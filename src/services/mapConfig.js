// ============================================================
//  mapConfig — مصادر الخريطة والتوجيه
//
//  نظير `geocoding.js` عند تطبيق العميل، مقصوراً على ما تحتاجه خريطة التتبّع
//  هنا. المصدران مجّانيان بلا مفتاح، وكلاهما قابل للاستبدال من `app.json`
//  دون لمس الشيفرة.
// ============================================================
import Constants from "expo-constants";

function extra() {
  return (
    Constants?.expoConfig?.extra ??
    Constants?.manifest2?.extra?.expoClient?.extra ??
    Constants?.manifest?.extra ??
    {}
  );
}

/**
 * بلاطات الخريطة.
 *
 * الافتراضي خادم OpenStreetMap العام: مجّاني بلا مفتاح ويكفي للتطوير
 * والتجربة تماماً. لكن **سياسة استعماله تمنع الأحمال الإنتاجية** — عند النشر
 * يُضبط `extra.tileUrlTemplate` على مزوّد يسمح بالاستعمال داخل التطبيقات
 * (MapTiler أو Stadia أو Geoapify؛ جميعها بطبقة مجّانية سخيّة).
 *
 * ضبطه على `false` يعطّل البلاطات فتبقى العلامات والمسار على خلفية نظيفة —
 * وهو أفضل من بلاطات محجوبة تصل صوراً مكسورة.
 */
export function tileTemplate() {
  const value = extra().tileUrlTemplate;
  if (value === false || value === null) return null;
  return value || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
}

/**
 * خدمة توجيه الطرق — ترسم المسار الحقيقي عبر الشوارع لا خطاً مستقيماً.
 *
 * الافتراضي خادم OSRM التجريبي العام: مجّاني بلا مفتاح، محدود المعدّل ولا
 * يضمن توفّراً. `{coords}` تُستبدل بـ "lng,lat;lng,lat".
 *
 * تعطيله يُرجع الخط مستقيماً بدل تركه معطّلاً بصمت.
 */
export function routingUrl() {
  const value = extra().routingUrl;
  if (value === false || value === null) return null;
  return (
    value ||
    "https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson"
  );
}
