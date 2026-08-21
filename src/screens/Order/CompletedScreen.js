// ============================================================
//  CompletedScreen  —  ٨ · تم إنجاز الخدمة
//
//  «إنهاء الخدمة» عند الفنّي ينقل الطلب إلى `awaiting_customer_confirmation`
//  لا إلى `completed`: تطبيق العميل فيه شاشة تأكيد إتمام، وتحويل الأرباح
//  معلّق عليها. الشاشة تقول ذلك صراحةً بدل أن تَعِد بمبلغ لم يُحرَّر بعد —
//  الوعد المخلَف هنا أسوأ من الانتظار المعلن.
// ============================================================

import React from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { Check, House, Info } from "phosphor-react-native";
import { Card, DetailRow, GradientButton, HaloIcon, ProviderScreen } from "../../components/providerUi";
import { colors, font, gradients, spacing } from "../../theme/theme";
import { formatMoney } from "../../services/money";
import { OrderStatus } from "../../services/requestStatus";
import { useSession } from "../../context/SessionContext";

export default function CompletedScreen({ navigation, route }) {
  const { activeRequest, refreshHome } = useSession();
  const request = route?.params?.request || activeRequest;

  const awaitingCustomer = request?.status === OrderStatus.AWAITING_CUSTOMER_CONFIRMATION;

  const goHome = () => {
    // تحديث الرئيسية قبل العودة: الطلب خرج من دائرة النشِط، وبقاء بطاقته
    // هناك بعد إنهائه يبدو كأن الإنهاء لم يُسجَّل.
    refreshHome().catch(() => {});
    navigation?.reset?.({ index: 0, routes: [{ name: "Home" }] });
  };

  return (
    <ProviderScreen gradient={gradients.calm} style={s.root}>
      <View style={s.center}>
        <HaloIcon Icon={Check} tone="success" iconSize={52} weight="bold" />

        <Text style={s.title} accessibilityRole="header">
          تم إنجاز الخدمة بنجاح
        </Text>
        <Text style={s.desc}>
          {awaitingCustomer
            ? "تم إبلاغ العميل، وبانتظار تأكيده لإتمام الطلب."
            : "شكراً لك! تم إبلاغ العميل والنظام بإتمام الطلب."}
        </Text>

        <Card style={s.card} padded={false}>
          <View style={s.cardInner}>
            <DetailRow label="رقم الطلب" value={`‏#${request?.shortNumber ?? "----"}`} />
            <DetailRow label="نوع الخدمة" value={request?.serviceName || "خدمة"} />
            <DetailRow
              label={awaitingCustomer ? "المبلغ المتوقّع" : "المبلغ النهائي"}
              value={formatMoney(request?.payment?.amount ?? request?.amount)}
              tone={colors.success}
              strong
              last
            />
          </View>
        </Card>

        {awaitingCustomer ? (
          <View style={s.note}>
            <Info size={18} color={colors.textMuted} />
            <Text style={s.noteText}>
              تُضاف الأرباح إلى محفظتك بعد تأكيد العميل. تفاصيل المحفظة في لوحة التحكم على الويب.
            </Text>
          </View>
        ) : null}
      </View>

      <GradientButton
        label="العودة للرئيسية"
        icon={<House size={20} weight="fill" color={colors.onPrimary} />}
        onPress={goHome}
        style={s.cta}
      />
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  root: { alignItems: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", alignSelf: "stretch" },
  title: {
    fontSize: font.size.h1,
    fontWeight: font.weight.bold,
    color: colors.textDark,
    marginTop: spacing.xxl + spacing.xs,
    textAlign: "center",
  },
  desc: {
    fontSize: font.size.body,
    color: colors.textBody,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: font.lineHeight.body,
  },
  card: { alignSelf: "stretch", marginTop: spacing.xxl },
  cardInner: { paddingHorizontal: spacing.xl },
  note: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  noteText: {
    flex: 1,
    minWidth: 0,
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
  },
  cta: { alignSelf: "stretch" },
});
