// ============================================================
//  ProviderNav  —  الشريط السفلي (نظير BottomTabBar في تطبيق العميل)
//
//  يختلف عن نظيره في شيء واحد مقصود: **عائم** لا ملتصق بالحافة. شاشات الفنّي
//  خريطة أو بطاقة واحدة كبيرة، والشريط العائم يترك المحتوى يمتدّ تحته فيبدو
//  السطح أوسع. وما عدا ذلك — النغمات والحالات وسلوك اللمس وقراءة الشاشة —
//  هو عقد `BottomTabBar` نفسه.
// ============================================================

import React from "react";
import { StyleSheet, View } from "react-native";
import Text from "./AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, House, ListChecks, User } from "phosphor-react-native";
import { colors, font, layout, providerRadius, radius, shadow, spacing } from "../theme/theme";
import { PressableScale } from "./ui";
import { NAV_GAP, NAV_HEIGHT } from "./providerUi";

const TABS = [
  { id: "home", label: "الرئيسية", Icon: House },
  { id: "orders", label: "الطلبات", Icon: ListChecks },
  { id: "alerts", label: "التنبيهات", Icon: Bell },
  { id: "account", label: "حسابي", Icon: User },
];

export default function ProviderNav({ active = "home", onTab, unreadCount = 0 }) {
  const insets = useSafeAreaInsets();

  return (
    // غلاف بعرض الشاشة يتوسّط الشريط داخله: العنصر المطلق الذي يحدّد `left`
    // و`right` معاً يتجاهل `alignSelf`، فلو حصرنا عرضه مباشرة لبقي ملتصقاً
    // باليمين. الغلاف يمركزه فوق نفس عمود المحتوى (`contentMaxWidth`) بدل أن
    // يتمدّد وحده عبر الشاشة العريضة بينما البطاقات فوقه محصورة.
    <View
      style={[s.wrap, { bottom: Math.max(insets.bottom, 0) + NAV_GAP }]}
      pointerEvents="box-none"
    >
      {/* الشريط كان يجلس على `bottom: 14` ثابتاً، فيقع تحت شريط إيماءات النظام
          على الأجهزة التي لا زرّ لها — أي أن تبويباته تصير غير قابلة للّمس. */}
      <View style={s.bar} accessibilityRole="tablist">
        {TABS.map(({ id, label, Icon }) => {
          const on = id === active;
          const tone = on ? colors.primary : colors.textMuted;
          const badge = id === "alerts" && unreadCount > 0;
          return (
            <PressableScale
              key={id}
              style={s.tab}
              onPress={() => !on && onTab?.(id)}
              feedback={on ? false : "selection"}
              hitSlop={6}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={badge ? `${label}، ${unreadCount} غير مقروء` : label}
            >
              <View style={[s.iconWrap, on && s.iconWrapOn]}>
                <Icon size={22} weight={on ? "fill" : "regular"} color={tone} />
                {badge ? <View style={s.badge} pointerEvents="none" /> : null}
              </View>
              <Text
                style={[s.label, { color: tone, fontWeight: on ? font.weight.bold : font.weight.semibold }]}
                numberOfLines={1}
              >
                {label}
              </Text>
              <View style={[s.indicator, on && s.indicatorOn]} />
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: NAV_GAP,
  },
  bar: {
    width: "100%",
    maxWidth: layout.contentMaxWidth - NAV_GAP * 2,
    height: NAV_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: providerRadius.nav,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    ...shadow.card,
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  // `flex: 1` لا `space-around`: التبويبات الأربعة تقتسم العرض بالتساوي فتبقى
  // أهداف اللمس متجاورة بلا فجوات ميتة بينها.
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: layout.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconWrap: { width: 38, height: 30, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  iconWrapOn: { backgroundColor: colors.tint },
  badge: {
    position: "absolute",
    top: 2,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  label: { fontSize: font.size.xxs, textAlign: "center" },
  indicator: { width: 20, height: 2, borderRadius: 1, backgroundColor: "transparent", marginTop: 1 },
  indicatorOn: { backgroundColor: colors.primaryLight },
});
