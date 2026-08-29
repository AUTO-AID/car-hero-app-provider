// ============================================================
//  RequestDetailsScreen  —  ٤ · تفاصيل الطلب (بعد القبول)
// ============================================================

import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatCircle, NavigationArrow, Phone, XCircle } from "phosphor-react-native";
import {
  AppHeader,
  ConfirmSheet,
  ErrorBanner,
  IconButton,
  OutlineButton,
  SkeletonCard,
  StatusPill,
} from "../../components/ui";
import {
  Card,
  DetailRow,
  GradientButton,
  ProviderScreen,
  ServiceRow,
} from "../../components/providerUi";
import { iconForService } from "../../components/serviceIcon";
import TrackingMap from "../../components/TrackingMap";
import { colors, font, providerRadius, spacing } from "../../theme/theme";
import { formatMoney } from "../../services/money";
import { arabicNumber, formatDateTimeLabel, formatRelative } from "../../services/datetime";
import { declineBooking } from "../../services/providerApi";
import { callNumber, canChat, canContact, openChat } from "../../services/contact";
import { reverseGeocode } from "../../services/location";
import { statusMeta } from "../../services/requestStatus";
import { errorFeedback, successFeedback } from "../../services/feedback";
import { useSession } from "../../context/SessionContext";
import useRequestDetail from "../../hooks/useRequestDetail";

export default function RequestDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { startEnRoute, position } = useSession();
  const { request, loading, error, reload } = useRequestDetail({ route, navigation });

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmDecline, setConfirmDecline] = useState(false);
  // مسافة/زمن التوجيه الحقيقيان من محرّك الخريطة (OSRM)، وعنوان مشتقّ من
  // الإحداثيات حين لا يرسله الخادم.
  const [routeInfo, setRouteInfo] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState(null);

  // حجز مجدول لم يحن موعده: لا توجيه ولا وصول بعد — الفعل الوحيد المتاح هو
  // الاعتذار، وعرض «بدء التوجيه» فوق موعدٍ بعد ثلاثة أيام يدعو إلى خطأ.
  const isBooking = !!request?.isUpcomingBooking;

  const onDecline = async () => {
    setConfirmDecline(false);
    if (busy || !request) return;
    setBusy(true);
    setActionError("");
    try {
      await declineBooking(request.id);
      successFeedback();
      navigation?.navigate?.("MyRequests");
    } catch (err) {
      errorFeedback();
      setActionError(err?.message || "تعذّر الاعتذار عن الحجز، حاول مجدداً");
      setBusy(false);
    }
  };

  const customerName = request?.customer?.name || "عميل Car Hero";
  // الحرف يُشتقّ من الاسم لا يُكتب: كتابته حرفياً تفصله عن الاسم عند أول
  // عميل حقيقي.
  const initial = customerName.trim().charAt(0) || "ع";
  const state = statusMeta(request?.status);
  const phone = request?.customer?.phone;
  const { latitude, longitude } = request?.location || {};

  // المسافة الدقيقة من التوجيه الحقيقي (طريق) تتقدّم على تقدير الخادم (خطّ
  // مستقيم)؛ نسقط إليه ما لم يصل مسار بعد.
  const distanceKm =
    routeInfo?.distanceKm != null ? Math.round(routeInfo.distanceKm * 10) / 10 : request?.distanceKm;
  const etaMinutes =
    routeInfo?.durationMin != null ? Math.max(1, Math.round(routeInfo.durationMin)) : request?.etaMinutes;

  // العنوان: من الخادم إن وُجد، وإلا المشتقّ من الإحداثيات، وإلا «محدّد على
  // الخريطة» — فالموقع معروف وإن غاب اسمه، و«غير محدّد» يوحي بعكس ذلك.
  const serverAddress = request?.location?.address;
  const locationText =
    serverAddress ||
    resolvedAddress ||
    (Number.isFinite(latitude) && Number.isFinite(longitude) ? "موقع محدّد على الخريطة" : "غير محدّد");

  useEffect(() => {
    if (serverAddress || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    let alive = true;
    reverseGeocode(latitude, longitude).then((addr) => {
      if (alive && addr) setResolvedAddress(addr);
    });
    return () => {
      alive = false;
    };
  }, [serverAddress, latitude, longitude]);

  const onStart = async () => {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      const updated = await startEnRoute(request.id);
      successFeedback();
      /**
       * الانتقال إلى شاشة «في الطريق» **داخل التطبيق** — بلا فتح خرائط خارجية.
       *
       * كان الزرّ يقذف الفنّي إلى تطبيق الخرائط (`google.navigation:` أو
       * `maps://`) قبل الانتقال: يخرج من التطبيق في اللحظة التي يبدأ فيها
       * التتبّع، فيغيب عنه المسار والحالة والمحادثة وزرّ «لقد وصلت»، ويعود
       * إليها بضغطة رجوع إن تذكّر. وشاشة «في الطريق» نفسها ترسم المسار
       * الحقيقي إلى العميل وتُحدّث موقعه لحظياً — فلا حاجة إلى مغادرة.
       */
      navigation?.navigate?.("EnRoute", { request: updated });
    } catch (err) {
      errorFeedback();
      setActionError(err?.message || "تعذّر بدء التوجيه، حاول مجدداً");
      setBusy(false);
    }
  };

  return (
    <ProviderScreen padded={false} bottomInset={false}>
      {/* الشارة كانت خضراء ثابتة مهما كانت الحالة. `StatusPill` تقرن اللون
          بنصّ وبنقطة، فلا تُنقل الحالة باللون وحده. */}
      <AppHeader
        title="تفاصيل الطلب"
        onBack={() => navigation?.goBack?.()}
        action={request ? <StatusPill label={state.label} tone={state.tone} /> : null}
        style={s.header}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {!request ? (
          loading ? (
            <>
              <SkeletonCard lines={2} showMedia />
              <SkeletonCard lines={3} />
            </>
          ) : (
            <ErrorBanner message={error || "تعذّر تحميل الطلب."} />
          )
        ) : (
          <>
            <ErrorBanner message={actionError || error} />

            <Card raised>
              <ServiceRow
                Icon={iconForService(request)}
                title={request.serviceName || "خدمة"}
                subtitle={`طلب ‏#${request.shortNumber}${
                  request.timestamps?.acceptedAt
                    ? ` · ${formatRelative(request.timestamps.acceptedAt)}`
                    : ""
                }`}
                size={56}
              />
            </Card>

            <Card>
              <Text style={s.cardHint}>بيانات العميل</Text>
              <View style={s.custRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{initial}</Text>
                </View>
                <View style={s.custText}>
                  <Text style={s.custName} numberOfLines={1}>
                    {customerName}
                  </Text>
                  <Text style={s.custSub}>عميل Car Hero</Text>
                </View>
                {/* كلّ زرّ يظهر بشرطه هو لا بشرط الآخر: الاتصال يحتاج رقماً،
                    والمحادثة تحتاج معرّف عميل. زرّ بلا ما يعمل به ينكمش
                    ويهتزّ ولا يفعل شيئاً — أسوأ من غيابه لأن الفنّي ينتظر. */}
                {canContact(phone) ? (
                  <IconButton
                    label={`اتصال بالعميل ${customerName}`}
                    onPress={() => callNumber(phone)}
                    icon={<Phone size={20} weight="fill" color={colors.success} />}
                    style={[s.actBtn, { backgroundColor: colors.successBg }]}
                  />
                ) : null}
                {canChat(request) ? (
                  <IconButton
                    label={`مراسلة العميل ${customerName}`}
                    onPress={() => openChat(navigation, request)}
                    icon={<ChatCircle size={20} weight="fill" color={colors.primary} />}
                    style={[s.actBtn, { backgroundColor: colors.tint }]}
                  />
                ) : null}
              </View>
            </Card>

            {/* خريطة حقيقية لا رسم تقريبي: الفنّي يقرّر من هذه الشاشة إن كان
                سيقبل التوجّه، والمعالم الحقيقية حول العميل تحسم القرار. */}
            <TrackingMap
              height={230}
              origin={position}
              destination={request.location}
              onRouteInfo={setRouteInfo}
            />

            <Card style={s.detailCard}>
              {/* الموعد أول ما يُقرأ في الحجز: هو ما يبني عليه الفنّي يومه */}
              {isBooking ? (
                <DetailRow label="موعد الحجز" value={formatDateTimeLabel(request.scheduledAt)} strong />
              ) : null}
              <DetailRow label="الموقع" value={locationText} />
              <DetailRow
                label="المسافة"
                value={
                  distanceKm != null
                    ? `${arabicNumber(distanceKm)} كم · ~${arabicNumber(etaMinutes)} دقيقة`
                    : "—"
                }
              />
              {request.vehicle ? (
                <DetailRow
                  label="المركبة"
                  value={[request.vehicle.brand, request.vehicle.model, request.vehicle.plateNumber]
                    .filter(Boolean)
                    .join(" · ")}
                />
              ) : null}
              {/* ملاحظة العميل تصف العطل غالباً — هي أهم سطر للفنّي قبل أن
                  يتحرّك، ولهذا لا تُخفى خلف طيّ. */}
              {request.notes ? <DetailRow label="ملاحظات العميل" value={request.notes} /> : null}
              <DetailRow
                label="السعر التقديري"
                value={formatMoney(request.payment?.amount)}
                strong
                last
              />
            </Card>
          </>
        )}
      </ScrollView>

      {request ? (
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}>
          {isBooking ? (
            <>
              <Text style={s.bookingNote}>
                سيصلك طلب تأكيد قبل الموعد. إن لم تعد تستطيع تنفيذه، اعتذر مبكراً ليجد العميل بديلاً.
              </Text>
              <OutlineButton
                label="الاعتذار عن الحجز"
                danger
                icon={<XCircle size={20} weight="bold" color={colors.danger} />}
                onPress={() => setConfirmDecline(true)}
              />
            </>
          ) : (
            <GradientButton
              label={busy ? "جارٍ البدء…" : "بدء التوجيه"}
              height={58}
              disabled={busy}
              icon={<NavigationArrow size={20} weight="fill" color={colors.onPrimary} />}
              onPress={onStart}
              accessibilityHint="يبدأ إرسال موقعك للعميل ويفتح شاشة الطريق داخل التطبيق"
            />
          )}
        </View>
      ) : null}

      <ConfirmSheet
        visible={confirmDecline}
        title="الاعتذار عن الحجز"
        message="سيُسند هذا الحجز إلى فنّي آخر. لا يمكن التراجع بعد التأكيد."
        confirmLabel="اعتذار"
        cancelLabel="تراجع"
        danger
        busy={busy}
        onCancel={() => setConfirmDecline(false)}
        onConfirm={onDecline}
      />
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg },
  scroll: { padding: spacing.xl, paddingTop: spacing.md, gap: spacing.md + 2 },

  cardHint: {
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    color: colors.textMuted,
    marginBottom: spacing.md,
    textAlign: "right",
  },
  custRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  custText: { flex: 1, minWidth: 0 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: font.weight.bold, color: colors.primary, fontSize: font.size.body },
  custName: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.textDark, textAlign: "right" },
  custSub: { fontSize: font.size.label, color: colors.textMuted, textAlign: "right" },
  actBtn: { width: 44, height: 44, borderRadius: providerRadius.tileSm },

  detailCard: { paddingVertical: 0, paddingHorizontal: spacing.lg },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.screenBg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    gap: spacing.md,
  },
  bookingNote: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
