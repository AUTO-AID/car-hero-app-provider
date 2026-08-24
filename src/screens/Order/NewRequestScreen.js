// ============================================================
//  NewRequestScreen  —  ٣ · طلب وارد (نافذة ردّ محدودة)
//
//  العدّاد يبدأ من `offer.secondsRemaining` القادم من الخادم لا من رقم ثابت:
//  الإشعار قد يُفتح بعد ثوانٍ من وصوله، والبدء من عشرين كان يَعِد الفنّي بوقت
//  لا يملكه — ثم يُرفض قبوله بـ409 بلا سبب مفهوم.
//
//  انتهاء المهلة هنا يُبلَّغ للخادم (`expireRequest`) كي ينتقل الطلب فوراً إلى
//  الفنّي التالي بدل انتظار دورة المسح.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import Svg, { Circle } from "react-native-svg";
import { Check, Clock, CurrencyCircleDollar, MapPin, MapPinLine, X } from "phosphor-react-native";
import {
  Card,
  GlassButton,
  GradientButton,
  IconTile,
  ProviderScreen,
  StatTile,
} from "../../components/providerUi";
import { ErrorBanner } from "../../components/ui";
import { iconForService } from "../../components/serviceIcon";
import useReducedMotion from "../../hooks/useReducedMotion";
import { colors, font, gradients, onDark, spacing } from "../../theme/theme";
import { useSession } from "../../context/SessionContext";
import { arabicNumber } from "../../services/datetime";
import { errorFeedback, successFeedback } from "../../services/feedback";

const R = 58;
const CIRC = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function NewRequestScreen({ navigation, route }) {
  const reduceMotion = useReducedMotion();
  const { incomingRequest, acceptRequest, rejectRequest, expireRequest, offerWindowSeconds } = useSession();

  // مصدر الطلب مزدوج: معاملات المسار (قفزة من الإشعار أو من البثّ اللحظي) ثم
  // السياق. الأول يصل قبل أن يستقرّ الثاني في بعض المسارات، والاعتماد على
  // أحدهما وحده كان يُظهر شاشة فارغة لجزء من الثانية.
  const request = route?.params?.request || incomingRequest;

  // احتياطٌ أخير فقط: الخادم هو من يحسم النافذة، وهذا الرقم يطابق قيمته
  // الافتراضية (PROVIDER_OFFER_WINDOW_SECONDS) كي لا يعرض العدّاد رقماً كاذباً.
  const total = request?.offer?.windowSeconds || offerWindowSeconds || 45;
  const initialLeft = request?.offer?.secondsRemaining ?? total;

  const [left, setLeft] = useState(initialLeft);
  const [busy, setBusy] = useState(null); // 'accept' | 'reject' | null
  const [error, setError] = useState("");
  const progress = useRef(new Animated.Value(total > 0 ? initialLeft / total : 0)).current;
  const settledRef = useRef(false);

  // ------------------------------------------------------------
  //  العدّاد
  // ------------------------------------------------------------
  useEffect(() => {
    if (!request) return undefined;

    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: Math.max(0, initialLeft) * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();

    // الحدّ خارج المُحدِّث والتنظيف في مكان واحد: كان `clearInterval` داخل
    // `setLeft`، فإن أعاد React تشغيل الدالة (StrictMode) انطفأ المؤقّت قبل
    // أوانه.
    const id = setInterval(() => {
      setLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);

    return () => {
      animation.stop();
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  // ------------------------------------------------------------
  //  انتهت النافذة
  // ------------------------------------------------------------
  useEffect(() => {
    if (!request || left > 0 || settledRef.current) return undefined;
    settledRef.current = true;

    const id = setTimeout(async () => {
      await expireRequest(request.id);
      navigation?.replace?.("Home");
    }, 600);
    return () => clearTimeout(id);
  }, [left, request, expireRequest, navigation]);

  // الشاشة فُتحت بلا طلب (تحديث ساخن، أو أُغلق العرض قبل الرسم): لا نعرض
  // هيكلاً فارغاً بعدّاد يدور على لا شيء.
  useEffect(() => {
    if (!request) navigation?.replace?.("Home");
  }, [request, navigation]);

  const onAccept = useCallback(async () => {
    if (busy || left === 0) return;
    setBusy("accept");
    setError("");
    try {
      const accepted = await acceptRequest(request.id);
      settledRef.current = true;
      successFeedback();
      navigation?.replace?.("RequestDetails", { request: accepted });
    } catch (err) {
      errorFeedback();
      // 409 يعني أن الطلب لم يعد لنا (مهلة/سبقنا غيرنا/إلغاء): لا فائدة من
      // إبقاء الفنّي على شاشة لا يستطيع فعل شيء فيها.
      if (err?.isConflict) {
        setError(err.message);
        settledRef.current = true;
        setTimeout(() => navigation?.replace?.("Home"), 1400);
        return;
      }
      setError(err?.message || "تعذّر قبول الطلب، حاول مجدداً");
      setBusy(null);
    }
  }, [busy, left, request, acceptRequest, navigation]);

  const onReject = useCallback(async () => {
    if (busy) return;
    setBusy("reject");
    settledRef.current = true;
    // الرفض لا يفشل من وجهة نظر الفنّي: حتى لو رفض الخادم النداء (انتهت
    // المهلة أصلاً) فالنتيجة واحدة — الطلب لم يعد له.
    await rejectRequest(request.id).catch(() => {});
    navigation?.replace?.("Home");
  }, [busy, request, rejectRequest, navigation]);

  if (!request) return <ProviderScreen gradient={gradients.night} />;

  const dashoffset = progress.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] });
  const expired = left === 0;
  const Icon = iconForService(request.serviceName);

  return (
    <ProviderScreen gradient={gradients.night}>
      <View style={s.head}>
        <View style={s.headDot} />
        <Text style={s.headText} accessibilityRole="header">
          طلب خدمة جديد
        </Text>
      </View>

      {/* الحلقة زخرفة للرقم، والرقم هو ما يُقرأ: `aria-hidden` على الرسم
          و`accessibilityLiveRegion` على النصّ كي يُعلن التناقص مرّة واحدة. */}
      <View style={s.ringWrap}>
        <Svg
          width={132}
          height={132}
          style={{ transform: [{ rotate: "-90deg" }] }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Circle cx={66} cy={66} r={R} stroke={onDark.glassRaised} strokeWidth={9} fill="none" />
          <AnimatedCircle
            cx={66}
            cy={66}
            r={R}
            stroke={onDark.live}
            strokeWidth={9}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={reduceMotion ? 0 : dashoffset}
          />
        </Svg>
        <View style={s.ringCenter} accessibilityLiveRegion="polite">
          <Text style={s.ringNum}>{arabicNumber(left)}</Text>
          <Text style={s.ringLabel}>ثانية للرد</Text>
        </View>
      </View>

      <Card style={s.headline} padded={false}>
        <View style={s.headlineRow}>
          <IconTile Icon={Icon} size={58} gradient />
          <View style={s.headlineText}>
            <Text style={s.svcTitle}>{request.serviceName || "خدمة"}</Text>
            <Text style={s.svcNo}>طلب رقم ‏#{request.shortNumber}</Text>
          </View>
        </View>
      </Card>

      <View style={s.infoRow}>
        <StatTile
          variant="dark"
          Icon={MapPinLine}
          value={request.distanceKm != null ? arabicNumber(request.distanceKm) : "—"}
          unit="كم"
          label="المسافة"
        />
        <StatTile
          variant="dark"
          Icon={Clock}
          value={request.etaMinutes != null ? arabicNumber(request.etaMinutes) : "—"}
          unit="دقائق"
          label="زمن الوصول"
        />
        <StatTile
          variant="dark"
          Icon={CurrencyCircleDollar}
          value={arabicNumber(request.payment?.amount ?? request.amount ?? 0)}
          unit="ل.س"
          label="تقديري"
        />
      </View>

      {request.location?.address ? (
        <View style={s.locRow}>
          <MapPin size={18} color={onDark.textMuted} />
          <Text style={s.locText} numberOfLines={2}>
            {request.location.address}
          </Text>
        </View>
      ) : null}

      <ErrorBanner message={error} style={s.error} />

      <View style={s.spacer} />

      <GradientButton
        label={expired ? "انتهت المهلة" : busy === "accept" ? "جارٍ القبول…" : "قبول الطلب"}
        tone="success"
        height={64}
        disabled={expired || !!busy}
        icon={expired || busy ? null : <Check size={22} weight="bold" color={colors.onPrimary} />}
        onPress={onAccept}
        accessibilityHint="يسند الطلب إليك ويفتح تفاصيله"
      />
      <GlassButton
        label="رفض"
        danger
        icon={<X size={18} color={onDark.danger} />}
        onPress={busy ? undefined : onReject}
        style={s.reject}
      />
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  headDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: onDark.live },
  headText: { fontSize: font.size.body, fontWeight: font.weight.bold, color: onDark.text },

  ringWrap: { alignItems: "center", justifyContent: "center", marginTop: spacing.xxl, height: 132 },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringNum: { fontSize: 42, fontWeight: font.weight.bold, color: onDark.text },
  ringLabel: { fontSize: font.size.label, color: onDark.textMuted },

  headline: {
    marginTop: spacing.xxl,
    backgroundColor: onDark.glass,
    borderColor: onDark.glassBorder,
    padding: spacing.lg,
  },
  headlineRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md + 2 },
  headlineText: { flex: 1, minWidth: 0 },
  svcTitle: { fontSize: font.size.title, fontWeight: font.weight.bold, color: onDark.text, textAlign: "right" },
  svcNo: { fontSize: font.size.sm, color: onDark.textMuted, marginTop: 2, textAlign: "right" },

  infoRow: { marginTop: spacing.lg, flexDirection: "row-reverse", gap: spacing.md },
  locRow: { marginTop: spacing.md + 2, flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  locText: { flex: 1, minWidth: 0, fontSize: font.size.sm, color: onDark.textFaint, textAlign: "right" },

  error: { marginTop: spacing.md },
  spacer: { flex: 1, minHeight: spacing.xl },
  reject: { marginTop: spacing.md },
});
