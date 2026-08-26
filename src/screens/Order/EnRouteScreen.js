// ============================================================
//  EnRouteScreen  —  ٥ · في الطريق (خريطة + طبقة سفلية)
//
//  نبضة الموقع لا تُدار هنا: `SessionContext` يشغّلها ما دام هناك طلب نشِط
//  بحالة تستدعي التتبّع. ربطها بهذه الشاشة كان يعني توقّف التتبّع بمجرّد أن
//  يفتح الفنّي «طلباتي» أو يردّ على مكالمة — والعميل يرى السيارة تتجمّد.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
// أيقونة «المسار» تُصدَّر في phosphor-react-native باسم `PathIcon` لا `Path`
// (تفادياً لتصادم الاسم مع `Path` في react-native-svg). استيرادها كـ`Path`
// مباشرةً كان يعطي `undefined` فيسقط الرسم بـ«Element type is invalid».
import { ChatCircle, FlagCheckered, NavigationArrow, Phone, PathIcon as Path } from "phosphor-react-native";
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
import { callNumber, canChat, canContact, openChat } from "../../services/contact";
import { openNavigation } from "../../services/navigationLink";
import { arabicNumber } from "../../services/datetime";
import { errorFeedback, successFeedback } from "../../services/feedback";
import { useSession } from "../../context/SessionContext";
import useRequestDetail from "../../hooks/useRequestDetail";
import useTripSimulation from "../../hooks/useTripSimulation";
import { metersBetween } from "../../services/geo";

// نطاق تسجيل الوصول تلقائياً حول موقع العميل. ٨٠م توازن يتسامح مع دقّة GPS
// في المدن (تنحرف عشرات الأمتار قرب المباني) دون تسجيل وصول مبكّر كاذب.
const ARRIVAL_RADIUS_M = 80;

export default function EnRouteScreen({ navigation, route }) {
  const { markArrived, position } = useSession();
  const { request, error } = useRequestDetail({ route, navigation });

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  // يمنع السياج الجغرافي من إطلاق «وصلت» مرّتين: أول قراءة داخل النطاق تكفي،
  // وما بعدها تكرار يقذف الفنّي إلى الشاشة التالية وهو فيها.
  const autoArrivedRef = useRef(false);
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

  const onArrived = useCallback(async () => {
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
  }, [busy, request, markArrived, navigation]);

  // محاكاة الرحلة (وضع التطوير): تقود السيارة على المسار الحقيقي إلى العميل
  // وتدفع كل نقطة إلى الخادم، فتتحرّك عند العميل أيضاً. `simPosition` يَجُبّ
  // موقع الجهاز ما دامت المحاكاة تعمل.
  const { active: simActive, simPosition, start: startSim, stop: stopSim } = useTripSimulation({
    destination: request?.location,
    orderId: request?.id,
    startFrom: position,
  });
  const effectivePosition = simPosition ?? position;

  // السياج الجغرافي: أوّل قراءة تقع داخل نطاق العميل تسجّل الوصول تلقائياً،
  // مع بقاء الزرّ اليدوي احتياطاً. يقرأ الموقع الفعّال نفسه الذي يغذّي الخريطة
  // كي تعمل مع المحاكاة كما مع GPS الحقيقي.
  useEffect(() => {
    if (autoArrivedRef.current || busy || !request) return;
    const st = request.status;
    if (st && st !== "provider_en_route") return;
    const meters = metersBetween(effectivePosition, request.location);
    if (meters != null && meters <= ARRIVAL_RADIUS_M) {
      autoArrivedRef.current = true;
      stopSim();
      onArrived();
    }
  }, [effectivePosition, request, busy, onArrived, stopSim]);

  return (
    // `wide`: الخريطة تملأ العرض ولا تُحصر في عمود — نفس ما يفعله تطبيق
    // العميل في `InteractiveMapScreen`.
    <ProviderScreen padded={false} topInset={false} bottomInset={false} wide style={s.root}>
      <TrackingMap
        height="fill"
        origin={effectivePosition}
        destination={request?.location}
        onRouteInfo={setRouteInfo}
      />

      {/* زرّ محاكاة القيادة — وضع التطوير فقط، لا أثر له في الإنتاج.
          يُمكّن من رؤية السيارة تمشي والتحقّق من صحّة المسار وتزامن الوصول
          دون قيادة فعلية عشرات الأمتار بالجهاز. */}
      {__DEV__ ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={simActive ? "إيقاف محاكاة القيادة" : "محاكاة القيادة إلى العميل"}
          onPress={() => (simActive ? stopSim() : startSim())}
          style={[s.simBtn, simActive && s.simBtnActive]}
        >
          <Path size={18} weight="fill" color={simActive ? colors.onPrimary : colors.primary} />
          <Text style={[s.simLabel, simActive && s.simLabelActive]}>
            {simActive ? "إيقاف المحاكاة" : "محاكاة"}
          </Text>
        </Pressable>
      ) : null}

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
          <IconTile Icon={iconForService(request)} size={52} gradient />
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
          {/* المحادثة أولاً أثناء القيادة: الكتابة بضغطة ردٍّ جاهز أأمن من
              مكالمة، والعميل يقرأ متى استطاع. */}
          {canChat(request) ? (
            <PressableScale
              onPress={() => openChat(navigation, request)}
              feedback="action"
              accessibilityRole="button"
              accessibilityLabel={`مراسلة العميل ${customerName}`}
              accessibilityHint="يفتح محادثة الطلب"
              style={[s.callTile, s.chatTile]}
            >
              <ChatCircle size={22} weight="fill" color={colors.primary} />
              <Text style={[s.callLabel, s.chatLabel]}>مراسلة</Text>
            </PressableScale>
          ) : null}
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

  // زرّ المحاكاة — أعلى يمين الخريطة، بعيداً عن زرّ إعادة التمركز (أعلى اليسار)
  simBtn: {
    position: "absolute",
    top: spacing.xl + spacing.lg,
    right: spacing.md,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: providerRadius.tileSm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...shadow.card,
  },
  simBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  simLabel: { fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.primary },
  simLabelActive: { color: colors.onPrimary },

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
  chatTile: { backgroundColor: colors.tint, borderColor: colors.primarySoft },
  callLabel: { fontSize: font.size.xs, fontWeight: font.weight.bold, color: colors.success },
  chatLabel: { color: colors.primary },

  cta: { marginTop: spacing.lg },
});
