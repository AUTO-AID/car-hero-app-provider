// ============================================================
//  ArrivedScreen  —  ٦ · وصلت الموقع
// ============================================================

import React from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { MapPinArea, Phone, Tire, Wrench } from "phosphor-react-native";
import { IconButton, StatusPill } from "../../components/ui";
import {
  Card,
  GradientButton,
  HaloIcon,
  ProviderScreen,
  ServiceRow,
} from "../../components/providerUi";
import { colors, font, providerRadius, spacing } from "../../theme/theme";
import { callNumber } from "../../services/contact";
import { DEMO_CUSTOMER } from "../../services/demo";

export default function ArrivedScreen({ navigation }) {
  return (
    <ProviderScreen style={s.root}>
      <StatusPill label="طلب ‏#1042 · وصلت الموقع" tone="info" />

      <View style={s.hero}>
        <HaloIcon Icon={MapPinArea} tone="success" />
      </View>

      <Text style={s.title} accessibilityRole="header">
        وصلت إلى موقع العميل
      </Text>
      <Text style={s.desc}>أنت الآن عند موقع العميل. تواصل معه إن لزم، ثم ابدأ تنفيذ الخدمة.</Text>

      <Card style={s.card}>
        <ServiceRow
          Icon={Tire}
          title="تغيير إطار"
          subtitle={DEMO_CUSTOMER.name}
          trailing={
            <IconButton
              label={`اتصال بالعميل ${DEMO_CUSTOMER.name}`}
              onPress={() => callNumber(DEMO_CUSTOMER.phone)}
              icon={<Phone size={20} weight="fill" color={colors.success} />}
              style={s.callBtn}
            />
          }
        />
      </Card>

      <View style={s.spacer} />

      <GradientButton
        label="بدء الخدمة"
        tone="success"
        height={62}
        icon={<Wrench size={22} weight="fill" color={colors.onPrimary} />}
        onPress={() => navigation?.navigate?.("InService")}
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
  card: { alignSelf: "stretch", marginTop: spacing.xxl + spacing.xs },
  callBtn: {
    width: 46,
    height: 46,
    borderRadius: providerRadius.tileSm,
    backgroundColor: colors.successBg,
  },
  spacer: { flex: 1, minHeight: spacing.xl },
});
