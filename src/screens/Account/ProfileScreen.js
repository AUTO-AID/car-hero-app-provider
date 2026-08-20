// ============================================================
//  ProfileScreen  —  ١١ · حسابي (الملف الشخصي للفنّي)
// ============================================================

import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Buildings, Info, Phone, ShieldCheck, SignOut, User } from "phosphor-react-native";
import { ConfirmSheet, OutlineButton, StatusPill } from "../../components/ui";
import {
  Card,
  DetailRow,
  GradientOrb,
  ProviderScreen,
  ScreenTitle,
  navClearance,
} from "../../components/providerUi";
import ProviderNav from "../../components/ProviderNav";
import { colors, font, gradients, onDark, providerRadius, shadow, spacing } from "../../theme/theme";
import { PROVIDER } from "../../services/demo";

const initial = PROVIDER.shortName.trim().charAt(0) || "ف";

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const goTab = (key) => {
    if (key === "home") navigation?.navigate?.("Home");
    if (key === "orders") navigation?.navigate?.("MyRequests");
    if (key === "alerts") navigation?.navigate?.("Notifications");
  };

  return (
    <ProviderScreen padded={false} withNav bottomInset={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: navClearance(insets.bottom) }]}
      >
        <ScreenTitle title="حسابي" style={s.title} />

        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          <GradientOrb size={160} top={-70} left={-40} />
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <View style={s.headerText}>
            <Text style={s.name} numberOfLines={1}>
              {PROVIDER.name}
            </Text>
            <Text style={s.workshop} numberOfLines={1}>
              {PROVIDER.workshop}
            </Text>
            <View style={s.activeChip}>
              <View style={s.activeDot} />
              <Text style={s.activeText}>حساب مفعّل</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={s.body}>
          <Card style={s.card} padded={false}>
            <View style={s.cardInner}>
              <DetailRow Icon={User} label="الاسم" value={PROVIDER.shortName} />
              <DetailRow Icon={Buildings} label="الورشة" value={PROVIDER.workshopShort} />
              <DetailRow Icon={Phone} label="رقم الهاتف" valueNode={<Text style={s.phone}>{PROVIDER.phone}</Text>} />
              <DetailRow Icon={ShieldCheck} label="حالة الحساب" valueNode={<StatusPill label="مفعّل" tone="success" />} last />
            </View>
          </Card>

          <Card style={s.noteCard}>
            <View style={s.noteRow}>
              <Info size={20} color={colors.textMuted} />
              <Text style={s.noteText}>
                إدارة المحفظة والأرباح والتقارير تتم عبر لوحة التحكم على الويب.
              </Text>
            </View>
          </Card>

          {/* الخروج كان يقع فوراً على أول لمسة. هو فعل لا رجعة فيه من داخل
              التطبيق (الحساب من الإدارة، ولا تسجيل ذاتي)، فيستحق تأكيداً. */}
          <OutlineButton
            label="تسجيل الخروج"
            danger
            icon={<SignOut size={20} weight="bold" color={colors.danger} />}
            onPress={() => setConfirmLogout(true)}
            style={s.logout}
          />
        </View>
      </ScrollView>

      <ConfirmSheet
        visible={confirmLogout}
        title="تسجيل الخروج"
        message="ستحتاج إلى بيانات حسابك للدخول مجدداً."
        confirmLabel="خروج"
        cancelLabel="تراجع"
        danger
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          navigation?.replace?.("Login");
        }}
      />

      <ProviderNav active="account" onTab={goTab} unreadCount={1} />
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingTop: 0 },
  title: { paddingHorizontal: spacing.xl },

  header: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: providerRadius.hero - 2,
    padding: spacing.xl,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.lg,
    overflow: "hidden",
    ...shadow.card,
    shadowOpacity: 0.22,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: font.size.h1, fontWeight: font.weight.bold, color: colors.primary },
  headerText: { flex: 1, minWidth: 0 },
  name: { fontSize: font.size.body + 3, fontWeight: font.weight.bold, color: onDark.text, textAlign: "right" },
  workshop: { fontSize: font.size.sm, color: onDark.textSoft, marginTop: 3, textAlign: "right" },
  activeChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: onDark.glassRaised,
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    alignSelf: "flex-end",
  },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: onDark.live },
  activeText: { fontSize: font.size.label, fontWeight: font.weight.semibold, color: onDark.text },

  body: { padding: spacing.xl, paddingTop: spacing.lg, gap: spacing.md + 2 },
  card: {},
  cardInner: { paddingHorizontal: spacing.lg },
  phone: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.textDark, writingDirection: "ltr" },

  noteCard: { padding: spacing.lg },
  noteRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  noteText: { flex: 1, minWidth: 0, fontSize: font.size.sm, color: colors.textBody, lineHeight: 21, textAlign: "right" },

  logout: { marginTop: spacing.xs },
});
