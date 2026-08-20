// App.js — تطبيق الفنّي (Car Hero Provider)
//
// نفس بنية تطبيق العميل: لا مكتبة تنقّل، بل `step` واحدة ومكدّس يدوي، وكائن
// `nav` يحاكي واجهة react-navigation فتبقى الشاشات مكتوبة بأسلوبها المألوف
// (navigate / replace / goBack / reset) دون أن يعتمد التطبيق على المكتبة.
// السبب هو نفسه في التطبيقين: الشاشات قليلة ومتسلسلة، والتحكّم المركزي في
// الانتقالات يجعل كل مسار مرئياً في ملف واحد.
import React, { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";

import { colors } from "./src/theme/theme";
import { qaState } from "./src/services/qa";
import { StatusBarScrim } from "./src/components/ui";
import { callNumber } from "./src/services/contact";
import { SUPPORT_PHONE } from "./src/services/demo";

import LoginScreen from "./src/screens/Auth/LoginScreen";
import HomeScreen from "./src/screens/Main/HomeScreen";

// استعادة كلمة المرور — الأربع منسوخة حرفياً من تطبيق العميل، ولهذا تُقاد
// بعقد الخصائص نفسه (onSubmit · onBack · onLogin · loading · error) لا بكائن
// `nav`: تغيير العقد كان يكسر مقارنة diff ويجعل نقل أي تحسين لاحق تخميناً.
import ForgotPasswordScreen from "./src/screens/Auth/ForgotPasswordScreen";
import OtpScreen from "./src/screens/Auth/OtpScreen";
import ResetPasswordScreen from "./src/screens/Auth/ResetPasswordScreen";
import PasswordChangedScreen from "./src/screens/Auth/PasswordChangedScreen";

// دورة الطلب — من الوصول إلى الإتمام
import NewRequestScreen from "./src/screens/Order/NewRequestScreen";
import RequestDetailsScreen from "./src/screens/Order/RequestDetailsScreen";
import EnRouteScreen from "./src/screens/Order/EnRouteScreen";
import ArrivedScreen from "./src/screens/Order/ArrivedScreen";
import InServiceScreen from "./src/screens/Order/InServiceScreen";
import CompletedScreen from "./src/screens/Order/CompletedScreen";
import MyRequestsScreen from "./src/screens/Order/MyRequestsScreen";
import PastRequestScreen from "./src/screens/Order/PastRequestScreen";

// الحساب والتنبيهات
import NotificationsScreen from "./src/screens/Account/NotificationsScreen";
import ProfileScreen from "./src/screens/Account/ProfileScreen";

// شاشات الشريط السفلي: التنقّل بينها **تبديل جذر لا دفع للمكدّس**، وإلا نما
// المكدّس بلا حدّ مع كل تنقّل بين تبويبين وصار زرّ الرجوع يمشي في التاريخ
// بدل أن يخرج من الشاشة.
const TAB_STEPS = ["home", "myRequests", "notifications", "profile"];

const ROUTE_TO_STEP = {
  Login: "login",
  ForgotPassword: "forgotPassword",
  Home: "home",
  NewRequest: "newRequest",
  RequestDetails: "requestDetails",
  EnRoute: "enRoute",
  Arrived: "arrived",
  InService: "inService",
  Completed: "completed",
  MyRequests: "myRequests",
  PastRequest: "pastRequest",
  Notifications: "notifications",
  Profile: "profile",
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular: require("@expo-google-fonts/cairo/400Regular/Cairo_400Regular.ttf"),
    Cairo_500Medium: require("@expo-google-fonts/cairo/500Medium/Cairo_500Medium.ttf"),
    Cairo_600SemiBold: require("@expo-google-fonts/cairo/600SemiBold/Cairo_600SemiBold.ttf"),
    Cairo_700Bold: require("@expo-google-fonts/cairo/700Bold/Cairo_700Bold.ttf"),
  });

  return (
    <SafeAreaProvider>
      <Root fontsReady={fontsLoaded || !!fontError} />
    </SafeAreaProvider>
  );
}

function Root({ fontsReady = true }) {
  // قفزة تطويرية إلى أي شاشة عبر ?qa=<step> — تُلغى تلقائياً خارج __DEV__.
  // شاشات دورة الطلب تقع خلف تسلسل كامل (دخول ← اتصال ← طلب وارد ← قبول)،
  // فمعاينة أي منها كانت تتطلّب المرور بالتسلسل كلّه في كل مرّة.
  const [step, setStep] = useState(() => qaState() || "login");
  const [navStack, setNavStack] = useState([]);
  const [routeParams, setRouteParams] = useState({});

  // مرجع لأحدث معاملات الشاشة الحالية، تقرأه goTo عند الدفع للمكدّس: لو حفظنا
  // اسم الخطوة وحدها لعادت الشاشة عند الرجوع بلا بياناتها.
  const routeParamsRef = useRef({});
  routeParamsRef.current = routeParams;

  const goTo = (nextStep, params) => {
    if (TAB_STEPS.includes(nextStep)) {
      setNavStack([]);
      setRouteParams(params || {});
      setStep(nextStep);
      return;
    }
    setNavStack((prev) => [...prev, { step, params: routeParamsRef.current }]);
    setRouteParams(params || {});
    setStep(nextStep);
  };

  const goBack = () => {
    setNavStack((prev) => {
      if (!prev.length) return prev;
      const entry = prev[prev.length - 1];
      setRouteParams(entry.params || {});
      setStep(entry.step);
      return prev.slice(0, -1);
    });
  };

  const resetTo = (name, params) => {
    setNavStack([]);
    setRouteParams(params || {});
    setStep(ROUTE_TO_STEP[name] || name);
  };

  const nav = {
    navigate: (name, params) => goTo(ROUTE_TO_STEP[name] || name, params),
    // استبدال دون دفع للمكدّس: يُستعمل حيث لا معنى للرجوع (بعد الدخول، وبعد
    // قبول الطلب، وبعد إنهاء الخدمة) — الرجوع إلى شاشة انتهى دورها يربك.
    replace: (name, params) => {
      setRouteParams(params || {});
      setStep(ROUTE_TO_STEP[name] || name);
    },
    goBack,
    popToTop: () => resetTo("Home"),
    // توقيع react-navigation نفسه، لتبقى شاشة الإتمام مكتوبة كما هي
    reset: (state) => {
      const routes = state?.routes || [];
      const target = routes[state?.index ?? routes.length - 1];
      resetTo(target?.name || "Home", target?.params);
    },
  };

  const route = useMemo(() => ({ params: routeParams }), [routeParams]);

  // ============================================================
  //  استعادة كلمة المرور — حالة التدفّق
  //
  //  الحالة هنا لا في الشاشات، تماماً كما في جذر تطبيق العميل: الرقم يعبر
  //  ثلاث شاشات (طلب ← رمز ← كلمة جديدة)، وحفظه داخل إحداها يعني تمريره
  //  يدوياً بين الباقي أو إعادة سؤال المستخدم عنه — وإعادة السؤال في أسوأ
  //  لحظة (فشل الدخول) هي أول احتكاك يجب إلغاؤه.
  //
  //  **لا خادم بعد.** كل معالج أدناه ينتقل محلّياً، وموضع النداء الحقيقي
  //  معلّم بـ TODO. عند الربط تُنسخ `authApi.js` من تطبيق العميل وتُستبدل
  //  أجسام المعالجات وحدها — الشاشات لا تُلمس لأنها تتلقّى loading/error
  //  كخصائص أصلاً.
  // ============================================================
  const [authPhone, setAuthPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // الخطأ يُصفَّر مع كل انتقال: رسالة خطأ من شاشة سابقة تظهر فوق شاشة جديدة
  // تُقرأ كخطأ في هذه الشاشة.
  const goAuth = (nextStep, params) => {
    setAuthError("");
    setRouteParams(params || {});
    setStep(nextStep);
  };

  const handleForgotPassword = ({ phone }) => {
    // TODO عند الربط: await authApi.forgotPassword({ phone })
    setAuthPhone(phone);
    goAuth("otp");
  };

  // لا نقطة تحقّق مستقلّة للرمز في عقد العميل أيضاً: يُحمل حتى شاشة إعادة
  // التعيين ويُرسل معها.
  const handleOtpConfirm = () => goAuth("resetPassword");

  // TODO عند الربط: await authApi.forgotPassword({ phone: authPhone })
  const handleOtpResend = () => setAuthError("");

  const handleResetPassword = () => {
    // TODO عند الربط: await authApi.resetPassword({ phone, code, newPassword })
    goAuth("passwordChanged");
  };

  // نهاية التدفّق: تصفير المكدّس فلا يعيد زرّ الرجوع المستخدم إلى شاشات
  // انتهى دورها (رمز مستهلَك، كلمة مرور حُفظت).
  const leaveRecovery = () => {
    setNavStack([]);
    setAuthPhone("");
    goAuth("login");
  };

  // الخطوط جزء من الهوية لا زينة: عرض الشاشات بخطّ النظام ثم قلبها إلى Cairo
  // يُحدث قفزة تخطيط كاملة. نمسك الشاشة الأولى على خلفية العلامة حتى تجهز.
  if (!fontsReady) return <View style={{ flex: 1, backgroundColor: colors.screenBg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.screenBg }}>
      {/* الدخول */}
      {step === "login" && <LoginScreen navigation={nav} route={route} />}

      {/* استعادة كلمة المرور — أربع شاشات بعقد خصائص تطبيق العميل نفسه.
          الدخول باسم مستخدم والاستعادة برقم الهاتف: الرقم هو ما يملك الفنّي
          وسيلة استقباله (واتساب)، واسم المستخدم تختاره الإدارة وقد لا يذكره
          أصلاً — وهو سبب وقوفه هنا. */}
      {step === "forgotPassword" && (
        <ForgotPasswordScreen
          initialPhone={authPhone}
          loading={authLoading}
          error={authError}
          onSubmit={handleForgotPassword}
          onBack={() => goAuth("login")}
          onLogin={() => goAuth("login")}
        />
      )}

      {step === "otp" && (
        <OtpScreen
          mode="recovery"
          phone={authPhone}
          loading={authLoading}
          serverError={authError}
          onConfirm={handleOtpConfirm}
          onResend={handleOtpResend}
          // «تعديل الرقم» يعود إلى الشاشة التي يُدخَل فيها الرقم لا إلى الدخول:
          // الخطأ في الرقم أشيع أسباب عدم وصول الرمز، وإخفاء المخرج يحوّله
          // إلى طريق مسدود.
          onChangePhone={() => goAuth("forgotPassword")}
          onBack={() => goAuth("forgotPassword")}
          // «تواصل مع الدعم» بعد محاولتين فاشلتين: حساب الفنّي من الإدارة،
          // فهي جهة الدعم الفعلية — لا صندوق بريد عام.
          onSupport={() => callNumber(SUPPORT_PHONE)}
        />
      )}

      {step === "resetPassword" && (
        <ResetPasswordScreen
          loading={authLoading}
          error={authError}
          onSubmit={handleResetPassword}
          onBack={() => goAuth("otp")}
          onRequestNewCode={() => goAuth("forgotPassword")}
          onLogin={leaveRecovery}
        />
      )}

      {step === "passwordChanged" && <PasswordChangedScreen onDone={leaveRecovery} />}

      {/* الرئيسية — مفتاح الاتصال وحالة الفنّي */}
      {step === "home" && <HomeScreen navigation={nav} route={route} />}

      {/* دورة الطلب */}
      {step === "newRequest" && <NewRequestScreen navigation={nav} route={route} />}
      {step === "requestDetails" && <RequestDetailsScreen navigation={nav} route={route} />}
      {step === "enRoute" && <EnRouteScreen navigation={nav} route={route} />}
      {step === "arrived" && <ArrivedScreen navigation={nav} route={route} />}
      {step === "inService" && <InServiceScreen navigation={nav} route={route} />}
      {step === "completed" && <CompletedScreen navigation={nav} route={route} />}

      {/* سجلّ طلب منتهٍ — للقراءة فقط، لا يشارك دورة الطلب النشِط */}
      {step === "pastRequest" && <PastRequestScreen navigation={nav} route={route} />}

      {/* الشريط السفلي */}
      {step === "myRequests" && <MyRequestsScreen navigation={nav} route={route} />}
      {step === "notifications" && <NotificationsScreen navigation={nav} route={route} />}
      {step === "profile" && <ProfileScreen navigation={nav} route={route} />}

      {/* شريط معتم بارتفاع شريط الحالة، يُرسم **فوق** كل المحتوى — نفس موضعه
          في جذر تطبيق العميل. بدونه يصعد النصّ خلف الساعة والبطارية عند
          التمرير ويبقى مرئياً هناك، لأن `edgeToEdgeEnabled` يجعل التطبيق
          يرسم خلف الشريط الشفّاف. */}
      <StatusBarScrim />
    </View>
  );
}
