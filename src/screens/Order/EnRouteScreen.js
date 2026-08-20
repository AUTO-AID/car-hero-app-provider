// ============================================================
//  EnRouteScreen  —  ٥ · في الطريق (خريطة + طبقة سفلية)
// ============================================================

import React from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
// `Truck` لا `TowTruck`: الأخيرة **غير موجودة في phosphor** أصلاً، فكانت تصل
// `undefined` وتُسقط الشاشة كلها إلى صفحة بيضاء عند الضغط على «بدء التوجيه».
// و`Truck` هي نفسها أيقونة السحب في تطبيق العميل (`ServiceCatalogScreen`)،
// فالخدمة الواحدة ترتدي رمزاً واحداً في التطبيقين.
import { FlagCheckered, MapPin, NavigationArrow, Phone, Tire, Truck } from "phosphor-react-native";
import {
  BottomSheet,
  FloatingBar,
  GradientButton,
  IconTile,
  MapCanvas,
  ProviderScreen,
  StatTile,
} from "../../components/providerUi";
import { PressableScale } from "../../components/ui";
import { colors, font, layout, providerRadius, shadow, spacing } from "../../theme/theme";
import { callNumber } from "../../services/contact";
import { DEMO_CUSTOMER } from "../../services/demo";

export default function EnRouteScreen({ navigation }) {
  return (
    // `wide`: الخريطة تملأ العرض ولا تُحصر في عمود — نفس ما يفعله تطبيق
    // العميل في `InteractiveMapScreen`.
    <ProviderScreen padded={false} topInset={false} bottomInset={false} wide style={s.root}>
      <MapCanvas
        rounded={false}
        vertical
        style={StyleSheet.absoluteFill}
        accessibilityLabel="خريطة التوجيه: أنت على بُعد 2.4 كم من موقع العميل"
      >
        <View style={s.providerMarker}>
          <Truck size={20} weight="fill" color={colors.onPrimary} />
        </View>
        <View style={s.custMarker}>
          <MapPin size={22} weight="fill" color={colors.onPrimary} />
        </View>
      </MapCanvas>

      <FloatingBar>
        <View style={s.pill}>
          <View style={s.pillIcon}>
            <NavigationArrow size={20} weight="fill" color={colors.primary} />
          </View>
          <View style={s.pillText}>
            <Text style={s.pillTitle} accessibilityRole="header">
              أنت في الطريق
            </Text>
            <Text style={s.pillSub}>جارٍ إرسال موقعك للعميل</Text>
          </View>
          <View style={s.pillDot} />
        </View>
      </FloatingBar>

      <BottomSheet>
        <View style={s.custRow}>
          <IconTile Icon={Tire} size={52} gradient />
          <View style={s.custText}>
            <Text style={s.custName} numberOfLines={1}>
              {DEMO_CUSTOMER.name} · تغيير إطار
            </Text>
            <Text style={s.custSub} numberOfLines={1}>
              شارع المدينة المنورة
            </Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <StatTile value="2.4" unit="كم" label="متبقّية" style={s.statSurface} />
          <StatTile value="7" unit="دقائق" label="للوصول" style={s.statSurface} />
          {/* كان الاتصال بطاقة إحصاء ثالثة شكلاً وزرّاً وظيفةً: بلا دور ولا
              اسم مسموع. هو زرّ لا رقم، فيأخذ هيئة الزرّ وقياس البطاقة معاً
              كي يبقى الصفّ مستوياً. */}
          <PressableScale
            onPress={() => callNumber(DEMO_CUSTOMER.phone)}
            feedback="action"
            accessibilityRole="button"
            accessibilityLabel={`اتصال بالعميل ${DEMO_CUSTOMER.name}`}
            accessibilityHint="يفتح تطبيق الهاتف على رقم العميل"
            style={s.callTile}
          >
            <Phone size={22} weight="fill" color={colors.success} />
            <Text style={s.callLabel}>اتصال</Text>
          </PressableScale>
        </View>

        <GradientButton
          label="لقد وصلت"
          icon={<FlagCheckered size={22} weight="fill" color={colors.onPrimary} />}
          onPress={() => navigation?.navigate?.("Arrived")}
          accessibilityHint="يبلغ العميل بوصولك ويفتح الخطوة التالية"
          style={s.cta}
        />
      </BottomSheet>
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: colors.mapSurface },

  providerMarker: {
    position: "absolute",
    left: 104,
    bottom: 260,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.button,
  },
  custMarker: {
    position: "absolute",
    right: 118,
    top: 150,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.button,
  },

  pill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: providerRadius.tile + 2,
    padding: spacing.md,
    ...shadow.card,
    shadowOpacity: 0.18,
  },
  pillIcon: {
    width: 40,
    height: 40,
    borderRadius: providerRadius.tileSm - 2,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { flex: 1, minWidth: 0 },
  pillTitle: { fontSize: font.size.body, fontWeight: font.weight.bold, color: colors.textDark, textAlign: "right" },
  pillSub: { fontSize: font.size.label, color: colors.textMuted, textAlign: "right" },
  pillDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.success },

  custRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md + 2 },
  custText: { flex: 1, minWidth: 0 },
  custName: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.textDark, textAlign: "right" },
  custSub: { fontSize: font.size.sm, color: colors.textMuted, textAlign: "right" },

  statsRow: { flexDirection: "row-reverse", gap: spacing.md, marginTop: spacing.lg },
  statSurface: { backgroundColor: colors.screenBg },
  callTile: {
    flex: 1,
    minWidth: 0,
    minHeight: layout.touchTarget,
    borderRadius: providerRadius.tile,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successRingMid,
  },
  callLabel: { fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.success },

  cta: { marginTop: spacing.lg },
});
