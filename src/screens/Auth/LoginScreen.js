// ============================================================
//  LoginScreen  —  ١ · تسجيل دخول الفنّي
//
//  الدخول **برقم الهاتف** لا باسم مستخدم: الخادم لا يعرف أسماء مستخدمين
//  إطلاقاً (`auth.controller` يقبل `phoneNumber` وحده)، وتدفّق استعادة كلمة
//  المرور خلف هذه الشاشة يسأل عن الرقم أصلاً. حقل باسم مستخدم كان سيعني
//  الدخول بمعرّف والاستعادة بمعرّف آخر — وهو أول ما يُربك عند نسيان الكلمة.
// ============================================================

import React, { useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { LockKey, SignIn } from "phosphor-react-native";
import { colors, font, layout, spacing } from "../../theme/theme";
import {
  ErrorBanner,
  InputField,
  LinkText,
  PhoneField,
  PrimaryButton,
  ScreenContainer,
} from "../../components/ui";
import { useSession } from "../../context/SessionContext";
import { validatePasswordPresent, validatePhone } from "../../services/validators";
import { collectErrors } from "../../services/validators";
import { errorFeedback } from "../../services/feedback";

export default function LoginScreen({ navigation }) {
  const { signIn, error: sessionError, clearError } = useSession();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);

  // خطأ الجلسة (طرد لانتهاء التوكن، حساب موقوف) يصل من الجذر لا من هذه
  // الشاشة، ويجب أن يُعرض هنا لأنها الشاشة التي هبط عليها الفنّي.
  const banner = error || sessionError;

  // الحقول تحمل حالة خطأ ورسالة تحتها لا رسالة واحدة أعلى الشاشة: «أدخل رقم
  // الهاتف» فوق حقلين لا تقول أيّهما الناقص.
  const submit = async () => {
    const { errors, firstError, valid } = collectErrors({
      phone: validatePhone(phone),
      password: validatePasswordPresent(password),
    });
    setFieldErrors(errors);
    if (!valid) {
      setError(firstError);
      errorFeedback();
      return;
    }

    setError("");
    setFieldErrors({});
    clearError();
    setLoading(true);
    try {
      await signIn({ phone, password });
      // لا انتقال هنا: الجذر يراقب حالة الجلسة وينقل إلى الرئيسية — أو إلى
      // شاشة الطلب النشِط إن كان الفنّي في منتصف خدمة قبل إغلاق التطبيق.
    } catch (err) {
      setError(err?.message || "تعذّر تسجيل الدخول، حاول مجدداً");
      errorFeedback();
    } finally {
      setLoading(false);
    }
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
        <ErrorBanner message={banner} />

        <PhoneField
          label="رقم الهاتف"
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
          }}
          error={fieldErrors.phone}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!loading}
        />

        <InputField
          ref={passwordRef}
          label="كلمة المرور"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
          }}
          error={fieldErrors.password}
          placeholder="••••••••"
          icon={<LockKey size={20} color={colors.primaryLight} />}
          secure
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!loading}
        />

        <LinkText style={s.forgot} onPress={() => navigation?.navigate?.("ForgotPassword")}>
          نسيت كلمة المرور؟
        </LinkText>
      </View>

      <View style={s.footer}>
        <PrimaryButton
          label="دخول"
          height={58}
          loading={loading}
          disabled={loading}
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
