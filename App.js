// App.js — تطبيق الفنّي (Car Hero Provider)
//
// نفس بنية تطبيق العميل: لا مكتبة تنقّل، بل `step` واحدة ومكدّس يدوي، وكائن
// `nav` يحاكي واجهة react-navigation فتبقى الشاشات مكتوبة بأسلوبها المألوف
// (navigate / replace / goBack / reset) دون أن يعتمد التطبيق على المكتبة.
// السبب هو نفسه في التطبيقين: الشاشات قليلة ومتسلسلة، والتحكّم المركزي في
// الانتقالات يجعل كل مسار مرئياً في ملف واحد.
//
// ما تغيّر عند الربط: الشاشات لم تعد تقرّر الانتقال وحدها في دورة الطلب. الخادم
// هو مصدر حالة الطلب، و`SessionProvider` هو من يدفع التغييرات (طلب وارد، إلغاء
// من العميل، انتهاء مهلة) إلى هنا فيُترجمها إلى شاشة.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";

import { colors } from "./src/theme/theme";
import { StatusBarScrim } from "./src/components/ui";
import { callNumber } from "./src/services/contact";
import { SUPPORT_PHONE } from "./src/services/support";
import { forgotPassword, resetPassword } from "./src/services/authApi";
import { screenForStatus } from "./src/services/requestStatus";
import { SessionProvider, useSession } from "./src/context/SessionContext";
import { notify } from "./src/services/feedback";

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
import ChatScreen from "./src/screens/Order/ChatScreen";

// الحساب والتنبيهات
import { qaState, qaRouteParams } from "./src/services/qa";
import NotificationsScreen from "./src/screens/Account/NotificationsScreen";
import ProfileScreen from "./src/screens/Account/ProfileScreen";
import WalletScreen from "./src/screens/Account/WalletScreen";

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
  Chat: "chat",
  Notifications: "notifications",
  Profile: "profile",
  Wallet: "wallet",
};

// شاشات دورة الطلب — الخروج منها يقع تلقائياً حين ينتهي الطلب من طرف آخر
const ORDER_STEPS = ["newRequest", "requestDetails", "enRoute", "arrived", "inService", "chat"];

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
  const [step, setStep] = useState("login");
  const [navStack, setNavStack] = useState([]);
  const [routeParams, setRouteParams] = useState({});

  // مرجع لأحدث معاملات الشاشة الحالية، تقرأه goTo عند الدفع للمكدّس: لو حفظنا
  // اسم الخطوة وحدها لعادت الشاشة عند الرجوع بلا بياناتها.
  const routeParamsRef = useRef({});
  routeParamsRef.current = routeParams;

  // مرجع للخطوة الحالية: معالجات البثّ اللحظي تُنشأ مرّة واحدة، وقراءة `step`
  // منها مباشرةً كانت تُجمّدها على قيمة أول إطار.
  const stepRef = useRef(step);
  stepRef.current = step;

  const goTo = useCallback((nextStep, params) => {
    if (TAB_STEPS.includes(nextStep)) {
      setNavStack([]);
      setRouteParams(params || {});
      setStep(nextStep);
      return;
    }
    setNavStack((prev) => [...prev, { step: stepRef.current, params: routeParamsRef.current }]);
    setRouteParams(params || {});
    setStep(nextStep);
  }, []);

  const goBack = useCallback(() => {
    setNavStack((prev) => {
      if (!prev.length) return prev;
      const entry = prev[prev.length - 1];
      setRouteParams(entry.params || {});
      setStep(entry.step);
      return prev.slice(0, -1);
    });
  }, []);

  const resetTo = useCallback((name, params) => {
    setNavStack([]);
    setRouteParams(params || {});
    setStep(ROUTE_TO_STEP[name] || name);
  }, []);

  const nav = useMemo(
    () => ({
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
    }),
    [goTo, goBack, resetTo],
  );

  const route = useMemo(() => ({ params: routeParams }), [routeParams]);

  // ============================================================
  //  جسور البثّ اللحظي → التنقّل
  // ============================================================

  /** طلب وارد: يقفز فوق كل شيء — مهلته محدودة ولا تحتمل تصفّحاً */
  const handleIncomingRequest = useCallback(
    (request) => {
      if (stepRef.current === "newRequest") {
        setRouteParams({ request });
        return;
      }
      goTo("newRequest", { request });
    },
    [goTo],
  );

  /** أُغلق العرض من الخادم (مهلة/إلغاء/سبقك غيرك) ونحن على شاشته */
  const handleRequestClosed = useCallback(
    ({ reason }) => {
      if (stepRef.current !== "newRequest") return;
      const message =
        reason === "cancelled"
          ? "ألغى العميل هذا الطلب."
          : reason === "taken"
            ? "لم يعد هذا الطلب متاحاً."
            : reason === "rejected"
              ? "تم الاعتذار عن هذا الطلب."
              : "انتهت مهلة الرد على الطلب.";
      notify(message);
      resetTo("Home");
    },
    [resetTo],
  );

  /**
   * تغيّرت حالة الطلب النشِط. المصدر مهمّ: التغيير المحلي (ضغط الفنّي زرّاً)
   * تقوده الشاشة نفسها، أمّا القادم من الخادم (`remote`) فيفرض قفزة — العميل
   * ألغى الطلب والفنّي ما يزال على شاشة «في الطريق».
   */
  const handleActiveRequestChanged = useCallback(
    (request, meta) => {
      if (!meta?.remote) return;
      if (!ORDER_STEPS.includes(stepRef.current)) return;

      if (!request) {
        notify("انتهى هذا الطلب.");
        resetTo("Home");
        return;
      }

      const target = screenForStatus(request.status);
      if (target === "Home") {
        notify("تم إلغاء الطلب.");
        resetTo("Home");
        return;
      }
      if (ROUTE_TO_STEP[target] !== stepRef.current) {
        setRouteParams({ request });
        setStep(ROUTE_TO_STEP[target]);
      }
    },
    [resetTo],
  );

  /**
   * ضغط الفنّي على إشعار رسالة — من الإشعار المدفوع والهاتف مقفل.
   *
   * نفتح المحادثة بما وصل من الحمولة فقط: `chatId` يكفي الشاشة لتحميل
   * الرسائل، والاسم والرقم يظهران حين يكون `orderId` معروفاً.
   */
  const handleOpenChat = useCallback(
    (data) => {
      if (!data?.chatId && !data?.orderId) return;
      goTo("chat", { chatId: data.chatId, orderId: data.orderId });
    },
    [goTo],
  );

  if (!fontsReady) return <View style={{ flex: 1, backgroundColor: colors.screenBg }} />;

  return (
    <SessionProvider
      onIncomingRequest={handleIncomingRequest}
      onRequestClosed={handleRequestClosed}
      onActiveRequestChanged={handleActiveRequestChanged}
      onOpenChat={handleOpenChat}
    >
      <Screens nav={nav} route={route} step={step} setStep={setStep} setNavStack={setNavStack} setRouteParams={setRouteParams} />
    </SessionProvider>
  );
}

/**
 * فُصل عن `Root` لأنه يحتاج `useSession`، والسياق لا يُقرأ داخل المكوّن الذي
 * يركّب مزوّده.
 */
function Screens({ nav, route, step, setStep, setNavStack, setRouteParams }) {
  const { booting, isAuthenticated, activeRequest } = useSession();

  // ============================================================
  //  استعادة كلمة المرور — حالة التدفّق
  //
  //  الحالة هنا لا في الشاشات، تماماً كما في جذر تطبيق العميل: الرقم يعبر
  //  ثلاث شاشات (طلب ← رمز ← كلمة جديدة)، وحفظه داخل إحداها يعني تمريره
  //  يدوياً بين الباقي أو إعادة سؤال المستخدم عنه — وإعادة السؤال في أسوأ
  //  لحظة (فشل الدخول) هي أول احتكاك يجب إلغاؤه.
  // ============================================================
  const [authPhone, setAuthPhone] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  // الخادم قد يعلّق OTP في التطوير (`dev-flags`) ويردّ `otpBypassed` — عندها
  // نتخطّى شاشة الرمز بدل عرض حقل لرمز لن يصل أبداً.
  const [otpBypassed, setOtpBypassed] = useState(false);

  // الخطأ يُصفَّر مع كل انتقال: رسالة خطأ من شاشة سابقة تظهر فوق شاشة جديدة
  // تُقرأ كخطأ في هذه الشاشة.
  const goAuth = (nextStep, params) => {
    setAuthError("");
    setRouteParams(params || {});
    setStep(nextStep);
  };

  const handleForgotPassword = async ({ phone }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await forgotPassword({ phone });
      setAuthPhone(phone);
      setOtpBypassed(!!res?.otpBypassed);
      goAuth(res?.otpBypassed ? "resetPassword" : "otp");
    } catch (err) {
      setAuthError(err?.message || "تعذّر إرسال الرمز، حاول مجدداً");
    } finally {
      setAuthLoading(false);
    }
  };

  // لا نقطة تحقّق مستقلّة للرمز في عقد الخادم: يُحمل حتى شاشة إعادة التعيين
  // ويُرسل معها في نداء واحد (`/auth/reset-password`).
  const handleOtpConfirm = (code) => {
    setAuthCode(typeof code === "string" ? code : code?.code || "");
    goAuth("resetPassword");
  };

  const handleOtpResend = async () => {
    setAuthError("");
    try {
      await forgotPassword({ phone: authPhone });
    } catch (err) {
      setAuthError(err?.message || "تعذّر إعادة الإرسال، حاول مجدداً");
    }
  };

  const handleResetPassword = async ({ password }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await resetPassword({
        phone: authPhone,
        code: otpBypassed ? undefined : authCode,
        newPassword: password,
      });
      goAuth("passwordChanged");
    } catch (err) {
      setAuthError(err?.message || "تعذّر تغيير كلمة المرور، حاول مجدداً");
    } finally {
      setAuthLoading(false);
    }
  };

  // نهاية التدفّق: تصفير المكدّس فلا يعيد زرّ الرجوع المستخدم إلى شاشات
  // انتهى دورها (رمز مستهلَك، كلمة مرور حُفظت).
  const leaveRecovery = () => {
    setNavStack([]);
    setAuthPhone("");
    setAuthCode("");
    setOtpBypassed(false);
    goAuth("login");
  };

  // ============================================================
  //  حرّاس الجلسة
  // ============================================================

  const authSteps = ["login", "forgotPassword", "otp", "resetPassword", "passwordChanged"];

  // قفزة تطويرية إلى أي شاشة عبر ?qa=<step> — تُلغى تلقائياً خارج __DEV__.
  // كثير من الشاشات يقع خلف تدفّقات ذات آثار خارجية (قبول طلب فعلي، رسائل
  // OTP)، فالوصول إليها للفحص كان يتطلّب تعديل الكود ثم عكسه في كل مرّة.
  const qaJumpedRef = useRef(false);
  useEffect(() => {
    if (booting || qaJumpedRef.current) return;
    const qaStep = qaState();
    if (!qaStep) return;
    qaJumpedRef.current = true;
    setRouteParams(qaRouteParams());
    setStep(qaStep);
  }, [booting]);

  useEffect(() => {
    if (booting) return;
    // القفزة التطويرية تتجاوز حرّاس الجلسة، وإلا أعادتها فوراً إلى الرئيسية
    if (qaJumpedRef.current) return;
    // خروج (أو طرد جلسة) ونحن داخل التطبيق → شاشة الدخول
    if (!isAuthenticated && !authSteps.includes(step)) {
      setNavStack([]);
      setRouteParams({});
      setStep("login");
      return;
    }
    // دخول ناجح ونحن على شاشة مصادقة → الرئيسية.
    // الطلب النشِط يقفز إلى شاشته مباشرةً: الفنّي الذي أُغلق تطبيقه وهو في
    // الطريق يجب أن يعود إلى حيث كان لا إلى رئيسية تقول «لا طلب نشِط».
    if (isAuthenticated && authSteps.includes(step)) {
      setNavStack([]);
      if (activeRequest) {
        setRouteParams({ request: activeRequest });
        setStep(ROUTE_TO_STEP[screenForStatus(activeRequest.status)] || "home");
      } else {
        setRouteParams({});
        setStep("home");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, isAuthenticated, step]);

  // شاشة إقلاع: نمسك العرض حتى نعرف إن كان هناك حساب — عرض شاشة الدخول
  // ومضةً لفنّي مسجَّل دخوله فعلاً يبدو كخروج غير مقصود.
  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.screenBg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.screenBg }}>
      {/* الدخول */}
      {step === "login" && <LoginScreen navigation={nav} route={route} />}

      {/* استعادة كلمة المرور — أربع شاشات بعقد خصائص تطبيق العميل نفسه.
          الدخول والاستعادة كلاهما برقم الهاتف: الخادم لا يعرف أسماء مستخدمين
          إطلاقاً، ومعرّفان مختلفان بين الشاشتين كانا سيربكان عند أول نسيان. */}
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
          onBack={() => goAuth(otpBypassed ? "forgotPassword" : "otp")}
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
      {step === "chat" && <ChatScreen navigation={nav} route={route} />}

      {/* الشريط السفلي */}
      {step === "myRequests" && <MyRequestsScreen navigation={nav} route={route} />}
      {step === "notifications" && <NotificationsScreen navigation={nav} route={route} />}
      {step === "profile" && <ProfileScreen navigation={nav} route={route} />}

      {/* رصيدي — شاشة مدفوعة من «حسابي»، للقراءة فقط */}
      {step === "wallet" && <WalletScreen navigation={nav} route={route} />}

      {/* شريط معتم بارتفاع شريط الحالة، يُرسم **فوق** كل المحتوى — نفس موضعه
          في جذر تطبيق العميل. بدونه يصعد النصّ خلف الساعة والبطارية عند
          التمرير ويبقى مرئياً هناك، لأن `edgeToEdgeEnabled` يجعل التطبيق
          يرسم خلف الشريط الشفّاف. */}
      <StatusBarScrim />
    </View>
  );
}
