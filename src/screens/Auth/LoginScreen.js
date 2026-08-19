// ============================================================
//  LoginScreen  —  ١ · تسجيل دخول الفنّي
// ============================================================

import React, { useState } from 'react';
import { View, Image, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Text from '../../components/AppText';
import { User, LockKey, Eye, EyeSlash, SignIn } from 'phosphor-react-native';
import { colors, layout, radius } from '../../theme/theme';
import { PrimaryButton } from '../../components/ui';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.root}>
      <View style={s.header}>
        <Image
          source={require('../../../assets/carhero-logo.png')}
          style={s.logo}
          resizeMode="contain"
          accessibilityLabel="Car Hero"
        />
        <Text style={s.title}>تسجيل دخول الفنّي</Text>
        <Text style={s.sub}>أدخل بيانات حسابك المعتمد من الإدارة</Text>
      </View>

      <View style={s.form}>
        <View>
          <Text style={s.label}>اسم المستخدم</Text>
          <View style={s.field}>
            <User size={20} color={colors.primaryLight} />
            <TextInput value={username} onChangeText={setUsername} placeholder="karhero.fix"
              placeholderTextColor={colors.textMuted2} style={s.input} textAlign="right" autoCapitalize="none" />
          </View>
        </View>
        <View>
          <Text style={s.label}>كلمة المرور</Text>
          <View style={s.field}>
            <LockKey size={20} color={colors.primaryLight} />
            <TextInput value={password} onChangeText={setPassword} placeholder="••••••••"
              placeholderTextColor={colors.textMuted2} secureTextEntry={hidden} style={s.input} textAlign="right" />
            <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={8}>
              {hidden ? <Eye size={20} color={colors.textMuted2} /> : <EyeSlash size={20} color={colors.textMuted2} />}
            </TouchableOpacity>
          </View>
        </View>
        <Text style={s.forgot}>نسيت كلمة المرور؟</Text>
      </View>

      <View style={{ flex: 1 }} />

      <PrimaryButton label="دخول" height={58} icon={<SignIn size={20} weight="bold" color="#fff" />}
        onPress={() => navigation?.replace?.('Home')} style={{ marginHorizontal: 26 }} />
      <Text style={s.note}>التسجيل يتم عبر الإدارة — لا يمكن للفنّي إنشاء حساب من التطبيق.</Text>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', paddingTop: 70, paddingBottom: 34 },
  header: { alignItems: 'center', gap: 14, paddingHorizontal: 26 },
  // الشعار الرسمي أفقي ويضمّ اسم العلامة داخله: القياس **عرض** والارتفاع
  // يُشتقّ من نسبة الملف الأصلية، فلا يُحشر في مربّع ولا يُرسم بديل نصّي.
  logo: { width: layout.logoBrand, height: layout.logoBrand / layout.logoAspect },
  title: { fontSize: 26, fontWeight: '800', color: colors.textDark, marginTop: 4 },
  sub: { fontSize: 14.5, color: colors.textBody, textAlign: 'center' },
  form: { marginTop: 34, paddingHorizontal: 26, gap: 16 },
  label: { fontSize: 13.5, fontWeight: '700', color: colors.textHeading, marginBottom: 8, textAlign: 'right' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 56, borderRadius: radius.md, backgroundColor: '#faf7fd', borderWidth: 1, borderColor: colors.borderInput, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 15.5, color: colors.textDark, padding: 0 },
  forgot: { fontSize: 13.5, fontWeight: '700', color: colors.primaryLight, textAlign: 'left', marginTop: 2 },
  note: { textAlign: 'center', marginTop: 18, fontSize: 13, color: colors.textMuted2, paddingHorizontal: 40, lineHeight: 20 },
});
