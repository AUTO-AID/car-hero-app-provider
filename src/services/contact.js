// ============================================================
//  contact — الاتصال بالعميل ومراسلته
//
//  أزرار الاتصال والمراسلة كانت `onPress={() => {}}`: تنكمش عند اللمس وتهتزّ
//  ثم لا يحدث شيء — وهو أسوأ من زرّ معطّل ظاهرياً، لأن الفنّي يظنّ أن الاتصال
//  جارٍ فينتظر. المنطق هنا لا في الشاشات كي يبقى تنقية الرقم قراراً واحداً.
//
//  النقل نفسه المستعمل في تطبيق العميل (`OrderTrackingScreen` ·
//  `ProviderFoundScreen` · `ChatScreen`): `Linking.openURL("tel:")`.
// ============================================================

import { Linking } from "react-native";

// الرقم يصل من الخادم بمسافات وأقواس وشرطات، و`tel:` لا يفهم منها شيئاً.
// نفس التنقية الحرفية في تطبيق العميل، فلا يتباعد التطبيقان في أول رقم شاذّ.
const sanitize = (phone) => String(phone || "").replace(/[^+\d]/g, "");

// تُرجع false حين لا رقم: الشاشة تخفي الزرّ بدل أن تعرضه صامتاً.
export const canContact = (phone) => sanitize(phone).length > 0;

export const callNumber = (phone) => {
  const number = sanitize(phone);
  if (!number) return false;
  // `catch` صامت: الفشل الوحيد المتوقّع هو جهاز بلا تطبيق اتصال (الويب،
  // المحاكي)، وإظهار خطأ هناك ضجيج لا معلومة.
  Linking.openURL(`tel:${number}`).catch(() => {});
  return true;
};

// مؤقّتاً رسالة نصّية: تطبيق العميل يراسل عبر محادثة داخلية (`chatApi` +
// `ChatScreen`)، ولا نظير لها هنا بعد. عند نقلها يُستبدل جسم هذه الدالة
// وحدها بـ`navigation.navigate("Chat")` ولا تُلمس الشاشات الثلاث.
export const messageNumber = (phone) => {
  const number = sanitize(phone);
  if (!number) return false;
  Linking.openURL(`sms:${number}`).catch(() => {});
  return true;
};
