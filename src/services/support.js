// ============================================================
//  support — جهة الدعم
//
//  حساب الفنّي يُنشأ ويُستعاد من الإدارة لا من التطبيق، فالإدارة هي جهة الدعم
//  الفعلية — لا صندوق بريد عام. شاشة الدخول وشاشة الرمز تحتاجان مخرجاً
//  حقيقياً هنا، لا رابطاً معطّلاً.
//
//  الرقم قابل للتجاوز من `app.json` (`extra.supportPhone`) كي يتغيّر مع البيئة
//  دون بناء جديد.
// ============================================================
import Constants from "expo-constants";

const FALLBACK = "+963 11 000 0000";

function fromConfig() {
  try {
    const value =
      Constants?.expoConfig?.extra?.supportPhone ??
      Constants?.manifest2?.extra?.expoClient?.extra?.supportPhone ??
      Constants?.manifest?.extra?.supportPhone;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export const SUPPORT_PHONE = fromConfig() || FALLBACK;
