// ============================================================
//  NotificationsScreen  —  ١١ · التنبيهات
// ============================================================

import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import Text from '../../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { BellRinging, CheckCircle, XCircle, Megaphone } from 'phosphor-react-native';
import { colors, gradients, shadow } from '../../theme/theme';
import ProviderNav from '../../components/ProviderNav';

function Item({ Icon, iconBg, iconColor, gradient, title, body, time, unread }) {
  return (
    <View style={[s.item, unread && s.itemUnread]}>
      {unread ? <View style={s.unreadDot} /> : null}
      {gradient
        ? <LinearGradient colors={gradients.primary} style={s.icon}><Icon size={24} weight="fill" color="#fff" /></LinearGradient>
        : <View style={[s.icon, { backgroundColor: iconBg }]}><Icon size={24} weight="fill" color={iconColor} /></View>}
      <View style={{ flex: 1 }}>
        <Text style={s.itemTitle}>{title}</Text>
        <Text style={s.itemBody}>{body}</Text>
        <Text style={s.itemTime}>{time}</Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const goTab = (k) => { if (k === 'home') navigation?.navigate?.('Home'); if (k === 'orders') navigation?.navigate?.('MyRequests'); if (k === 'account') navigation?.navigate?.('Profile'); };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>التنبيهات</Text>
        <Pressable><Text style={s.markAll}>تحديد الكل كمقروء</Text></Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 96, gap: 12 }}>
        <Item gradient Icon={BellRinging} title="طلب خدمة جديد" body="تغيير إطار على بُعد 2.4 كم — لديك 20 ثانية للرد." time="الآن" unread />
        <Item Icon={CheckCircle} iconBg={colors.successBg} iconColor={colors.success} title="تم قبول الطلب" body="تم تعيينك للطلب #1042 بنجاح." time="قبل ٥ دقائق" />
        <Item Icon={XCircle} iconBg={colors.dangerBg} iconColor={colors.danger} title="تم إلغاء الطلب" body="قام العميل بإلغاء الطلب #1030." time="اليوم ١١:٢٠ ص" />
        <Item Icon={Megaphone} iconBg={colors.tint} iconColor={colors.primaryLight} title="تحديث النظام" body="تمت إضافة تحسينات على دقة الموقع أثناء التوجيه." time="أمس" />
      </ScrollView>

      <ProviderNav active="alerts" onTab={goTab} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingTop: 52 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 26 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textDark },
  markAll: { fontSize: 12.5, fontWeight: '700', color: colors.primaryLight },
  item: { flexDirection: 'row', gap: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 20, padding: 16, marginTop: 12 },
  itemUnread: { borderColor: colors.borderSoft, ...shadow.soft, shadowOpacity: 0.14 },
  unreadDot: { position: 'absolute', top: 16, left: 16, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, textAlign: 'right' },
  itemBody: { fontSize: 13, color: colors.textBody, marginTop: 3, lineHeight: 20, textAlign: 'right' },
  itemTime: { fontSize: 11.5, color: colors.textMuted2, marginTop: 6, textAlign: 'right' },
});
