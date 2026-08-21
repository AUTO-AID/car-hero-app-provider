// ============================================================
//  push — الإشعارات المدفوعة
//
//  أهمّ إشعار في التطبيق هو «طلب خدمة جديد»: يصل والهاتف مقفل، ومهلته عشرون
//  ثانية. لذلك: قناة أندرويد مستقلّة بأولوية قصوى وصوت، وتسجيل الرمز على
//  الخادم فور الدخول لا عند أول فتح لشاشة الإشعارات.
//
//  التسجيل يفشل بصمت في المحاكي وعلى الويب (لا رمز جهاز حقيقي هناك) — وهذا
//  متوقّع ولا يجوز أن يمنع الدخول.
// ============================================================
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { registerDeviceToken } from "./providerApi";

const REQUEST_CHANNEL = "new-requests";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(REQUEST_CHANNEL, {
    name: "طلبات الخدمة",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
}

/**
 * يطلب الإذن، ينشئ القناة، ويسجّل الرمز على الخادم.
 * يُرجع الرمز أو null — ولا يرمي أبداً: فشل الإشعارات لا يمنع العمل، والبثّ
 * اللحظي يغطّي الحالة التي يكون فيها التطبيق مفتوحاً.
 */
export async function registerForPush() {
  try {
    if (Platform.OS === "web") return null;

    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    if (!token) return null;

    await registerDeviceToken({ token, platform: Platform.OS });
    return token;
  } catch {
    return null;
  }
}

/**
 * الاستماع للإشعارات. `onOpen` هو المسار الحرج: الفنّي ضغط الإشعار وهاتفه
 * مقفل، والتطبيق يجب أن يفتح على الطلب مباشرةً لا على الرئيسية.
 */
export function listenToPush({ onReceive, onOpen }) {
  const received = onReceive
    ? Notifications.addNotificationReceivedListener((event) =>
        onReceive(event?.request?.content?.data ?? {}),
      )
    : null;

  const opened = onOpen
    ? Notifications.addNotificationResponseReceivedListener((event) =>
        onOpen(event?.notification?.request?.content?.data ?? {}),
      )
    : null;

  return () => {
    received?.remove?.();
    opened?.remove?.();
  };
}

/** الإشعار الذي فُتح به التطبيق من حالة الإغلاق التام */
export async function getInitialPushData() {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification?.request?.content?.data ?? null;
  } catch {
    return null;
  }
}

export async function clearBadge() {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // غير مدعوم على بعض الأجهزة — لا أثر وظيفي
  }
}
