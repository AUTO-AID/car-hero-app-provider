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
 * الخادم يردّ `{ success, messages, pagination }`، وقد يلفّها في `data` حسب
 * المسار. نقرأ الأشكال الثلاثة كما يفعل تطبيق العميل حرفياً.
 */
export async function fetchMessages(chatId, { page = 1, limit = 20 } = {}) {
  const res = await api.get(`/chat/${chatId}/messages?page=${page}&limit=${limit}`, { auth: true });
  return {
    messages: res?.messages ?? res?.data?.messages ?? res?.data ?? (Array.isArray(res) ? res : []),
    pagination: res?.pagination ?? res?.meta ?? null,
  };
}
