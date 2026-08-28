// ============================================================
//  providerApi — سطح `/provider-app` كاملاً
//
//  كل دالة هنا تقابل مساراً واحداً على الخادم، وكل مسار مصمَّم لشاشة واحدة.
//  الشاشات لا تركّب مسارات ولا تعرف أشكال الأجسام — تنادي دالة وتأخذ كائناً
//  مسطّحاً جاهزاً للعرض.
// ============================================================
import { api } from "./api";

// ------------------------------------------------------------
//  الملف والحالة
// ------------------------------------------------------------

/** GET /provider-app/me — بيانات شاشة «حسابي» */
export function fetchProfile() {
  return api.get("/provider-app/me", { auth: true });
}

/**
 * GET /provider-app/home — الشاشة الرئيسية في نداء واحد:
 * { online, activeRequest, incomingRequest, todayCount, unreadNotifications,
 *   locationIntervalSeconds, offerWindowSeconds }
 */
export function fetchHome() {
  return api.get("/provider-app/home", { auth: true });
}

/**
 * POST /provider-app/presence — تشغيل/إيقاف الاتصال.
 * الموقع يُرسل مع «تشغيل الاتصال» متى توفّر: بدونه يبقى الفنّي مرشّحاً
 * بإحداثيات آخر جلسة.
 */
export function setPresence({ online, latitude, longitude }) {
  return api.post(
    "/provider-app/presence",
    {
      online,
      ...(typeof latitude === "number" ? { latitude } : {}),
      ...(typeof longitude === "number" ? { longitude } : {}),
    },
    { auth: true },
  );
}

/** POST /provider-app/device-token — تسجيل رمز الإشعارات المدفوعة */
export function registerDeviceToken({ token, platform }) {
  return api.post("/provider-app/device-token", { token, platform }, { auth: true });
}

/** POST /provider-app/location — نبضة الموقع (مع الطلب النشِط إن وُجد) */
export function pushLocation({ latitude, longitude, accuracy, heading, speed, orderId }) {
  return api.post(
    "/provider-app/location",
    {
      latitude,
      longitude,
      ...(typeof accuracy === "number" ? { accuracy } : {}),
      ...(typeof heading === "number" ? { heading } : {}),
      ...(typeof speed === "number" ? { speed } : {}),
      ...(orderId ? { orderId } : {}),
    },
    { auth: true },
  );
}

// ------------------------------------------------------------
//  الطلبات
// ------------------------------------------------------------

/** GET /provider-app/requests?scope=active|past → { requests, pagination } */
export function fetchRequests({ scope = "active", page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams({ scope, page: String(page), limit: String(limit) });
  return api.get(`/provider-app/requests?${query.toString()}`, { auth: true });
}

/** GET /provider-app/requests/:id → تفاصيل + سجلّ الخطوات */
export function fetchRequest(orderId) {
  return api.get(`/provider-app/requests/${orderId}`, { auth: true });
}

/** POST …/accept — قد يرمي 409 إن انتهت المهلة أو سبقك فنّي آخر */
export function acceptRequest(orderId) {
  return api.post(`/provider-app/requests/${orderId}/accept`, {}, { auth: true });
}

export function rejectRequest(orderId, reason) {
  return api.post(`/provider-app/requests/${orderId}/reject`, { reason }, { auth: true });
}

/**
 * الإبلاغ بانقضاء العدّاد. ليس شرطاً لصحّة النظام (الخادم يمسح المهل دورياً)
 * لكنه يُسقط الطلب إلى الفنّي التالي فوراً بدل انتظار الدورة.
 */
export function expireRequest(orderId) {
  return api.post(`/provider-app/requests/${orderId}/expire`, {}, { auth: true });
}

/**
 * الاعتذار عن حجز مجدول. منفصل عن `rejectRequest`: ذاك يردّ على عرضٍ بمهلة
 * عدّاد، وهذا يتخلّى عن حجز أُسند بلا عرض — ويُرفض بـ409 إن اقترب الموعد.
 */
export function declineBooking(orderId, reason) {
  return api.post(`/provider-app/requests/${orderId}/decline-booking`, { reason }, { auth: true });
}

export function startEnRoute(orderId) {
  return api.post(`/provider-app/requests/${orderId}/en-route`, {}, { auth: true });
}

export function markArrived(orderId) {
  return api.post(`/provider-app/requests/${orderId}/arrived`, {}, { auth: true });
}

export function startService(orderId) {
  return api.post(`/provider-app/requests/${orderId}/start`, {}, { auth: true });
}

export function completeService(orderId, notes) {
  return api.post(
    `/provider-app/requests/${orderId}/complete`,
    notes ? { notes } : {},
    { auth: true },
  );
}

// ------------------------------------------------------------
//  المحفظة — الرصيد وحركاته
//
//  المسار هنا `/provider/wallet` لا `/provider-app`: سطح المحفظة على الخادم
//  مشترك بين لوحة الويب والتطبيق (نفس المتحكّم `ProviderWalletController`)،
//  ومضاعفته تحت `/provider-app` كان سيعني منطقَ رصيد في مكانين يتباعدان.
// ------------------------------------------------------------

/**
 * GET /provider/wallet/me — بطاقة «رصيدي» في نداء واحد:
 * { balance, pendingBalance, currency, summary: { totalEarnings, monthlyEarnings,
 *   pendingPayouts, transactionCount, … } }
 */
export function fetchWallet() {
  return api.get("/provider/wallet/me", { auth: true });
}

/**
 * GET /provider/wallet/transactions?page&limit → { data, total, pagination }
 * كل حركة: { type: credit|debit, amount, referenceType, status, description,
 *   createdAt, transactionNumber }.
 */
export function fetchWalletTransactions({ page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return api.get(`/provider/wallet/transactions?${query.toString()}`, { auth: true });
}
