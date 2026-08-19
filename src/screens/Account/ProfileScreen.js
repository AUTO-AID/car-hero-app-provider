// ============================================================
//  ProfileScreen  —  ١٢ · حسابي (الملف الشخصي للفنّي)
// ============================================================

import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import Text from '../../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Buildings, Phone, ShieldCheck, Info, SignOut } from 'phosphor-react-native';
import { colors, gradients, radius, shadow } from '../../theme/theme';
import ProviderNav from '../../components/ProviderNav';

function Row({ Icon, label, value, statusPill, last }) {
  return (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <Icon size={22} color={colors.primaryLight} />
      <Text style={s.rowLabel}>{label}</Text>
      {statusPill
        ? <View style={s.statusPill}><Text style={s.statusText}>{value}</Text></View>
        : <Text style={s.rowValue}>{value}</Text>}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const goTab = (k) => { if (k === 'home') navigation?.navigate?.('Home'); if (k === 'orders') navigation?.navigate?.('MyRequests'); if (k === 'alerts') navigation?.navigate?.('Notifications'); };

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        <Text style={s.title}>حسابي</Text>

        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          <View style={s.headerCircle} />
          <View style={s.avatar}><Text style={s.avatarText}>س</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>م. سامر خالد</Text>
            <Text style={s.workshop}>ورشة النخبة لمساعدة الطريق</Text>
            <View style={s.activeChip}><View style={s.activeDot} /><Text style={s.activeText}>حساب مفعّل</Text></View>
          </View>
        </LinearGradient>

        <View style={s.body}>
          <View style={s.card}>
            <Row Icon={User} label="الاسم" value="سامر خالد" />
            <Row Icon={Buildings} label="الورشة" value="ورشة النخبة" />
            <Row Icon={Phone} label="رقم الهاتف" value="+962 79 000 0000" />
            <Row Icon={ShieldCheck} label="حالة الحساب" value="مفعّل" statusPill last />
          </View>

          <View style={s.noteCard}>
            <Info size={20} color={colors.textMuted} />
            <Text style={s.noteText}>إدارة المحفظة والأرباح والتقارير تتم عبر لوحة التحكم على الويب.</Text>
          </View>

          <Pressable style={s.logout} onPress={() => navigation?.replace?.('Login')}>
            <SignOut size={20} weight="bold" color={colors.danger} /><Text style={s.logoutText}>تسجيل الخروج</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ProviderNav active="account" onTab={goTab} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingTop: 52 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textDark, paddingHorizontal: 26 },
  header: { marginHorizontal: 22, marginTop: 18, borderRadius: 26, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'hidden', ...shadow.card, shadowOpacity: 0.55 },
  headerCircle: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: '#ffffff1f', top: -70, left: -40 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.primary },
  name: { fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'right' },
  workshop: { fontSize: 13, color: '#f0e7fa', marginTop: 3, textAlign: 'right' },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff22', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12, marginTop: 8, alignSelf: 'flex-end' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5fe6a3' },
  activeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  body: { padding: 22, paddingTop: 16 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 22, paddingHorizontal: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, fontSize: 14, color: colors.textMuted, textAlign: 'right' },
  rowValue: { fontSize: 14.5, fontWeight: '700', color: colors.textDark, writingDirection: 'ltr' },
  statusPill: { backgroundColor: colors.successBg, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 11 },
  statusText: { fontSize: 12.5, fontWeight: '800', color: colors.success },
  noteCard: { marginTop: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  noteText: { flex: 1, fontSize: 13, color: colors.textBody, lineHeight: 21, textAlign: 'right' },
  logout: { marginTop: 14, height: 56, borderRadius: radius.lg, borderWidth: 1, borderColor: '#f3d0d6', backgroundColor: colors.dangerBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  logoutText: { fontSize: 16, fontWeight: '800', color: colors.danger },
});
