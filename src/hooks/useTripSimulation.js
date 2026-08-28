// ============================================================
//  useTripSimulation — قيادة وهميّة على المسار الحقيقي (وضع التطوير فقط)
//
//  سيارة الفنّي على الخريطة تُرسم من GPS الجهاز الحيّ، ولا تتحرّك إلا إذا
//  تحرّك الجهاز ٢٥ متراً فأكثر — فعلى محاكٍ أو جهاز واقف تبقى ثابتة، وهذا
//  سلوك مقصود لا عطب. لكن ذلك يجعل التحقّق من أن الأنبوب كلّه (الحركة، الخطّ،
//  تزامن الوصول عند العميل) سليمٌ متعذّراً دون قيادة فعلية عشرات الأمتار.
//
//  هذا الخطّاف يملأ تلك الفجوة: يجلب مساراً حقيقياً من OSRM من نقطة البداية
//  إلى العميل، يكثّفه، ثم «يقود» السيارة عليه نقطةً نقطة — ويدفع كل نقطة إلى
//  الخادم تماماً كنبضة حقيقية، فيتحرّك كذلك عند العميل. لا أثر له في الإنتاج:
//  الشاشة لا تعرض زرّه إلا داخل `__DEV__`.
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { pushLocation } from "../services/providerApi";
import { routingUrl } from "../services/mapConfig";
import { bearing, densifyPath, toLatLng } from "../services/geo";

/** الفاصل بين خطوات المحاكاة — قريب من فاصل نبضة حقيقية أثناء القيادة */
const TICK_MS = 1000;
/** تباعد نقاط المسار المكثّف؛ ~٣٠م/ثانية ≈ ١٠٨ كم/س، سرعة قيادة معقولة */
const STEP_M = 30;
/** حين تغيب نقطة بداية، نبدأ على هذا البُعد شمال العميل */
const FALLBACK_START_M = 1500;

/**
 * @param {object}   opts
 * @param {any}      opts.destination  موقع العميل (أي شكل يقبله toLatLng)
 * @param {string}   opts.orderId      لدفع النبضة إلى خطّ تتبّع الطلب
 * @param {any}      opts.startFrom    نقطة البداية (موقع الفنّي الحيّ إن وُجد)
 * @returns {{ active:boolean, simPosition:object|null, start:Function, stop:Function }}
 */
export default function useTripSimulation({ destination, orderId, startFrom }) {
  const [active, setActive] = useState(false);
  const [simPosition, setSimPosition] = useState(null);
  const timerRef = useRef(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setActive(false);
    setSimPosition(null);
  }, []);

  const buildPath = useCallback(async () => {
    const dest = toLatLng(destination);
    if (!dest) return [];

    // نقطة البداية: موقع الفنّي الحيّ، وإلا نقطة مُفتعلة شمال العميل كي تكون
    // للسيارة مسافة تقطعها بدل أن تولد فوق الوجهة.
    const origin =
      toLatLng(startFrom) || { lat: dest.lat + FALLBACK_START_M / 111320, lng: dest.lng };

    const url = routingUrl();
    if (url) {
      try {
        const coords = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
        const res = await fetch(url.replace("{coords}", coords));
        const json = await res.json();
        const line = json?.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(line) && line.length >= 2) {
          // OSRM يعيد [lng,lat]؛ toLatLng يقبلها كما هي
          return densifyPath(line, STEP_M);
        }
      } catch {
        // تعذّر التوجيه — نرتدّ إلى خطّ مستقيم مكثّف
      }
    }
    return densifyPath([origin, dest], STEP_M);
  }, [destination, startFrom]);

  const start = useCallback(async () => {
    if (timerRef.current) return;
    const path = await buildPath();
    if (path.length < 2) return;

    setActive(true);
    let i = 0;
    let prev = path[0];
    setSimPosition({ latitude: prev.lat, longitude: prev.lng });

    timerRef.current = setInterval(() => {
      i += 1;
      if (i >= path.length) {
        // بلغنا الوجهة — نتوقّف. السياج الجغرافي يكون قد سجّل الوصول قبلها.
        stop();
        return;
      }
      const point = path[i];
      const heading = bearing(prev, point);
      prev = point;

      const reading = {
        latitude: point.lat,
        longitude: point.lng,
        ...(typeof heading === "number" ? { heading } : {}),
      };
      setSimPosition(reading);

      // ندفعها إلى الخادم كنبضة حقيقية: بذلك تتحرّك السيارة عند العميل أيضاً،
      // فيُختبر تطابق الواجهتين من طرف إلى طرف لا خريطة الفنّي وحدها.
      if (orderId) pushLocation({ ...reading, orderId }).catch(() => {});
    }, TICK_MS);
  }, [buildPath, orderId, stop]);

  // تنظيف صارم: مؤقّت باقٍ بعد إغلاق الشاشة يظلّ يدفع مواقع وهميّة للخادم
  useEffect(() => () => stop(), [stop]);

  return { active, simPosition, start, stop };
}
