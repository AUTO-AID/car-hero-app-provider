// ============================================================
//  serviceIcon — أيقونة الخدمة من اسمها
//
//  كانت كل شاشة تختار أيقونة الخدمة بيدها، فظهرت الخدمة الواحدة برمزين
//  مختلفين حسب الشاشة التي فُتحت منها. القرار هنا مرّة واحدة، بنفس منطق
//  `iconFor` في `ServiceCatalogScreen` عند تطبيق العميل — والاثنان يقرآن
//  الاسم العربي والإنجليزي معاً لأن الخادم قد يُرجع أيّهما.
//
//  `Truck` لا `TowTruck`: الأخيرة غير موجودة في phosphor، وأيقونة غائبة تصل
//  `undefined` فتُسقط الشاشة كلها إلى صفحة بيضاء بلا خطأ يشير إليها.
// ============================================================

import { CarBattery, GasPump, Gear, Key, Tire, Truck, Wrench } from "phosphor-react-native";

export function iconForService(name) {
  const key = String(name || "").toLowerCase();
  if (/batter|بطار/.test(key)) return CarBattery;
  if (/tire|tyre|wheel|إطار|اطار/.test(key)) return Tire;
  if (/fuel|gas|petrol|وقود|بنزين/.test(key)) return GasPump;
  if (/lock|key|فتح|مفتاح/.test(key)) return Key;
  if (/tow|سحب|قطر/.test(key)) return Truck;
  if (/mechanic|ميكانيك|maintenance|صيانة/.test(key)) return Gear;
  return Wrench;
}

export default iconForService;
