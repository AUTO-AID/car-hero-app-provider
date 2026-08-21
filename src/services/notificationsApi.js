// ============================================================
//  notificationsApi — التنبيهات (نفس مسارات تطبيق العميل)
//
//  الخادم يخزّن إشعارات الفنّي على معرّف المستخدم أو على معرّف وثيقة الفنّي
//  حسب أصلها، ويغطّي `NotificationScope` الاثنين معاً — فلا حاجة لمسار خاص
//  بالفنّي هنا.
// ============================================================
import { api } from "./api";

/** GET /notifications → { notifications, total, pagination } */
export async function fetchNotifications({ page = 1, limit = 30 } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await api.get(`/notifications?${query.toString()}`, { auth: true });
  return {
    notifications: res?.notifications ?? [],
    total: res?.total ?? 0,
    pagination: res?.pagination ?? null,
  };
}

export async function fetchUnreadCount() {
  const res = await api.get("/notifications/unread-count", { auth: true });
  return Number(res?.count ?? 0);
}

export function markNotificationRead(id) {
  return api.patch(`/notifications/${id}/read`, {}, { auth: true });
}

export function markAllNotificationsRead() {
  return api.patch("/notifications/read-all", {}, { auth: true });
}
