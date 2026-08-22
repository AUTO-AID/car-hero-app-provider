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

/** أقصى عمر مقبول لموقع محفوظ نبدأ به — دقيقتان */
const LAST_KNOWN_MAX_AGE_MS = 120_000;
/** سقف انتظار القراءة الطازجة قبل الاستسلام */
const FRESH_FIX_TIMEOUT_MS = 8_000;

/**
 * قراءة واحدة — تُستعمل عند «تشغيل الاتصال» وعند فتح شاشة التوجيه.
 *
 * **آخر موقع معروف أولاً.** القراءة الطازجة تحتاج تثبيتاً من الأقمار يستغرق
 * ٥–١٥ ثانية داخل المباني، وكان الفنّي يضغط «تشغيل الاتصال» فيجمد الزرّ طوال
 * تلك المدّة بلا تفسير. الموقع المحفوظ يصل فوراً ويكفي تماماً لاختيار
 * المرشّحين (دقّته عشرات الأمتار، والنطاق عشرة كيلومترات)، ثم تصحّحه
 * `watchPosition` خلال ثوانٍ من تشغيل الاتصال.
 *
 * `high: true` يتخطّى المحفوظ ويطلب الطازج — تستعمله الشاشات التي تحتاج دقّة
 * فعلية لا تقديراً.
 */
export async function readCurrentPosition({ high = false } = {}) {
  await requestLocationPermission();

  if (!high) {
    try {
      const cached = await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
      });
      if (cached?.coords) return toReading(cached);
    } catch {
      // لا موقع محفوظ — نكمل إلى القراءة الطازجة
    }
  }

  try {
    // سباق مع مؤقّت: `getCurrentPositionAsync` قد لا تعود أبداً حين يتعذّر
    // التثبيت (قبو، وضع طيران)، فتُبقي الزرّ معلّقاً إلى ما لا نهاية.
    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: high ? Location.Accuracy.High : Location.Accuracy.Balanced,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new LocationError(LocationErrors.UNAVAILABLE, MESSAGES[LocationErrors.UNAVAILABLE])),
          FRESH_FIX_TIMEOUT_MS,
        ),
      ),
    ]);
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
