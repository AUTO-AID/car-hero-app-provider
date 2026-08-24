// ============================================================
//  qa — مِرقاب حالات للتطوير فقط
//
//  كثير من الحالات الحرجة لا تظهر تلقائياً: رفض إذن دائم، خدمة موقع مغلقة،
//  لا مزوّد متاح، فشل شبكة، قائمة فارغة. اختبارها كان يتطلّب تعديل الكود
//  مؤقّتاً ثم عكسه في كل مرّة — بطيء وعرضة لنسيان العكس.
//
//  الآن: أضف ?qa=<state> إلى الرابط في وضع التطوير على الويب.
//  الدالة تُرجع null دائماً خارج __DEV__، فلا أثر لها في الإنتاج إطلاقاً.
// ============================================================
import { Platform } from "react-native";

export function qaState(key = "qa") {
  if (!__DEV__ || Platform.OS !== "web") return null;
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

/** هل الحالة المطلوبة مفروضة؟ استعمال: if (qaIs('empty')) return <EmptyState/> */
export function qaIs(value, key = "qa") {
  return qaState(key) === value;
}

/**
 * كل معطيات الرابط عدا ?qa نفسه، لتُزرع كـ route.params للشاشة المقفوز إليها.
 *
 * القفزة كانت تصل الشاشة بلا معطيات، فكل شاشة تعتمد على معرّف (طلب، محادثة)
 * تعرض «غير متوفر» بدل محتواها الحقيقي. تُرجع {} خارج __DEV__.
 */
export function qaRouteParams() {
  if (!__DEV__ || Platform.OS !== "web") return {};
  try {
    const out = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
      if (key === "qa") return;
      // معطيات الرابط نصوص دائماً، بينما تتوقّع الشاشات أرقاماً ومنطقيات.
      // المعرّفات تبقى نصوصاً: ObjectId المكوّن من أرقام فقط يفقد خاناته
      // إن حُوّل إلى رقم، فيصير معرّفاً آخر لا وجود له.
      const isId = /Id$/.test(key) || key === "id";
      if (value === "true" || value === "false") out[key] = value === "true";
      else if (!isId && value !== "" && Number.isFinite(Number(value))) out[key] = Number(value);
      else out[key] = value;
    });
    return out;
  } catch {
    return {};
  }
}

/**
 * معطيات مسار من الرابط لشاشة قُفز إليها بـ ?qa=<step>.
 *
 * القفزة التطويرية تصل الشاشة بلا route.params، فتبدو الشاشات التي تعتمد على
 * معطيات (الخدمة، المزوّد، الإحداثيات) كأنها معطّلة. تُرجع {} خارج __DEV__.
 */
export function qaParams(keys = []) {
  const result = {};
  keys.forEach((key) => {
    const value = qaState(key);
    if (value != null && value !== "") result[key] = value;
  });
  return result;
}
