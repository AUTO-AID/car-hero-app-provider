// ============================================================
//  authApi — مصادقة الفنّي
//
//  الدخول **برقم الهاتف** لا باسم مستخدم: الخادم لا يعرف أسماء المستخدمين
//  إطلاقاً (`auth.controller` يقبل `phoneNumber` وحده)، وتدفّق استعادة كلمة
//  المرور في هذا التطبيق يسأل عن الرقم أصلاً. حقل باسم مستخدم كان سيعني
//  الدخول بمعرّف والاستعادة بمعرّف آخر — وهو أول ما يُربك عند نسيان الكلمة.
//
//  الحساب يُنشأ من الإدارة: لا تسجيل ذاتي هنا، وهو سبب غياب `register`.
// ============================================================
import { api } from "./api";
import { clearSession, saveSession } from "./tokenStorage";

/** يحوّل ما يُدخله الفنّي إلى الصيغة التي يتوقّعها الخادم: +963XXXXXXXXX */
export function toE164Syrian(digits) {
  const clean = String(digits || "").replace(/[^0-9]/g, "");
  if (/^09\d{8}$/.test(clean)) return `+963${clean.slice(1)}`;
  if (/^963\d{9}$/.test(clean)) return `+${clean}`;
  return `+963${clean}`;
}

/** POST /auth/login → { user, accessToken, refreshToken } */
export async function login({ phone, password }) {
  const session = await api.post("/auth/login", {
    phoneNumber: toE164Syrian(phone),
    password,
  });
  await saveSession(session);
  return session;
}

/** POST /auth/forgot-password → { message, phoneNumber, expiresIn, otpBypassed? } */
export function forgotPassword({ phone }) {
  return api.post("/auth/forgot-password", { phoneNumber: toE164Syrian(phone) });
}

/** POST /auth/reset-password — يتحقّق من الرمز ويعيّن الكلمة معاً */
export function resetPassword({ phone, code, newPassword }) {
  return api.post("/auth/reset-password", {
    phoneNumber: toE164Syrian(phone),
    ...(code ? { otpCode: code } : {}),
    newPassword,
  });
}

/** GET /auth/me — التحقّق من صلاحية الجلسة عند الإقلاع */
export async function getMe() {
  const res = await api.get("/auth/me", { auth: true });
  return res?.user ?? res;
}

/**
 * الخروج. مسح الجلسة محلياً في `finally`: فشل النداء (شبكة مقطوعة) يجب ألا
 * يحبس الفنّي داخل حساب يريد الخروج منه.
 */
export async function logout() {
  try {
    await api.post("/auth/logout", {}, { auth: true });
  } catch {
    // متوقّع عند انقطاع الشبكة — المسح المحلي أدناه هو ما يهمّ
  } finally {
    await clearSession();
  }
}
