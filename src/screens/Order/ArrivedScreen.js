// ============================================================
//  ArrivedScreen  —  ٧ · وصلت الموقع
// ============================================================

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from '../../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPinArea, Tire, Phone, Wrench } from 'phosphor-react-native';
import { colors, gradients, radius, shadow } from '../../theme/theme';

export default function ArrivedScreen({ navigation }) {
  return (
    <View style={s.root}>
      <View style={s.chip}><Text style={s.chipText}>طلب #1042 · وصلت الموقع</Text></View>

      <View style={s.hero}>
        <View style={s.ringOuter} />
        <View style={s.ringMid} />
        <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.iconCircle}>
          <MapPinArea size={46} weight="fill" color="#fff" />
        </LinearGradient>
      </View>

      <Text style={s.title}>وصلت إلى موقع العميل</Text>
      <Text style={s.desc}>أنت الآن عند موقع العميل. تواصل معه إن لزم، ثم ابدأ تنفيذ الخدمة.</Text>

      <View style={s.card}>
        <LinearGradient colors={gradients.primary} style={s.svcIcon}><Tire size={26} weight="fill" color="#fff" /></LinearGradient>
        <View style={{ flex: 1 }}><Text style={s.svcTitle}>تغيير إطار</Text><Text style={s.svcSub}>أحمد الرواشدة</Text></View>
        <Pressable style={s.callBtn}><Phone size={20} weight="fill" color={colors.success} /></Pressable>
      </View>

      <View style={{ flex: 1 }} />

      <Pressable onPress={() => navigation?.navigate?.('InService')} style={{ width: '100%' }}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}>
          <Wrench size={22} weight="fill" color="#fff" /><Text style={s.ctaText}>بدء الخدمة</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingTop: 52, paddingBottom: 34, paddingHorizontal: 26, alignItems: 'center' },
  chip: { backgroundColor: colors.tint, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  chipText: { fontSize: 13, fontWeight: '800', color: colors.primaryLight },
  hero: { marginTop: 60, width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  ringOuter: { ...StyleSheet.absoluteFillObject, borderRadius: 75, backgroundColor: colors.successBg },
  ringMid: { position: 'absolute', top: 14, left: 14, right: 14, bottom: 14, borderRadius: 61, backgroundColor: '#cdeeda' },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', ...shadow.button, shadowColor: '#2e9e6b' },
  title: { fontSize: 24, fontWeight: '800', color: colors.textDark, marginTop: 30 },
  desc: { fontSize: 15, color: colors.textBody, marginTop: 10, textAlign: 'center', lineHeight: 24 },
  card: { width: '100%', marginTop: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  svcIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  svcTitle: { fontSize: 16.5, fontWeight: '800', color: colors.textDark, textAlign: 'right' },
  svcSub: { fontSize: 13, color: colors.textMuted, textAlign: 'right' },
  callBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center' },
  cta: { height: 62, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.button },
  ctaText: { fontSize: 18, fontWeight: '800', color: '#fff' },
});
