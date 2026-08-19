// ============================================================
//  InServiceScreen  —  ٨ · الخدمة قيد التنفيذ + نافذة تأكيد الإنهاء
// ============================================================

import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Modal } from 'react-native';
import Text from '../../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Tire, Check, SealQuestion, CheckCircle } from 'phosphor-react-native';
import { colors, gradients, radius, shadow } from '../../theme/theme';

function Step({ done, active, label }) {
  return (
    <View style={s.step}>
      <View style={[s.stepDot, done && s.stepDotDone, active && s.stepDotActive]}>
        {done ? <Check size={14} weight="bold" color="#fff" /> : active ? <View style={s.stepInner} /> : null}
      </View>
      <Text style={[s.stepLabel, active && { color: colors.primary, fontWeight: '800' }]}>{label}</Text>
    </View>
  );
}

export default function InServiceScreen({ navigation }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <View style={s.root}>
      <View style={s.chip}><View style={s.chipDot} /><Text style={s.chipText}>الخدمة قيد التنفيذ</Text></View>

      <View style={s.card}>
        <View style={s.svcRow}>
          <LinearGradient colors={gradients.primary} style={s.svcIcon}><Tire size={30} weight="fill" color="#fff" /></LinearGradient>
          <View><Text style={s.svcTitle}>تغيير إطار</Text><Text style={s.svcNo}>طلب #1042</Text></View>
        </View>
        <View style={s.divider} />
        <View style={s.metaRow}><Text style={s.metaLbl}>العميل</Text><Text style={s.metaVal}>أحمد الرواشدة</Text></View>
        <View style={s.metaRow}><Text style={s.metaLbl}>الحالة</Text><View style={s.statePill}><Text style={s.statePillText}>IN_SERVICE</Text></View></View>
        <View style={s.metaRow}><Text style={s.metaLbl}>مدة التنفيذ</Text><Text style={s.metaVal}>00:12:34</Text></View>
      </View>

      <View style={s.stepsCard}>
        <Step done label="قبول الطلب" />
        <Step done label="الوصول للعميل" />
        <Step active label="تنفيذ الخدمة الآن" />
      </View>

      <View style={{ flex: 1 }} />

      <Pressable onPress={() => setConfirm(true)} style={{ width: '100%' }}>
        <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}>
          <CheckCircle size={22} weight="fill" color="#fff" /><Text style={s.ctaText}>إنهاء الخدمة</Text>
        </LinearGradient>
      </Pressable>

      {/* نافذة التأكيد */}
      <Modal transparent visible={confirm} animationType="slide" onRequestClose={() => setConfirm(false)}>
        <View style={s.overlay}>
          <View style={s.dialog}>
            <View style={s.grabber} />
            <View style={s.qIcon}><SealQuestion size={34} weight="fill" color={colors.primary} /></View>
            <Text style={s.dTitle}>تأكيد إنهاء الخدمة</Text>
            <Text style={s.dDesc}>هل أنت متأكد من إنهاء هذه الخدمة؟ لا يمكن التراجع بعد التأكيد.</Text>
            <View style={s.dBtns}>
              <Pressable style={s.cancel} onPress={() => setConfirm(false)}><Text style={s.cancelText}>إلغاء</Text></Pressable>
              <Pressable style={{ flex: 1.4 }} onPress={() => { setConfirm(false); navigation?.replace?.('Completed'); }}>
                <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.confirmBtn}>
                  <Text style={s.confirmText}>إنهاء الخدمة</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingTop: 52, paddingBottom: 34, paddingHorizontal: 26 },
  chip: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.tint, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  chipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primaryLight },
  chipText: { fontSize: 13, fontWeight: '800', color: colors.primaryLight },
  card: { marginTop: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 24, padding: 22, ...shadow.soft, shadowOpacity: 0.12 },
  svcRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  svcIcon: { width: 60, height: 60, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  svcTitle: { fontSize: 19, fontWeight: '800', color: colors.textDark },
  svcNo: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 16, marginBottom: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  metaLbl: { fontSize: 14, color: colors.textMuted },
  metaVal: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  statePill: { backgroundColor: colors.tint, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  statePillText: { fontSize: 13, fontWeight: '800', color: colors.primary, writingDirection: 'ltr' },
  stepsCard: { marginTop: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderCard, borderRadius: 22, padding: 20, gap: 14 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: colors.success },
  stepDotActive: { backgroundColor: colors.tint, borderWidth: 2, borderColor: colors.primaryLight },
  stepInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryLight },
  stepLabel: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  cta: { height: 62, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.button, shadowColor: '#2e9e6b' },
  ctaText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  overlay: { flex: 1, backgroundColor: 'rgba(30,18,48,0.5)', justifyContent: 'flex-end' },
  dialog: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 26, paddingTop: 16, paddingBottom: 30, alignItems: 'center' },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderSoft, marginBottom: 20 },
  qIcon: { width: 66, height: 66, borderRadius: 20, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  dTitle: { fontSize: 20, fontWeight: '800', color: colors.textDark, marginTop: 16 },
  dDesc: { fontSize: 14.5, color: colors.textBody, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  dBtns: { flexDirection: 'row', gap: 12, marginTop: 22, width: '100%' },
  cancel: { flex: 1, height: 54, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderInput, backgroundColor: colors.screenBg, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15.5, fontWeight: '700', color: colors.textBody },
  confirmBtn: { height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 15.5, fontWeight: '800', color: '#fff' },
});
