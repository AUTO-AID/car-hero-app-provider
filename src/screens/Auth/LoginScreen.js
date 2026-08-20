// ============================================================
//  LoginScreen  —  ١ · تسجيل دخول الفنّي
// ============================================================

import React, { useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { LockKey, SignIn, User } from "phosphor-react-native";
import { colors, font, layout, spacing } from "../../theme/theme";
import { ErrorBanner, InputField, LinkText, PrimaryButton, ScreenContainer } from "../../components/ui";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const passwordRef = useRef(null);

  // الحقول كانت `TextInput` خامّة: بلا حالة خطأ، وبلا إظهار/إخفاء موحّد،
  // وبلا تسلسل تركيز بين الحقلين. `InputField` من الطبقة المشتركة تحمل
  // الثلاثة، وهي نفسها التي يستعملها تطبيق العميل في شاشة دخوله.
  const submit = () => {
    if (!username.trim() || !password) {
      setError("أدخل اسم المستخدم وكلمة المرور");
      return;
    }
    setError("");
    navigation?.replace?.("Home");
  };

  return (
    <ScreenContainer contentStyle={s.content}>
      <View style={s.header}>
        <Image
          source={require("../../../assets/carhero-logo.png")}
          style={s.logo}
          resizeMode="contain"
          accessibilityLabel="Car Hero"
        />
        <Text style={s.title} accessibilityRole="header">
          تسجيل دخول الفنّي
        </Text>
        <Text style={s.sub}>أدخل بيانات حسابك المعتمد من الإدارة</Text>
      </View>

      <View style={s.form}>
        <ErrorBanner message={error} />

        <InputField
          label="اسم المستخدم"
          value={username}
          onChangeText={setUsername}
          placeholder="karhero.fix"
          icon={<User size={20} color={colors.primaryLight} />}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <InputField
          ref={passwordRef}
          label="كلمة المرور"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          icon={<LockKey size={20} color={colors.primaryLight} />}
          secure
          returnKeyType="go"
          onSubmitEditing={submit}
        />

        {/* كان نصّاً بلا `onPress` إطلاقاً: يبدو رابطاً ولا يفتح شيئاً.
            التدفّق خلفه (رقم ← رمز ← كلمة جديدة ← تأكيد) منسوخ حرفياً من
            تطبيق العميل، ويُقاد من الجذر لأن الرقم يعبر ثلاث شاشات. */}
        <LinkText style={s.forgot} onPress={() => navigation?.navigate?.("ForgotPassword")}>
          نسيت كلمة المرور؟
        </LinkText>
      </View>

      <View style={s.footer}>
        <PrimaryButton
          label="دخول"
          height={58}
          icon={<SignIn size={20} weight="bold" color={colors.onPrimary} />}
          onPress={submit}
        />
        <Text style={s.note}>التسجيل يتم عبر الإدارة — لا يمكن للفنّي إنشاء حساب من التطبيق.</Text>
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  content: { flexGrow: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xxl },
  // الشعار الرسمي أفقي ويضمّ اسم العلامة داخله: القياس **عرض** والارتفاع
  // يُشتقّ من نسبة الملف الأصلية، فلا يُحشر في مربّع ولا يُرسم بديل نصّي.
  logo: { width: layout.logoBrand, height: layout.logoBrand / layout.logoAspect },
  title: { fontSize: font.size.h1, fontWeight: font.weight.bold, color: colors.textDark },
  sub: {
    fontSize: font.size.body,
    color: colors.textBody,
    textAlign: "center",
    lineHeight: font.lineHeight.body,
  },
  form: { marginTop: spacing.xxl + spacing.sm, gap: spacing.lg },
  forgot: { textAlign: "left" },
  footer: { marginTop: "auto", paddingTop: spacing.xxl, gap: spacing.md },
  note: {
    textAlign: "center",
    fontSize: font.size.sm,
    color: colors.textMuted2,
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },
});
 