// ============================================================
//  useRequestDetail — تفاصيل طلب واحد لشاشات دورة الطلب
//
//  خمس شاشات (تفاصيل · في الطريق · وصلت · قيد التنفيذ · سجلّ) تعرض الطلب
//  نفسه بزوايا مختلفة، وكانت كلٌّ منها ستكتب نداءها وحالة تحميلها وخطأها.
//  ثلاث نسخ من المنطق ذاته تعني ثلاثة سلوكيات مختلفة عند أول فشل شبكة.
//
//  **البذرة ثم التحديث:** الشاشة تُفتح ببيانات الطلب التي جاءت مع الانتقال
//  (`route.params.request`) فترسم فوراً بلا هيكل عظمي، ثم تُحدَّث من الخادم في
//  الخلفية. الانتظار على شاشة فارغة بينما البيانات في اليد أصلاً احتكاك بلا
//  مقابل — والفنّي واقف عند سيارة عميل.
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";

import { fetchRequest } from "../services/providerApi";
import { useSession } from "../context/SessionContext";

export default function useRequestDetail({ route, navigation } = {}) {
  const { activeRequest, setActiveRequest } = useSession();

  // البذرة: معاملات المسار أولاً (أدقّ لأنها تخصّ ما فُتح)، ثم الطلب النشِط.
  const seed = route?.params?.request || activeRequest || null;
  const orderId = route?.params?.id || seed?.id || null;

  const [request, setRequest] = useState(seed);
  const [loading, setLoading] = useState(!seed);
  const [error, setError] = useState("");

  // يمنع `setState` بعد تفكيك الشاشة — الفنّي قد يخرج قبل أن يردّ الخادم
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!orderId) {
        setError("تعذّر تحديد الطلب.");
        setLoading(false);
        return null;
      }

      if (!silent) setLoading(true);
      try {
        const fresh = await fetchRequest(orderId);
        if (!aliveRef.current) return fresh;
        setRequest(fresh);
        setError("");
        // مزامنة الطلب النشِط: الشاشة قرأت نسخة أحدث مما في السياق (تغيّرت
        // الحالة من الطرف الآخر مثلاً)، وإبقاء السياق على القديمة كان يجعل
        // الرئيسية تناقض الشاشة المفتوحة فوقها.
        if (fresh?.isActive) setActiveRequest(fresh);
        return fresh;
      } catch (err) {
        if (!aliveRef.current) return null;
        // 403/404: الطلب لم يعد لنا. البقاء على شاشته يعرض أزراراً كلها سترفض.
        if (err?.statusCode === 403 || err?.statusCode === 404) {
          navigation?.replace?.("Home");
          return null;
        }
        setError(err?.message || "تعذّر تحميل الطلب.");
        return null;
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    },
    [orderId, navigation, setActiveRequest],
  );

  useEffect(() => {
    // البذرة الموجودة تجعل التحديث صامتاً: وميض هيكل عظمي فوق بيانات مرسومة
    // بالفعل يبدو كإعادة تحميل لا كتحديث.
    load({ silent: !!seed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return { request, orderId, loading, error, reload: load, setRequest };
}
