// ============================================================
//  ProviderNav  —  شريط التنقّل السفلي (تطبيق الفنّي)
//  props: active: 'home' | 'orders' | 'alerts' | 'account'
// ============================================================

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { House, ListChecks, Bell, User } from 'phosphor-react-native';
import { colors, shadow } from '../theme/theme';

const TABS = [
  { key: 'home',    label: 'الرئيسية',  Icon: House },
  { key: 'orders',  label: 'الطلبات',   Icon: ListChecks },
  { key: 'alerts',  label: 'التنبيهات', Icon: Bell },
  { key: 'account', label: 'حسابي',     Icon: User },
];

export default function ProviderNav({ active = 'home', onTab }) {
  return (
    <View style={s.bar}>
      {TABS.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <Pressable key={key} style={s.tab} onPress={() => onTab?.(key)}>
            <View style={[s.iconWrap, on && s.iconWrapOn]}>
              <Icon size={on ? 21 : 22} weight={on ? 'fill' : 'regular'} color={on ? colors.primaryLight : '#a79fb3'} />
            </View>
            <Text style={[s.label, { color: on ? colors.primaryLight : '#a79fb3', fontWeight: on ? '700' : '600' }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute', left: 14, right: 14, bottom: 14, height: 66,
    backgroundColor: '#fff', borderRadius: 22,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 6, ...shadow.soft, shadowOpacity: 0.28, shadowRadius: 30, shadowOffset: { width: 0, height: 12 },
  },
  tab: { alignItems: 'center', gap: 3 },
  iconWrap: { width: 40, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  iconWrapOn: { backgroundColor: colors.tint },
  label: { fontSize: 10.5 },
});
