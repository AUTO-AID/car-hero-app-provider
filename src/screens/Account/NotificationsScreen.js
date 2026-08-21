// ============================================================
//  NotificationsScreen  —  ١٠ · التنبيهات
//
//  الوجهة تُشتقّ من `data` القادم مع الإشعار لا من حقل ثابت: الخادم يرفق
//  `orderId` مع كل إشعار طلب (انظر `notificationContent` + `provider-dispatch`)،
//  وهو ما يسمح بفتح الطلب الصحيح لا شاشةً عامّة. تنبيه بلا وجهة (تحديث نظام)
//  يبقى بطاقة لا زرّاً — الزرّ الذي لا يذهب إلى مكان أسوأ من نصّ لا يُضغط.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BellRinging, CheckCircle, Megaphone, WarningCircle, XCircle } from "phosphor-react-native";
import { AsyncContent, LinkText, PressableScale } from "../../components/ui";
import { Card, IconTile, ProviderScreen, ScreenTitle, navClearance } from "../../components/providerUi";
import ProviderNav from "../../components/ProviderNav";
import { colors, font, providerRadius, spacing } from "../../theme/theme";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationsApi";
import { formatRelative } from "../../services/datetime";
import { fetchRequest } from "../../services/providerApi";
import { screenForRequest } from "../../services/requestStatus";
import { useSession } from "../../context/SessionContext";

/**
 * شكل الإشعار حسب نوعه. الخادم يرسل `type` من `NotificationType` و`data.event`
 * التفصيلي — والاثنان معاً يحدّدان الأيقونة والنغمة. الافتراضي محايد لا أحمر:
 * إشعار غير معروف ليس خطأً.
 */
function decorate(item) {
  const event = item?.data?.event;
  const type = item?.type;

  if (event === "provider_app.new_request") {
    return { Icon: BellRinging, gradient: true };
  }
  if (type === "order_cancelled" || event === "provider_app.request_cancelled") {
    return { Icon: XCircle, tone: [colors.dangerBg, colors.danger] };
  }
  if (type === "order_created") {
    return { Icon: CheckCircle, tone: [colors.successBg, colors.success] };
  }
  if (type === "order_updated") {
    return { Icon: CheckCircle, tone: [colors.tint, colors.primaryLight] };
  }
  if (type === "alert" || type === "system_alert") {
    return { Icon: WarningCircle, tone: [colors.warningBg, colors.warning] };
  }
  return { Icon: Megaphone, tone: [colors.tint, colors.primaryLight] };
}

function Item({ item, onPress }) {
  const { Icon, tone, gradient } = decorate(item);
  const unread = !item.isRead;
  const time = formatRelative(item.createdAt);

  const card = (
    <Card
      style={[s.item, unread && s.itemUnread]}
      raised={unread}
      // «غير مقروء» كانت نقطة حمراء وحدها: معلومة باللون فقط، لا يصل منها
      // شيء إلى قارئ الشاشة.
      accessibilityLabel={
        onPress ? undefined : `${unread ? "غير مقروء: " : ""}${item.title}. ${item.body} ${time}`
      }
    >
      <View style={s.itemRow}>
        <IconTile Icon={Icon} size={48} gradient={gradient} tone={tone} />
        <View style={s.itemText}>
          <Text style={s.itemTitle}>{item.title}</Text>
          <Text style={s.itemBody}>{item.body}</Text>
          <Text style={s.itemTime}>{time}</Text>
        </View>
        {unread ? <View style={s.unreadDot} pointerEvents="none" /> : null}
      </View>
    </Card>
  );

  // الوصف ينتقل إلى الغلاف حين يصير الصفّ زرّاً: اسمان متداخلان يُقرآن مرّتين.
  if (!onPress) return card;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? "غير مقروء: " : ""}${item.title}. ${item.body} ${time}`}
      style={s.itemPress}
    >
      {card}
    </PressableScale>
  );
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { unreadNotifications, setUnreadCount } = useSession();

  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchNotifications();
      if (!aliveRef.current) return;
      setItems(res.notifications);
      setError("");
      setUnreadCount(res.notifications.filter((item) => !item.isRead).length);
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err?.message || "تعذّر تحميل التنبيهات.");
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  };

  const goTab = (key) => {
    if (key === "home") navigation?.navigate?.("Home");
    if (key === "orders") navigation?.navigate?.("MyRequests");
    if (key === "account") navigation?.navigate?.("Profile");
  };

  const markRead = async (item) => {
    // تفاؤلي: النقطة تختفي فوراً ثم يُثبَّت على الخادم. الانتظار كان يترك
    // النقطة الحمراء ثانيةً كاملة بعد الضغط فيبدو الضغط بلا أثر.
    setItems((list) => list.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)));
    setUnreadCount(Math.max(0, unreadNotifications - 1));
    await markNotificationRead(item.id).catch(() => {});
  };

  const markAll = async () => {
    setItems((list) => list.map((entry) => ({ ...entry, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsRead().catch(() => load({ silent: true }));
  };

  /**
   * يُعلّم كمقروء أولاً ثم ينتقل — نفس تسلسل `openNotification` عند العميل، كي
   * لا تبقى النقطة الحمراء بعد فتح التنبيه فعلاً.
   *
   * الوجهة تُحسب من **حالة الطلب الآن** لا من نوع الإشعار: إشعار «طلب جديد»
   * عمره ساعة يجب أن يفتح سجلّ الطلب لا شاشة عدّاد لعرض انتهى.
   */
  const openItem = async (item) => {
    if (!item.isRead) markRead(item);

    const orderId = item?.data?.orderId;
    if (!orderId) return;

    try {
      const request = await fetchRequest(orderId);
      navigation?.navigate?.(screenForRequest(request), { id: request.id, request });
    } catch {
      // الطلب حُذف أو لم يعد لنا — القائمة أفضل من شاشة خطأ
      navigation?.navigate?.("MyRequests");
    }
  };

  const unread = (items || []).filter((item) => !item.isRead).length;

  return (
    <ProviderScreen padded={false} withNav bottomInset={false}>
      <View style={s.head}>
        <ScreenTitle
          title="التنبيهات"
          // كان الزرّ نصّاً داخل `Pressable` بلا `onPress` إطلاقاً: يبدو قابلاً
          // للضغط ولا يفعل شيئاً. الآن يعمل، ويختفي حين لا يبقى غير مقروء.
          action={unread > 0 ? <LinkText onPress={markAll}>تحديد الكل كمقروء</LinkText> : null}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: navClearance(insets.bottom) }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <AsyncContent
          loading={loading}
          error={error}
          hasData={!!items?.length}
          isEmpty={!!items && items.length === 0}
          onRetry={load}
          errorTitle="تعذّر تحميل التنبيهات"
          empty={{
            title: "لا تنبيهات",
            message: "ستصلك هنا الطلبات الجديدة وتحديثات حالتها.",
          }}
        >
          {(items || []).map((item) => (
            <Item
              key={item.id}
              item={item}
              // زرّ فقط حين يوجد ما يُفتح أو ما يُعلَّم: البطاقة المقروءة بلا
              // وجهة تبقى بطاقة، فلا يضغطها الفنّي منتظراً شيئاً.
              onPress={item?.data?.orderId || !item.isRead ? () => openItem(item) : undefined}
            />
          ))}
        </AsyncContent>
      </ScrollView>

      <ProviderNav active="alerts" onTab={goTab} unreadCount={unread} />
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: spacing.xl },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },

  itemPress: { borderRadius: providerRadius.card },
  item: { padding: spacing.lg },
  itemUnread: { borderColor: colors.primarySoft },
  itemRow: { flexDirection: "row-reverse", gap: spacing.md + 2 },
  itemText: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: font.size.body, fontWeight: font.weight.bold, color: colors.textDark, textAlign: "right" },
  itemBody: {
    fontSize: font.size.sm,
    color: colors.textBody,
    marginTop: 3,
    lineHeight: 20,
    textAlign: "right",
  },
  itemTime: { fontSize: font.size.xs, color: colors.textMuted2, marginTop: spacing.xs + 2, textAlign: "right" },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger, marginTop: spacing.xs },
});
