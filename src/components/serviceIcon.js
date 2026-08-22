// ============================================================
//  serviceIcon — أيقونة الخدمة من اسمها
//
//  كانت كل شاشة تختار أيقونة الخدمة بيدها، فظهرت الخدمة الواحدة برمزين
//  مختلفين حسب الشاشة التي فُتحت منها. القرار هنا مرّة واحدة، بنفس منطق
//  `iconFor` في `ServiceCatalogScreen` عند تطبيق العميل — والاثنان يقرآن
//  الاسم العربي والإنجليزي معاً لأن الخادم قد يُرجع أيّهما.
//
//  `Truck` لا `TowTruck`: الأخيرة غير موجودة في phosphor، وأيقونة غائبة تصل
//  `undefined` فتُسقط الشاشة كلها إلى صفحة بيضاء بلا خطأ يشير إليها. كل
//  أيقونة في الجدول أدناه تحقّقنا من وجودها في الحزمة.
// ============================================================

import {
  ArrowsClockwise,
  CarBattery,
  Disc,
  Drop,
  Engine,
  FirstAid,
  GasPump,
  Gauge,
  Gear,
  Key,
  Lightning,
  PaintRoller,
  ShieldCheck,
  Snowflake,
  Sparkle,
  SprayBottle,
  Tire,
  Toolbox,
  Truck,
  Wrench,
} from "phosphor-react-native";

/**
 * تطبيع النصّ العربي قبل المطابقة.
 *
 * الخادم يستقبل أسماء الخدمات من الإدارة كما تُكتب، والكاتب البشري لا يوحّد
 * الهمزات: «إطار» و«اطار» و«أطار» ثلاث كتابات لخدمة واحدة. بلا تطبيع كنّا
 * نحتاج كل صيغة في كل نمط — وأول صيغة تُنسى تُسقط الخدمة إلى الأيقونة
 * الافتراضية بلا سبب ظاهر.
 */
function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // تشكيل وتطويل
    .replace(/[أإآٱ]/g, "ا") // أ إ آ ٱ ← ا
    .replace(/ة/g, "ه") // ة ← ه
    .replace(/[ىئ]/g, "ي") // ى ئ ← ي
    .replace(/ؤ/g, "و"); // ؤ ← و
}

/**
 * الترتيب مقصود: الأخصّ أوّلاً.
 *
 * «شحن بطارية» يحوي «شحن» و«بطار» معاً، و«غسيل محرك» يحوي «غسيل» و«محرك».
 * القاعدة الأولى المطابِقة هي التي تفوز، فالأخصّ يجب أن يسبق الأعمّ — وإلا
 * حملت خدمتان مختلفتان الرمز نفسه.
 */
const RULES = [
  // ---- الأعطال الميدانية (جوهر التطبيق) ----
  [/batter|jump.?pack|بطار|شحن كهرب/, CarBattery],
  [/\btow(ing)?\b|winch|سحب|قطر|ونش|جر مركب/, Truck],
  [/tire|tyre|wheel|puncture|flat|اطار|كفر|بنشر|عجل|دولاب/, Tire],
  [/fuel|petrol|diesel|gasoline|وقود|بنزين|مازوت|ديزل|تعبئ/, GasPump],
  [/lock|unlock|keys?\b|locksmith|فتح قفل|مفتاح|مفاتيح|قفل|اقفال/, Key],
  [/jump.?start|boost|تشغيل المحرك/, Lightning],

  // ---- الصيانة الدورية ----
  [/oil|lubric|زيت|شحوم/, Drop],
  [/filter|فلتر|مصفا/, ArrowsClockwise],
  [/brake|فرام|فحمات|بريك|بطان/, Disc],
  [/(^|[^a-z])a\/?c([^a-z]|$)|air.?cond|climate|cooling|تكييف|تبريد|مكيف|ريدتر|رادتر/, Snowflake],
  [/electric|wiring|alternator|كهرب|اسلاك|دينامو|مولد/, Lightning],
  [/engine|motor\b|محرك|مكنه|بلوك/, Engine],
  [/diagnos|scan|computer|فحص|تشخيص|كمبيوتر|سكانر/, Gauge],
  [/suspension|align|balanc|مساعد|ترصيص|زوايا|توازن/, Wrench],

  // ---- خدمات إضافية ----
  [/polish|wax|detail|تلميع|بوليش|تنعيم/, Sparkle],
  [/wash|clean|shampoo|غسيل|تنظيف|شامبو/, SprayBottle],
  [/paint|body.?work|dent|دهان|بويا|سمكر|صدم/, PaintRoller],
  [/insur|warrant|تامين|ضمان|كفاله/, ShieldCheck],
  [/accident|emergency|rescue|first.?aid|طوارئ|حادث|اسعاف|انقاذ/, FirstAid],

  // ---- الأعمّ في النهاية ----
  [/maintenance|periodic|صيانه|دوري|خدمه شامل/, Toolbox],
  [/mechanic|repair|ميكانيك|تصليح|اصلاح|ورشه/, Gear],
];

/**
 * يُرجع مكوّن الأيقونة — **ولا يُرجع `undefined` أبداً**: القيمة تُمرَّر مباشرةً
 * كوسم JSX، و`undefined` هناك يرمي «Element type is invalid» فتنهار الشاشة
 * كلها إلى بياض.
 */
export function iconForService(name) {
  const key = normalize(name);
  for (const [pattern, Icon] of RULES) {
    if (pattern.test(key)) return Icon;
  }
  return Wrench;
}

export default iconForService;
