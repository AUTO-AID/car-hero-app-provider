// ============================================================
//  ProfileScreen  —  ١١ · حسابي (الملف الشخصي للفنّي)
//
//  للقراءة فقط عن قصد: تعديل الملف والخدمات وساعات العمل والحساب البنكي كلّها
//  في لوحة التحكّم على الويب (`PUT /providers/me/*`). تكرارها هنا كان سيعني
//  نموذجين لنفس البيانات يتسابقان — والتطبيق الميداني ليس مكان تعبئة نماذج.
// ============================================================

import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Buildings, CaretLeft, Info, Phone, ShieldCheck, SignOut, Star, User, Wallet } from "phosphor-react-native";
import { ConfirmSheet, ErrorBanner, OutlineButton, PressableScale, StatusPill } from "../../components/ui";
import {
  Card,
  DetailRow,
  GradientOrb,
  IconTile,
  ProviderScreen,
  ScreenTitle,
  navClearance,
} from "../../components/providerUi";
import ProviderNav from "../../components/ProviderNav";
import { colors, font, gradients, onDark, providerRadius, shadow, spacing } from "../../theme/theme";
import { arabicNumber } from "../../services/datetime";
import { useSession } from "../../context/SessionContext";

/**
 * حالة الحساب من زاوية «هل أستطيع العمل الآن؟» لا من زاوية حقول القاعدة.
 * الفنّي غير المعتمد كان يرى «مفعّل» أخضر ثم لا يصله طلب واحد أبداً — والشارة
 * التي تكذب أسوأ من غيابها.
 */
function accountState({ isApproved, isActive, accountStatus }) {
  if (!isApproved) return { label: "قيد المراجعة", tone: "warning", short: "قيد المراجعة" };
  if (accountStatus === "suspended" || !isActive) {
    return { label: "موقوف", tone: "danger", short: "موقوف" };
  }
  return { label: "مفعّل", tone: "success", short: "حساب مفعّل" };
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { provider, unreadNotifications, signOut, refreshProfile } = useSession();

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // الملفّ في الجلسة لقطةٌ من لحظة الدخول: التقييم الذي أضافه عميل بعدها،
  // وأي تغيير في حالة الاعتماد، لا يظهران هنا أبداً حتى إعادة تشغيل التطبيق.
  // القراءة صامتة — الشاشة تعرض القيمة المخزّنة ريثما يردّ الخادم.
  useEffect(() => {
    refreshProfile?.().catch(() => {});
  }, [refreshProfile]);

  const name = provider?.name || provider?.businessName || "الفنّي";
  const initial = name.replace(/^م\.\s*/, "").trim().charAt(0) || "ف";
  const state = accountState(provider || {});

  const goTab = (key) => {
    if (key === "home") navigation?.navigate?.("Home");
    if (key === "orders") navigation?.navigate?.("MyRequests");
    if (key === "alerts") navigation?.navigate?.("Notifications");
  };

  const onLogout = async () => {
    setBusy(true);
    setError("");
    try {
      await signOut();
      setConfirmLogout(false);
      // لا انتقال هنا: الجذر يراقب حالة الجلسة وينقل إلى شاشة الدخول.
    } catch (err) {
      setError(err?.message || "تعذّر تسجيل الخروج، حاول مجدداً");
      setConfirmLogout(false);
      setBusy(false);
    }
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
              {name}
            </Text>
            <Text style={s.workshop} numberOfLines={1}>
              {provider?.businessName || "—"}
            </Text>
            <View style={s.activeChip}>
              <View
                style={[
                  s.activeDot,
                  state.tone !== "success" && { backgroundColor: onDark.textSoft },
                ]}
              />
              <Text style={s.activeText}>{state.short}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={s.body}>
          <ErrorBanner message={error} />

          <Card style={s.card} padded={false}>
            <View style={s.cardInner}>
              <DetailRow Icon={User} label="الاسم" value={name} />
              <DetailRow Icon={Buildings} label="الورشة" value={provider?.businessName || "—"} />
              <DetailRow
                Icon={Phone}
                label="رقم الهاتف"
                valueNode={<Text style={s.phone}>{provider?.phone || "—"}</Text>}
              />
              {/* التقييم رقم واحد لا تحليل: تفصيله ورسومه في لوحة الويب */}
              <DetailRow
                Icon={Star}
                label="التقييم"
                value={
                  provider?.averageRating
                    ? `${arabicNumber(Number(provider.averageRating).toFixed(1))} من ٥`
                    : "لا تقييم بعد"
                }
              />
              <DetailRow
                Icon={ShieldCheck}
                label="حالة الحساب"
                valueNode={<StatusPill label={state.label} tone={state.tone} />}
                last
              />
            </View>
          </Card>

          {/* رصيدي — المدخل الوحيد إلى المحفظة داخل التطبيق. بطاقة لا صفّاً
              خفيفاً: الرصيد سؤال يفتحه الفنّي قصداً، فيستحق هدف لمس واضحاً. */}
          <PressableScale
            onPress={() => navigation?.navigate?.("Wallet")}
            accessibilityRole="button"
            accessibilityLabel="رصيدي"
            accessibilityHint="يفتح رصيدك الحالي وحركات أرباحك"
            style={s.walletPress}
          >
            <Card style={s.walletCard}>
              <IconTile Icon={Wallet} size={48} gradient />
              <View style={s.walletText}>
                <Text style={s.walletTitle}>رصيدي</Text>
                <Text style={s.walletSub}>صافي حسابك مع المنصّة وحركاته</Text>
              </View>
              <CaretLeft size={20} weight="bold" color={colors.textMuted} />
            </Card>
          </PressableScale>

          {/* الفنّي غير المعتمد يحتاج تفسيراً لا شارةً صامتة: لماذا لا تصله
              طلبات، ومن يرفع عنه هذا الحال. */}
          {state.tone !== "success" ? (
            <Card style={[s.noteCard, s.warnCard]}>
              <View style={s.noteRow}>
                <Info size={20} color={colors.warning} />
                <Text style={s.noteText}>
                  {state.tone === "warning"
                    ? "حسابك قيد المراجعة من الإدارة — لن تصلك طلبات حتى اعتماده."
                    : "حسابك موقوف حالياً. تواصل مع الإدارة لمعرفة التفاصيل."}
                </Text>
              </View>
            </Card>
          ) : null}

          <Card style={s.noteCard}>
            <View style={s.noteRow}>
              <Info size={20} color={colors.textMuted} />
              <Text style={s.noteText}>
                التقارير التفصيلية وطلبات السحب تتم عبر لوحة التحكم على الويب.
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
        message="ستحتاج إلى بيانات حسابك للدخول مجدداً، ولن تصلك طلبات حتى تعود."
        confirmLabel="خروج"
        cancelLabel="تراجع"
        danger
        busy={busy}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={onLogout}
      />

      <ProviderNav active="account" onTab={goTab} unreadCount={unreadNotifications} />
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

  walletPress: { borderRadius: providerRadius.card },
  walletCard: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  walletText: { flex: 1, minWidth: 0 },
  walletTitle: { fontSize: font.size.body, fontWeight: font.weight.bold, color: colors.textDark, textAlign: "right" },
  walletSub: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2, textAlign: "right" },

  noteCard: { padding: spacing.lg },
  warnCard: { borderColor: colors.warningBg, backgroundColor: colors.warningBg },
  noteRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  noteText: { flex: 1, minWidth: 0, fontSize: font.size.sm, color: colors.textBody, lineHeight: 21, textAlign: "right" },

  logout: { marginTop: spacing.xs },
});
