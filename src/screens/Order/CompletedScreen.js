// ============================================================
//  CompletedScreen  —  ٩ · تم إنجاز الخدمة
// ============================================================

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from '../../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, House } from 'phosphor-react-native';
import { colors, gradients, radius, shadow } from '../../theme/theme';

function Row({ label, value, last, success }) {
  return (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, success && { color: colors.success, fontSize: 16, fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

export default function CompletedScreen({ navigation }) {
  return (
    <LinearGradient colors={gradients.calm} style={s.root}>
      <View style={s.center}>
        <View style={s.hero}>
          <View style={s.ringOuter} /><View style={s.ringMid} />
          <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.iconCircle}>
            <Check size={52} weight="bold" color="#fff" />
          </LinearGradient>
        </View>
        <Text style={s.title}>تم إنجاز الخدمة بنجاح</Text>
        <Text style={s.desc}>شكرًا لك! تم إبلاغ العميل والنظام بإتمام الطلب.</Text>

        <View style={s.card}>
          <Row label="رقم الطلب" value="#1042" />
          <Row label="نوع الخدمة" value="تغيير إطار" />
          <Row label="المبلغ النهائي" value="45 د.أ" success last />
        </View>
      </View>

      <Pressable onPress={() => navigation?.reset?.({ index: 0, routes: [{ name: 'Home' }] })} style={{ width: '100%' }}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}>
          <House size={20} weight="fill" color="#fff" /><Text style={s.ctaText}>العودة للرئيسية</Text>
        </LinearGradient>
      </Pressable>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: 56, paddingBottom: 34, paddingHorizontal: 26, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  hero: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  ringOuter: { ...StyleSheet.absoluteFillObject, borderRadius: 75, backgroundColor: colors.successBg },
  ringMid: { position: 'absolute', top: 16, left: 16, right: 16, bottom: 16, borderRadius: 59, backgroundColor: '#cdeeda' },
  iconCircle: { width: 98, height: 98, borderRadius: 49, alignItems: 'center', justifyContent: 'center', ...shadow.button, shadowColor: '#2e9e6b' },
  title: { fontSize: 26, fontWeight: '800', color: colors.textDark, marginTop: 28 },
  desc: { fontSize: 15, color: colors.textBody, marginTop: 8, textAlign: 'center', lineHeight: 24 },
  card: { width: '100%', marginTop: 26, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 22, paddingHorizontal: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  cta: { height: 60, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.button },
  ctaText: { fontSize: 17.5, fontWeight: '800', color: '#fff' },
});
