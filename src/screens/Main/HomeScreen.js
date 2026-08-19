// ============================================================
//  HomeScreen  —  ٢/٣ · الرئيسية (متصل / غير متصل)
// ============================================================

import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from '../../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Moon, Power, Broadcast, CheckCircle, ClockCountdown, MagnifyingGlass } from 'phosphor-react-native';
import { colors, gradients, radius, shadow } from '../../theme/theme';
import ProviderNav from '../../components/ProviderNav';

// اسم الفنّي — نقطة واحدة تُستبدل بالمستخدم الحقيقي عند ربط المصادقة.
// الحرف الأول يُشتقّ منه لا يُكتب يدوياً، وإلا انفصل الحرف عن الاسم عند تغييره.
const PROVIDER_NAME = 'م. سامر خالد';
const initial = PROVIDER_NAME.replace(/^م\.\s*/, '').trim().charAt(0) || 'ف';

function StatTile({ Icon, value, label }) {
  return (
    <View style={s.stat}>
      <View style={s.statIcon}><Icon size={24} weight="fill" color={colors.primaryLight} /></View>
      <View><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const [online, setOnline] = useState(false);
  const goTab = (k) => { if (k === 'orders') navigation?.navigate?.('MyRequests'); if (k === 'alerts') navigation?.navigate?.('Notifications'); if (k === 'account') navigation?.navigate?.('Profile'); };

  return (
    <View style={s.root}>
      {/* الترويسة */}
      <View style={s.topbar}>
        <View style={s.greetRow}>
          <LinearGradient colors={gradients.logoTile} style={s.avatar}><Text style={s.avatarText}>{initial}</Text></LinearGradient>
          <View><Text style={s.greetHi}>مرحبًا،</Text><Text style={s.greetName}>{PROVIDER_NAME}</Text></View>
        </View>
        <Pressable style={s.bell} onPress={() => navigation?.navigate?.('Notifications')}>
          <Bell size={22} color={colors.primary} /><View style={s.bellDot} />
        </Pressable>
      </View>

      {online ? (
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cardOn}>
          <View style={s.cardCircle} />
          <View style={s.ringWrap}>
            <View style={s.iconCircleWhite}><Broadcast size={42} weight="fill" color={colors.success} /></View>
          </View>
          <View style={s.statusRow}>
            <View style={s.liveDot} />
            <Text style={s.statusOnText}>أنت متصل الآن</Text>
          </View>
          <Text style={s.descOn}>جاهز لاستقبال طلبات الخدمة في منطقتك.</Text>
          <Pressable style={s.toggleGlass} onPress={() => setOnline(false)}>
            <Power size={20} weight="fill" color="#fff" /><Text style={s.toggleGlassText}>إيقاف الاتصال</Text>
          </Pressable>
        </LinearGradient>
      ) : (
        <View style={s.cardOff}>
          <View style={s.offRing}><View style={s.offInner}><Moon size={38} weight="fill" color="#a79fb3" /></View></View>
          <Text style={s.statusOffText}>غير متاح حاليًا</Text>
          <Text style={s.descOff}>أنت غير متصل الآن ولن تصلك طلبات جديدة. فعّل الاتصال لبدء استقبال الطلبات.</Text>
          <Pressable style={s.toggleOn} onPress={() => setOnline(true)}>
            <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.toggleOnGrad}>
              <Power size={22} weight="fill" color="#fff" /><Text style={s.toggleOnText}>تشغيل الاتصال</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      {online ? (
        <View style={{ paddingHorizontal: 22, marginTop: 18 }}>
          <Text style={s.sectionTitle}>لا يوجد طلب نشِط</Text>
          <View style={s.waitCard}>
            <View style={s.waitIcon}><MagnifyingGlass size={28} color={colors.primaryLight} /></View>
            <Text style={s.waitTitle}>بانتظار طلب جديد</Text>
            <Text style={s.waitDesc}>سيتم إشعارك فورًا عند وصول طلب خدمة قريب منك.</Text>
            {/* أزرار للتنقّل بين حالات التصميم أثناء التطوير */}
            <Pressable onPress={() => navigation?.navigate?.('NewRequest')} style={s.devLink}><Text style={s.devLinkText}>محاكاة وصول طلب ←</Text></Pressable>
          </View>
        </View>
      ) : (
        <View style={s.statsRow}>
          <StatTile Icon={CheckCircle} value="6" label="طلبات اليوم" />
          <StatTile Icon={ClockCountdown} value="—" label="طلب نشِط" />
        </View>
      )}

      <ProviderNav active="home" onTab={goTab} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingTop: 52 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 26 },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderSoft },
  avatarText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  greetHi: { fontSize: 12.5, color: colors.textMuted, textAlign: 'right' },
  greetName: { fontSize: 16, fontWeight: '800', color: colors.textDark, textAlign: 'right' },
  bell: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, alignItems: 'center', justifyContent: 'center', ...shadow.soft, shadowOpacity: 0.3 },
  bellDot: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: '#fff' },

  cardOff: { marginHorizontal: 22, marginTop: 26, borderRadius: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, padding: 32, alignItems: 'center', ...shadow.card, shadowOpacity: 0.2 },
  offRing: { width: 118, height: 118, borderRadius: 59, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d6d2dc', backgroundColor: '#eef0f3', alignItems: 'center', justifyContent: 'center' },
  offInner: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#f4f3f6', alignItems: 'center', justifyContent: 'center' },
  statusOffText: { fontSize: 22, fontWeight: '800', color: colors.textDark, marginTop: 18 },
  descOff: { fontSize: 14.5, color: colors.textBody, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  toggleOn: { width: '100%', marginTop: 22, borderRadius: radius.lg, overflow: 'hidden' },
  toggleOnGrad: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  toggleOnText: { color: '#fff', fontSize: 17.5, fontWeight: '800' },

  cardOn: { marginHorizontal: 22, marginTop: 26, borderRadius: 28, padding: 30, alignItems: 'center', overflow: 'hidden', ...shadow.card, shadowOpacity: 0.5 },
  cardCircle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#ffffff22', top: -60, left: -40 },
  ringWrap: { width: 118, height: 118, alignItems: 'center', justifyContent: 'center' },
  iconCircleWhite: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  liveDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#5fe6a3' },
  statusOnText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  descOn: { fontSize: 14, color: '#f0e7fa', marginTop: 6, textAlign: 'center', lineHeight: 21 },
  toggleGlass: { width: '100%', height: 56, marginTop: 20, borderRadius: radius.md, backgroundColor: '#ffffff22', borderWidth: 1, borderColor: '#ffffff44', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  toggleGlassText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textHeading, paddingHorizontal: 4 },
  waitCard: { marginTop: 10, backgroundColor: '#fff', borderWidth: 1, borderStyle: 'dashed', borderColor: '#d9cfe6', borderRadius: 22, padding: 26, alignItems: 'center', gap: 8 },
  waitIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  waitTitle: { fontSize: 15.5, fontWeight: '800', color: colors.textDark },
  waitDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  devLink: { marginTop: 6 }, devLinkText: { fontSize: 13, fontWeight: '700', color: colors.primaryLight },

  statsRow: { flexDirection: 'row', gap: 14, paddingHorizontal: 22, marginTop: 18 },
  stat: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textDark },
  statLabel: { fontSize: 12.5, color: colors.textMuted },
});
