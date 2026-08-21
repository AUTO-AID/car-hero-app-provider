// ============================================================
//  InServiceScreen  —  ٧ · الخدمة قيد التنفيذ
// ============================================================

import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { Check, CheckCircle } from "phosphor-react-native";
import { ConfirmSheet, ErrorBanner, StatusPill } from "../../components/ui";
import {
  Card,
  DetailRow,
  GradientButton,
  ProviderScreen,
  ServiceRow,
} from "../../components/providerUi";
import { iconForService } from "../../components/serviceIcon";
import { colors, font, spacing } from "../../theme/theme";
import { formatDuration, secondsSince } from "../../services/datetime";
import { errorFeedback, successFeedback } from "../../services/feedback";
import { statusLabel } from "../../services/requestStatus";
import { useSession } from "../../context/SessionContext";
import useRequestDetail from "../../hooks/useRequestDetail";

/**
 * عدّاد المدّة يبدأ من `startedAt` القادم من الخادم لا من لحظة فتح الشاشة:
 * الفنّي قد يخرج إلى «طلباتي» ويعود، وإعادة العدّ من الصفر كانت تمحو المدّة
 * الحقيقية للخدمة — وهي رقم يُحتكم إليه لا زينة.
 */
function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState(() => secondsSince(startedAt));

  useEffect(() => {
    setElapsed(secondsSince(startedAt));
    if (!startedAt) return undefined;
    const id = setInterval(() => setElapsed(secondsSince(startedAt)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return formatDuration(elapsed);
}

function Step({ done, active, label }) {
  return (
    <View style={s.step}>
      <View style={[s.stepDot, done && s.stepDotDone, active && s.stepDotActive]}>
        {done ? <Check size={14} weight="bold" color={colors.onPrimary} /> : active ? <View style={s.stepInner} /> : null}
      </View>
      <Text style={[s.stepLabel, active && s.stepLabelActive]}>{label}</Text>
    </View>
  );
}

export default function InServiceScreen({ navigation, route }) {
  const { completeService } = useSession();
  const { request, error } = useRequestDetail({ route, navigation });

  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const duration = useElapsed(request?.timestamps?.startedAt);

  // الخطوات تُشتقّ من طوابع الخادم لا من مصفوفة ثابتة: القائمة الثابتة كانت
  // تعرض «الوصول للعميل ✓» حتى لو لم يُسجَّل الوصول أصلاً.
  const steps = [
    { key: "accepted", label: "قبول الطلب", done: !!request?.timestamps?.acceptedAt },
    { key: "arrived", label: "الوصول للعميل", done: !!request?.timestamps?.startedAt },
    { key: "working", label: "تنفيذ الخدمة الآن", active: true },
  ];

  const onComplete = async () => {
    setConfirm(false);
    if (busy || !request) return;
    setBusy(true);
    setActionError("");
    try {
      const updated = await completeService(request.id);
      successFeedback();
      navigation?.replace?.("Completed", { request: updated });
    } catch (err) {
      errorFeedback();
      setActionError(err?.message || "تعذّر إنهاء الخدمة، حاول مجدداً");
      setBusy(false);
    }
  };

  return (
    <ProviderScreen>
      <View style={s.chipRow}>
        <StatusPill label={statusLabel(request?.status) || "الخدمة قيد التنفيذ"} tone="info" />
      </View>

      <ErrorBanner message={actionError || error} style={s.error} />

      <Card style={s.card} raised>
        <ServiceRow
          Icon={iconForService(request?.serviceName)}
          title={request?.serviceName || "خدمة"}
          subtitle={`طلب ‏#${request?.shortNumber ?? "----"}`}
          size={60}
        />
        <View style={s.divider} />
        <DetailRow label="العميل" value={request?.customer?.name || "—"} />
        {/* كانت الحالة تُعرض كـ«IN_SERVICE» — رمز داخلي للخادم لا نصّ للفنّي */}
        <DetailRow
          label="الحالة"
          valueNode={<StatusPill label={statusLabel(request?.status)} tone="info" />}
        />
        <DetailRow label="مدة التنفيذ" value={duration} last />
      </Card>

      <Card style={s.stepsCard}>
        {steps.map((step) => (
          <Step key={step.key} done={step.done} active={step.active} label={step.label} />
        ))}
      </Card>

      <View style={s.spacer} />

      <GradientButton
        label={busy ? "جارٍ الإنهاء…" : "إنهاء الخدمة"}
        tone="success"
        height={62}
        disabled={busy || !request}
        icon={<CheckCircle size={22} weight="fill" color={colors.onPrimary} />}
        onPress={() => setConfirm(true)}
        accessibilityHint="يفتح تأكيداً قبل إغلاق الطلب"
      />

      {/* كانت `Modal` خامّة: بلا خلفية قابلة للإغلاق، وبلا دور `alert`، وزرّ
          «إلغاء» فيها أضيق من هدف اللمس. `ConfirmSheet` من الطبقة المشتركة
          هي نفسها التي يستعملها تطبيق العميل في كل تأكيداته. */}
      <ConfirmSheet
        visible={confirm}
        title="تأكيد إنهاء الخدمة"
        message="هل أنت متأكد من إنهاء هذه الخدمة؟ سيُطلب من العميل تأكيد الإتمام."
        confirmLabel="إنهاء الخدمة"
        cancelLabel="إلغاء"
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={onComplete}
      />
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  chipRow: { alignItems: "center" },
  error: { marginTop: spacing.lg },
  card: { marginTop: spacing.xxl, padding: spacing.xl },
  divider: { height: 1, backgroundColor: colors.borderRow, marginTop: spacing.lg, marginBottom: spacing.xs },

  stepsCard: { marginTop: spacing.xl, padding: spacing.xl, gap: spacing.md + 2 },
  step: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotDone: { backgroundColor: colors.success },
  stepDotActive: { backgroundColor: colors.tint, borderWidth: 2, borderColor: colors.primaryLight },
  stepInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryLight },
  stepLabel: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textDark, textAlign: "right" },
  stepLabelActive: { color: colors.primary, fontWeight: font.weight.bold },

  spacer: { flex: 1, minHeight: spacing.xl },
});
