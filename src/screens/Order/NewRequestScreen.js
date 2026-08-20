// ============================================================
//  NewRequestScreen  —  ٣ · طلب وارد (نافذة ردّ محدودة)
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import Svg, { Circle } from "react-native-svg";
import { Check, Clock, CurrencyCircleDollar, MapPin, MapPinLine, Tire, X } from "phosphor-react-native";
import {
  Card,
  GlassButton,
  GradientButton,
  IconTile,
  ProviderScreen,
  StatTile,
} from "../../components/providerUi";
import useReducedMotion from "../../hooks/useReducedMotion";
import { colors, font, gradients, onDark, providerMotion, spacing } from "../../theme/theme";

const R = 58;
const CIRC = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// النافذة الزمنية مصدرها رمز واحد في theme، فالعدّاد الرقمي والحلقة يقرآن
// منه معاً. حين كانا رقمين منفصلين كان تغيير أحدهما يترك الآخر خلفه.
const TOTAL_MS = providerMotion.responseWindow;
const TOTAL_S = Math.round(TOTAL_MS / 1000);

export default function NewRequestScreen({ navigation }) {
  const reduceMotion = useReducedMotion();
  const [left, setLeft] = useState(TOTAL_S);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: TOTAL_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();

    // العدّاد كان يُنقص داخل `setLeft` مع `clearInterval` في نفس التعبير، فإن
    // أعاد React تشغيل الدالة (StrictMode) انطفأ المؤقّت قبل أوانه. الحدّ
    // الآن خارج المُحدِّث، والتنظيف في مكان واحد.
    const id = setInterval(() => {
      setLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);

    return () => {
      animation.stop();
      clearInterval(id);
    };
  }, [progress]);

  // انتهت النافذة: الطلب يسقط عن الفنّي ويعود إلى الرئيسية. تركه معلّقاً على
  // صفر كان يوهم بأن القبول ما زال ممكناً.
  useEffect(() => {
    if (left > 0) return undefined;
    const id = setTimeout(() => navigation?.replace?.("Home"), 600);
    return () => clearTimeout(id);
  }, [left, navigation]);

  const dashoffset = progress.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] });
  const expired = left === 0;

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
          <Text style={s.ringNum}>{left}</Text>
          <Text style={s.ringLabel}>ثانية للرد</Text>
        </View>
      </View>

      <Card style={s.headline} padded={false}>
        <View style={s.headlineRow}>
          <IconTile Icon={Tire} size={58} gradient />
          <View style={s.headlineText}>
            <Text style={s.svcTitle}>تغيير إطار</Text>
            <Text style={s.svcNo}>طلب رقم ‏#1042</Text>
          </View>
        </View>
      </Card>

      <View style={s.infoRow}>
        <StatTile variant="dark" Icon={MapPinLine} value="2.4" unit="كم" label="المسافة" />
        <StatTile variant="dark" Icon={Clock} value="7" unit="دقائق" label="زمن الوصول" />
        <StatTile variant="dark" Icon={CurrencyCircleDollar} value="45" unit="ل.س" label="تقديري" />
      </View>

      <View style={s.locRow}>
        <MapPin size={18} color={onDark.textMuted} />
        <Text style={s.locText}>شارع المدينة المنورة، عمّان</Text>
      </View>

      <View style={s.spacer} />

      <GradientButton
        label={expired ? "انتهت المهلة" : "قبول الطلب"}
        tone="success"
        height={64}
        disabled={expired}
        icon={expired ? null : <Check size={22} weight="bold" color={colors.onPrimary} />}
        onPress={() => navigation?.replace?.("RequestDetails")}
        accessibilityHint="يسند الطلب إليك ويفتح تفاصيله"
      />
      <GlassButton
        label="رفض"
        danger
        icon={<X size={18} color={onDark.danger} />}
        onPress={() => navigation?.replace?.("Home")}
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
  locText: { fontSize: font.size.sm, color: onDark.textFaint },

  spacer: { flex: 1, minHeight: spacing.xl },
  reject: { marginTop: spacing.md },
});
