// ============================================================
//  NewRequestScreen  —  ٤ · طلب جديد (عدّاد ٢٠ ثانية)
// ============================================================

import React, { useEffect, useState, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import Text from '../../components/AppText';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Tire, MapPinLine, Clock, CurrencyCircleDollar, MapPin, Check, X } from 'phosphor-react-native';
import { colors, gradients, radius, shadow } from '../../theme/theme';

const R = 58;
const CIRC = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const TOTAL = 20;

export default function NewRequestScreen({ navigation }) {
  const [left, setLeft] = useState(TOTAL);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 0, duration: TOTAL * 1000, easing: Easing.linear, useNativeDriver: false }).start();
    const t = setInterval(() => setLeft(v => (v <= 1 ? (clearInterval(t), 0) : v - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const dashoffset = progress.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] });

  return (
    <LinearGradient colors={gradients.night} style={s.root}>
      <View style={s.head}><View style={s.headDot} /><Text style={s.headText}>طلب خدمة جديد</Text></View>

      <View style={s.ringWrap}>
        <Svg width={132} height={132} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={66} cy={66} r={R} stroke="#ffffff22" strokeWidth={9} fill="none" />
          <AnimatedCircle cx={66} cy={66} r={R} stroke="#5fe6a3" strokeWidth={9} fill="none"
            strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={dashoffset} />
        </Svg>
        <View style={s.ringCenter}><Text style={s.ringNum}>{left}</Text><Text style={s.ringLabel}>ثانية للرد</Text></View>
      </View>

      <View style={s.headline}>
        <LinearGradient colors={gradients.primary} style={s.svcIcon}><Tire size={30} weight="fill" color="#fff" /></LinearGradient>
        <View><Text style={s.svcTitle}>تغيير إطار</Text><Text style={s.svcNo}>طلب رقم #1042</Text></View>
      </View>

      <View style={s.infoRow}>
        <View style={s.info}><MapPinLine size={22} color="#c9a7e3" /><Text style={s.infoVal}>2.4</Text><Text style={s.infoLbl}>كم</Text></View>
        <View style={s.info}><Clock size={22} color="#c9a7e3" /><Text style={s.infoVal}>7</Text><Text style={s.infoLbl}>دقائق</Text></View>
        <View style={s.info}><CurrencyCircleDollar size={22} color="#c9a7e3" /><Text style={s.infoVal}>45</Text><Text style={s.infoLbl}>د.أ تقديري</Text></View>
      </View>
      <View style={s.locRow}><MapPin size={18} color="#c9a7e3" /><Text style={s.locText}>شارع المدينة المنورة، عمّان</Text></View>

      <View style={{ flex: 1 }} />

      <Pressable onPress={() => navigation?.replace?.('RequestDetails')} style={({ pressed }) => pressed && { transform: [{ scale: 0.97 }] }}>
        <LinearGradient colors={gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.accept}>
          <Check size={22} weight="bold" color="#fff" /><Text style={s.acceptText}>قبول الطلب</Text>
        </LinearGradient>
      </Pressable>
      <Pressable style={s.reject} onPress={() => navigation?.goBack?.()}>
        <X size={18} color="#ffb3bc" /><Text style={s.rejectText}>رفض</Text>
      </Pressable>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingTop: 56, paddingBottom: 34, paddingHorizontal: 26 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#5fe6a3' },
  headText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 26, height: 132 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringNum: { fontSize: 42, fontWeight: '800', color: '#fff' },
  ringLabel: { fontSize: 12, color: '#c9a7e3' },
  headline: { marginTop: 26, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ffffff12', borderWidth: 1, borderColor: '#ffffff22', borderRadius: 22, padding: 18 },
  svcIcon: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  svcTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  svcNo: { fontSize: 13, color: '#c9a7e3', marginTop: 2 },
  infoRow: { marginTop: 16, flexDirection: 'row', gap: 12 },
  info: { flex: 1, backgroundColor: '#ffffff10', borderRadius: 16, padding: 14, alignItems: 'center' },
  infoVal: { fontSize: 19, fontWeight: '800', color: '#fff', marginTop: 6 },
  infoLbl: { fontSize: 11.5, color: '#b9a9cc' },
  locRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  locText: { fontSize: 13.5, color: '#d9cfe6' },
  accept: { height: 64, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.button, shadowColor: '#2e9e6b' },
  acceptText: { fontSize: 19, fontWeight: '800', color: '#fff' },
  reject: { height: 52, marginTop: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: '#ffffff33', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  rejectText: { fontSize: 15.5, fontWeight: '700', color: '#ffb3bc' },
});
