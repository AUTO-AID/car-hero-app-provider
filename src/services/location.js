// ============================================================
//  location — إذن الموقع وقراءته ونبضته
//
//  قاعدة الخصوصية التي يفرضها هذا الملف: **لا يُقرأ الموقع إلا عند الحاجة**
//  — أي حين يكون الفنّي متصلاً أو لديه طلب نشِط. تتبّع فنّي مغلق تطبيقه ليس
//  ميزة، وهو أول ما يُحرق ثقة المستخدم وبطاريته معاً.
// ============================================================
import * as Location from "expo-location";

export const LocationErrors = {
  DENIED: "denied",
  DISABLED: "disabled",
  UNAVAILABLE: "unavailable",
};

export class LocationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "LocationError";
    this.code = code;
  }
}

const MESSAGES = {
  [LocationErrors.DENIED]: "نحتاج إذن الوصول للموقع لاستقبال الطلبات القريبة منك.",
  [LocationErrors.DISABLED]: "خدمة الموقع مغلقة في جهازك. فعّلها ثم حاول مجدداً.",
  [LocationErrors.UNAVAILABLE]: "تعذّر تحديد موقعك الآن. حاول مجدداً بعد قليل.",
};

export const locationMessage = (code) => MESSAGES[code] || MESSAGES[LocationErrors.UNAVAILABLE];

/** هل الإذن ممنوح أصلاً؟ للقراءة فقط — لا يفتح أي نافذة نظام */
export async function hasLocationPermission() {
  try {
    const { granted } = await Location.getForegroundPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/**
 * طلب الإذن. يميّز الرفض الدائم عن المؤقّت: الأول لا يُصلَح بإعادة السؤال
 * (النظام لا يعرض النافذة ثانيةً) بل بفتح إعدادات التطبيق، وإعادة السؤال في
 * وجهه تُقرأ كعطل.
 */
export async function requestLocationPermission() {
  const enabled = await Location.hasServicesEnabledAsync().catch(() => true);
  if (!enabled) throw new LocationError(LocationErrors.DISABLED, MESSAGES[LocationErrors.DISABLED]);

  const { granted, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (!granted) {
    throw new LocationError(
      LocationErrors.DENIED,
      canAskAgain
        ? MESSAGES[LocationErrors.DENIED]
        : "إذن الموقع مرفوض. فعّله من إعدادات التطبيق لاستقبال الطلبات.",
    );
  }
  return true;
}

/** قراءة واحدة — تُستعمل عند «تشغيل الاتصال» وعند فتح شاشة التوجيه */
export async function readCurrentPosition({ high = false } = {}) {
  await requestLocationPermission();
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: high ? Location.Accuracy.High : Location.Accuracy.Balanced,
    });
    return toReading(position);
  } catch (error) {
    if (error instanceof LocationError) throw error;
    throw new LocationError(LocationErrors.UNAVAILABLE, MESSAGES[LocationErrors.UNAVAILABLE]);
  }
}

function toReading(position) {
  return {
    latitude: position?.coords?.latitude,
    longitude: position?.coords?.longitude,
    accuracy: numberOrUndefined(position?.coords?.accuracy),
    // الاتجاه والسرعة يصلان سالبَين حين لا يعرفهما الجهاز، والخادم يرفض
    // السالب — فنُسقطهما بدل إفشال النبضة كلها.
    heading: positiveOrUndefined(position?.coords?.heading),
    speed: positiveOrUndefined(position?.coords?.speed),
  };
}

const numberOrUndefined = (value) => (Number.isFinite(value) && value >= 0 ? value : undefined);
const positiveOrUndefined = (value) => (Number.isFinite(value) && value >= 0 ? value : undefined);

/**
 * مراقبة مستمرّة أثناء الطلب النشِط. تُرجع دالة إيقاف — استدعاؤها في تنظيف
 * `useEffect` هو ما يمنع بقاء المراقبة حيّة بعد إغلاق الشاشة (وهو أسرع طريق
 * لاستنزاف البطارية وإرسال مواقع لطلب انتهى).
 */
export async function watchPosition(onReading, { intervalSeconds = 15, distanceMeters = 25 } = {}) {
  await requestLocationPermission();

  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: Math.max(5, intervalSeconds) * 1000,
      distanceInterval: distanceMeters,
    },
    (position) => onReading(toReading(position)),
  );

  return () => {
    try {
      subscription?.remove?.();
    } catch {
      // اشتراك أُزيل سلفاً
    }
  };
}
