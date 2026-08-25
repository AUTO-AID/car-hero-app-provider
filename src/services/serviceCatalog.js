// ============================================================
//  serviceCatalog — الخدمات التسع، تعريفاً واحداً لتطبيق الفنّي
//
//  الكتالوج مغلق: تسع فئات لا غير، هي نفسها في الخادم وفي الموقع التعريفي
//  وفي لوحتي الأدمن والمزوّد وفي تطبيق الفنّي. الفئة هي **هوية الخدمة**، ومنها
//  يُشتقّ الاسم العربي والأيقونة واللون — فلا تُكتب أي من الثلاثة في شاشة.
//
//  قبل هذا الملف لم يكن لتطبيق الفنّي كتالوج أصلاً: كان `serviceIcon.js` يخمّن
//  الأيقونة من اسم الخدمة بأربع وعشرين قاعدة، ولا اسم عربي موحّداً ولا ألوان.
//
//  النظير في تطبيق العميل: `newapp2/carApp/src/services/serviceCatalog.js`
//  — الجدولان متطابقان عمداً كي لا يرى العميل خدمة ويرى الفنّي غيرها لنفس الطلب.
// ============================================================

import {
  CarBattery,
  Drop,
  Engine,
  GasPump,
  Key,
  SprayBottle,
  Tire,
  Truck,
  Warning,
} from "phosphor-react-native";

/** بترتيب العرض. `id` هو `category` في الخادم حرفياً. */
export const SERVICE_CATALOG = [
  { id: "towing", label: "خدمة السحب", icon: Truck, color: "#2563EB", emergency: true },
  { id: "battery", label: "تشغيل البطارية", icon: CarBattery, color: "#7C3AED", emergency: true },
  { id: "tire", label: "تغيير الإطار", icon: Tire, color: "#E11D48", emergency: true },
  { id: "fuel", label: "توصيل الوقود", icon: GasPump, color: "#F59E0B", emergency: true },
  { id: "lockout", label: "فتح الأقفال", icon: Key, color: "#0891B2", emergency: true },
  { id: "oil", label: "تغيير الزيت", icon: Drop, color: "#059669", emergency: false },
  { id: "breakdown", label: "أعطال مفاجئة", icon: Warning, color: "#EA580C", emergency: true },
  { id: "engine", label: "مشاكل المحرك", icon: Engine, color: "#DC2626", emergency: true },
  { id: "car_wash", label: "غسيل السيارة", icon: SprayBottle, color: "#0284C7", emergency: false },
];

export const SERVICE_IDS = SERVICE_CATALOG.map((service) => service.id);

const BY_ID = Object.fromEntries(SERVICE_CATALOG.map((service) => [service.id, service]));

/**
 * فئات متقاعدة ما زالت في وثائق قديمة على الخادم.
 *
 * الخادم لا يكتبها بعد الآن لكنه يقرؤها، فلا بدّ للتطبيق أن يعرف أين يعرضها:
 * بدونها كان الطلب القديم يظهر بتصنيف خام («maintenance») وأيقونة افتراضية.
 */
const LEGACY_ALIAS = {
  maintenance: "oil",
  roadside_assistance: "breakdown",
  emergency: "breakdown",
  other: "breakdown",
  mechanic: "breakdown",
  electrical: "battery",
  brakes: "breakdown",
  ac: "engine",
};

/** إدخال الكتالوج لأي فئة مخزّنة، أو `undefined` إن كانت مجهولة تماماً. */
export function catalogEntry(category) {
  if (!category) return undefined;
  return BY_ID[category] || BY_ID[LEGACY_ALIAS[category]];
}

/** اسم عربي للفئة، مع تراجع مقروء لأي فئة غير معروفة. */
export function categoryLabel(category) {
  if (!category) return "";
  return catalogEntry(category)?.label || String(category).replace(/_/g, " ");
}

/** لون التمييز — يُستعمل في الشرائح والبطاقات؛ رماديّ محايد للمجهول. */
export function categoryColor(category) {
  return catalogEntry(category)?.color || "#64748B";
}
