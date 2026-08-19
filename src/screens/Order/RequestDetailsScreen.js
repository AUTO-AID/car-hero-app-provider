// ============================================================
//  RequestDetailsScreen  —  ٥ · تفاصيل الطلب (بعد القبول)
// ============================================================

import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import Text from '../../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Tire, Phone, ChatCircle, NavigationArrow } from 'phosphor-react-native';
import { colors, gradients, radius, shadow } from '../../theme/theme';

function MapMock({ height = 180, children }) {
  return (
    <View style={[mm.map, { height }]}>
      <View style={mm.roadA} /><View style={mm.roadB} />
      {children}
    </View>
  );
}
const mm = StyleSheet.create({
  map: { borderRadius: 22, overflow: 'hidden', backgroundColor: '#ece0f7', borderWidth: 1, borderColor: colors.borderCard },
  roadA: { position: 'absolute', top: '34%', left: '-6%', width: '112%', height: 14, backgroundColor: '#fff', transform: [{ rotate: '-7deg' }] },
  roadB: { position: 'absolute', top: '66%', left: '-6%', width: '112%', height: 18, backgroundColor: '#fff', transform: [{ rotate: '5deg' }] },
});

function InfoRow({ label, value, last, strong }) {
  return (
    <View style={[dr.row, last && { borderBottomWidth: 0 }]}>
      <Text style={dr.rowLabel}>{label}</Text>
      <Text style={[dr.rowValue, strong && { color: colors.primary, fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

export default function RequestDetailsScreen({ navigation }) {
  return (
    <View style={dr.root}>
      <View style={dr.header}>
        <Pressable style={dr.back} onPress={() => navigation?.goBack?.()}><ArrowRight size={22} color={colors.textHeading} /></Pressable>
        <Text style={dr.headerTitle}>تفاصيل الطلب</Text>
        <View style={dr.chip}><Text style={dr.chipText}>مقبول</Text></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 20 }}>
        <View style={dr.svcCard}>
          <LinearGradient colors={gradients.primary} style={dr.svcIcon}><Tire size={28} weight="fill" color="#fff" /></LinearGradient>
          <View><Text style={dr.svcTitle}>تغيير إطار</Text><Text style={dr.svcSub}>طلب #1042 · قبل ٣ دقائق</Text></View>
        </View>

        <View style={dr.card}>
          <Text style={dr.cardHint}>بيانات العميل</Text>
          <View style={dr.custRow}>
            <View style={dr.avatar}><Text style={dr.avatarText}>أ</Text></View>
            <View style={{ flex: 1 }}><Text style={dr.custName}>أحمد الرواشدة</Text><Text style={dr.custSub}>عميل Car Hero</Text></View>
            <Pressable style={[dr.actBtn, { backgroundColor: colors.successBg }]}><Phone size={20} weight="fill" color={colors.success} /></Pressable>
            <Pressable style={[dr.actBtn, { backgroundColor: colors.tint }]}><ChatCircle size={20} weight="fill" color={colors.primary} /></Pressable>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <MapMock>
            <View style={dr.custPinDot} />
            <View style={dr.mapBadge}><NavigationArrow size={16} weight="fill" color={colors.primary} /><Text style={dr.mapBadgeText}>2.4 كم</Text></View>
          </MapMock>
        </View>

        <View style={[dr.card, { paddingVertical: 6, paddingHorizontal: 18 }]}>
          <InfoRow label="الموقع" value="شارع المدينة المنورة" />
          <InfoRow label="المسافة" value="2.4 كم · ~7 دقائق" />
          <InfoRow label="السعر التقديري" value="45 د.أ" strong last />
        </View>
      </ScrollView>

      <View style={dr.footer}>
        <Pressable onPress={() => navigation?.navigate?.('EnRoute')}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dr.cta}>
            <NavigationArrow size={20} weight="fill" color="#fff" /><Text style={dr.ctaText}>بدء التوجيه</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const dr = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingTop: 52 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22 },
  back: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textDark },
  chip: { marginLeft: 'auto', backgroundColor: colors.tint, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  chipText: { fontSize: 12.5, fontWeight: '800', color: colors.primaryLight },
  svcCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, ...shadow.soft, shadowOpacity: 0.12 },
  svcIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  svcTitle: { fontSize: 18, fontWeight: '800', color: colors.textDark },
  svcSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  card: { marginTop: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 22, padding: 18 },
  cardHint: { fontSize: 13, fontWeight: '800', color: colors.textMuted, marginBottom: 12, textAlign: 'right' },
  custRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', color: colors.primary, fontSize: 18 },
  custName: { fontSize: 16, fontWeight: '800', color: colors.textDark, textAlign: 'right' },
  custSub: { fontSize: 12.5, color: colors.textMuted, textAlign: 'right' },
  actBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  custPinDot: { position: 'absolute', left: 24, bottom: 26, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, borderWidth: 3, borderColor: '#fff' },
  mapBadge: { position: 'absolute', left: 12, top: 12, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapBadgeText: { fontSize: 13, fontWeight: '800', color: colors.textDark },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  footer: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 26 },
  cta: { height: 58, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.button },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
