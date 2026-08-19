// ============================================================
//  MyRequestsScreen  —  ١٠ · طلباتي (نشطة / سابقة)
// ============================================================

import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import Text from '../../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Tire, GasPump, CarBattery, TowTruck, MapPin } from 'phosphor-react-native';
import { colors, gradients, radius, shadow } from '../../theme/theme';
import ProviderNav from '../../components/ProviderNav';

const STATUS = {
  active:   { label: 'في الطريق', color: colors.primaryLight, bg: colors.tint },
  done:     { label: 'مكتمل',     color: colors.success,      bg: colors.successBg },
  canceled: { label: 'ملغى',      color: colors.danger,       bg: colors.dangerBg },
};

function Card({ Icon, title, meta, status, place, gradient }) {
  const st = STATUS[status];
  return (
    <View style={s.card}>
      <View style={s.cardRow}>
        {gradient
          ? <LinearGradient colors={gradients.primary} style={s.icon}><Icon size={24} weight="fill" color="#fff" /></LinearGradient>
          : <View style={[s.icon, { backgroundColor: status === 'canceled' ? colors.dangerBg : colors.tint }]}><Icon size={24} weight="fill" color={status === 'canceled' ? colors.danger : colors.primaryLight} /></View>}
        <View style={{ flex: 1 }}><Text style={s.cardTitle}>{title}</Text><Text style={s.cardMeta}>{meta}</Text></View>
        <View style={[s.statusPill, { backgroundColor: st.bg }]}><Text style={[s.statusText, { color: st.color }]}>{st.label}</Text></View>
      </View>
      {place ? (
        <View style={s.placeRow}><MapPin size={16} color={colors.primaryLight} /><Text style={s.placeText}>{place}</Text></View>
      ) : null}
    </View>
  );
}

export default function MyRequestsScreen({ navigation }) {
  const [tab, setTab] = useState('active');
  const goTab = (k) => { if (k === 'home') navigation?.navigate?.('Home'); if (k === 'alerts') navigation?.navigate?.('Notifications'); if (k === 'account') navigation?.navigate?.('Profile'); };

  return (
    <View style={s.root}>
      <Text style={s.title}>طلباتي</Text>
      <View style={s.tabs}>
        <Pressable style={[s.tab, tab === 'active' && s.tabOn]} onPress={() => setTab('active')}><Text style={[s.tabText, tab === 'active' && s.tabTextOn]}>نشطة</Text></Pressable>
        <Pressable style={[s.tab, tab === 'past' && s.tabOn]} onPress={() => setTab('past')}><Text style={[s.tabText, tab === 'past' && s.tabTextOn]}>سابقة</Text></Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 96, gap: 12 }}>
        {tab === 'active' ? (
          <Card Icon={Tire} title="تغيير إطار" meta="#1042 · اليوم ٢:١٤ م" status="active" place="شارع المدينة المنورة · 2.4 كم" gradient />
        ) : (
          <>
            <Card Icon={GasPump} title="توصيل وقود" meta="#1025 · ١٩ آب ٢٠٢٦" status="done" />
            <Card Icon={CarBattery} title="شحن بطارية" meta="#1019 · ١٨ آب ٢٠٢٦" status="done" />
            <Card Icon={TowTruck} title="سحب مركبة" meta="#1011 · ١٧ آب ٢٠٢٦" status="canceled" />
          </>
        )}
      </ScrollView>

      <ProviderNav active="orders" onTab={goTab} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingTop: 52 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textDark, paddingHorizontal: 26 },
  tabs: { flexDirection: 'row', backgroundColor: '#f0eaf7', borderRadius: radius.md, padding: 5, marginHorizontal: 22, marginTop: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12 },
  tabOn: { backgroundColor: '#fff', ...shadow.soft, shadowOpacity: 0.2 },
  tabText: { fontSize: 14.5, fontWeight: '700', color: colors.textMuted },
  tabTextOn: { color: colors.primary, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 20, padding: 16, marginTop: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, textAlign: 'right' },
  cardMeta: { fontSize: 12.5, color: colors.textMuted, textAlign: 'right' },
  statusPill: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 },
  statusText: { fontSize: 11.5, fontWeight: '800' },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 12 },
  placeText: { fontSize: 13, color: colors.textBody },
});
