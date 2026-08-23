// ============================================================
//  contact — الاتصال بالعميل ومراسلته
//
//  أزرار الاتصال والمراسلة كانت `onPress={() => {}}`: تنكمش عند اللمس وتهتزّ
//  ثم لا يحدث شيء — وهو أسوأ من زرّ معطّل ظاهرياً، لأن الفنّي يظنّ أن الاتصال
//  جارٍ فينتظر. المنطق هنا لا في الشاشات كي يبقى تنقية الرقم قراراً واحداً.
//
//  النقل نفسه المستعمل في تطبيق العميل (`OrderTrackingScreen` ·
//  `ProviderFoundScreen` · `ChatScreen`): `Linking.openURL("tel:")`.
//
//  أمّا المراسلة فداخل التطبيق الآن (`screens/Order/ChatScreen`) لا عبر
//  `sms:`. الرسالة النصّية كانت تخرج من المنصّة كلّها: العميل يكتب في
//  محادثة التطبيق ولا يقرؤها أحد، والفنّي يردّ برسالة هاتفية لا تظهر عند
//  العميل. `openChat` أدناه هو المسار الوحيد.
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

/**
 * فتح محادثة الطلب.
 *
 * المنطق هنا لا في الشاشات كي يبقى شرط الفتح قراراً واحداً: بلا معرّف عميل
 * أو معرّف طلب لا محادثة، والشاشة تُخفي الزرّ بدل أن تعرضه صامتاً — كما تفعل
 * مع `canContact`.
 */
export const canChat = (request) => !!(request?.id && request?.customer?.id);

export const openChat = (navigation, request) => {
  if (!canChat(request)) return false;
  navigation?.navigate?.("Chat", {
    orderId: request.id,
    customerId: request.customer.id,
    customerName: request.customer.name,
    customerPhone: request.customer.phone,
  });
  return true;
};
