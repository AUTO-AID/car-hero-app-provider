// ============================================================
//  EnRouteScreen  —  ٦ · في الطريق (خريطة + bottom sheet)
// ============================================================

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from '../../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationArrow, TowTruck, MapPin, Tire, Phone, FlagCheckered } from 'phosphor-react-native';
import { colors, gradients, radius, shadow } from '../../theme/theme';

export default function EnRouteScreen({ navigation }) {
  return (
    <View style={s.root}>
      {/* الخريطة */}
      <View style={s.map}>
        <View style={s.roadA} /><View style={s.roadB} /><View style={s.roadV} />
        <View style={s.providerMarker}><TowTruck size={20} weight="fill" color="#fff" /></View>
        <View style={s.custMarker}><MapPin size={22} weight="fill" color="#fff" /></View>
      </View>

      {/* شارة علوية */}
      <View style={s.topPill}>
        <View style={s.pillIcon}><NavigationArrow size={20} weight="fill" color={colors.primary} /></View>
        <View style={{ flex: 1 }}><Text style={s.pillTitle}>أنت في الطريق</Text><Text style={s.pillSub}>جارٍ إرسال موقعك للعميل</Text></View>
        <View style={s.pillDot} />
      </View>

      {/* البطاقة السفلية */}
      <View style={s.sheet}>
        <View style={s.grabber} />
        <View style={s.custRow}>
          <LinearGradient colors={gradients.primary} style={s.svcIcon}><Tire size={26} weight="fill" color="#fff" /></LinearGradient>
          <View style={{ flex: 1 }}><Text style={s.custName}>أحمد الرواشدة · تغيير إطار</Text><Text style={s.custSub}>شارع المدينة المنورة</Text></View>
        </View>
        <View style={s.statsRow}>
          <View style={s.stat}><Text style={s.statVal}>2.4</Text><Text style={s.statLbl}>كم متبقّية</Text></View>
          <View style={s.stat}><Text style={s.statVal}>7</Text><Text style={s.statLbl}>دقائق للوصول</Text></View>
          <Pressable style={s.callStat}><Phone size={22} weight="fill" color={colors.success} /><Text style={s.callLbl}>اتصال</Text></Pressable>
        </View>
        <Pressable onPress={() => navigation?.navigate?.('Arrived')}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}>
            <FlagCheckered size={22} weight="fill" color="#fff" /><Text style={s.ctaText}>لقد وصلت</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ece0f7' },
  map: { ...StyleSheet.absoluteFillObject, backgroundColor: '#ece0f7' },
  roadA: { position: 'absolute', top: '28%', left: '-6%', width: '112%', height: 18, backgroundColor: '#fff', transform: [{ rotate: '-8deg' }] },
  roadB: { position: 'absolute', top: '58%', left: '-6%', width: '112%', height: 22, backgroundColor: '#fff', transform: [{ rotate: '6deg' }] },
  roadV: { position: 'absolute', top: 0, left: '44%', width: 16, height: '100%', backgroundColor: '#fff', transform: [{ rotate: '4deg' }] },
  providerMarker: { position: 'absolute', left: 104, bottom: 200, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.button },
  custMarker: { position: 'absolute', right: 118, top: 130, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryLight, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.button },
  topPill: { position: 'absolute', top: 52, left: 22, right: 22, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 18, padding: 12, ...shadow.card, shadowOpacity: 0.35 },
  pillIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  pillTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, textAlign: 'right' },
  pillSub: { fontSize: 12.5, color: colors.textMuted, textAlign: 'right' },
  pillDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.success },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 30, ...shadow.card, shadowOffset: { width: 0, height: -14 } },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderSoft, alignSelf: 'center', marginBottom: 16 },
  custRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  svcIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  custName: { fontSize: 16.5, fontWeight: '800', color: colors.textDark, textAlign: 'right' },
  custSub: { fontSize: 13, color: colors.textMuted, textAlign: 'right' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stat: { flex: 1, backgroundColor: colors.screenBg, borderWidth: 1, borderColor: colors.borderCard, borderRadius: 16, padding: 12, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: colors.textDark },
  statLbl: { fontSize: 11.5, color: colors.textMuted },
  callStat: { flex: 1, backgroundColor: colors.successBg, borderWidth: 1, borderColor: '#cdeeda', borderRadius: 16, padding: 12, alignItems: 'center', justifyContent: 'center' },
  callLbl: { fontSize: 11.5, color: colors.success, fontWeight: '700', marginTop: 2 },
  cta: { height: 60, borderRadius: radius.lg, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.button },
  ctaText: { fontSize: 18, fontWeight: '800', color: '#fff' },
});
