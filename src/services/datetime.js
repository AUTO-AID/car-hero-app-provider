// ============================================================
//  datetime — عرض التواريخ والمُدد
//
//  التطبيق كلّه عربي بأرقام عربية (انظر `money.formatNumber`)، فالتواريخ
//  اللاتينية وسطه تبدو سهواً. التنسيق هنا في مكان واحد: كل شاشة كانت ستكتب
//  خيارات `Intl` بنفسها، وأول اختلاف بينها يجعل الطلب يظهر بتاريخين.
// ============================================================

const LOCALE = "ar-SY";
const TIME_ZONE = "Asia/Damascus";

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** «١٩ آب ٢٠٢٦» */
export function formatDate(value) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

/** «٢:١٤ م» */
export function formatTime(value) {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
}

/**
 * «اليوم ٢:١٤ م» / «أمس ٤:٤٠ م» / «١٧ آب ٢٠٢٦».
 * اليوم والأمس بالكلمة لا بالتاريخ: هما ما يبحث عنه الفنّي أولاً، وقراءة
 * تاريخ كامل لتمييز طلب قبل ساعة عمل ذهني لا داعي له.
 */
export function formatDateTimeLabel(value) {
  const date = toDate(value);
  if (!date) return "—";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

  if (date >= startOfToday) return `اليوم ${formatTime(date)}`;
  if (date >= startOfYesterday) return `أمس ${formatTime(date)}`;
  return formatDate(date);
}

/** «قبل ٣ دقائق» — للطلب الوارد وحالة «قُبل للتوّ» */
export function formatRelative(value) {
  const date = toDate(value);
  if (!date) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "الآن";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `قبل ${arabicNumber(minutes)} دقيقة`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${arabicNumber(hours)} ساعة`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${arabicNumber(days)} يوم`;
  return formatDate(date);
}

/** «٠٠:٢٤:١٠» — عدّاد مدّة التنفيذ */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** الثواني المنقضية منذ لحظة ما — مبدأ عدّاد شاشة «قيد التنفيذ» */
export function secondsSince(value) {
  const date = toDate(value);
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
}

export const arabicNumber = (value) => Number(value || 0).toLocaleString("ar-EG");
