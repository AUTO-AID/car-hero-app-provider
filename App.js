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

import LoginScreen from "./src/screens/Auth/LoginScreen";
import HomeScreen from "./src/screens/Main/HomeScreen";

// دورة الطلب — من الوصول إلى الإتمام
import NewRequestScreen from "./src/screens/Order/NewRequestScreen";
import RequestDetailsScreen from "./src/screens/Order/RequestDetailsScreen";
import EnRouteScreen from "./src/screens/Order/EnRouteScreen";
import ArrivedScreen from "./src/screens/Order/ArrivedScreen";
import InServiceScreen from "./src/screens/Order/InServiceScreen";
import CompletedScreen from "./src/screens/Order/CompletedScreen";
import MyRequestsScreen from "./src/screens/Order/MyRequestsScreen";

// الحساب والتنبيهات
import NotificationsScreen from "./src/screens/Account/NotificationsScreen";
import ProfileScreen from "./src/screens/Account/ProfileScreen";

// شاشات الشريط السفلي: التنقّل بينها **تبديل جذر لا دفع للمكدّس**، وإلا نما
// المكدّس بلا حدّ مع كل تنقّل بين تبويبين وصار زرّ الرجوع يمشي في التاريخ
// بدل أن يخرج من الشاشة.
const TAB_STEPS = ["home", "myRequests", "notifications", "profile"];

const ROUTE_TO_STEP = {
  Login: "login",
  Home: "home",
  NewRequest: "newRequest",
  RequestDetails: "requestDetails",
  EnRoute: "enRoute",
  Arrived: "arrived",
  InService: "inService",
  Completed: "completed",
  MyRequests: "myRequests",
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

  // الخطوط جزء من الهوية لا زينة: عرض الشاشات بخطّ النظام ثم قلبها إلى Cairo
  // يُحدث قفزة تخطيط كاملة. نمسك الشاشة الأولى على خلفية العلامة حتى تجهز.
  if (!fontsReady) return <View style={{ flex: 1, backgroundColor: colors.screenBg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.screenBg }}>
      {/* الدخول */}
      {step === "login" && <LoginScreen navigation={nav} route={route} />}

      {/* الرئيسية — مفتاح الاتصال وحالة الفنّي */}
      {step === "home" && <HomeScreen navigation={nav} route={route} />}

      {/* دورة الطلب */}
      {step === "newRequest" && <NewRequestScreen navigation={nav} route={route} />}
      {step === "requestDetails" && <RequestDetailsScreen navigation={nav} route={route} />}
      {step === "enRoute" && <EnRouteScreen navigation={nav} route={route} />}
      {step === "arrived" && <ArrivedScreen navigation={nav} route={route} />}
      {step === "inService" && <InServiceScreen navigation={nav} route={route} />}
      {step === "completed" && <CompletedScreen navigation={nav} route={route} />}

      {/* الشريط السفلي */}
      {step === "myRequests" && <MyRequestsScreen navigation={nav} route={route} />}
      {step === "notifications" && <NotificationsScreen navigation={nav} route={route} />}
      {step === "profile" && <ProfileScreen navigation={nav} route={route} />}
    </View>
  );
}
