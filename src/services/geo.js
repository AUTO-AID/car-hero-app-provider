// ============================================================
//  geo — حسابات جغرافية على جانب React Native
//
//  خريطة التتبّع تملك نسخة JavaScript خاصّة بها من هذه الدوالّ داخل الـWebView
//  (تعمل في سياق منفصل لا يصله استيراد)، أمّا هذا الملفّ فلِمنطق الشاشات
//  والخطّافات: السياج الجغرافي لتسجيل الوصول تلقائياً، ومحاكاة الرحلة.
// ============================================================

const RAD = Math.PI / 180;
const EARTH_M = 6371000;

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** يقبل {latitude,longitude} أو {lat,lng} أو {coordinates:[lng,lat]} أو [lng,lat] */
export function toLatLng(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const lng = num(value[0]);
    const lat = num(value[1]);
    return lat === null || lng === null ? null : { lat, lng };
  }
  if (Array.isArray(value.coordinates)) return toLatLng(value.coordinates);
  const lat = num(value.latitude ?? value.lat);
  const lng = num(value.longitude ?? value.lng);
  return lat === null || lng === null ? null : { lat, lng };
}

/** المسافة بالأمتار بين نقطتين (Haversine). يُرجع null إن نقصت إحداهما. */
export function metersBetween(a, b) {
  const p = toLatLng(a);
  const q = toLatLng(b);
  if (!p || !q) return null;
  const dLat = (q.lat - p.lat) * RAD;
  const dLng = (q.lng - p.lng) * RAD;
  const la = p.lat * RAD;
  const lb = q.lat * RAD;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return EARTH_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** زاوية الاتجاه (٠–٣٦٠) من a إلى b — تُغذّي تدوير السيارة نحو وجهة سيرها */
export function bearing(a, b) {
  const p = toLatLng(a);
  const q = toLatLng(b);
  if (!p || !q) return null;
  const y = Math.sin((q.lng - p.lng) * RAD) * Math.cos(q.lat * RAD);
  const x =
    Math.cos(p.lat * RAD) * Math.sin(q.lat * RAD) -
    Math.sin(p.lat * RAD) * Math.cos(q.lat * RAD) * Math.cos((q.lng - p.lng) * RAD);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/** نقطة على القطعة [a,b] عند نسبة t (٠–١). تقريب خطّي يكفي لمسافات قصيرة. */
export function interpolate(a, b, t) {
  const p = toLatLng(a);
  const q = toLatLng(b);
  if (!p || !q) return null;
  return { lat: p.lat + (q.lat - p.lat) * t, lng: p.lng + (q.lng - p.lng) * t };
}

/**
 * يكثّف مساراً متفرّق الرؤوس إلى نقاط متقاربة (~stepMeters).
 *
 * رؤوس OSRM متباعدة عشرات ومئات الأمتار على الطرق المستقيمة، فلو حرّكنا
 * سيارة المحاكاة رأساً برأس لقفزت قفزات كبيرة. التكثيف يجعلها تنساب.
 */
export function densifyPath(points, stepMeters = 25) {
  const src = (points || []).map(toLatLng).filter(Boolean);
  if (src.length < 2) return src;
  const out = [src[0]];
  for (let i = 1; i < src.length; i++) {
    const a = src[i - 1];
    const b = src[i];
    const d = metersBetween(a, b) || 0;
    const n = Math.max(1, Math.floor(d / stepMeters));
    for (let k = 1; k <= n; k++) out.push(interpolate(a, b, k / n));
  }
  return out;
}
