// ============================================================
//  ArrivedScreen  —  ٦ · وصلت الموقع
// ============================================================

import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { ChatCircle, MapPinArea, Phone, Timer, Wrench } from "phosphor-react-native";
import { ErrorBanner, IconButton, StatusPill } from "../../components/ui";
import {
  Card,
  GradientButton,
  HaloIcon,
  ProviderScreen,
  ServiceRow,
} from "../../components/providerUi";
import { iconForService } from "../../components/serviceIcon";
import { colors, font, providerRadius, spacing } from "../../theme/theme";
import { formatDuration, secondsSince } from "../../services/datetime";
import { callNumber, canChat, canContact, openChat } from "../../services/contact";
import { errorFeedback, successFeedback } from "../../services/feedback";
import { useSession } from "../../context/SessionContext";
import useRequestDetail from "../../hooks/useRequestDetail";

export default function ArrivedScreen({ navigation, route }) {
  const { startService } = useSession();
  const { request, error } = useRequestDetail({ route, navigation });

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const customerName = request?.customer?.name || "العميل";
  const phone = request?.customer?.phone;

  // مدّة الانتظار منذ تسجيل الوصول. تُقرأ من الخادم لا من لحظة فتح الشاشة كي
  // لا تُصفَّر بخروج الفنّي إلى «طلباتي» وعودته. تبقى فارغة على الطلبات التي
  // سُجِّل وصولها قبل إضافة `arrivedAt` — سطرٌ غائب أصدق من صفر كاذب.
  const arrivedAt = request?.timestamps?.arrivedAt;
  const [waitSeconds, setWaitSeconds] = useState(() => secondsSince(arrivedAt));
  useEffect(() => {
    setWaitSeconds(secondsSince(arrivedAt));
    if (!arrivedAt) return undefined;
    const id = setInterval(() => setWaitSeconds(secondsSince(arrivedAt)), 1000);
    return () => clearInterval(id);
  }, [arrivedAt]);
  const waiting = arrivedAt ? formatDuration(waitSeconds) : "";

  const onStart = async () => {
    if (busy || !request) return;
    setBusy(true);
    setActionError("");
    try {
      const updated = await startService(request.id);
      successFeedback();
      navigation?.navigate?.("InService", { request: updated });
    } catch (err) {
      errorFeedback();
      setActionError(err?.message || "تعذّر بدء الخدمة، حاول مجدداً");
      setBusy(false);
    }
  };

  return (
    <ProviderScreen style={s.root}>
      <StatusPill label={`طلب ‏#${request?.shortNumber ?? "----"} · وصلت الموقع`} tone="info" />

      <View style={s.hero}>
        <HaloIcon Icon={MapPinArea} tone="success" />
      </View>

      <Text style={s.title} accessibilityRole="header">
        وصلت إلى موقع العميل
      </Text>
      <Text style={s.desc}>أنت الآن عند موقع العميل. تواصل معه إن لزم، ثم ابدأ تنفيذ الخدمة.</Text>

      <ErrorBanner message={actionError || error} style={s.error} />

      <Card style={s.card}>
        <ServiceRow
          Icon={iconForService(request?.serviceName)}
          title={request?.serviceName || "خدمة"}
          subtitle={customerName}
          trailing={
            /* الوصول هو أكثر لحظة يُسأل فيها «أين أنت بالضبط؟» — والمحادثة
               تحمل الجواب مكتوباً بينما المكالمة تضيع. */
            <View style={s.trailingRow}>
              {canChat(request) ? (
                <IconButton
                  label={`مراسلة العميل ${customerName}`}
                  onPress={() => openChat(navigation, request)}
                  icon={<ChatCircle size={20} weight="fill" color={colors.primary} />}
                  style={s.chatBtn}
                />
              ) : null}
              {canContact(phone) ? (
                <IconButton
                  label={`اتصال بالعميل ${customerName}`}
                  onPress={() => callNumber(phone)}
                  icon={<Phone size={20} weight="fill" color={colors.success} />}
                  style={s.callBtn}
                />
              ) : null}
            </View>
          }
        />
      </Card>

      <View style={s.spacer} />

      {/* الانتظار عند السيارة يجب أن يكون مرئياً: بلا رقم لا يعرف الفنّي أنه
          واقف منذ عشر دقائق لم تُحتسب له، والعميل لا يعرف لماذا لم تبدأ. */}
      {waiting ? (
        <View style={s.waitRow}>
          <Timer size={16} weight="bold" color={colors.textMuted} />
          <Text style={s.waitText}>منذ وصولك: {waiting}</Text>
        </View>
      ) : null}

      <GradientButton
        label={busy ? "جارٍ البدء…" : "بدء الخدمة"}
        tone="success"
        // أطول من زرّ عادي: هو الفعل الوحيد في الشاشة، والفنّي يضغطه واقفاً
        // بيد واحدة أمام سيارة — لا جالساً ينظر إلى الهاتف.
        height={68}
        disabled={busy || !request}
        icon={<Wrench size={24} weight="fill" color={colors.onPrimary} />}
        onPress={onStart}
        accessibilityHint="يبدأ تنفيذ الخدمة ويشغّل عدّاد المدة من الصفر"
        style={s.cta}
      />

      {/* ما سيحدث عند الضغط، قبل الضغط: العدّاد يبدأ ولا يمكن إيقافه، وهذا
          ما يجعل الفنّي يضغط عند بدء العمل فعلاً لا عند وصوله. */}
      <Text style={s.ctaHint}>يبدأ عدّاد مدّة التنفيذ من ٠٠:٠٠:٠٠ ويُبلَّغ العميل.</Text>
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  root: { alignItems: "center" },
  hero: { marginTop: spacing.xxl * 2 },
  title: {
    fontSize: font.size.h1 - 2,
    fontWeight: font.weight.bold,
    color: colors.textDark,
    marginTop: spacing.xxl + spacing.xs,
    textAlign: "center",
  },
  desc: {
    fontSize: font.size.body,
    color: colors.textBody,
    marginTop: spacing.sm + 2,
    textAlign: "center",
    lineHeight: font.lineHeight.body,
  },
  error: { alignSelf: "stretch", marginTop: spacing.lg },
  card: { alignSelf: "stretch", marginTop: spacing.xxl + spacing.xs },
  // زرّان في نهاية الصفّ: المحادثة أولاً لأنها الأنسب للسؤال المكتوب
  trailingRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  callBtn: {
    width: 46,
    height: 46,
    borderRadius: providerRadius.tileSm,
    backgroundColor: colors.successBg,
  },
  chatBtn: {
    width: 46,
    height: 46,
    borderRadius: providerRadius.tileSm,
    backgroundColor: colors.tint,
  },
  spacer: { flex: 1, minHeight: spacing.xl },

  waitRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  waitText: { fontSize: font.size.sm, color: colors.textMuted, fontVariant: ["tabular-nums"] },

  cta: { alignSelf: "stretch" },
  ctaHint: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
