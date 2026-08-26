// ============================================================
//  ChatScreen — محادثة الطلب من طرف الفنّي
//
//  قبل هذه الشاشة كان زرّ «مراسلة» يفتح `sms:` خارج التطبيق، ولم يكن للفنّي
//  أي مكان يقرأ فيه ما يكتبه العميل — فرسالة العميل داخل تطبيقه كانت تُحفظ
//  ولا تصل أحداً. هذه هي الطرف المقابل الذي كان ناقصاً.
//
//  الشاشة مكتوبة على عقد الخادم نفسه الذي يستعمله تطبيق العميل:
//  `POST /chat/conversations` ثم `GET /chat/:id/messages`، والبثّ على فضاء
//  `/chat` بأحداث `join_chat` · `send_message` · `new_message`. والخادم يوحّد
//  هوية الفنّي على **معرّف وثيقة المزوّد** (`chatIdentityOf`)، فيلتقي الطرفان
//  على محادثة واحدة لا محادثتين متوازيتين.
//
//  ثلاثة دروس منقولة من نظيرتها في تطبيق العميل، وكلّها أخطاء وقعت هناك:
//   • **صدى رسالتي** يحلّ محلّ فقاعتها المتفائلة لا يُضاف بعدها، وإلا ظهرت كل
//     رسالة مرّتين (المطابقة بالمعرّف تفشل: المحلية `local-…` والقادمة `_id`).
//   • **`emit` وحده ليس وصولاً**: ننتظر ack البوّابة، فالحارس قد يرفض الرسالة
//     على الخادم بينما تبقى معروضة كـ«أُرسلت».
//   • **الفشل يُعرض ولا يختفي**، ومعه إعادة إرسال بضغطة.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowClockwise,
  ArrowRight,
  MapPin,
  PaperPlaneTilt,
  Phone,
} from "phosphor-react-native";
import { EmptyState, ErrorState } from "../../components/ui";
import { colors, font, gradients, layout, radius, spacing } from "../../theme/theme";
import { fetchMessages, startConversation } from "../../services/chatApi";
import { fetchRequest } from "../../services/providerApi";
import { createChatSocket } from "../../services/realtime";
import { useSession } from "../../context/SessionContext";
import { callNumber } from "../../services/contact";
import { readCurrentPosition } from "../../services/location";

/**
 * ردود الفنّي الجاهزة.
 *
 * ليست نسخة من ردود العميل: هو يسأل «كم تبعد؟» وهذا يجيب. الكتابة أثناء
 * القيادة خطر حقيقي، فالردّ بضغطة واحدة أعلى مكسب مفرد في هذه الشاشة.
 */
const QUICK_REPLIES = [
  "أنا في الطريق إليك",
  "سأصل خلال ١٠ دقائق",
  "وصلت إلى موقعك",
  "أين أجدك بالضبط؟",
  "تأخّرت قليلاً بسبب الزحام",
];

const getId = (v) => v?.id || v?._id || v;
/**
 * معرّف Mongo صالح؟ الحارس القديم كان يكتفي بـ«ليس فارغاً»، فمرّت قيمٌ خاطئة
 * لكن غير فارغة — أشهرها `"null"`/`"undefined"` نصّاً من حمولة إشعار مدفوع —
 * إلى `POST /chat/conversations`، فيردّها الخادم برسالة تحقّق تقنية
 * («participantId must be a mongo id») تظهر للفنّي حرفيّاً.
 */
const isObjectId = (v) => /^[a-f\d]{24}$/i.test(String(v ?? ""));
const msgText = (m) => m?.message || m?.text || m?.body || "";
const isMine = (m, myId) => {
  const sender = getId(m?.senderId || m?.sender || m?.userId);
  return sender && myId && String(sender) === String(myId);
};
const msgTime = (m) =>
  m?.createdAt
    ? new Date(m.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    : "الآن";

/** صدى رسالتي يستبدل فقاعتها المحلية؛ رسائل الآخرين تُضاف */
function mergeIncoming(prev, message, myId) {
  const incomingId = getId(message);
  if (incomingId && prev.some((m) => !m.local && getId(m) === incomingId)) return prev;

  if (isMine(message, myId)) {
    const idx = prev.findIndex((m) => m.local && msgText(m) === msgText(message));
    if (idx !== -1) {
      const next = prev.slice();
      next[idx] = message;
      return next;
    }
  }
  return [...prev, message];
}

export default function ChatScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { provider, activeRequest } = useSession();
  const params = route?.params || {};

  // الطلب قد يصل بالمعاملات أو يُقرأ من الجلسة (فتح المحادثة من شريط الإجراءات)
  const request = params.request || activeRequest || null;
  const orderId = params.orderId || request?.id || null;
  const customerId = params.customerId || request?.customer?.id || null;
  const customerName = params.customerName || request?.customer?.name || "العميل";
  const customerPhone = params.customerPhone || request?.customer?.phone || "";

  /**
   * هوية الفنّي داخل المحادثة هي **معرّف وثيقة المزوّد** لا حساب المستخدم —
   * وهي ما يفحصه الخادم في عضوية المحادثة (`chatIdentityOf`). و`/provider-app/me`
   * يُرجعها في `id` أصلاً. قراءة حساب المستخدم هنا كانت ستجعل كل رسائلي
   * تبدو رسائل الطرف الآخر.
   */
  const myId = provider?.id || provider?.providerId || provider?._id;

  // معرّف محادثة غير صالح (نصّ "null" من إشعار مثلاً) لا يُستعمل مباشرةً:
  // وإلا انضمّ المقبس إلى غرفة وهمية وحمّل الرسائل بمعرّف يرفضه الخادم.
  const [chatId, setChatId] = useState(isObjectId(params.chatId) ? params.chatId : null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  // المستمعون يُسجَّلون مرّة على [chatId]؛ الإغلاق يُجمّد قيمة myId لحظة التسجيل
  const myIdRef = useRef(myId);
  myIdRef.current = myId;

  const scrollDown = (animated = true) =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 60);

  const ensureChat = useCallback(async () => {
    if (chatId) return chatId;
    if (!isObjectId(orderId)) {
      throw new Error("لا تتوفّر بيانات كافية لفتح المحادثة");
    }

    // معرّف العميل يغيب حين تُفتح المحادثة من طلب مختصر (الطلب النشِط أو
    // إشعار) لا يحمل سوى اسمه ورقمه — فقط `toDetail` على الخادم يُرجع
    // `customer.id`. نجلب التفاصيل لنعرف العميل بدل إرسال معرّف ناقص يردّه
    // الخادم برسالة تحقّق تقنية عن «mongo id».
    let participantId = isObjectId(customerId) ? customerId : null;
    if (!participantId) {
      const detail = await fetchRequest(orderId).catch(() => null);
      participantId = isObjectId(detail?.customer?.id) ? detail.customer.id : null;
    }
    if (!participantId) {
      throw new Error("لا تتوفّر بيانات كافية لفتح المحادثة");
    }

    const created = await startConversation({ participantId, orderId });
    const id = getId(created?.data || created);
    setChatId(id);
    return id;
  }, [chatId, customerId, orderId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const id = await ensureChat();
      const result = await fetchMessages(id, { limit: 50 });
      setMessages(Array.isArray(result.messages) ? result.messages : []);
      scrollDown(false);
    } catch (loadError) {
      setError(loadError?.message || "تعذّر تحميل المحادثة");
    } finally {
      setLoading(false);
    }
  }, [ensureChat]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!chatId) return undefined;
    let disposed = false;

    createChatSocket().then((socket) => {
      if (!socket) return;
      if (disposed) { socket.disconnect(); return; }
      socketRef.current = socket;
      setConnected(!!socket.connected);

      // الانضمام يُعاد بعد كل اتصال: بعد أول انقطاع يعود المقبس ويخرج من
      // غرفته بصمت، فيبدو التطبيق متصلاً ولا تصله رسالة واحدة.
      // فتح المحادثة قراءةٌ لها: `message_read` لم يكن يُرسَل من أي تطبيق،
      // فبقي `markAsRead` على الخادم شيفرةً ميتة وعدّاد «غير المقروء»
      // متصاعداً بلا رجعة.
      const join = () => {
        setConnected(true);
        socket.emit("join_chat", { chatId });
        socket.emit("message_read", { chatId });
      };
      socket.on("connect", join);
      socket.on("disconnect", () => setConnected(false));
      socket.on("connect_error", () => setConnected(false));
      if (socket.connected) join();

      socket.on("new_message", (message) => {
        setMessages((prev) => mergeIncoming(prev, message, myIdRef.current));
        if (!isMine(message, myIdRef.current)) socket.emit("message_read", { chatId });
        scrollDown();
      });
      socket.on("error", (e) => setNotice(e?.message || "حدث خطأ في الاتصال بالمحادثة"));
      // الرفض القادم من الخادم يُبثّ على `exception` لا `error` (سلوك Nest)
      socket.on("exception", (e) => setNotice(e?.message || "تعذّر تنفيذ العملية في المحادثة"));
    }).catch(() => {});

    return () => {
      disposed = true;
      socketRef.current?.emit?.("leave_chat", { chatId });
      socketRef.current?.disconnect?.();
      socketRef.current = null;
    };
  }, [chatId]);

  const deliver = useCallback(async (localId, body) => {
    try {
      const id = await ensureChat();
      const socket = socketRef.current;
      if (!socket?.connected) throw new Error("لا يوجد اتصال");

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("انتهت مهلة الإرسال")), 12000);
        socket.emit("send_message", { chatId: id, message: body, type: "text" }, (res) => {
          clearTimeout(timer);
          if (res && res.success === false) reject(new Error(res.message || "تعذّر إرسال الرسالة"));
          else resolve(res);
        });
      });

      // إن سبق صدى الخادم وصولَ الـ ack فالفقاعة المحلية استُبدلت — لا نعيدها
      setMessages((prev) =>
        prev.map((m) => (m.local && m.id === localId ? { ...m, pending: false, failed: false } : m)),
      );
    } catch (sendError) {
      setMessages((prev) =>
        prev.map((m) => (m.local && m.id === localId ? { ...m, pending: false, failed: true } : m)),
      );
      setNotice(
        sendError?.message === "لا يوجد اتصال"
          ? "لا يوجد اتصال — الرسالة محفوظة، أعد إرسالها عند عودة الشبكة"
          : sendError?.message || "تعذّر إرسال الرسالة",
      );
    }
  }, [ensureChat]);

  const sendBody = useCallback(async (body) => {
    const trimmed = String(body || "").trim();
    if (!trimmed || sending) return;
    setSending(true);
    const localId = `local-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: localId, local: true, senderId: myId, message: trimmed, createdAt: new Date().toISOString(), pending: true },
    ]);
    setText("");
    scrollDown();
    await deliver(localId, trimmed);
    setSending(false);
  }, [deliver, sending, myId]);

  const retry = (message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, pending: true, failed: false } : m)),
    );
    deliver(message.id, msgText(message));
  };

  // مشاركة الموقع بضغطة: أدقّ من وصف الشارع بالكلام، وأسرع أثناء القيادة
  const shareLocation = async () => {
    try {
      const reading = await readCurrentPosition();
      if (!reading) throw new Error("no fix");
      sendBody(`موقعي الحالي: https://maps.google.com/?q=${reading.latitude},${reading.longitude}`);
    } catch {
      setNotice("تعذّر تحديد موقعك — فعّل الموقع ثم أعد المحاولة");
    }
  };

  const call = () => {
    if (!callNumber(customerPhone)) setNotice("رقم العميل غير متاح لهذا الطلب");
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          onPress={() => navigation?.goBack?.()}
          style={s.back}
        >
          <ArrowRight size={20} color={colors.textHeading} />
        </Pressable>

        <View style={s.avatar}><Text style={s.initials}>{customerName.slice(0, 2)}</Text></View>

        <View style={s.headerCopy}>
          <Text style={s.name} numberOfLines={1}>{customerName}</Text>
          <View style={s.stateRow}>
            <View style={[s.dot, { backgroundColor: connected ? colors.success : colors.textMuted2 }]} />
            <Text style={[s.state, { color: connected ? colors.success : colors.textMuted }]}>
              {connected ? "متصل بالمحادثة" : chatId ? "انقطع الاتصال — نحاول إعادة الوصل" : "جارٍ الفتح"}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`اتصال بالعميل ${customerName}`}
          onPress={call}
          style={s.callBtn}
        >
          <Phone size={20} weight="fill" color={colors.primary} />
        </Pressable>
      </View>

      {notice ? (
        <Pressable
          accessibilityRole="alert"
          accessibilityLabel={notice}
          onPress={() => setNotice("")}
          style={s.notice}
        >
          <Text style={s.noticeText}>{notice}</Text>
        </Pressable>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={s.flex}
        contentContainerStyle={s.log}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.centerText}>جارٍ تحميل الرسائل…</Text>
          </View>
        ) : error ? (
          <ErrorState title="تعذّر فتح المحادثة" message={error} onRetry={load} />
        ) : messages.length === 0 ? (
          <EmptyState
            title="لا رسائل بعد"
            message="اكتب للعميل ليعرف أنك في الطريق، أو استعمل ردّاً جاهزاً بالأسفل."
          />
        ) : null}

        {messages.map((m) => {
          const mine = isMine(m, myId);
          const label = `${mine ? "أنت" : customerName}: ${msgText(m)}، ${msgTime(m)}${
            m.failed ? "، لم تُرسل" : m.pending ? "، قيد الإرسال" : ""
          }`;

          return mine ? (
            <View key={getId(m)} style={s.meWrap}>
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.meBubble, m.pending && s.pendingBubble, m.failed && s.failedBubble]}
                accessible
                accessibilityLabel={label}
              >
                <Text style={s.meText}>{msgText(m)}</Text>
                <View style={s.metaRow}>
                  <Text style={s.meMeta}>{msgTime(m)}</Text>
                  <Text style={s.meMeta}>
                    {m.failed ? "لم تُرسل" : m.pending ? "جارٍ الإرسال…" : "أُرسلت"}
                  </Text>
                </View>
              </LinearGradient>

              {m.failed ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="إعادة إرسال الرسالة"
                  onPress={() => retry(m)}
                  style={s.retry}
                >
                  <ArrowClockwise size={13} weight="bold" color={colors.danger} />
                  <Text style={s.retryText}>إعادة الإرسال</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View key={getId(m)} style={s.themBubble} accessible accessibilityLabel={label}>
              <Text style={s.themText}>{msgText(m)}</Text>
              <Text style={s.themMeta}>{msgTime(m)}</Text>
            </View>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.quickScroll}
        contentContainerStyle={s.quickRow}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="مشاركة موقعي الحالي"
          onPress={shareLocation}
          style={[s.chip, s.chipAccent]}
        >
          <MapPin size={14} weight="fill" color={colors.primary} />
          <Text style={s.chipText}>مشاركة موقعي</Text>
        </Pressable>

        {QUICK_REPLIES.map((reply) => (
          <Pressable
            key={reply}
            accessibilityRole="button"
            accessibilityLabel={`إرسال: ${reply}`}
            onPress={() => sendBody(reply)}
            style={s.chip}
          >
            <Text style={s.chipText}>{reply}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[s.composer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="اكتب رسالة…"
          placeholderTextColor={colors.textMuted2}
          style={s.input}
          multiline
          accessibilityLabel="نص الرسالة"
          onSubmitEditing={() => sendBody(text)}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="إرسال"
          accessibilityState={{ disabled: !text.trim() || sending }}
          disabled={!text.trim() || sending}
          onPress={() => sendBody(text)}
          style={[s.send, (!text.trim() || sending) && s.sendOff]}
        >
          <PaperPlaneTilt size={19} weight="fill" color={colors.onPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  flex: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: font.size.sm, fontWeight: "700", color: colors.primary },
  headerCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: font.size.md, fontWeight: "700", color: colors.textHeading, textAlign: "right" },
  stateRow: { flexDirection: "row-reverse", alignItems: "center", gap: 5, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  state: { fontSize: font.size.xs },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },

  notice: { backgroundColor: colors.dangerBg, paddingVertical: spacing.sm, paddingHorizontal: spacing.screenH },
  noticeText: { fontSize: font.size.xs, color: colors.danger, textAlign: "center" },

  log: {
    width: "100%",
    maxWidth: layout?.contentMaxWidth ?? 640,
    alignSelf: "center",
    padding: spacing.screenH,
    gap: spacing.sm,
  },
  center: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl },
  centerText: { fontSize: font.size.sm, color: colors.textMuted },

  meWrap: { alignSelf: "flex-start", maxWidth: "82%", gap: 4 },
  meBubble: {
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pendingBubble: { opacity: 0.7 },
  failedBubble: { opacity: 0.85 },
  meText: { fontSize: font.size.sm, color: colors.onPrimary, lineHeight: 21, textAlign: "right" },
  metaRow: { flexDirection: "row-reverse", justifyContent: "space-between", gap: spacing.sm, marginTop: 3 },
  meMeta: { fontSize: font.size.xxs, color: "rgba(255,255,255,0.82)" },
  retry: { flexDirection: "row-reverse", alignItems: "center", gap: 4, paddingHorizontal: 4 },
  retryText: { fontSize: font.size.xxs, fontWeight: "700", color: colors.danger },

  themBubble: {
    alignSelf: "flex-end",
    maxWidth: "82%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  themText: { fontSize: font.size.sm, color: colors.textHeading, lineHeight: 21, textAlign: "right" },
  themMeta: { fontSize: font.size.xxs, color: colors.textMuted, marginTop: 3, textAlign: "left" },

  quickScroll: { maxHeight: 52, backgroundColor: colors.screenBg },
  quickRow: { flexDirection: "row-reverse", gap: spacing.sm, paddingHorizontal: spacing.screenH, paddingVertical: spacing.sm },
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  chipAccent: { backgroundColor: colors.tint, borderColor: colors.tint2 },
  chipText: { fontSize: font.size.xs, color: colors.textBody },

  composer: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontFamily: font.family,
    fontSize: font.size.sm,
    color: colors.textHeading,
    textAlign: "right",
    backgroundColor: colors.screenBg,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendOff: { opacity: 0.45 },
});
