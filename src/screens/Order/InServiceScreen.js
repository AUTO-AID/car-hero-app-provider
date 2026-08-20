// ============================================================
//  InServiceScreen  —  ٧ · الخدمة قيد التنفيذ
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { Check, CheckCircle, Tire } from "phosphor-react-native";
import { ConfirmSheet, StatusPill } from "../../components/ui";
import {
  Card,
  DetailRow,
  GradientButton,
  ProviderScreen,
  ServiceRow,
} from "../../components/providerUi";
import { colors, font, spacing } from "../../theme/theme";
import { DEMO_CUSTOMER } from "../../services/demo";

const STEPS = [
  { key: "accepted", label: "قبول الطلب", done: true },
  { key: "arrived", label: "الوصول للعميل", done: true },
  { key: "working", label: "تنفيذ الخدمة الآن", active: true },
];

// «00:12:34» كانت نصّاً ثابتاً: مدّة معطّلة تُقرأ كخلل لا كتصميم. العدّاد
// يبدأ من لحظة فتح الشاشة — وعند الربط يُستبدل مبدؤه بوقت البدء من الخادم.
function useElapsed() {
  const startedAt = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(elapsed / 3600))}:${pad(Math.floor((elapsed % 3600) / 60))}:${pad(elapsed % 60)}`;
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

export default function InServiceScreen({ navigation }) {
  const [confirm, setConfirm] = useState(false);
  const duration = useElapsed();

  return (
    <ProviderScreen>
      <View style={s.chipRow}>
        <StatusPill label="الخدمة قيد التنفيذ" tone="info" />
      </View>

      <Card style={s.card} raised>
        <ServiceRow Icon={Tire} title="تغيير إطار" subtitle="طلب ‏#1042" size={60} />
        <View style={s.divider} />
        <DetailRow label="العميل" value={DEMO_CUSTOMER.name} />
        {/* كانت الحالة تُعرض كـ«IN_SERVICE» — رمز داخلي للخادم لا نصّ للفنّي */}
        <DetailRow label="الحالة" valueNode={<StatusPill label="قيد التنفيذ" tone="info" />} />
        <DetailRow label="مدة التنفيذ" value={duration} last />
      </Card>

      <Card style={s.stepsCard}>
        {STEPS.map((step) => (
          <Step key={step.key} done={step.done} active={step.active} label={step.label} />
        ))}
      </Card>

      <View style={s.spacer} />

      <GradientButton
        label="إنهاء الخدمة"
        tone="success"
        height={62}
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
        message="هل أنت متأكد من إنهاء هذه الخدمة؟ لا يمكن التراجع بعد التأكيد."
        confirmLabel="إنهاء الخدمة"
        cancelLabel="إلغاء"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          navigation?.replace?.("Completed");
        }}
      />
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  chipRow: { alignItems: "center" },
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
