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

export const ProviderEvents = {
  REQUEST_NEW: "request:new",
  REQUEST_CLOSED: "request:closed",
  REQUEST_STATUS: "request:status",
};

async function connect(namespace, { onConnect } = {}) {
  const token = await getAccessToken();
  if (!token) return null;

  const socket = io(`${API_BASE_URL}${namespace}`, {
    transports: ["websocket"],
    auth: { token: `Bearer ${token}` },
    extraHeaders: { Authorization: `Bearer ${token}` },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  if (onConnect) socket.on("connect", () => onConnect(socket));
  return socket;
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
