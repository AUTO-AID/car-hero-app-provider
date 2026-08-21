// ============================================================
//  ArrivedScreen  —  ٦ · وصلت الموقع
// ============================================================

import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { MapPinArea, Phone, Wrench } from "phosphor-react-native";
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
import { callNumber, canContact } from "../../services/contact";
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
            canContact(phone) ? (
              <IconButton
                label={`اتصال بالعميل ${customerName}`}
                onPress={() => callNumber(phone)}
                icon={<Phone size={20} weight="fill" color={colors.success} />}
                style={s.callBtn}
              />
            ) : null
          }
        />
      </Card>

      <View style={s.spacer} />

      <GradientButton
        label={busy ? "جارٍ البدء…" : "بدء الخدمة"}
        tone="success"
        height={62}
        disabled={busy || !request}
        icon={<Wrench size={22} weight="fill" color={colors.onPrimary} />}
        onPress={onStart}
        accessibilityHint="يبدأ تنفيذ الخدمة ويشغّل عدّاد المدة"
      />
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
  callBtn: {
    width: 46,
    height: 46,
    borderRadius: providerRadius.tileSm,
    backgroundColor: colors.successBg,
  },
  spacer: { flex: 1, minHeight: spacing.xl },
});
