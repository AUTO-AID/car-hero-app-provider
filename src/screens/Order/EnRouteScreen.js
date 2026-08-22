// ============================================================
//  EnRouteScreen  —  ٥ · في الطريق (خريطة + طبقة سفلية)
//
//  نبضة الموقع لا تُدار هنا: `SessionContext` يشغّلها ما دام هناك طلب نشِط
//  بحالة تستدعي التتبّع. ربطها بهذه الشاشة كان يعني توقّف التتبّع بمجرّد أن
//  يفتح الفنّي «طلباتي» أو يردّ على مكالمة — والعميل يرى السيارة تتجمّد.
// ============================================================

import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { FlagCheckered, NavigationArrow, Phone } from "phosphor-react-native";
import {
  BottomSheet,
  FloatingBar,
  GradientButton,
  IconTile,
  ProviderScreen,
  StatTile,
} from "../../components/providerUi";
import TrackingMap from "../../components/TrackingMap";
import { ErrorBanner, PressableScale } from "../../components/ui";
import { iconForService } from "../../components/serviceIcon";
import { colors, font, layout, providerRadius, shadow, spacing } from "../../theme/theme";
import { callNumber, canContact } from "../../services/contact";
import { openNavigation } from "../../services/navigationLink";
import { arabicNumber } from "../../services/datetime";
import { errorFeedback, successFeedback } from "../../services/feedback";
import { useSession } from "../../context/SessionContext";
import useRequestDetail from "../../hooks/useRequestDetail";

export default function EnRouteScreen({ navigation, route }) {
  const { markArrived, position } = useSession();
  const { request, error } = useRequestDetail({ route, navigation });

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  // المسافة وزمن الوصول من محرّك التوجيه: الخادم يحسبهما بخطّ مستقيم، والفرق
  // في مدينة مزدحمة يبلغ الضعف — ورقمٌ يَعِد العميل بما لا يقع أسوأ من غيابه.
  const [routeInfo, setRouteInfo] = useState(null);

  const customerName = request?.customer?.name || "العميل";
  const phone = request?.customer?.phone;
  const { latitude, longitude } = request?.location || {};

  const distanceKm =
    routeInfo?.distanceKm != null ? Math.round(routeInfo.distanceKm * 10) / 10 : request?.distanceKm;
  const etaMinutes =
    routeInfo?.durationMin != null ? Math.max(1, Math.round(routeInfo.durationMin)) : request?.etaMinutes;

  const onArrived = async () => {
    if (busy || !request) return;
    setBusy(true);
    setActionError("");
    try {
      const updated = await markArrived(request.id);
      successFeedback();
      navigation?.navigate?.("Arrived", { request: updated });
    } catch (err) {
      errorFeedback();
      setActionError(err?.message || "تعذّر تسجيل الوصول، حاول مجدداً");
      setBusy(false);
    }
  };

  return (
    // `wide`: الخريطة تملأ العرض ولا تُحصر في عمود — نفس ما يفعله تطبيق
    // العميل في `InteractiveMapScreen`.
    <ProviderScreen padded={false} topInset={false} bottomInset={false} wide style={s.root}>
      <TrackingMap
        height="fill"
        origin={position}
        destination={request?.location}
        onRouteInfo={setRouteInfo}
      />

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
        <ErrorBanner message={actionError || error} style={s.error} />

        <View style={s.custRow}>
          <IconTile Icon={iconForService(request?.serviceName)} size={52} gradient />
          <View style={s.custText}>
            <Text style={s.custName} numberOfLines={1}>
              {customerName}
              {request?.serviceName ? ` · ${request.serviceName}` : ""}
            </Text>
            <Text style={s.custSub} numberOfLines={1}>
              {request?.location?.address || `طلب ‏#${request?.shortNumber ?? "----"}`}
            </Text>
          </View>
        </View>

        <View style={s.statsRow}>
          {/* رقم الطريق يسبق رقم الخادم: الأخير مسافة هوائية، وهذا مسافة سَوق */}
          <StatTile
            value={distanceKm != null ? arabicNumber(distanceKm) : "—"}
            unit="كم"
            label="متبقّية"
            style={s.statSurface}
          />
          <StatTile
            value={etaMinutes != null ? arabicNumber(etaMinutes) : "—"}
            unit="دقائق"
            label="للوصول"
            style={s.statSurface}
          />
          {/* كان الاتصال بطاقة إحصاء ثالثة شكلاً وزرّاً وظيفةً: بلا دور ولا
              اسم مسموع. هو زرّ لا رقم، فيأخذ هيئة الزرّ وقياس البطاقة معاً
              كي يبقى الصفّ مستوياً. بلا رقم يصير زرّ توجيه — الصفّ لا يبقى
              ناقصاً خانة. */}
          {canContact(phone) ? (
            <PressableScale
              onPress={() => callNumber(phone)}
              feedback="action"
              accessibilityRole="button"
              accessibilityLabel={`اتصال بالعميل ${customerName}`}
              accessibilityHint="يفتح تطبيق الهاتف على رقم العميل"
              style={s.callTile}
            >
              <Phone size={22} weight="fill" color={colors.success} />
              <Text style={s.callLabel}>اتصال</Text>
            </PressableScale>
          ) : (
            <PressableScale
              onPress={() => openNavigation(latitude, longitude, customerName)}
              feedback="action"
              accessibilityRole="button"
              accessibilityLabel="فتح التوجيه في الخرائط"
              style={[s.callTile, s.navTile]}
            >
              <NavigationArrow size={22} weight="fill" color={colors.primary} />
              <Text style={[s.callLabel, { color: colors.primary }]}>توجيه</Text>
            </PressableScale>
          )}
        </View>

        <GradientButton
          label={busy ? "جارٍ التسجيل…" : "لقد وصلت"}
          disabled={busy || !request}
          icon={<FlagCheckered size={22} weight="fill" color={colors.onPrimary} />}
          onPress={onArrived}
          accessibilityHint="يبلغ العميل بوصولك ويفتح الخطوة التالية"
          style={s.cta}
        />
      </BottomSheet>
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: colors.mapSurface },

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

  error: { marginBottom: spacing.md },
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
  navTile: { backgroundColor: colors.tint, borderColor: colors.primarySoft },
  callLabel: { fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.success },

  cta: { marginTop: spacing.lg },
});
