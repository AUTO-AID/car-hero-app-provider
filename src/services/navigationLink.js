// ============================================================
//  navigationLink — فتح التوجيه في تطبيق الخرائط الأصلي
//
//  التطبيق لا يرسم مساراً بنفسه عمداً: الفنّي يقود، ويحتاج توجيهاً صوتياً
//  بتحديث حيّ لحركة المرور — وهو ما تقدّمه خرائط جوجل/آبل ولا يقدّمه أي رسم
//  داخل التطبيق. ما نملكه هنا هو الإحداثيات، وننقلها إلى الأداة التي تُحسنها.
// ============================================================
import { Linking, Platform } from "react-native";

export function canNavigateTo(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude);
}

/**
 * يفتح التوجيه إلى نقطة. يُرجع false حين لا إحداثيات — الشاشة تعطّل الزرّ
 * بدل عرضه صامتاً.
 */
export function openNavigation(latitude, longitude, label) {
  if (!canNavigateTo(latitude, longitude)) return false;

  const coords = `${latitude},${longitude}`;
  const name = encodeURIComponent(label || "موقع العميل");

  // نجرّب المخطّط الأصلي أولاً (يفتح التطبيق مباشرةً)، ثم رابط الويب كبديل
  // مضمون على الأجهزة التي لا تملك التطبيق أو على الويب.
  const primary =
    Platform.OS === "ios"
      ? `maps://app?daddr=${coords}&dirflg=d`
      : `google.navigation:q=${coords}`;
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${coords}&destination_place_id=${name}`;

  Linking.canOpenURL(primary)
    .then((supported) => Linking.openURL(supported ? primary : fallback))
    .catch(() => Linking.openURL(fallback).catch(() => {}));

  return true;
}
