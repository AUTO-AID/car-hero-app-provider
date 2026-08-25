// ============================================================
//  serviceIcon — أيقونة الخدمة، قراراً واحداً لكل التطبيق
//
//  كان هذا الملف يخمّن الأيقونة من **اسم** الخدمة وحده بأربع وعشرين قاعدة،
//  لأن حمولة الطلب لم تكن تحمل الفئة أصلاً. وتطبيق العميل يقرؤها من الفئة —
//  فظهر الطلب الواحد برمزين مختلفين على الشاشتين لنفس الخدمة.
//
//  الخادم صار يرسل `serviceCategory` في حمولة طلب الفنّي، فالمطابقة هنا
//  بالفئة أولاً (قائمة مغلقة لا لبس فيها) ثم بالاسم حين تغيب — وهي تغيب في
//  الطلبات القديمة وفي خدمات يكتبها المزوّد بنفسه.
//
//  نظيره في تطبيق العميل: `newapp2/carApp/src/components/serviceIcon.js`
//  — الجدولان متطابقان عمداً كي لا يرى العميل رمزاً ويرى الفنّي غيره لنفس الطلب.
// ============================================================

import { Wrench } from "phosphor-react-native";
import { catalogEntry } from "../services/serviceCatalog";

/**
 * تطبيع النصّ العربي قبل المطابقة: «إطار» و«اطار» و«أطار» كتاباتٌ ثلاث لخدمة
 * واحدة، وبلا توحيدها كنّا نحتاج كل صيغة في كل نمط — وأوّل صيغة تُنسى تُسقط
 * الخدمة إلى الأيقونة الافتراضية بلا سبب ظاهر.
 */
function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىئ]/g, "ي")
    .replace(/ؤ/g, "و");
}

/**
 * الاسم ← فئة من الكتالوج. الترتيب مقصود: الأخصّ أوّلاً، لأن أول قاعدة مطابِقة
 * هي التي تفوز — «غسيل محرك» يحوي «غسيل» و«محرك» معاً، و«شحن بطارية» يحوي
 * «شحن» و«بطار».
 */
const RULES = [
  [/\btow(ing)?\b|winch|سحب|قطر|ونش|جر مركب/, "towing"],
  [/batter|jump.?start|jump.?pack|boost|بطار|شحن كهرب|تشغيل المحرك/, "battery"],
  [/tire|tyre|wheel|puncture|flat|اطار|كفر|بنشر|عجل|دولاب/, "tire"],
  [/fuel|petrol|diesel|gasoline|وقود|بنزين|مازوت|ديزل|تعبئ/, "fuel"],
  [/lock|unlock|keys?\b|locksmith|فتح قفل|مفتاح|مفاتيح|قفل|اقفال/, "lockout"],
  [/polish|wax|detail|wash|clean|shampoo|غسيل|تنظيف|شامبو|تلميع|بوليش/, "car_wash"],
  [/oil|lubric|filter|زيت|شحوم|فلتر|مصفا/, "oil"],
  [/engine|motor\b|overheat|smoke|محرك|مكنه|بلوك|تسخين|دخان/, "engine"],
  [/breakdown|accident|emergency|rescue|first.?aid|diagnos|scan|repair|طوارئ|حادث|اسعاف|انقاذ|عطل|تعطل|فحص|تشخيص|تصليح|اصلاح|صيانه/, "breakdown"],
];

/**
 * يقبل نصّاً، أو كائن خدمة/طلب. **لا يُرجع `undefined` أبداً**: القيمة تُمرَّر
 * مباشرةً كوسم JSX، و`undefined` هناك يرمي «Element type is invalid» فتنهار
 * الشاشة كلها إلى بياض.
 */
export function iconForService(input) {
  const source = typeof input === "string" ? { serviceName: input } : input || {};
  const category =
    source.category ?? source.serviceCategory ?? source.metadata?.category ?? source.service?.category;

  const byCategory = catalogEntry(category);
  if (byCategory) return byCategory.icon;

  const key = normalize(
    [source.serviceName, source.nameAr, source.name, source.service?.name, category]
      .filter(Boolean)
      .join(" "),
  );
  for (const [pattern, id] of RULES) {
    if (pattern.test(key)) return catalogEntry(id).icon;
  }
  return Wrench;
}

export default iconForService;
