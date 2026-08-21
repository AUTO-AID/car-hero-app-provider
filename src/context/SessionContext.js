// ============================================================
//  SessionContext — الجلسة وحالة الاتصال والطلب الحالي
//
//  لماذا سياق واحد لا ثلاثة: الثلاثة يتغيّرون معاً في كل حدث تقريباً. قبول
//  طلب يغيّر «الطلب الحالي» و«هل أنا منشغل» معاً، وانتهاء المهلة يغيّر «العرض
//  الوارد» و«ما يجب أن تعرضه الرئيسية» معاً. تفريقهم كان سيعني حالتين تُحدَّثان
//  في نداءين متتاليين، وإطاراً واحداً بينهما يعرض التطبيق فيه شيئين متناقضين.
//
//  **الخادم مصدر الحقيقة.** لا يُخترع هنا انتقال حالة ولا يُخزَّن محلياً: كل
//  فعل ينادي الخادم ثم يخزّن ما ردّ به. البثّ اللحظي يدفع التغييرات القادمة من
//  الطرف الآخر (إلغاء العميل، تأكيده الإتمام).
// ============================================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { ApiError, registerAuthExpiredHandler } from "../services/api";
import { getMe, login as loginRequest, logout as logoutRequest } from "../services/authApi";
import { clearSession, getUser, hasSession, saveUser } from "../services/tokenStorage";
import * as providerApi from "../services/providerApi";
import { closeSocket, createNotificationsSocket, createProviderSocket, ProviderEvents } from "../services/realtime";
import { hasLocationPermission, readCurrentPosition, watchPosition } from "../services/location";
import { clearBadge, listenToPush, registerForPush } from "../services/push";
import { needsLocationTracking } from "../services/requestStatus";

const SessionContext = createContext(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}

const EMPTY_HOME = {
  online: false,
  activeRequest: null,
  incomingRequest: null,
  todayCount: 0,
  unreadNotifications: 0,
  locationIntervalSeconds: 15,
  offerWindowSeconds: 15,
};

export function SessionProvider({ children, onIncomingRequest, onRequestClosed, onActiveRequestChanged }) {
  // `booting` منفصل عن `loading`: الأول يمسك الشاشة قبل أن نعرف إن كان هناك
  // حساب أصلاً، والثاني يعطّل أزراراً أثناء نداء. خلطهما كان يعرض شاشة الدخول
  // ومضةً لفنّي مسجَّل دخوله فعلاً.
  const [booting, setBooting] = useState(true);
  const [provider, setProvider] = useState(null);
  const [home, setHome] = useState(EMPTY_HOME);
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const notificationsSocketRef = useRef(null);
  const stopWatchRef = useRef(null);
  // مرجع للطلب النشِط تقرأه نبضة الموقع: الإغلاق (closure) داخل `watchPosition`
  // يُنشأ مرّة واحدة، فقراءة الحالة منه مباشرةً كانت تُجمّده على أول طلب.
  const activeRequestRef = useRef(null);
  const homeRef = useRef(EMPTY_HOME);

  const applyHome = useCallback(
    (next) => {
      const merged = { ...EMPTY_HOME, ...next };
      homeRef.current = merged;
      activeRequestRef.current = merged.activeRequest;
      setHome(merged);
      return merged;
    },
    [],
  );

  // ------------------------------------------------------------
  //  الإقلاع واستعادة الجلسة
  // ------------------------------------------------------------

  const loadHome = useCallback(async () => {
    const data = await providerApi.fetchHome();
    const merged = applyHome(data);
    if (data?.provider) setProvider((current) => ({ ...current, ...data.provider }));
    return merged;
  }, [applyHome]);

  const bootstrap = useCallback(async () => {
    try {
      if (!(await hasSession())) {
        setProvider(null);
        return;
      }

      // نتحقّق من التوكن أولاً: توكن منتهٍ كان يجعل نداء `home` يفشل بـ 401
      // فيسقط الفنّي على شاشة الدخول بعد ومضة تحميل بلا تفسير.
      const cached = await getUser();
      if (cached) setProvider(cached);
      await getMe();

      const profile = await providerApi.fetchProfile();
      setProvider(profile);
      await saveUser(profile);
      await loadHome();
    } catch (err) {
      // الحساب موقوف/قيد المراجعة: نعرض السبب على شاشة الدخول بدل إسقاط
      // الفنّي عليها صامتة.
      if (err instanceof ApiError && err.statusCode !== 0) {
        await clearSession();
        setProvider(null);
        setError(err.message);
      }
    } finally {
      setBooting(false);
    }
  }, [loadHome]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // طرد الجلسة من طبقة النقل (فشل تجديد التوكن) — يصل من أي نداء في أي شاشة
  useEffect(() => {
    registerAuthExpiredHandler(() => {
      setProvider(null);
      applyHome(EMPTY_HOME);
      setError("انتهت الجلسة، يرجى تسجيل الدخول من جديد");
    });
  }, [applyHome]);

  // ------------------------------------------------------------
  //  الدخول والخروج
  // ------------------------------------------------------------

  const signIn = useCallback(
    async ({ phone, password }) => {
      setError("");
      await loginRequest({ phone, password });

      // الملف يُقرأ من `/provider-app/me` لا من ردّ الدخول: ردّ الدخول يحمل
      // حساب المستخدم لا ملف الفنّي (اسم الورشة، الاعتماد، التقييم)، وهو ما
      // يفصل «دخل بنجاح» عن «حسابه معتمد ويستطيع العمل».
      const profile = await providerApi.fetchProfile();
      setProvider(profile);
      await saveUser(profile);
      await loadHome();

      // تسجيل الجهاز بعد الدخول لا عند أول فتح للإشعارات: الطلب الأول قد يصل
      // قبل أن يفتح الفنّي تلك الشاشة أبداً.
      registerForPush();
      return profile;
    },
    [loadHome],
  );

  const signOut = useCallback(async () => {
    stopWatchRef.current?.();
    stopWatchRef.current = null;
    closeSocket(socketRef.current);
    closeSocket(notificationsSocketRef.current);
    socketRef.current = null;
    notificationsSocketRef.current = null;

    await logoutRequest();
    setProvider(null);
    applyHome(EMPTY_HOME);
  }, [applyHome]);

  // ------------------------------------------------------------
  //  الاتصال (متصل / غير متصل)
  // ------------------------------------------------------------

  const setOnline = useCallback(
    async (online) => {
      let coords = {};
      if (online) {
        // الموقع مطلوب للاتصال: بدونه يصير الفنّي مرشّحاً بإحداثيات بائتة.
        // رفض الإذن يرفع خطأ `LocationError` تعرضه الشاشة كما هو.
        const reading = await readCurrentPosition();
        coords = { latitude: reading.latitude, longitude: reading.longitude };
      }

      const result = await providerApi.setPresence({ online, ...coords });
      applyHome({ ...homeRef.current, online: result.online });
      setProvider((current) => (current ? { ...current, status: result.status } : current));
      return result.online;
    },
    [applyHome],
  );

  // ------------------------------------------------------------
  //  أفعال الطلب — كلها تمرّ بالخادم ثم تخزّن ما ردّ به
  // ------------------------------------------------------------

  const setActiveRequest = useCallback(
    (request) => {
      const merged = applyHome({ ...homeRef.current, activeRequest: request });
      onActiveRequestChanged?.(request);
      return merged.activeRequest;
    },
    [applyHome, onActiveRequestChanged],
  );

  const runRequestAction = useCallback(
    async (action, orderId, ...args) => {
      const updated = await action(orderId, ...args);
      setActiveRequest(updated);
      return updated;
    },
    [setActiveRequest],
  );

  const acceptRequest = useCallback(
    async (orderId) => {
      const accepted = await providerApi.acceptRequest(orderId);
      applyHome({ ...homeRef.current, activeRequest: accepted, incomingRequest: null });
      onActiveRequestChanged?.(accepted);
      return accepted;
    },
    [applyHome, onActiveRequestChanged],
  );

  const rejectRequest = useCallback(
    async (orderId, reason) => {
      await providerApi.rejectRequest(orderId, reason);
      applyHome({ ...homeRef.current, incomingRequest: null });
    },
    [applyHome],
  );

  const expireRequest = useCallback(
    async (orderId) => {
      // فشل الإبلاغ لا يُعرض: الخادم يمسح المهل دورياً على أي حال، والرسالة
      // هنا كانت ستُقرأ كخطأ من الفنّي وهو لم يفعل شيئاً.
      await providerApi.expireRequest(orderId).catch(() => {});
      applyHome({ ...homeRef.current, incomingRequest: null });
    },
    [applyHome],
  );

  const requestActions = useMemo(
    () => ({
      acceptRequest,
      rejectRequest,
      expireRequest,
      startEnRoute: (orderId) => runRequestAction(providerApi.startEnRoute, orderId),
      markArrived: (orderId) => runRequestAction(providerApi.markArrived, orderId),
      startService: (orderId) => runRequestAction(providerApi.startService, orderId),
      completeService: (orderId, notes) =>
        runRequestAction(providerApi.completeService, orderId, notes),
    }),
    [acceptRequest, rejectRequest, expireRequest, runRequestAction],
  );

  // ------------------------------------------------------------
  //  البثّ اللحظي
  // ------------------------------------------------------------

  useEffect(() => {
    if (!provider) return undefined;
    let cancelled = false;

    (async () => {
      const socket = await createProviderSocket();
      if (cancelled || !socket) {
        closeSocket(socket);
        return;
      }
      socketRef.current = socket;

      socket.on(ProviderEvents.REQUEST_NEW, ({ request }) => {
        if (!request) return;
        applyHome({ ...homeRef.current, incomingRequest: request });
        onIncomingRequest?.(request);
      });

      socket.on(ProviderEvents.REQUEST_CLOSED, ({ orderId, reason }) => {
        const current = homeRef.current.incomingRequest;
        if (current?.id !== orderId) return;
        applyHome({ ...homeRef.current, incomingRequest: null });
        onRequestClosed?.({ orderId, reason });
      });

      // تغيّر جاء من الطرف الآخر: العميل ألغى، أو أكّد الإتمام، أو تدخّلت
      // الإدارة. نعيد قراءة الرئيسية بدل تخمين الحالة الجديدة محلياً.
      socket.on(ProviderEvents.REQUEST_STATUS, ({ orderId, status }) => {
        if (homeRef.current.activeRequest?.id !== orderId) return;
        loadHome().catch(() => {});
        onActiveRequestChanged?.({ ...homeRef.current.activeRequest, status }, { remote: true });
      });
    })();

    (async () => {
      const socket = await createNotificationsSocket();
      if (cancelled || !socket) {
        closeSocket(socket);
        return;
      }
      notificationsSocketRef.current = socket;
      socket.on("unread_count", ({ count }) =>
        applyHome({ ...homeRef.current, unreadNotifications: Number(count) || 0 }),
      );
    })();

    return () => {
      cancelled = true;
      closeSocket(socketRef.current);
      closeSocket(notificationsSocketRef.current);
      socketRef.current = null;
      notificationsSocketRef.current = null;
    };
  }, [provider, applyHome, loadHome, onIncomingRequest, onRequestClosed, onActiveRequestChanged]);

  // ------------------------------------------------------------
  //  الإشعارات المدفوعة
  // ------------------------------------------------------------

  useEffect(() => {
    if (!provider) return undefined;
    clearBadge();

    return listenToPush({
      // ضغط الإشعار وهاتفه مقفل: يجب أن يفتح على الطلب مباشرةً. نقرأ الرئيسية
      // لأن حمولة الإشعار مختصرة (معرّفات فقط) والمهلة قد تكون تقلّصت.
      onOpen: async (data) => {
        if (data?.event !== "provider_app.new_request") return;
        const fresh = await loadHome().catch(() => null);
        if (fresh?.incomingRequest) onIncomingRequest?.(fresh.incomingRequest);
      },
    });
  }, [provider, loadHome, onIncomingRequest]);

  // ------------------------------------------------------------
  //  نبضة الموقع
  // ------------------------------------------------------------

  useEffect(() => {
    if (!provider) return undefined;

    const shouldTrack = home.online || !!home.activeRequest;
    if (!shouldTrack) {
      stopWatchRef.current?.();
      stopWatchRef.current = null;
      return undefined;
    }
    if (stopWatchRef.current) return undefined; // مراقبة قائمة — لا نضاعفها

    let cancelled = false;
    (async () => {
      if (!(await hasLocationPermission())) return;

      const stop = await watchPosition(
        (reading) => {
          const active = activeRequestRef.current;
          providerApi
            .pushLocation({
              ...reading,
              // معرّف الطلب يُرفق فقط حين يكون التتبّع مفيداً للعميل: بعد
              // «وصلت» لم يعد هناك ما يُتتبّع، وإرساله كان يُرفض بـ 400.
              orderId: active && needsLocationTracking(active.status) ? active.id : undefined,
            })
            .catch(() => {});
        },
        { intervalSeconds: homeRef.current.locationIntervalSeconds },
      ).catch(() => null);

      if (cancelled) stop?.();
      else stopWatchRef.current = stop;
    })();

    return () => {
      cancelled = true;
    };
  }, [provider, home.online, home.activeRequest]);

  // إيقاف المراقبة نهائياً عند تفكيك المزوّد — تسريب المراقبة يستنزف البطارية
  useEffect(
    () => () => {
      stopWatchRef.current?.();
      stopWatchRef.current = null;
    },
    [],
  );

  // ------------------------------------------------------------
  //  العودة من الخلفية
  // ------------------------------------------------------------

  useEffect(() => {
    if (!provider) return undefined;

    // التطبيق كان في الخلفية دقائق: العرض الذي كان معروضاً ربّما انتهت مهلته،
    // والطلب النشِط ربّما أُلغي. نعيد القراءة بدل عرض لقطة قديمة.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        clearBadge();
        loadHome().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [provider, loadHome]);

  const value = useMemo(
    () => ({
      booting,
      provider,
      isAuthenticated: !!provider,
      error,
      clearError: () => setError(""),

      online: home.online,
      activeRequest: home.activeRequest,
      incomingRequest: home.incomingRequest,
      todayCount: home.todayCount,
      unreadNotifications: home.unreadNotifications,
      offerWindowSeconds: home.offerWindowSeconds,

      signIn,
      signOut,
      setOnline,
      refreshHome: loadHome,
      setActiveRequest,
      setUnreadCount: (count) => applyHome({ ...homeRef.current, unreadNotifications: count }),
      ...requestActions,
    }),
    [
      booting,
      provider,
      error,
      home,
      signIn,
      signOut,
      setOnline,
      loadHome,
      setActiveRequest,
      applyHome,
      requestActions,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
