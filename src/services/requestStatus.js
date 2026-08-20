// ============================================================
//  requestStatus — حالة الطلب: نصّها ونغمتها
//
//  نظير `orderStatus.js` عند تطبيق العميل. خريطة الألوان كانت مكرّرة في
//  «طلباتي» وفي شاشة السجلّ، فاختلف لون «ملغى» بين شاشة وأخرى — والحالة
//  التي تتغيّر بتغيّر الشاشة لا يُوثق بها.
//
//  النغمة تُمرَّر إلى `StatusPill` التي تقرن اللون بنصّ وبنقطة، فلا تُنقل
//  الحالة باللون وحده.
// ============================================================

const META = {
  active: { label: "في الطريق", tone: "info" },
  done: { label: "مكتمل", tone: "success" },
  canceled: { label: "ملغى", tone: "danger" },
};

export const statusMeta = (status) => META[status] || META.done;

export const isCanceled = (status) => status === "canceled";
