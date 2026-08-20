// ============================================================
//  HomeScreen  —  ٢ · الرئيسية (متصل / غير متصل)
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, View } from "react-native";
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
import { IconButton, LinkText, SectionHeader } from "../../components/ui";
import {
  Card,
  GlassButton,
  GradientButton,
  GradientOrb,
  ProviderScreen,
  StatTile,
  navClearance,
} from "../../components/providerUi";
import ProviderNav from "../../components/ProviderNav";
import useReducedMotion from "../../hooks/useReducedMotion";
import { colors, font, gradients, onDark, providerMotion, providerRadius, spacing } from "../../theme/theme";
import { PROVIDER } from "../../services/demo";

// اسم الفنّي من مصدر واحد مع «حسابي» — كان مكتوباً في الشاشتين، فتغييره في
// إحداهما يجعل التطبيق يناديه باسمين. الحرف الأول يُشتقّ منه لا يُكتب يدوياً.
const initial = PROVIDER.name.replace(/^م\.\s*/, "").trim().charAt(0) || "ف";

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
  const [online, setOnline] = useState(false);

  const goTab = (key) => {
    if (key === "orders") navigation?.navigate?.("MyRequests");
    if (key === "alerts") navigation?.navigate?.("Notifications");
    if (key === "account") navigation?.navigate?.("Profile");
  };

  return (
    <ProviderScreen padded={false} withNav bottomInset={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: navClearance(insets.bottom) }]}
      >
        <View style={s.topbar}>
          <View style={s.greetRow}>
            <LinearGradient colors={gradients.logoTile} style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </LinearGradient>
            <View style={s.greetText}>
              <Text style={s.greetHi}>مرحباً،</Text>
              <Text style={s.greetName} numberOfLines={1}>
                {PROVIDER.name}
              </Text>
            </View>
          </View>
          <View>
            <IconButton
              label="الإشعارات، تنبيه غير مقروء"
              onPress={() => navigation?.navigate?.("Notifications")}
              icon={<Bell size={21} color={colors.textHeading} />}
            />
            <View style={s.bellDot} pointerEvents="none" />
          </View>
        </View>

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
              label="إيقاف الاتصال"
              icon={<Power size={20} weight="fill" color={onDark.text} />}
              onPress={() => setOnline(false)}
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
              label="تشغيل الاتصال"
              tone="success"
              icon={<Power size={22} weight="fill" color={colors.onPrimary} />}
              onPress={() => setOnline(true)}
              accessibilityHint="يجعلك مرئياً للعملاء القريبين"
              style={s.toggleOn}
            />
          </Card>
        )}

        {online ? (
          <View style={s.section}>
            <SectionHeader title="لا يوجد طلب نشِط" />
            <Card style={s.waitCard} dashed>
              <View style={s.waitIcon}>
                <MagnifyingGlass size={28} color={colors.primaryLight} />
              </View>
              <Text style={s.waitTitle}>بانتظار طلب جديد</Text>
              <Text style={s.waitDesc}>سيتم إشعارك فوراً عند وصول طلب خدمة قريب منك.</Text>
              {/* مدخل تجربة التصميم — يُحذف عند ربط البثّ اللحظي */}
              {__DEV__ ? (
                <LinkText onPress={() => navigation?.navigate?.("NewRequest")} style={s.devLink}>
                  محاكاة وصول طلب ←
                </LinkText>
              ) : null}
            </Card>
          </View>
        ) : (
          <View style={s.statsRow}>
            <StatTile Icon={CheckCircle} value="٦" label="طلبات اليوم" />
            <StatTile Icon={ClockCountdown} value="—" label="طلب نشِط" />
          </View>
        )}
      </ScrollView>

      <ProviderNav active="home" onTab={goTab} unreadCount={1} />
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
  devLink: { marginTop: spacing.xs },

  statsRow: { flexDirection: "row-reverse", gap: spacing.md },
});
