// ============================================================
//  CompletedScreen  —  ٨ · تم إنجاز الخدمة
// ============================================================

import React from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { Check, House } from "phosphor-react-native";
import { Card, DetailRow, GradientButton, HaloIcon, ProviderScreen } from "../../components/providerUi";
import { colors, font, gradients, spacing } from "../../theme/theme";
import { formatMoney } from "../../services/money";

export default function CompletedScreen({ navigation }) {
  return (
    <ProviderScreen gradient={gradients.calm} style={s.root}>
      <View style={s.center}>
        <HaloIcon Icon={Check} tone="success" iconSize={52} weight="bold" />

        <Text style={s.title} accessibilityRole="header">
          تم إنجاز الخدمة بنجاح
        </Text>
        <Text style={s.desc}>شكراً لك! تم إبلاغ العميل والنظام بإتمام الطلب.</Text>

        <Card style={s.card} padded={false}>
          <View style={s.cardInner}>
            <DetailRow label="رقم الطلب" value="‏#1042" />
            <DetailRow label="نوع الخدمة" value="تغيير إطار" />
            <DetailRow label="المبلغ النهائي" value={formatMoney(45)} tone={colors.success} strong last />
          </View>
        </Card>
      </View>

      <GradientButton
        label="العودة للرئيسية"
        icon={<House size={20} weight="fill" color={colors.onPrimary} />}
        onPress={() => navigation?.reset?.({ index: 0, routes: [{ name: "Home" }] })}
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
  cta: { alignSelf: "stretch" },
});
