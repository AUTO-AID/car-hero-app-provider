// ============================================================
//  PastRequestScreen  —  ١٢ · سجلّ طلب منتهٍ (مكتمل أو ملغى)
//
//  لماذا شاشة مستقلّة عن `RequestDetailsScreen`؟ الأخيرة شاشة **عمل**: شارتها
//  «مقبول» وأسفلها زرّ «بدء التوجيه». فتحُها لطلب انتهى قبل أسبوع يعرض
//  إجراءً لا محلّ له — وأسوأ ما في شاشة سجلّ أن تعرض زرّاً يوحي بأن الطلب
//  ما زال حيّاً.
//
//  فهذه للقراءة فقط وبلا إجراء أساسي إطلاقاً: وظيفتها أن تجيب على «ماذا حدث
//  ومتى وبكم» حين يُسأل الفنّي بعد أيام. ولهذا المسار الزمني — المبني من
//  `history` القادم من الخادم — هو قلبها لا زينتها.
// ============================================================

import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Clock, MapPin, User, X } from "phosphor-react-native";
import { AppHeader, EmptyState, SkeletonCard, StatusPill } from "../../components/ui";
import { Card, DetailRow, ProviderScreen, ServiceRow } from "../../components/providerUi";
import { iconForService } from "../../components/serviceIcon";
import { colors, font, providerRadius, spacing } from "../../theme/theme";
import { formatMoney } from "../../services/money";
import { arabicNumber, formatDate, formatDuration, formatTime } from "../../services/datetime";
import { isCanceled, OrderStatus, statusLabel, statusMeta } from "../../services/requestStatus";
import useRequestDetail from "../../hooks/useRequestDetail";

// ============================================================
//  المسار الزمني — نظير `Timeline` في `OrderDetailScreen` عند العميل
//  كل نقطة كانت هناك خضراء بعلامة صحّ مهما كانت الحالة، فيبدو الإلغاء
//  إنجازاً. النغمة تأتي مع الخطوة، والخطوة الفاشلة تحمل ✕ لا ✓ — فلا تُنقل
//  النتيجة باللون وحده.
// ============================================================
function Timeline({ steps }) {
  return (
    <View style={s.timeline}>
      {steps.map((step, index) => {
        const failed = step.tone === "danger";
        const last = index === steps.length - 1;
        return (
          <View key={step.key} style={s.step}>
            <View style={s.rail}>
              <View style={[s.dot, failed && s.dotFailed]}>
                {failed ? (
                  <X size={12} weight="bold" color={colors.onPrimary} />
                ) : (
                  <Check size={12} weight="bold" color={colors.onPrimary} />
                )}
              </View>
              {/* الخيط يصل النقطة بالتي تحتها ولا يتدلّى بعد الأخيرة */}
              {last ? null : <View style={s.line} />}
            </View>
            <View style={s.stepCopy}>
              <Text style={[s.stepLabel, failed && s.stepLabelFailed]}>{step.label}</Text>
              <Text style={s.stepTime}>{step.time}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * يبني المسار من `history` القادم من الخادم.
 *
 * الخادم يسجّل كل انتقال بحالته ووقته وفاعله — وهو أدقّ مصدر ممكن. لكنه قد
 * يحمل انتقالات لا تعني الفنّي شيئاً (تعديل إداري مثلاً)، فنعرض الحالات التي
 * تخصّ عمله وحدها. وإن غاب السجلّ كلياً (طلبات قديمة سابقة لتفعيله) نعود إلى
 * طوابع الطلب نفسه بدل عرض مسار فارغ.
 */
function buildSteps(request) {
  const MEANINGFUL = [
    OrderStatus.ACCEPTED,
    OrderStatus.PROVIDER_ASSIGNED,
    OrderStatus.PROVIDER_EN_ROUTE,
    OrderStatus.PROVIDER_ARRIVED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
  ];

  const fromHistory = (request.history || [])
    .filter((entry) => MEANINGFUL.includes(entry.status))
    .map((entry, index) => ({
      key: `${entry.status}-${index}`,
      label: statusLabel(entry.status),
      time: entry.at ? formatTime(entry.at) : "—",
      tone: isCanceled(entry.status) ? "danger" : undefined,
    }));

  if (fromHistory.length) return fromHistory;

  const { timestamps = {} } = request;
  return [
    timestamps.acceptedAt && { key: "accepted", label: "قبول الطلب", time: formatTime(timestamps.acceptedAt) },
    timestamps.startedAt && { key: "started", label: "بدء الخدمة", time: formatTime(timestamps.startedAt) },
    timestamps.completedAt && { key: "done", label: "إنجاز الخدمة", time: formatTime(timestamps.completedAt) },
    timestamps.cancelledAt && {
      key: "cancelled",
      label: "إلغاء الطلب",
      time: formatTime(timestamps.cancelledAt),
      tone: "danger",
    },
  ].filter(Boolean);
}

/** مدّة التنفيذ من الطوابع — لا تُخزَّن جاهزة على الخادم */
function serviceDuration(timestamps = {}) {
  const from = timestamps.startedAt;
  const to = timestamps.completedAt || timestamps.completionRequestedAt;
  if (!from || !to) return null;
  const seconds = Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 1000);
  return seconds > 0 ? formatDuration(seconds) : null;
}

export default function PastRequestScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { request, loading, error } = useRequestDetail({ route, navigation });

  if (!request) {
    return (
      <ProviderScreen padded={false} bottomInset={false}>
        <AppHeader title="تفاصيل الطلب" onBack={() => navigation?.goBack?.()} style={s.header} />
        {loading ? (
          <View style={s.loadingWrap}>
            <SkeletonCard lines={2} showMedia />
            <SkeletonCard lines={4} />
          </View>
        ) : (
          // طلب غير موجود ليس شاشة فارغة صامتة: أي رابط قديم أو إشعار لطلب
          // حُذف يصل إلى هنا، ويحتاج مخرجاً لا جداراً.
          <EmptyState
            title="تعذّر عرض هذا الطلب"
            message={error || "لم نعثر على سجلّ هذا الطلب. جرّب فتحه من قائمة «طلباتي»."}
            actionLabel="العودة إلى طلباتي"
            onAction={() => navigation?.navigate?.("MyRequests")}
          />
        )}
      </ProviderScreen>
    );
  }

  const meta = statusMeta(request.status);
  const canceled = isCanceled(request.status);
  const Icon = iconForService(request.serviceName);
  const steps = buildSteps(request);
  const duration = serviceDuration(request.timestamps);
  const startedAt = request.timestamps?.startedAt;

  return (
    <ProviderScreen padded={false} bottomInset={false}>
      <AppHeader
        title="تفاصيل الطلب"
        subtitle={`طلب ‏#${request.shortNumber}`}
        onBack={() => navigation?.goBack?.()}
        action={<StatusPill label={meta.label} tone={meta.tone} />}
        style={s.header}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl }]}
      >
        <Card raised>
          {/* النغمة حمراء للملغى: أيقونة بنفسجية متدرّجة فوق طلب لم يقع
              تعطي السجلّ مظهر الإنجاز. */}
          <ServiceRow
            Icon={Icon}
            title={request.serviceName || "خدمة"}
            subtitle={formatDate(
              request.timestamps?.completedAt ||
                request.timestamps?.cancelledAt ||
                request.timestamps?.createdAt,
            )}
            size={56}
            tone={canceled ? [colors.dangerBg, colors.danger] : undefined}
          />
        </Card>

        <Card style={s.detailCard}>
          <DetailRow Icon={User} label="العميل" value={request.customer?.name || "—"} />
          <DetailRow Icon={MapPin} label="الموقع" value={request.location?.address || "غير محدّد"} />
          {startedAt ? (
            <DetailRow Icon={Clock} label="بدء الخدمة" value={formatTime(startedAt)} />
          ) : null}
          {duration ? <DetailRow label="مدة التنفيذ" value={duration} /> : null}
          <DetailRow
            label="المسافة"
            value={request.distanceKm != null ? `${arabicNumber(request.distanceKm)} كم` : "—"}
            last
          />
        </Card>

        {steps.length ? (
          <>
            <Text style={s.sectionTitle} accessibilityRole="header">
              مسار الطلب
            </Text>
            <Card>
              <Timeline steps={steps} />
            </Card>
          </>
        ) : null}

        {canceled ? (
          // سبب الإلغاء لا «٠ ل.س»: المبلغ الصفري يُقرأ خدمةً مجّانية لا
          // خدمةً لم تقع، والسبب هو ما يُسأل عنه الفنّي فعلاً.
          <Card style={s.reasonCard}>
            <View style={s.reasonRow}>
              <View style={s.reasonIcon}>
                <X size={16} weight="bold" color={colors.danger} />
              </View>
              <View style={s.reasonCopy}>
                <Text style={s.reasonLabel}>سبب الإلغاء</Text>
                <Text style={s.reasonText}>
                  {request.cancellation?.reason || "لم يُذكر سبب."}
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          <>
            <Text style={s.sectionTitle} accessibilityRole="header">
              التفصيل المالي
            </Text>
            <Card style={s.detailCard}>
              <DetailRow label="سعر الخدمة" value={formatMoney(request.payment?.amount)} />
              <DetailRow
                label="المبلغ المحصَّل"
                value={formatMoney(request.payment?.amount)}
                tone={colors.success}
                strong
                last
              />
            </Card>
          </>
        )}

        {/* لا زرّ إجراء هنا عن قصد: الطلب انتهى، وكل زرّ يُضاف سيكون إمّا
            بلا وظيفة أو موحياً بأن الطلب ما زال قابلاً للتعديل. */}
        <Text style={s.footNote}>
          هذا سجلّ للقراءة فقط. للاستفسار عن طلب منتهٍ تواصل مع الإدارة.
        </Text>
      </ScrollView>
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md + 2 },
  loadingWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.md },

  detailCard: { paddingVertical: 0, paddingHorizontal: spacing.lg },

  sectionTitle: {
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: spacing.xs,
  },

  timeline: { gap: 0 },
  step: { flexDirection: "row-reverse", gap: spacing.md },
  rail: { alignItems: "center", width: 26 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  dotFailed: { backgroundColor: colors.danger },
  // الخيط يمتدّ بين نقطتين: ارتفاعه هو المسافة الرأسية التي يتركها نصّ
  // الخطوة أسفل نقطتها، فلو ثبّت برقم أصغر انقطع المسار بصرياً.
  line: { flex: 1, width: 2, backgroundColor: colors.borderRow, marginVertical: 2 },
  stepCopy: { flex: 1, minWidth: 0, paddingBottom: spacing.lg },
  stepLabel: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.textDark,
    textAlign: "right",
  },
  stepLabelFailed: { color: colors.danger },
  stepTime: { fontSize: font.size.xs, color: colors.textMuted, textAlign: "right", marginTop: 2 },

  reasonCard: { borderColor: colors.dangerBorder },
  reasonRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: spacing.md },
  reasonIcon: {
    width: 32,
    height: 32,
    borderRadius: providerRadius.tileSm - 4,
    backgroundColor: colors.dangerBg,
    alignItems: "center",
    justifyContent: "center",
  },
  reasonCopy: { flex: 1, minWidth: 0 },
  reasonLabel: { fontSize: font.size.label, color: colors.textMuted, textAlign: "right" },
  reasonText: {
    fontSize: font.size.md,
    fontWeight: font.weight.semibold,
    color: colors.textDark,
    textAlign: "right",
    marginTop: 2,
    lineHeight: 22,
  },

  footNote: {
    fontSize: font.size.xs,
    color: colors.textMuted2,
    textAlign: "center",
    lineHeight: 19,
    marginTop: spacing.sm,
  },
});
