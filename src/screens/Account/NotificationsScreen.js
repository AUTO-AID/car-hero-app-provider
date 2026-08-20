// ============================================================
//  NotificationsScreen  —  ١٠ · التنبيهات
// ============================================================

import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BellRinging, CheckCircle, Megaphone, XCircle } from "phosphor-react-native";
import { EmptyState, LinkText, PressableScale } from "../../components/ui";
import { Card, IconTile, ProviderScreen, ScreenTitle, navClearance } from "../../components/providerUi";
import ProviderNav from "../../components/ProviderNav";
import { colors, font, providerRadius, spacing } from "../../theme/theme";

// `route`: الشاشة التي يفتحها التنبيه عند الضغط. تنبيه بلا وجهة (تحديث نظام،
// إلغاء طلب انتهى) لا يحمل الحقل، فيبقى بطاقة لا زرّاً — نفس عقد
// `notificationTarget` في تطبيق العميل: الضغط يُعلّم كمقروء، ثم ينتقل إن وُجدت
// وجهة. الزرّ الذي لا يذهب إلى مكان أسوأ من نصّ لا يُضغط.
const ITEMS = [
  {
    id: "n1",
    Icon: BellRinging,
    gradient: true,
    title: "طلب خدمة جديد",
    body: "تغيير إطار على بُعد 2.4 كم — لديك ٢٠ ثانية للرد.",
    time: "الآن",
    unread: true,
    route: "NewRequest",
  },
  {
    id: "n2",
    Icon: CheckCircle,
    tone: [colors.successBg, colors.success],
    title: "تم قبول الطلب",
    body: "تم تعيينك للطلب ‏#1042 بنجاح.",
    time: "قبل ٥ دقائق",
    route: "RequestDetails",
  },
  {
    id: "n3",
    Icon: XCircle,
    tone: [colors.dangerBg, colors.danger],
    title: "تم إلغاء الطلب",
    body: "قام العميل بإلغاء الطلب ‏#1030.",
    time: "اليوم ١١:٢٠ ص",
  },
  {
    id: "n4",
    Icon: Megaphone,
    tone: [colors.tint, colors.primaryLight],
    title: "تحديث النظام",
    body: "تمت إضافة تحسينات على دقة الموقع أثناء التوجيه.",
    time: "أمس",
  },
];

function Item({ Icon, tone, gradient, title, body, time, unread, onPress }) {
  const card = (
    <Card
      style={[s.item, unread && s.itemUnread]}
      raised={unread}
      // «غير مقروء» كانت نقطة حمراء وحدها: معلومة باللون فقط، لا يصل منها
      // شيء إلى قارئ الشاشة.
      accessibilityLabel={onPress ? undefined : `${unread ? "غير مقروء: " : ""}${title}. ${body} ${time}`}
    >
      <View style={s.itemRow}>
        <IconTile Icon={Icon} size={48} gradient={gradient} tone={tone} />
        <View style={s.itemText}>
          <Text style={s.itemTitle}>{title}</Text>
          <Text style={s.itemBody}>{body}</Text>
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
      accessibilityLabel={`${unread ? "غير مقروء: " : ""}${title}. ${body} ${time}`}
      style={s.itemPress}
    >
      {card}
    </PressableScale>
  );
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState(ITEMS);
  const unread = items.filter((item) => item.unread).length;

  const goTab = (key) => {
    if (key === "home") navigation?.navigate?.("Home");
    if (key === "orders") navigation?.navigate?.("MyRequests");
    if (key === "account") navigation?.navigate?.("Profile");
  };

  const markRead = (id) =>
    setItems((list) => list.map((item) => (item.id === id ? { ...item, unread: false } : item)));

  // نفس تسلسل تطبيق العميل (`openNotification`): يُعلّم كمقروء أولاً ثم ينتقل،
  // كي لا تبقى النقطة الحمراء بعد فتح التنبيه فعلاً.
  const openItem = (item) => {
    if (item.unread) markRead(item.id);
    if (item.route) navigation?.navigate?.(item.route);
  };

  return (
    <ProviderScreen padded={false} withNav bottomInset={false}>
      <View style={s.head}>
        <ScreenTitle
          title="التنبيهات"
          // كان الزرّ نصّاً داخل `Pressable` بلا `onPress` إطلاقاً: يبدو قابلاً
          // للضغط ولا يفعل شيئاً. الآن يعمل، ويختفي حين لا يبقى غير مقروء.
          action={
            unread > 0 ? (
              <LinkText onPress={() => setItems((list) => list.map((item) => ({ ...item, unread: false })))}>
                تحديد الكل كمقروء
              </LinkText>
            ) : null
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: navClearance(insets.bottom) }]}
      >
        {items.length === 0 ? (
          <EmptyState title="لا تنبيهات" message="ستصلك هنا الطلبات الجديدة وتحديثات حالتها." />
        ) : (
          items.map((item) => (
            <Item
              key={item.id}
              {...item}
              // زرّ فقط حين يوجد ما يُفتح أو ما يُعلَّم: البطاقة المقروءة بلا
              // وجهة تبقى بطاقة، فلا يضغطها الفنّي منتظراً شيئاً.
              onPress={item.route || item.unread ? () => openItem(item) : undefined}
            />
          ))
        )}
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
