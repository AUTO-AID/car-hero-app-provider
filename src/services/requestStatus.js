// ============================================================
//  requestStatus — حالة الطلب: نصّها ونغمتها والخطوة التالية
//
//  نظير `orderStatus.js` عند تطبيق العميل، ومطابق لـ `OrderStatus` في الخادم
//  حرفاً بحرف. خريطة الألوان كانت مكرّرة في «طلباتي» وفي شاشة السجلّ، فاختلف
//  لون «ملغى» بين شاشة وأخرى — والحالة التي تتغيّر بتغيّر الشاشة لا يُوثق بها.
//
//  النغمة تُمرَّر إلى `StatusPill` التي تقرن اللون بنصّ وبنقطة، فلا تُنقل
//  الحالة باللون وحده.
// ============================================================

export const OrderStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  PROVIDER_ASSIGNED: "provider_assigned",
  PROVIDER_EN_ROUTE: "provider_en_route",
  PROVIDER_ARRIVED: "provider_arrived",
  IN_PROGRESS: "in_progress",
  AWAITING_CUSTOMER_CONFIRMATION: "awaiting_customer_confirmation",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

// النصّ من زاوية **الفنّي** لا من زاوية النظام: «accepted» عند الخادم تعني
// للفنّي «مقبول — ابدأ التوجّه»، و«awaiting_customer_confirmation» تعني
// «أنهيتها وتنتظر تأكيده» لا «بانتظار تأكيدك».
const META = {
  [OrderStatus.PENDING]: { label: "بانتظار ردّك", tone: "warning" },
  [OrderStatus.ACCEPTED]: { label: "مقبول", tone: "info" },
  [OrderStatus.PROVIDER_ASSIGNED]: { label: "مُسند إليك", tone: "info" },
  [OrderStatus.PROVIDER_EN_ROUTE]: { label: "في الطريق", tone: "info" },
  [OrderStatus.PROVIDER_ARRIVED]: { label: "وصلت الموقع", tone: "info" },
  [OrderStatus.IN_PROGRESS]: { label: "قيد التنفيذ", tone: "info" },
  [OrderStatus.AWAITING_CUSTOMER_CONFIRMATION]: { label: "بانتظار تأكيد العميل", tone: "warning" },
  [OrderStatus.COMPLETED]: { label: "مكتمل", tone: "success" },
  [OrderStatus.CANCELLED]: { label: "ملغى", tone: "danger" },
  [OrderStatus.REJECTED]: { label: "مرفوض", tone: "danger" },
};

const UNKNOWN = { label: "غير معروفة", tone: "neutral" };

export const statusMeta = (status) => META[status] || UNKNOWN;

export const statusLabel = (status) => statusMeta(status).label;

export const isCanceled = (status) =>
  status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED;

export const isCompleted = (status) => status === OrderStatus.COMPLETED;

const ACTIVE = [
  OrderStatus.ACCEPTED,
  OrderStatus.PROVIDER_ASSIGNED,
  OrderStatus.PROVIDER_EN_ROUTE,
  OrderStatus.PROVIDER_ARRIVED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.AWAITING_CUSTOMER_CONFIRMATION,
];

export const isActive = (status) => ACTIVE.includes(status);

/**
 * الشاشة التي تخصّ الحالة الحالية.
 *
 * هذه هي القاعدة التي تحكم كل استئناف: التطبيق يُفتح، يقرأ حالة الطلب النشِط
 * من الخادم، ويقفز إلى شاشتها — بدل أن يفترض أن الفنّي ما يزال حيث تركه.
 * الخادم مصدر الحقيقة، والشاشة تُشتقّ منه لا العكس.
 */
export function screenForStatus(status) {
  switch (status) {
    case OrderStatus.PENDING:
      return "NewRequest";
    case OrderStatus.ACCEPTED:
    case OrderStatus.PROVIDER_ASSIGNED:
      return "RequestDetails";
    case OrderStatus.PROVIDER_EN_ROUTE:
      return "EnRoute";
    case OrderStatus.PROVIDER_ARRIVED:
      return "Arrived";
    case OrderStatus.IN_PROGRESS:
      return "InService";
    case OrderStatus.AWAITING_CUSTOMER_CONFIRMATION:
    case OrderStatus.COMPLETED:
      return "Completed";
    default:
      return "Home";
  }
}

/**
 * الشاشة التي يفتحها طلب من القائمة.
 *
 * تختلف عن `screenForStatus` في حالة واحدة تحسم كل شيء: الحجز المجدول قبل
 * موعده حالته `pending` أيضاً، لكنه ليس عرضاً بمهلة — فتحه على شاشة العدّاد
 * يعرض عدّاداً يدور على موعدٍ بعد ثلاثة أيام. مكانه شاشة التفاصيل.
 */
export function screenForRequest(request) {
  if (!request) return "Home";
  if (request.isUpcomingBooking) return "RequestDetails";
  if (!request.isActive) return "PastRequest";
  return screenForStatus(request.status);
}

/** هل يحتاج هذا الطلب إرسال نبضات موقع؟ */
export const needsLocationTracking = (status) =>
  [OrderStatus.ACCEPTED, OrderStatus.PROVIDER_ASSIGNED, OrderStatus.PROVIDER_EN_ROUTE].includes(status);
