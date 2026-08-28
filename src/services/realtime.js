// ============================================================
//  realtime — القناة اللحظية بين الفنّي والخادم
//
//  فضاء أسماء `/provider` مستقلّ: الطلبات موجّهة إلى فنّي بعينه ضمن غرفته،
//  ولا تُبثّ للجميع. الانضمام إلى الغرفة يُعاد بعد **كل** اتصال — لا مرّة
//  واحدة عند الإنشاء: بعد أول انقطاع شبكة يعود المقبس ويخرج من غرفته بصمت،
//  فيبدو التطبيق متصلاً بينما لا يصله طلب واحد.
// ============================================================
import { io } from "socket.io-client";
import { API_BASE_URL } from "./config";
import { getAccessToken } from "./tokenStorage";
import { refreshSession } from "./api";

export const ProviderEvents = {
  REQUEST_NEW: "request:new",
  REQUEST_CLOSED: "request:closed",
  REQUEST_STATUS: "request:status",
};

/** رمز الخادم عند انتهاء صلاحية التوكن (`WsJwtGuard`) — قابل للإصلاح */
const WS_AUTH_EXPIRED = "ws_auth_expired";

/**
 * **التوكن في `auth` وحده — لا في `extraHeaders`.**
 *
 * socket.io يدمج فضاءات الأسماء على نفس المضيف في اتصال فيزيائي واحد،
 * فترويسة الـhandshake تخصّ أوّل فضاء اتّصل ولا تتغيّر بعده: توكنها مجمَّد على
 * لحظة الإنشاء. و`/provider` و`/notifications` و`/chat` تُفتح كلها هنا، فأيّها
 * سبق فرض توكنه على البقيّة.
 *
 * والأثر ميداني لا نظري: صلاحية توكن الوصول **خمس عشرة دقيقة**، وبعدها كان
 * الخادم يرفض `provider:join` — فيخرج الفنّي من غرفته بصمت ولا يصله **أي عرض
 * طلب** والتطبيق مفتوح أمامه، لأن هذا التطبيق لا يستطلع الطلبات إطلاقاً:
 * البثّ اللحظي هو طريقه الوحيد (مع الإشعار المدفوع).
 */
async function connect(namespace, { onConnect, onAuthError } = {}) {
  const token = await getAccessToken();
  if (!token) return null;

  const socket = io(`${API_BASE_URL}${namespace}`, {
    transports: ["websocket"],
    auth: { token: `Bearer ${token}` },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  attachAuthRecovery(socket, onAuthError);
  if (onConnect) socket.on("connect", () => onConnect(socket));
  return socket;
}

/**
 * شفاء ذاتي للمصادقة: جدّد الجلسة، اكتب التوكن الجديد في `socket.auth`، ثم
 * أعد الوصل — فتُعاد المصادقة ويُعاد `provider:join` من مستمع `connect`.
 *
 * حدث `exception` هو ما يرسله Nest عند رفض رسالة محروسة، ولم يكن أحد يستمع
 * له: الرفض كان يقع بلا استدعاء دالّة الردّ وبلا أي أثر مرئي.
 */
function attachAuthRecovery(socket, onAuthError) {
  let healing = false;
  let attempts = 0;

  const heal = async (reason) => {
    if (healing) return;
    /**
     * سقف للمحاولات — يمنع حلقة لا تنتهي: `healing` يُصفَّر عند `connect`،
     * فلو بقي التوكن مرفوضاً بعد التجديد (سرّ تغيّر، حساب أُوقف) لدارت
     * تجديد ⇄ وصل ⇄ رفض بلا توقّف. ثلاث محاولات تعبر الانقطاع العابر.
     */
    if (attempts >= 3) {
      onAuthError?.(reason);
      return;
    }
    attempts += 1;
    healing = true;
    try {
      const ok = await refreshSession();
      const fresh = ok ? await getAccessToken() : null;
      if (!fresh) {
        onAuthError?.(reason);
        return;
      }
      socket.auth = { token: `Bearer ${fresh}` };
      if (socket.connected) socket.disconnect();
      socket.connect();
    } catch {
      onAuthError?.(reason);
    } finally {
      healing = false;
    }
  };

  // اتصالٌ ناجح يعني انقضاء العطل — يُصفَّر العدّاد ليبقى السقف على
  // «محاولات متتالية فاشلة» لا على عمر الجلسة.
  socket.on("connect", () => { healing = false; attempts = 0; });

  socket.on("connect_error", (error) => {
    const message = String(error?.message || "");
    if (message.includes("token") || message.includes("Unauthorized") || message.includes("auth")) {
      heal("connect");
    }
  });

  socket.on("exception", (payload) => {
    const code = payload?.message?.code ?? payload?.code;
    const text = String(payload?.message?.message ?? payload?.message ?? "");
    if (code === WS_AUTH_EXPIRED || text.includes("expired") || text.includes("Invalid authentication")) {
      heal("exception");
    }
  });
}

/**
 * نصّ خطأ مقروء من حمولة `exception`.
 *
 * Nest يلفّ `WsException` بـ`{status:"error", message:<الحمولة>}`، والحمولة
 * صارت كائناً `{code,message}` لتمييز «انتهت الصلاحية» عن «توكن فاسد».
 * وضعُ الكائن في `<Text>` يطبع `[object Object]` أو يرمي — فالاستخراج هنا.
 */
export function wsErrorMessage(payload, fallback = "تعذّر تنفيذ العملية") {
  const inner = payload?.message ?? payload;
  if (typeof inner === "string" && inner.trim()) return inner;
  if (typeof inner?.message === "string" && inner.message.trim()) return inner.message;
  return fallback;
}

/** قناة الطلبات — تنضمّ تلقائياً إلى غرفة الفنّي بعد كل اتصال */
export function createProviderSocket() {
  return connect("/provider", {
    onConnect: (socket) => socket.emit("provider:join", {}),
  });
}

/** قناة التنبيهات — نفس عقد تطبيق العميل */
export function createNotificationsSocket() {
  return connect("/notifications", {
    onConnect: (socket) => socket.emit("join_notifications", {}),
  });
}

/**
 * قناة محادثة الطلب — فضاء `/chat` نفسه الذي يستعمله تطبيق العميل.
 *
 * الانضمام إلى غرفة المحادثة يقع في الشاشة لا هنا: `chatId` لا يُعرف إلا بعد
 * `POST /chat/conversations`، والشاشة تُعيد الانضمام بعد كل اتصال.
 */
export function createChatSocket() {
  return connect("/chat");
}

/**
 * قناة تتبّع طلب واحد. الفنّي لا يحتاجها للقراءة (هو مصدر الموقع) لكنه يحتاج
 * أن يعرف فوراً إن ألغى العميل الطلب وهو في الطريق.
 */
export function createOrderSocket(orderId) {
  return connect("/ws", {
    onConnect: (socket) => socket.emit("join:order", { orderId }),
  });
}

/** إغلاق آمن — يُنادى من دوال تنظيف useEffect حيث قد يكون المقبس null */
export function closeSocket(socket) {
  try {
    socket?.removeAllListeners?.();
    socket?.disconnect?.();
  } catch {
    // مقبس مغلق أصلاً — لا شيء يُفعل
  }
}
