// ============================================================
//  HomeScreen  —  ٢ · الرئيسية (متصل / غير متصل)
//
//  الشاشة تقرأ من `SessionContext` لا من نداء خاص بها: حالة الاتصال والطلب
//  النشِط يتغيّران من أماكن أخرى (بثّ لحظي، عودة من الخلفية، قبول طلب)،
//  وقراءتها محلياً كانت ستجعل الرئيسية تعرض لقطة قديمة بعد كل واحد منها.
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Broadcast,
  CheckCircle,
  ClockCountdown,
  MagnifyingGlass,
  Moon,
  Power,
} from "phosphor-react-native";
import { ErrorBanner, IconButton, SectionHeader } from "../../components/ui";
import {
  Card,
  GlassButton,
  GradientButton,
  GradientOrb,
  ProviderScreen,
  ServiceRow,
  StatTile,
  navClearance,
} from "../../components/providerUi";
import ProviderNav from "../../components/ProviderNav";
import { iconForService } from "../../components/serviceIcon";
import useReducedMotion from "../../hooks/useReducedMotion";
import { colors, font, gradients, onDark, providerMotion, providerRadius, spacing } from "../../theme/theme";
import { useSession } from "../../context/SessionContext";
import { arabicNumber } from "../../services/datetime";
import { screenForStatus, statusLabel } from "../../services/requestStatus";
import { errorFeedback, successFeedback } from "../../services/feedback";

// نبضة «متصل»: الحلقة وحدها تتنفّس، لا البطاقة — تحريك البطاقة كاملة يزحزح
// النصّ تحتها فيصعب قراءته. وتتوقّف كلياً مع «تقليل الحركة».
function LiveHalo({ children }) {
  const reduceMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: providerMotion.pulse,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: providerMotion.pulse,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <View style={s.haloWrap}>
      <Animated.View style={[s.haloPulse, { transform: [{ scale }], opacity }]} pointerEvents="none" />
      {children}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    provider,
    online,
    activeRequest,
    todayCount,
    unreadNotifications,
    setOnline,
    refreshHome,
  } = useSession();

  const [toggling, setToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // الحرف الأول يُشتقّ من الاسم لا يُكتب: كتابته حرفياً تفصله عن الاسم عند أول
  // حساب حقيقي. البادئة الهندسية («م.») تُنزع أولاً وإلا صار الحرف «م» للجميع.
  const name = provider?.name || provider?.businessName || "الفنّي";
  const initial = name.replace(/^م\.\s*/, "").trim().charAt(0) || "ف";

  const goTab = (key) => {
    if (key === "orders") navigation?.navigate?.("MyRequests");
    if (key === "alerts") navigation?.navigate?.("Notifications");
    if (key === "account") navigation?.navigate?.("Profile");
  };

  const toggle = async (next) => {
    setError("");
    setToggling(true);
    try {
      await setOnline(next);
      successFeedback();
    } catch (err) {
      // رفض إذن الموقع يصل هنا كـ`LocationError` برسالة عربية جاهزة، ورفض
      // الخادم («لديك طلب نشِط») كذلك — كلاهما يُعرض كما هو.
      setError(err?.message || "تعذّر تغيير حالة الاتصال، حاول مجدداً");
      errorFeedback();
    } finally {
      setToggling(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      await refreshHome();
    } catch (err) {
      setError(err?.message || "تعذّر التحديث");
    } finally {
      setRefreshing(false);
    }
  };

  const openActive = () => {
    if (!activeRequest) return;
    navigation?.navigate?.(screenForStatus(activeRequest.status), { request: activeRequest });
  };

  return (
    <ProviderScreen padded={false} withNav bottomInset={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: navClearance(insets.bottom) }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={s.topbar}>
          <View style={s.greetRow}>
            <LinearGradient colors={gradients.logoTile} style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </LinearGradient>
            <View style={s.greetText}>
              <Text style={s.greetHi}>مرحباً،</Text>
              <Text style={s.greetName} numberOfLines={1}>
                {name}
              </Text>
            </View>
          </View>
          <View>
            <IconButton
              label={
                unreadNotifications > 0
                  ? `الإشعارات، ${arabicNumber(unreadNotifications)} غير مقروء`
                  : "الإشعارات"
              }
              onPress={() => navigation?.navigate?.("Notifications")}
              icon={<Bell size={21} color={colors.textHeading} />}
            />
            {unreadNotifications > 0 ? <View style={s.bellDot} pointerEvents="none" /> : null}
          </View>
        </View>

        <ErrorBanner message={error} />

        {online ? (
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.cardOn}
          >
            <GradientOrb />
            <LiveHalo>
              <View style={s.iconCircleWhite}>
                <Broadcast size={42} weight="fill" color={colors.success} />
              </View>
            </LiveHalo>
            <View style={s.statusRow}>
              <View style={s.liveDot} />
              <Text style={s.statusOnText} accessibilityRole="header">
                أنت متصل الآن
              </Text>
            </View>
            <Text style={s.descOn}>جاهز لاستقبال طلبات الخدمة في منطقتك.</Text>
            <GlassButton
              label={toggling ? "جارٍ الإيقاف…" : "إيقاف الاتصال"}
              icon={<Power size={20} weight="fill" color={onDark.text} />}
              onPress={toggling ? undefined : () => toggle(false)}
              accessibilityHint="يوقف استقبال الطلبات الجديدة"
              style={s.toggleGlass}
            />
          </LinearGradient>
        ) : (
          <Card style={s.cardOff} raised>
            <View style={s.offRing}>
              <View style={s.offInner}>
                <Moon size={38} weight="fill" color={colors.offIcon} />
              </View>
            </View>
            <Text style={s.statusOffText} accessibilityRole="header">
              غير متاح حالياً
            </Text>
            <Text style={s.descOff}>
              أنت غير متصل الآن ولن تصلك طلبات جديدة. فعّل الاتصال لبدء استقبال الطلبات.
            </Text>
            <GradientButton
              label={toggling ? "جارٍ التشغيل…" : "تشغيل الاتصال"}
              tone="success"
              disabled={toggling}
              icon={<Power size={22} weight="fill" color={colors.onPrimary} />}
              onPress={() => toggle(true)}
              accessibilityHint="يجعلك مرئياً للعملاء القريبين ويطلب إذن الموقع"
              style={s.toggleOn}
            />
          </Card>
        )}

        {/* الطلب النشِط يسبق كل شيء: هو العمل الذي بين يدي الفنّي الآن، ويجب
            أن يكون على بُعد لمسة من الرئيسية مهما كانت حالة الاتصال. */}
        {activeRequest ? (
          <View style={s.section}>
            <SectionHeader title="طلبك النشِط" actionLabel="فتح" onAction={openActive} />
            <Card>
              <ServiceRow
                Icon={iconForService(activeRequest)}
                title={activeRequest.serviceName || "خدمة"}
                subtitle={`طلب ‏#${activeRequest.shortNumber} · ${statusLabel(activeRequest.status)}`}
                size={52}
              />
            </Card>
          </View>
        ) : online ? (
          <View style={s.section}>
            <SectionHeader title="لا يوجد طلب نشِط" />
            <Card style={s.waitCard} dashed>
              <View style={s.waitIcon}>
                <MagnifyingGlass size={28} color={colors.primaryLight} />
              </View>
              <Text style={s.waitTitle}>بانتظار طلب جديد</Text>
              <Text style={s.waitDesc}>سيتم إشعارك فوراً عند وصول طلب خدمة قريب منك.</Text>
            </Card>
          </View>
        ) : null}

        <View style={s.statsRow}>
          <StatTile Icon={CheckCircle} value={arabicNumber(todayCount)} label="طلبات اليوم" />
          <StatTile
            Icon={ClockCountdown}
            value={activeRequest ? "١" : "—"}
            label="طلب نشِط"
          />
        </View>
      </ScrollView>

      <ProviderNav active="home" onTab={goTab} unreadCount={unreadNotifications} />
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.xl },

  topbar: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  greetRow: { flex: 1, minWidth: 0, flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm + 2 },
  greetText: { flex: 1, minWidth: 0 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: providerRadius.tileSm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  avatarText: { fontSize: font.size.body, fontWeight: font.weight.bold, color: colors.primary },
  greetHi: { fontSize: font.size.label, color: colors.textMuted, textAlign: "right" },
  greetName: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.textDark, textAlign: "right" },
  bellDot: {
    position: "absolute",
    top: 4,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },

  cardOff: { borderRadius: providerRadius.hero, padding: spacing.xxl + spacing.sm, alignItems: "center" },
  offRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.offRingBorder,
    backgroundColor: colors.offRing,
    alignItems: "center",
    justifyContent: "center",
  },
  offInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.offRingInner,
    alignItems: "center",
    justifyContent: "center",
  },
  statusOffText: {
    fontSize: font.size.title,
    fontWeight: font.weight.bold,
    color: colors.textDark,
    marginTop: spacing.lg,
  },
  descOff: {
    fontSize: font.size.body,
    color: colors.textBody,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: font.lineHeight.body,
  },
  toggleOn: { alignSelf: "stretch", marginTop: spacing.xl },

  cardOn: {
    borderRadius: providerRadius.hero,
    padding: spacing.xxl + spacing.xs,
    alignItems: "center",
    overflow: "hidden",
  },
  haloWrap: { width: 118, height: 118, alignItems: "center", justifyContent: "center" },
  haloPulse: { position: "absolute", width: 96, height: 96, borderRadius: 48, backgroundColor: onDark.live },
  iconCircleWhite: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm, marginTop: spacing.lg },
  liveDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: onDark.live },
  statusOnText: { fontSize: font.size.title, fontWeight: font.weight.bold, color: onDark.text },
  descOn: {
    fontSize: font.size.md,
    color: onDark.textSoft,
    marginTop: spacing.xs + 2,
    textAlign: "center",
    lineHeight: 21,
  },
  toggleGlass: { alignSelf: "stretch", marginTop: spacing.xl },

  section: { gap: spacing.sm },
  waitCard: { padding: spacing.xxl, alignItems: "center", gap: spacing.sm },
  waitIcon: {
    width: 56,
    height: 56,
    borderRadius: providerRadius.tile,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  waitTitle: { fontSize: font.size.body, fontWeight: font.weight.bold, color: colors.textDark },
  waitDesc: { fontSize: font.size.sm, color: colors.textMuted, textAlign: "center", lineHeight: 20 },

  statsRow: { flexDirection: "row-reverse", gap: spacing.md },
});
