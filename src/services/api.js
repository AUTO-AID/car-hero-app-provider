// ============================================================
//  api — طبقة النقل الوحيدة إلى الخادم
//
//  ما تتكفّل به الشاشات دونها: إرفاق التوكن، تجديده عند 401، فكّ غلاف
//  {success,data}، تحويل خطأ الشبكة إلى رسالة عربية، ومهلة قصوى. كل واحدة
//  منها كانت ستُكتب في اثنتي عشرة شاشة بصيغ متفاوتة.
// ============================================================
import { API_URL } from "./config";
import { getAccessToken, getRefreshToken, saveTokens, clearSession } from "./tokenStorage";
import { extractServerMessage } from "./serverMessages";

const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, statusCode, raw) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.raw = raw;
  }

  /** انقطاع الشبكة — الشاشة تعرض «تحقّق من اتصالك» لا رسالة خادم */
  get isOffline() {
    return this.statusCode === 0;
  }

  /** تعارض: الطلب سبقك إليه غيرك أو انتهت مهلته */
  get isConflict() {
    return this.statusCode === 409;
  }
}

let onAuthExpired = null;
export function registerAuthExpiredHandler(cb) {
  onAuthExpired = cb;
}

export function unwrapPayload(payload) {
  let data = payload;
  while (data && typeof data === "object" && "success" in data && "data" in data) {
    data = data.data;
  }
  return data;
}

let refreshPromise = null;

async function refreshTokens() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const text = await res.text();
    const payload = text ? JSON.parse(text) : null;
    const data = unwrapPayload(payload);
    if (!data?.accessToken) return false;

    await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return true;
  } catch {
    return false;
  }
}

/**
 * تجديد واحد مشترك: عدّة نداءات متوازية (الرئيسية + الإشعارات + الطلبات عند
 * الإقلاع) كانت ستطلق ثلاث عمليات تجديد، وأول ناجحة تُبطل التوكن الذي تحمله
 * الأخريان فتُطرد الجلسة فوراً بعد تجديدها.
 */
async function ensureRefreshed() {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * تجديد الجلسة من خارج مسار الـREST — تستعمله طبقة الـsockets.
 *
 * المقبس لا يمرّ بـ`request()` فلا يلتقط 401 ولا يستفيد من التجديد التلقائي،
 * ومع ذلك توكنه يُفحص عند **كل رسالة محروسة** على الخادم. صلاحية توكن الوصول
 * خمس عشرة دقيقة، فبعدها كانت كل رسالة تُرفض بصمت والاتصال يبدو قائماً.
 *
 * تُعيد استعمال نفس `refreshPromise` فلا ينطلق تجديدان متزامنان حين يفشل
 * نداء REST ومقبس معاً في اللحظة ذاتها.
 */
export function refreshSession() {
  return ensureRefreshed();
}

async function doFetch(path, method, body, headers, withAuth) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const finalHeaders = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...headers,
  };
  if (withAuth) {
    const token = await getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function request(path, { method = "GET", body, auth = false, headers = {}, _retried = false } = {}) {
  let res;
  try {
    res = await doFetch(path, method, body, headers, auth);
  } catch (networkErr) {
    throw new ApiError("لا يوجد اتصال بالإنترنت. تحقّق من الشبكة وحاول مجدداً.", 0, networkErr);
  }

  if (res.status === 401 && auth && !_retried) {
    const refreshed = await ensureRefreshed();
    if (refreshed) {
      return request(path, { method, body, auth, headers, _retried: true });
    }
    await clearSession();
    if (onAuthExpired) onAuthExpired();
    throw new ApiError("انتهت الجلسة، يرجى تسجيل الدخول من جديد", 401, null);
  }

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(extractServerMessage(payload, "حدث خطأ، حاول مجدداً"), res.status, payload);
  }

  return unwrapPayload(payload);
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};
