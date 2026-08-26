// ============================================================
//  WalletScreen  —  ١٣ · رصيدي (محفظة الفنّي)
//
//  تجيب على سؤال واحد: «كم لي الآن، ومن أين جاء؟». الرصيد الحالي في الأعلى
//  حدثاً لا سطراً، وتحته حركاته — كل خدمة أُنجزت تضيف مبلغها، وكل سحب يخصمه.
//
//  للقراءة فقط عن قصد: طلب السحب وتفاصيل الحساب البنكي يبقيان في لوحة التحكّم
//  على الويب (انظر ملاحظة «حسابي»). التطبيق الميداني يعرض الرصيد ولا يديره —
//  فالفنّي يفتحه ليطمئنّ لا ليعبّئ نموذجاً بين طلبين.
//
//  المصدر `/provider/wallet` وهو نفسه الذي تقرأه لوحة الويب: الرصيد قرار خادم
//  واحد، والتطبيق نافذة عليه لا حاسبة موازية.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowCircleDown,
  ArrowCircleUp,
  Coins,
  Info,
  Receipt,
  TrendUp,
  Wallet,
} from "phosphor-react-native";
import { AppHeader, AsyncContent, SectionHeader, StatusPill } from "../../components/ui";
import { Card, GradientOrb, IconTile, ProviderScreen, StatTile } from "../../components/providerUi";
import { colors, font, gradients, onDark, providerRadius, shadow, spacing } from "../../theme/theme";
import { formatMoney, formatNumber } from "../../services/money";
import { formatRelative } from "../../services/datetime";
import { fetchWallet, fetchWalletTransactions } from "../../services/providerApi";

/**
 * شكل الحركة حسب نوعها. الخادم يرسل `type` (credit|debit) و`referenceType`
 * (order|payout|withdrawal|…)، والاثنان معاً يحدّدان العنوان والنغمة والإشارة.
 *
 * العنوان يُبنى هنا بالعربية من `type` و`referenceType`، **لا يُقرأ من
 * `description`**: الخادم يكتب الوصف بالإنجليزية (`Commission owed on cash…`)،
 * وعرضه كما هو يخلط لغتين في شاشة عربية. التمييز الجوهري: العمولة على طلب
 * نقدي (`debit + order`) تختلف عن سحب الرصيد (`debit + payout`) — الأولى دَينٌ
 * نشأ من عمل، والثاني قبضٌ للرصيد.
 */
function decorateTxn(txn) {
  const credit = txn?.type === "credit";
  const ref = txn?.referenceType;

  // أرباح طلب إلكتروني (شام كاش): المنصّة قبضت المال وأودعت الصافي.
  if (credit && ref === "order") {
    return { Icon: ArrowCircleDown, title: "أرباح طلب", tone: "credit" };
  }
  // عمولة طلب نقدي: الفنّي قبض المبلغ بيده، فبقيت عمولة المنصّة ديناً عليه.
  if (!credit && ref === "order") {
    return { Icon: ArrowCircleUp, title: "عمولة طلب نقدي", tone: "debit" };
  }
  if (!credit && (ref === "payout" || ref === "withdrawal")) {
    return { Icon: ArrowCircleUp, title: "سحب رصيد", tone: "debit" };
  }
  // ردّ سحب رفضته الإدارة — يعود المبلغ إلى الرصيد.
  if (credit && ref === "payout_reversal") {
    return { Icon: ArrowCircleDown, title: "ردّ مبلغ سحب", tone: "credit" };
  }
  if (credit) return { Icon: ArrowCircleDown, title: "إضافة رصيد", tone: "credit" };
  return { Icon: ArrowCircleUp, title: "خصم", tone: "debit" };
}

function TxnRow({ txn, last }) {
  const { Icon, title, tone } = decorateTxn(txn);
  const credit = tone === "credit";
  const pending = txn?.status === "pending";
  const sign = credit ? "+ " : "− ";

  return (
    <View style={[s.txnRow, last && s.txnRowLast]}>
      <IconTile
        Icon={Icon}
        size={44}
        tone={credit ? [colors.successBg, colors.success] : [colors.dangerBg, colors.danger]}
      />
      <View style={s.txnText}>
        <Text style={s.txnTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={s.txnMetaRow}>
          <Text style={s.txnTime}>{formatRelative(txn?.createdAt)}</Text>
          {pending ? <StatusPill label="قيد المعالجة" tone="warning" /> : null}
        </View>
      </View>
      <Text style={[s.txnAmount, credit ? s.txnCredit : s.txnDebit]}>
        {sign}
        {formatMoney(txn?.amount)}
      </Text>
    </View>
  );
}

export default function WalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      // النداءان معاً: الرصيد وحركاته وجهان لبطاقة واحدة، وتحميلهما بالتتابع
      // كان يترك الحركات تومض بعد ظهور الرصيد.
      const [walletRes, txnRes] = await Promise.all([
        fetchWallet(),
        fetchWalletTransactions({ limit: 20 }),
      ]);
      if (!aliveRef.current) return;
      setWallet(walletRes);
      setTxns(txnRes?.data || []);
      setError("");
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err?.message || "تعذّر تحميل الرصيد.");
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  };

  const summary = wallet?.summary || {};
  const balance = wallet?.balance ?? 0;
  const pendingPayout = summary?.pendingPayouts ?? wallet?.pendingBalance ?? 0;

  // اتجاه الرصيد: صافي كشف الحساب مع المنصّة لا «محفظة أرباح». موجب = لك عندها
  // وقابل للسحب، سالب = عمولات مستحقّة عليك من طلباتٍ نقدية قبضتَ مبلغها بيدك.
  const owedToProvider = balance >= 0;

  // القوّتان اللتان تصنعان الرصيد، مفصولتين كي يفهم الفنّي مصدره: الأرباح
  // الإلكترونية (شام كاش) من الملخّص مباشرة، والعمولات المستحقّة تُجمع من
  // `breakdown` — قيود المدين التي ليست سحباً هي عمولات الطلبات النقدية.
  const electronicEarnings = summary?.totalEarnings || 0;
  const commissionsOwed =
    (summary?.breakdown || []).find((row) => row.kind === "debit")?.amount || 0;

  // قبل أول ردّ لا رصيد حقيقي بعد: عرض رقمٍ ثم قفزه إلى القيمة الفعلية يُقرأ
  // كأن رصيداً تغيّر. الشرطة تقول «جارٍ» بلا ادّعاء رقم.
  const hasWallet = !!wallet;
  const dash = "—";

  return (
    <ProviderScreen padded={false} bottomInset={false}>
      <AppHeader title="رصيدي" onBack={() => navigation?.goBack?.()} style={s.header} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* صافي الحساب — بقيمته المطلقة، واتجاهه في سطرٍ تحته: الإشارة السالبة
            وحدها لا تكفي في شاشة ميدانية، والكلمة أصرح من الرمز. */}
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <GradientOrb size={170} top={-80} left={-30} />
          <View style={s.heroTop}>
            <View style={s.heroIcon}>
              <Wallet size={22} weight="fill" color={onDark.text} />
            </View>
            <Text style={s.heroLabel}>صافي حسابك مع المنصّة</Text>
          </View>
          <Text style={s.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {hasWallet ? formatMoney(Math.abs(balance)) : dash}
          </Text>
          {hasWallet ? (
            <Text style={[s.heroDir, { color: owedToProvider ? onDark.live : onDark.danger }]}>
              {balance === 0
                ? "لا مستحقّات حالياً"
                : owedToProvider
                  ? "لك عند المنصّة · قابل للسحب"
                  : "عمولات مستحقّة عليك للمنصّة"}
            </Text>
          ) : null}
          {hasWallet && pendingPayout > 0 ? (
            <View style={s.pendingChip}>
              <Coins size={15} weight="fill" color={onDark.textSoft} />
              <Text style={s.pendingText}>
                {formatMoney(pendingPayout)} سحب قيد المعالجة
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* القوّتان اللتان تصنعان الرصيد: أرباح إلكترونية تُضيف، وعمولات نقدية
            تخصم. فصلهما يجعل الرقم أعلاه مفهوماً لا مفاجئاً. */}
        <View style={s.statsRow}>
          <StatTile
            Icon={TrendUp}
            value={hasWallet ? formatNumber(electronicEarnings) : dash}
            unit={hasWallet ? "ل.س" : undefined}
            label="أرباح إلكترونية"
          />
          <StatTile
            Icon={Receipt}
            value={hasWallet ? formatNumber(commissionsOwed) : dash}
            unit={hasWallet ? "ل.س" : undefined}
            label="عمولات مستحقّة"
          />
        </View>

        {/* لماذا قد ينقص الرصيد بعد طلب؟ الفنّي الميداني يحتاج تفسير الآلية مرّة
            لا أن يحزرها: النقد في جيبه، وعمولته دَينٌ على الرصيد. */}
        <Card style={s.infoCard}>
          <View style={s.noteRow}>
            <Info size={20} color={colors.primaryLight} />
            <Text style={s.infoText}>
              الطلبات الإلكترونية (شام كاش) تُضيف أرباحها إلى رصيدك بعد خصم العمولة.
              أمّا الطلبات النقدية فتقبض مبلغها كاملاً بيدك، وتُسجَّل عمولة المنصّة
              ديناً على رصيدك.
            </Text>
          </View>
        </Card>

        <View style={s.section}>
          <SectionHeader title="آخر الحركات" />
          <AsyncContent
            loading={loading}
            error={error}
            hasData={!!txns?.length}
            isEmpty={!!txns && txns.length === 0}
            onRetry={load}
            skeletonCount={4}
            errorTitle="تعذّر تحميل الرصيد"
            empty={{
              title: "لا حركات بعد",
              message: "ستظهر هنا حركات رصيدك: أرباح الطلبات الإلكترونية، وعمولات الطلبات النقدية، والسحوبات.",
            }}
          >
            <Card padded={false}>
              <View style={s.txnList}>
                {(txns || []).map((txn, index) => (
                  <TxnRow
                    key={txn.transactionNumber || txn.id || index}
                    txn={txn}
                    last={index === (txns || []).length - 1}
                  />
                ))}
              </View>
            </Card>
          </AsyncContent>
        </View>

        {/* السحب على الويب — نفس عقد «حسابي»: التطبيق يعرض الرصيد ولا يحرّكه. */}
        <Card style={s.noteCard}>
          <View style={s.noteRow}>
            <Receipt size={20} color={colors.textMuted} />
            <Text style={s.noteText}>
              طلبات السحب وتفاصيل الحساب البنكي تتم عبر لوحة التحكّم على الويب.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg },

  hero: {
    borderRadius: providerRadius.hero,
    padding: spacing.xxl,
    overflow: "hidden",
    ...shadow.card,
    shadowOpacity: 0.22,
  },
  heroTop: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  heroIcon: {
    width: 38,
    height: 38,
    borderRadius: providerRadius.tileSm,
    backgroundColor: onDark.glassRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: onDark.textSoft },
  heroValue: {
    fontSize: font.size.h1 + 6,
    fontWeight: font.weight.bold,
    color: onDark.text,
    textAlign: "right",
    marginTop: spacing.lg,
    writingDirection: "rtl",
  },
  heroDir: { fontSize: font.size.sm, fontWeight: font.weight.bold, textAlign: "right", marginTop: spacing.xs + 2 },
  pendingChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: onDark.glassRaised,
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    alignSelf: "flex-end",
  },
  pendingText: { fontSize: font.size.label, fontWeight: font.weight.semibold, color: onDark.textSoft },

  statsRow: { flexDirection: "row-reverse", gap: spacing.md },

  infoCard: { padding: spacing.lg, backgroundColor: colors.tint, borderColor: colors.primarySoft },
  infoText: { flex: 1, minWidth: 0, fontSize: font.size.sm, color: colors.textBody, lineHeight: 22, textAlign: "right" },

  section: { gap: spacing.sm },

  txnList: { paddingHorizontal: spacing.lg },
  txnRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderRow,
  },
  txnRowLast: { borderBottomWidth: 0 },
  txnText: { flex: 1, minWidth: 0 },
  txnTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.textDark, textAlign: "right" },
  txnMetaRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm, marginTop: 3 },
  txnTime: { fontSize: font.size.xs, color: colors.textMuted2, textAlign: "right" },
  txnAmount: { fontSize: font.size.md, fontWeight: font.weight.bold, writingDirection: "ltr" },
  txnCredit: { color: colors.success },
  txnDebit: { color: colors.danger },

  noteCard: { padding: spacing.lg },
  noteRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  noteText: { flex: 1, minWidth: 0, fontSize: font.size.sm, color: colors.textBody, lineHeight: 21, textAlign: "right" },
});
