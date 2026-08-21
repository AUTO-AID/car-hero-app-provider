// ============================================================
//  serverMessages — تعريب رسائل الخادم
//
//  الخادم يردّ برسائل عربية في مسارات تطبيق الفنّي (`provider-app`)، لكن
//  المصادقة وطبقة الطلبات المشتركة ما تزال ترد بالإنجليزية. الخريطة تغطّي
//  الثانية فقط، وأي رسالة عربية تمرّ كما هي.
//
//  القاعدة: **لا رسالة تقنية تصل الفنّي**. هو يعمل على الطريق ولا يملك ترف
//  تفسير «Forbidden resource» — يحتاج جملة تقول له ماذا يفعل الآن.
// ============================================================

const MAP = {
  // المصادقة
  "Invalid phone number or password": "رقم الهاتف أو كلمة المرور غير صحيحة",
  "Please verify your account first": "حسابك غير مفعّل — تواصل مع الإدارة",
  "Your account has been deactivated. Please contact support":
    "حسابك معطّل حالياً — تواصل مع الإدارة",
  "Invalid or expired refresh token": "انتهت الجلسة، يرجى تسجيل الدخول من جديد",
  "User not found": "لا يوجد حساب مرتبط بهذا الرقم",
  "Invalid OTP code": "رمز التحقّق غير صحيح",
  "OTP code has expired. Please request a new one": "انتهت صلاحية الرمز، اطلب رمزاً جديداً",
  "Maximum OTP attempts reached. Please request a new code":
    "تجاوزت عدد المحاولات، اطلب رمزاً جديداً",
  "Password has been reset successfully": "تم تغيير كلمة المرور بنجاح",
  "Password reset OTP has been sent to your phone": "تم إرسال رمز إعادة التعيين إلى هاتفك",
  "Logged in successfully": "تم تسجيل الدخول بنجاح",

  // الصلاحيات
  "Forbidden resource": "لا تملك صلاحية تنفيذ هذا الإجراء",
  "Unauthorized": "انتهت الجلسة، يرجى تسجيل الدخول من جديد",

  // الطلبات — تصل من الطبقة المشتركة في وحدة orders
  "Order not found": "الطلب غير موجود",
  "You do not have permission to view this order": "هذا الطلب غير مسند إليك",
  "You do not have permission to update status for this order": "هذا الطلب غير مسند إليك",
  "You are not authorized to update location for this order": "هذا الطلب غير مسند إليك",
  "Location tracking is only available for active orders":
    "تتبّع الموقع متاح للطلبات النشطة فقط",

  // كلمة المرور — رسائل class-validator
  "Password is required": "أدخل كلمة المرور",
  "Password must be at least 8 characters": "كلمة المرور 8 رموز على الأقل",
  "Password must contain at least one uppercase letter and one number":
    "كلمة المرور تحتاج حرفاً كبيراً ورقماً على الأقل",
  "Phone number is required": "أدخل رقم الهاتف",
  "Phone number must start with +963 followed by 9 digits (example: +963991234567)":
    "رقم غير صحيح — يبدأ بـ 9 (مثال: 991234567)",
};

/** فكّ غلاف {success,data} محلياً — استيراده من api.js يصنع دورة استيراد */
function unwrap(payload) {
  let data = payload;
  while (data && typeof data === "object" && "success" in data && "data" in data) {
    data = data.data;
  }
  return data;
}

export function localizeMessage(message, fallback = "حدث خطأ، حاول مجدداً") {
  if (!message) return fallback;
  if (typeof message !== "string") return fallback;
  return MAP[message] || message;
}

export function extractServerMessage(body, fallback) {
  const unwrapped = unwrap(body);
  const message = unwrapped?.message ?? body?.message ?? body?.error;
  // NestJS يرفض عدّة حقول في مصفوفة واحدة — أولها يكفي للعرض تحت زرّ واحد
  if (Array.isArray(message)) return localizeMessage(message[0], fallback);
  return localizeMessage(message, fallback);
}

/** الحساب معطّل أو قيد المراجعة — الفنّي لا يملك حلّاً داخل التطبيق */
export function isAccountBlockedError(error) {
  const message = error?.message || "";
  return (
    message.includes("معطّل") ||
    message.includes("قيد المراجعة") ||
    message.includes("غير مفعّل") ||
    message.includes("deactivated")
  );
}
