// ============================================================
//  chatApi — محادثة الطلب بين الفنّي والعميل
//
//  عقد الخادم نفسه الذي يستعمله تطبيق العميل (`@Controller('chat')`)، فلا
//  يتباعد الطرفان عند أول تعديل: الرسالة التي يرسلها العميل يجب أن يقرأها
//  الفنّي في المحادثة نفسها، لا في محادثة موازية أنشأها ترتيبٌ مختلف
//  للمشاركين.
//
//  `getOrCreateChat(userId, participantId, orderId)` على الخادم يبحث عن
//  محادثة الطلب أولاً، فالفتح من أي طرف يصل إلى الوثيقة ذاتها.
// ============================================================

import { api } from "./api";

/**
 * يفتح محادثة الطلب أو يُرجع القائمة منها.
 * `participantId` هنا هو **حساب العميل** (لا معرّف الطلب).
 */
export function startConversation({ participantId, orderId }) {
  return api.post("/chat/conversations", { participantId, orderId }, { auth: true });
}

export function fetchConversations() {
  return api.get("/chat/conversations", { auth: true });
}

/**
 * الخادم يرتّب `{ createdAt: -1 }` — الأحدث أولاً، وهو الصحيح للترقيم
 * بالصفحات. لكنّ الشاشة ترسم المصفوفة من أعلى إلى أسفل وتُلحق الرسائل
 * اللحظية بذيلها، فكان التاريخ يُقرأ مقلوباً وتستقرّ الرسالة الجديدة **تحت
 * أقدم** رسالة: `3 | 2 | 1 | 4` بدل `1 | 2 | 3 | 4`.
 *
 * القلب عند حدود الشبكة لا في الخادم، وبفرزٍ صريح لا `reverse()` ليبقى
 * صحيحاً لو تغيّر ترتيب الخادم. `_id` فاصلٌ عند تساوي المللي ثانية.
 * نسخة مطابقة لما في تطبيق العميل — العقد واحد فلا يتباعد الطرفان.
 */
export function orderMessages(list) {
  if (!Array.isArray(list)) return [];
  const at = (m) => new Date(m?.createdAt ?? m?.sentAt ?? 0).getTime() || 0;
  const key = (m) => String(m?._id ?? m?.id ?? "");
  return list.slice().sort((a, b) => at(a) - at(b) || key(a).localeCompare(key(b)));
}

/**
 * الخادم يردّ `{ success, messages, pagination }`، وقد يلفّها في `data` حسب
 * المسار. نقرأ الأشكال الثلاثة كما يفعل تطبيق العميل حرفياً.
 */
export async function fetchMessages(chatId, { page = 1, limit = 20 } = {}) {
  const res = await api.get(`/chat/${chatId}/messages?page=${page}&limit=${limit}`, { auth: true });
  const messages = res?.messages ?? res?.data?.messages ?? res?.data ?? (Array.isArray(res) ? res : []);
  return {
    messages: orderMessages(messages),
    pagination: res?.pagination ?? res?.meta ?? null,
  };
}
