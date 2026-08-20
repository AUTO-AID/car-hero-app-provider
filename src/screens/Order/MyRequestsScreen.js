// ============================================================
//  MyRequestsScreen  —  ٩ · طلباتي (نشطة / سابقة)
// ============================================================

import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin } from "phosphor-react-native";
import { EmptyState, PressableScale, StatusPill } from "../../components/ui";
import {
  Card,
  IconTile,
  ProviderScreen,
  ScreenTitle,
  Segmented,
  navClearance,
} from "../../components/providerUi";
import ProviderNav from "../../components/ProviderNav";
import { iconForService } from "../../components/serviceIcon";
import { colors, font, spacing } from "../../theme/theme";
import { isCanceled, statusMeta } from "../../services/requestStatus";
import { PAST_REQUESTS } from "../../services/demo";

const TABS = [
  { key: "active", label: "نشطة" },
  { key: "past", label: "سابقة" },
];

// السابقة تُشتقّ من `PAST_REQUESTS` لا تُكتب هنا: البطاقة وشاشة السجلّ كانتا
// ستحملان نسختين من الطلب نفسه، فيكفي تعديل إحداهما ليقول التطبيق شيئين.
//
// الترتيب صريح تنازلياً: مفاتيح الكائن الرقمية يرتّبها JS تصاعدياً بنفسه،
// فكانت القائمة تبدأ بأقدم طلب — وأول ما يبحث عنه الفنّي هو آخر ما عمله.
const PAST = Object.values(PAST_REQUESTS)
  .sort((a, b) => Number(b.id) - Number(a.id))
  .map((request) => ({
    id: request.id,
    title: request.service,
    meta: `‏#${request.id} · ${request.date}`,
    status: request.status,
  }));

const DATA = {
  active: [
    {
      id: "1042",
      title: "تغيير إطار",
      meta: "‏#1042 · اليوم ٢:١٤ م",
      status: "active",
      place: "شارع المدينة المنورة · 2.4 كم",
    },
  ],
  past: PAST,
};

function RequestCard({ title, meta, status, place, onPress }) {
  const state = statusMeta(status);
  const canceled = isCanceled(status);
  const Icon = iconForService(title);
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${title}، ${state.label}، ${meta}`}
      style={s.cardWrap}
    >
      <Card>
        <View style={s.cardRow}>
          {status === "active" ? (
            <IconTile Icon={Icon} size={48} gradient />
          ) : (
            <IconTile
              Icon={Icon}
              size={48}
              tone={canceled ? [colors.dangerBg, colors.danger] : [colors.tint, colors.primaryLight]}
            />
          )}
          <View style={s.cardText}>
            <Text style={s.cardTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={s.cardMeta} numberOfLines={1}>
              {meta}
            </Text>
          </View>
          <StatusPill label={state.label} tone={state.tone} />
        </View>
        {place ? (
          <View style={s.placeRow}>
            <MapPin size={16} color={colors.primaryLight} />
            <Text style={s.placeText} numberOfLines={1}>
              {place}
            </Text>
          </View>
        ) : null}
      </Card>
    </PressableScale>
  );
}

export default function MyRequestsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("active");

  const goTab = (key) => {
    if (key === "home") navigation?.navigate?.("Home");
    if (key === "alerts") navigation?.navigate?.("Notifications");
    if (key === "account") navigation?.navigate?.("Profile");
  };

  const list = DATA[tab] || [];

  return (
    <ProviderScreen padded={false} withNav bottomInset={false}>
      <View style={s.head}>
        <ScreenTitle title="طلباتي" />
        <Segmented items={TABS} value={tab} onChange={setTab} style={s.segment} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: navClearance(insets.bottom) }]}
      >
        {/* الفراغ كان يُعرض كمساحة بيضاء صامتة: لا عنوان ولا سبب */}
        {list.length === 0 ? (
          <EmptyState
            title={tab === "active" ? "لا طلبات نشطة" : "لا طلبات سابقة"}
            message={
              tab === "active"
                ? "ستظهر هنا الطلبات التي تقبلها حتى إتمامها."
                : "ستظهر هنا الطلبات المكتملة والملغاة."
            }
          />
        ) : (
          list.map((item) => (
            <RequestCard
              key={item.id}
              {...item}
              // النشِط يفتح شاشة العمل (تفاصيل + بدء التوجيه)، والمنتهي يفتح
              // سجلّه للقراءة. خلطهما كان يعرض زرّ «بدء التوجيه» فوق طلب
              // أُغلق قبل أسبوع.
              onPress={
                item.status === "active"
                  ? () => navigation?.navigate?.("RequestDetails")
                  : () => navigation?.navigate?.("PastRequest", { id: item.id })
              }
            />
          ))
        )}
      </ScrollView>

      <ProviderNav active="orders" onTab={goTab} unreadCount={1} />
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  segment: { marginTop: spacing.xs },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },

  cardWrap: { borderRadius: spacing.xl },
  cardRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.textDark, textAlign: "right" },
  cardMeta: { fontSize: font.size.label, color: colors.textMuted, textAlign: "right", marginTop: 2 },
  placeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderRow,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  placeText: { flex: 1, minWidth: 0, fontSize: font.size.sm, color: colors.textBody, textAlign: "right" },
});
