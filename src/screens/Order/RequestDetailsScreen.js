// ============================================================
//  RequestDetailsScreen  —  ٤ · تفاصيل الطلب (بعد القبول)
// ============================================================

import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatCircle, NavigationArrow, Phone, Tire } from "phosphor-react-native";
import { AppHeader, IconButton, StatusPill } from "../../components/ui";
import {
  Card,
  DetailRow,
  GradientButton,
  MapCanvas,
  ProviderScreen,
  ServiceRow,
} from "../../components/providerUi";
import { colors, font, providerRadius, spacing } from "../../theme/theme";
import { formatMoney } from "../../services/money";
import { callNumber, messageNumber } from "../../services/contact";
import { DEMO_CUSTOMER } from "../../services/demo";

const initial = DEMO_CUSTOMER.name.trim().charAt(0) || "ع";

export default function RequestDetailsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <ProviderScreen padded={false} bottomInset={false}>
      {/* الشارة كانت خضراء ثابتة مهما كانت الحالة. `StatusPill` تقرن اللون
          بنصّ وبنقطة، فلا تُنقل الحالة باللون وحده. */}
      <AppHeader
        title="تفاصيل الطلب"
        onBack={() => navigation?.goBack?.()}
        action={<StatusPill label="مقبول" tone="info" />}
        style={s.header}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Card raised>
          <ServiceRow Icon={Tire} title="تغيير إطار" subtitle="طلب ‏#1042 · قبل ٣ دقائق" size={56} />
        </Card>

        <Card>
          <Text style={s.cardHint}>بيانات العميل</Text>
          <View style={s.custRow}>
            <View style={s.avatar}>
              {/* الحرف يُشتقّ من الاسم لا يُكتب: كتابته حرفياً تفصله عن الاسم
                  عند أول عميل حقيقي. */}
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={s.custText}>
              <Text style={s.custName} numberOfLines={1}>
                {DEMO_CUSTOMER.name}
              </Text>
              <Text style={s.custSub}>عميل Car Hero</Text>
            </View>
            {/* كانت دائرتين بلا اسم ولا دور — أي زرّين صامتين لقارئ الشاشة —
                ثم صارتا بلا فعل: `onPress` فارغة تنكمش وتهتزّ ولا تتّصل. */}
            <IconButton
              label={`اتصال بالعميل ${DEMO_CUSTOMER.name}`}
              onPress={() => callNumber(DEMO_CUSTOMER.phone)}
              icon={<Phone size={20} weight="fill" color={colors.success} />}
              style={[s.actBtn, { backgroundColor: colors.successBg }]}
            />
            <IconButton
              label={`مراسلة العميل ${DEMO_CUSTOMER.name}`}
              onPress={() => messageNumber(DEMO_CUSTOMER.phone)}
              icon={<ChatCircle size={20} weight="fill" color={colors.primary} />}
              style={[s.actBtn, { backgroundColor: colors.tint }]}
            />
          </View>
        </Card>

        <MapCanvas height={180} accessibilityLabel="خريطة تقريبية: موقع العميل على بُعد 2.4 كم منك">
          <View style={s.custPinDot} />
          <View style={s.mapBadge}>
            <NavigationArrow size={16} weight="fill" color={colors.primary} />
            <Text style={s.mapBadgeText}>2.4 كم</Text>
          </View>
        </MapCanvas>

        <Card style={s.detailCard}>
          <DetailRow label="الموقع" value="شارع المدينة المنورة" />
          <DetailRow label="المسافة" value="2.4 كم · ~7 دقائق" />
          <DetailRow label="السعر التقديري" value={formatMoney(45)} strong last />
        </Card>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}>
        <GradientButton
          label="بدء التوجيه"
          height={58}
          icon={<NavigationArrow size={20} weight="fill" color={colors.onPrimary} />}
          onPress={() => navigation?.navigate?.("EnRoute")}
          accessibilityHint="يفتح شاشة التوجيه ويبدأ إرسال موقعك للعميل"
        />
      </View>
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

  custPinDot: {
    position: "absolute",
    left: 24,
    bottom: 26,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  mapBadge: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: providerRadius.tileSm - 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
  },
  mapBadgeText: { fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.textDark },

  detailCard: { paddingVertical: 0, paddingHorizontal: spacing.lg },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.screenBg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
});
