// ============================================================
//  TrackingMap — خريطة حقيقية: أنت تسير نحو العميل
//
//  نظيرة `TrackingMap` في تطبيق العميل، **بمنظور معكوس**: هناك يشاهد العميل
//  سيارة الفنّي قادمة، وهنا يقود الفنّي نفسه. الفارق الجوهري في مصدر الموقع:
//  العميل يقرأه من الخادم عبر socket، والفنّي يقرأه من **جهازه مباشرةً** —
//  فتتحرّك سيارته بلا تأخير رحلة الذهاب والإياب.
//
//  Leaflet داخل WebView على الموبايل و<iframe> على الويب. البلاطات من
//  OpenStreetMap والتوجيه من OSRM — كلاهما مجّاني بلا مفتاح.
//
//  ما يجعل الحركة تبدو حقيقية لا قافزة:
//    · كل تحديث يُحرَّك تدريجياً على مدى الفاصل المتوقّع للتحديث التالي
//    · السيارة تدور نحو اتجاه سيرها عبر أقصر قوس
//    · المسار يُقتطع كلما تقدّمت، فيبقى المعروض هو المتبقّي
//    · الخروج عن المسار يُعيد حساب الطريق تلقائياً
//
//  props:
//    origin       موقعك: {latitude, longitude, heading?} | {coordinates:[lng,lat]}
//    destination  موقع العميل بنفس الأشكال
//    height       ارتفاع ثابت، أو `fill` لملء الأب
//    onRouteInfo  ({ distanceKm, durationMin, source }) => void
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";
import { Crosshair, WarningCircle } from "phosphor-react-native";
import Text from "./AppText";
import { colors, font, providerRadius, shadow, spacing } from "../theme/theme";
import { routingUrl, tileTemplate } from "../services/mapConfig";

let WebView = null;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

const MAP_HTML = [
  "<!doctype html>",
  "<html>",
  "<head>",
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">',
  '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />',
  "<style>",
  "  html, body, #map { height:100%; margin:0; padding:0; background:#eee6f6; }",
  "  .leaflet-control-attribution { font-size:9px; opacity:.55; }",
  "",
  "  /* ---- دبّوس العميل: قطرة بحافّة بيضاء، هالة نابضة، وظلّ أرضي ---- */",
  "  .dest { position:relative; width:46px; height:58px; }",
  "  .dest-halo { position:absolute; left:50%; top:38px; width:44px; height:44px; margin:-22px 0 0 -22px;",
  "    border-radius:50%; background:__PRIMARY__; opacity:.18; animation:destPulse 2.6s ease-out infinite; }",
  "  /* الظلّ يفصل الدبّوس عن البلاطة فلا يبدو ملصوقاً على الصورة */",
  "  .dest-shadow { position:absolute; left:50%; top:44px; width:22px; height:7px; margin-left:-11px;",
  "    border-radius:50%; background:rgba(20,10,40,.32); filter:blur(2.5px); }",
  "  .dest-pin { position:absolute; left:50%; top:0; margin-left:-17px; width:34px; height:34px;",
  "    border-radius:50% 50% 50% 4px; transform:rotate(45deg);",
  "    background:linear-gradient(135deg, __PRIMARY_LIGHT__ 0%, __PRIMARY__ 70%);",
  "    border:2.5px solid #fff; box-shadow:0 6px 16px rgba(20,10,40,.34); }",
  "  .dest-core { position:absolute; left:50%; top:11px; margin-left:-6px; width:12px; height:12px;",
  "    border-radius:50%; background:#fff; box-shadow:inset 0 1px 2px rgba(20,10,40,.25); }",
  "  @keyframes destPulse {",
  "    0%   { transform:scale(.5);  opacity:.28; }",
  "    70%  { transform:scale(1.5); opacity:0; }",
  "    100% { transform:scale(1.5); opacity:0; }",
  "  }",
  "",
  "  /* ---- سيارة الفنّي ---- */",
  "  .car { position:relative; width:56px; height:56px; }",
  "  .car-rot { position:absolute; left:50%; top:50%; width:38px; height:38px; margin:-19px 0 0 -19px;",
  "    transition:transform .5s cubic-bezier(.22,.61,.36,1);",
  "    filter:drop-shadow(0 5px 10px rgba(20,10,40,.4)); }",
  "  .pulse { position:absolute; left:50%; top:50%; width:56px; height:56px; margin:-28px 0 0 -28px;",
  "    border-radius:50%; background:__SUCCESS__; opacity:.22; animation:pulse 2s ease-out infinite; }",
  "  @keyframes pulse {",
  "    0%   { transform:scale(.55); opacity:.32; }",
  "    70%  { transform:scale(1.25); opacity:0; }",
  "    100% { transform:scale(1.25); opacity:0; }",
  "  }",
  "</style>",
  "</head>",
  "<body>",
  '<div id="map"></div>',
  '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>',
  "<script>",
  "(function () {",
  "  var CFG = __CFG__;",
  "",
  "  function post(o) {",
  "    var m = JSON.stringify(o);",
  "    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(m);",
  '    else if (window.parent) window.parent.postMessage(m, "*");',
  "  }",
  "",
  // zoomSnap الكسري يجعل fitBounds يختار المقاس المناسب تماماً بدل أن يقفز
  // درجة كاملة فيترك المسار صغيراً وسط فراغ أو يقصّ طرفيه.
  '  var map = L.map("map", { zoomControl: false, attributionControl: !!CFG.tile,',
  "    zoomSnap: .25, zoomDelta: .5, wheelPxPerZoomLevel: 110 });",
  "  map.setView([CFG.dest.lat, CFG.dest.lng], 15);",
  "  if (CFG.tile) L.tileLayer(CFG.tile, {",
  "    maxZoom: 19,",
  // شاشات الهاتف بكثافة ٢×–٣×: بلا هذا تصل بلاطات نصف الدقّة فتبدو الشوارع
  // والأسماء ضبابية — وهي أوّل ما يوحي بأن الخريطة «تقريبية».
  "    detectRetina: true,",
  // بلاطة إضافية حول الإطار: التحريك لا يكشف مربّعات رمادية تُملأ بعد لحظة.
  "    keepBuffer: 3,",
  "    updateWhenIdle: false,",
  "  }).addTo(map);",
  "",
  "  var CAR_SVG =",
  "    '<svg viewBox=\"0 0 32 32\" width=\"34\" height=\"34\" xmlns=\"http://www.w3.org/2000/svg\">' +",
  "    '<rect x=\"7.5\" y=\"2.5\" width=\"17\" height=\"27\" rx=\"6.5\" fill=\"' + CFG.color.success + '\"/>' +",
  "    '<rect x=\"8.6\" y=\"3.6\" width=\"14.8\" height=\"24.8\" rx=\"5.6\" fill=\"none\" stroke=\"#ffffff\" stroke-opacity=\".9\" stroke-width=\"1.4\"/>' +",
  "    '<path d=\"M10.6 11.4h10.8l-1.15-3.1a2 2 0 0 0-1.87-1.3h-4.76a2 2 0 0 0-1.87 1.3z\" fill=\"#ffffff\" fill-opacity=\".92\"/>' +",
  "    '<rect x=\"11\" y=\"18.2\" width=\"10\" height=\"5.4\" rx=\"2.2\" fill=\"#ffffff\" fill-opacity=\".55\"/>' +",
  "    '<circle cx=\"11.3\" cy=\"5.2\" r=\"1.15\" fill=\"#FFE9A8\"/>' +",
  "    '<circle cx=\"20.7\" cy=\"5.2\" r=\"1.15\" fill=\"#FFE9A8\"/>' +",
  "    '</svg>';",
  "",
  "  var destIcon = L.divIcon({",
  // المرساة عند طرف القطرة السفلي (44px) لا عند مركزها: الدبّوس يجب أن يشير
  // إلى النقطة نفسها، وتوسيطه كان يزيحه نصف ارتفاعه شمالاً.
  '    className: "", iconSize: [46, 58], iconAnchor: [23, 44],',
  '    html: \'<div class="dest">\' +',
  '      \'<div class="dest-halo"></div>\' +',
  '      \'<div class="dest-shadow"></div>\' +',
  '      \'<div class="dest-pin"></div>\' +',
  '      \'<div class="dest-core"></div>\' +',
  "      '</div>'",
  "  });",
  "  L.marker([CFG.dest.lat, CFG.dest.lng], { icon: destIcon, keyboard: false, zIndexOffset: 500 })",
  '    .addTo(map).bindTooltip(CFG.text.destination, { direction: "top", offset: [0, -44] });',
  "",
  "  var carIcon = L.divIcon({",
  '    className: "", iconSize: [52, 52], iconAnchor: [26, 26],',
  "    html: '<div class=\"car\"><div class=\"pulse\"></div><div class=\"car-rot\" id=\"carRot\">' + CAR_SVG + '</div></div>'",
  "  });",
  "",
  "  // حاشية بيضاء تحت الخط: المسار فوق بلاطات مزدحمة يضيع بلا حدّ.",
  // smoothFactor:1 يوقف تبسيط Leaflet للنقاط: منعطفات OSRM تُرسم كما هي فلا
  // «يقصّ» الخط زاوية شارع ويبدو مارّاً فوق المباني.
  '  var casing   = L.polyline([], { color: "#ffffff", weight: 11, opacity: .95, lineCap: "round", lineJoin: "round", smoothFactor: 1 }).addTo(map);',
  '  var traveled = L.polyline([], { color: "#8E8AA8", weight: 4.5, opacity: .5, lineCap: "round", dashArray: "1 9", smoothFactor: 1 }).addTo(map);',
  '  var planned  = L.polyline([], { color: CFG.color.primary, weight: 6, opacity: .96, lineCap: "round", lineJoin: "round", smoothFactor: 1 }).addTo(map);',
  "",
  "  var carMarker = null, shown = null, target = null, animId = null;",
  "  var follow = true, fitted = false, routing = false;",
  "  var routePts = [], lastRouteAt = 0;",
  "  var RAD = Math.PI / 180;",
  "",
  "  function nowMs() { return (window.performance && window.performance.now) ? window.performance.now() : Date.now(); }",
  "",
  "  function metersBetween(a, b) {",
  "    var dLat = (b.lat - a.lat) * RAD, dLng = (b.lng - a.lng) * RAD;",
  "    var la = a.lat * RAD, lb = b.lat * RAD;",
  "    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +",
  "            Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) * Math.sin(dLng / 2);",
  "    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));",
  "  }",
  "",
  "  function bearing(a, b) {",
  "    var y = Math.sin((b.lng - a.lng) * RAD) * Math.cos(b.lat * RAD);",
  "    var x = Math.cos(a.lat * RAD) * Math.sin(b.lat * RAD) -",
  "            Math.sin(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.cos((b.lng - a.lng) * RAD);",
  "    return (Math.atan2(y, x) / RAD + 360) % 360;",
  "  }",
  "",
  "  var lastRot = 0;",
  "  function setRotation(deg) {",
  '    var el = document.getElementById("carRot");',
  "    if (!el) return;",
  "    // أقصر قوس: الانتقال من ٣٥٠° إلى ١٠° هو +٢٠° لا -٣٤٠°، وإلا دارت",
  "    // السيارة حول نفسها عند كل التفاف.",
  "    var delta = ((deg - (lastRot % 360)) + 540) % 360 - 180;",
  "    lastRot = lastRot + delta;",
  '    el.style.transform = "rotate(" + lastRot + "deg)";',
  "  }",
  "",
  "  /** يقتطع ما قُطع من المسار فيبقى المعروض هو المتبقّي وحده */",
  "  function trimPlanned(at) {",
  "    if (!routePts.length) return null;",
  "    var best = 0, bestD = Infinity;",
  "    for (var i = 0; i < routePts.length; i++) {",
  "      var d = metersBetween(at, { lat: routePts[i][0], lng: routePts[i][1] });",
  "      if (d < bestD) { bestD = d; best = i; }",
  "    }",
  "    var rest = [[at.lat, at.lng]].concat(routePts.slice(best + 1));",
  "    planned.setLatLngs(rest);",
  "    casing.setLatLngs(rest);",
  // ما قُطع يبقى مرسوماً منقّطاً باهتاً: الفنّي يرى تقدّمه لا خطّاً يتآكل
  // بلا أثر، والفرق بين «المتبقّي» و«المقطوع» يُقرأ من لون واحد بلمحة.
  "    traveled.setLatLngs(routePts.slice(0, best + 1).concat([[at.lat, at.lng]]));",
  "    return bestD;",
  "  }",
  "",
  "  function keepInView() {",
  "    if (!follow || !shown) return;",
  "    if (!map.getBounds().pad(-0.22).contains(L.latLng(shown.lat, shown.lng))) {",
  "      map.panTo([shown.lat, shown.lng], { animate: true, duration: .6 });",
  "    }",
  "  }",
  "",
  "  function fitAll() {",
  "    var pts = [[CFG.dest.lat, CFG.dest.lng]];",
  "    if (shown) pts.push([shown.lat, shown.lng]);",
  "    if (routePts.length) pts = pts.concat(routePts);",
  "    if (pts.length < 2) { map.setView(pts[0], 16.5); return; }",
  // حشوة أكبر أسفل الإطار: الطبقة السفلية (BottomSheet) تغطّي نحو ثلث الشاشة،
  // وحشوة متساوية كانت تضع الدبّوس خلفها فيبدو أن الخريطة أخطأت الموقع.
  "    map.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [55, 60], paddingBottomRight: [55, 150], maxZoom: 17 });",
  "  }",
  "",
  "  function applyRoute(pts, info) {",
  "    routePts = pts;",
  "    trimPlanned(shown || { lat: pts[0][0], lng: pts[0][1] });",
  "    if (!fitted) { fitted = true; fitAll(); }",
  '    post({ type: "route", distanceKm: info.distanceKm, durationMin: info.durationMin, source: info.source });',
  "  }",
  "",
  "  function requestRoute(from) {",
  "    if (routing) return;",
  "    var t = Date.now();",
  "    if (t - lastRouteAt < 20000) return;   // سقف لمعدّل طلبات التوجيه",
  "    lastRouteAt = t;",
  "",
  "    var straight = [[from.lat, from.lng], [CFG.dest.lat, CFG.dest.lng]];",
  "    if (!CFG.routingUrl) {",
  '      applyRoute(straight, { distanceKm: metersBetween(from, CFG.dest) / 1000, durationMin: null, source: "direct" });',
  "      return;",
  "    }",
  "",
  "    routing = true;",
  '    var url = CFG.routingUrl.replace("{coords}",',
  '      from.lng + "," + from.lat + ";" + CFG.dest.lng + "," + CFG.dest.lat);',
  "    fetch(url)",
  "      .then(function (r) { return r.json(); })",
  "      .then(function (j) {",
  "        var r0 = j && j.routes && j.routes[0];",
  '        if (!r0 || !r0.geometry || !r0.geometry.coordinates) throw new Error("no route");',
  "        applyRoute(r0.geometry.coordinates.map(function (c) { return [c[1], c[0]]; }),",
  '          { distanceKm: r0.distance / 1000, durationMin: r0.duration / 60, source: "osrm" });',
  "      })",
  "      .catch(function () {",
  "        // تعذّر التوجيه: خطّ مستقيم أفضل من لا شيء، لكن نُعلن أنه تقديري",
  '        applyRoute(straight, { distanceKm: metersBetween(from, CFG.dest) / 1000, durationMin: null, source: "direct" });',
  "      })",
  "      .then(function () { routing = false; });",
  "  }",
  "",
  "  function animateTo(next, durationMs, headingDeg) {",
  "    if (!carMarker) {",
  "      shown = next;",
  "      carMarker = L.marker([next.lat, next.lng], { icon: carIcon, keyboard: false, zIndexOffset: 1000 }).addTo(map);",
  '      carMarker.bindTooltip(CFG.text.origin, { direction: "top", offset: [0, -26] });',
  "      if (headingDeg != null) setRotation(headingDeg);",
  "      return;",
  "    }",
  "    var from = { lat: shown.lat, lng: shown.lng };",
  "    var moved = metersBetween(from, next);",
  "    // تشويش GPS يهزّ الإحداثي أمتاراً والسيارة واقفة؛ ما دون ٦ أمتار ليس حركة.",
  "    if (moved < 6) { shown = next; return; }",
  "",
  "    setRotation(headingDeg != null ? headingDeg : bearing(from, next));",
  "    if (animId) cancelAnimationFrame(animId);",
  "    var t0 = nowMs();",
  "    var dur = Math.max(400, Math.min(6000, durationMs || 1500));",
  "",
  "    function step() {",
  "      var p = Math.min(1, (nowMs() - t0) / dur);",
  "      var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;",
  "      shown = { lat: from.lat + (next.lat - from.lat) * e, lng: from.lng + (next.lng - from.lng) * e };",
  "      carMarker.setLatLng([shown.lat, shown.lng]);",
  "      var off = trimPlanned(shown);",
  "      keepInView();",
  "      if (p < 1) { animId = requestAnimationFrame(step); return; }",
  "      animId = null;",
  "      // خروج عن المسار ⇒ سلكتَ طريقاً آخر، فيُعاد الحساب.",
  "      if (off != null && off > 180) requestRoute(shown);",
  "    }",
  "    animId = requestAnimationFrame(step);",
  "  }",
  "",
  "  function handle(d) {",
  "    if (!d || !d.type) return;",
  '    if (d.type === "origin") {',
  "      var next = { lat: d.lat, lng: d.lng };",
  "      var prevFix = target;",
  "      if (!routePts.length) requestRoute(next);",
  "      target = next;",
  "      if (prevFix && metersBetween(prevFix, next) < 6) return;",
  '      animateTo(next, d.animMs, typeof d.heading === "number" ? d.heading : null);',
  "      if (!fitted) { fitted = true; fitAll(); }",
  "      return;",
  "    }",
  '    if (d.type === "recenter") {',
  "      follow = true; fitted = true;",
  '      post({ type: "follow", value: true });',
  "      fitAll();",
  "      return;",
  "    }",
  '    if (d.type === "reroute") { lastRouteAt = 0; if (target) requestRoute(target); }',
  "  }",
  "",
  "  // تحريك الخريطة يدوياً يعني أنك تنظر إلى مكان آخر؛ إعادة التمركز فوقه",
  "  // تنتزع منك السيطرة عند كل تحديث.",
  '  map.on("dragstart zoomstart", function () {',
  '    if (follow) { follow = false; post({ type: "follow", value: false }); }',
  "  });",
  "",
  '  window.addEventListener("message", function (e) {',
  '    try { handle(typeof e.data === "string" ? JSON.parse(e.data) : e.data); } catch (_) {}',
  "  });",
  '  document.addEventListener("message", function (e) {',
  '    try { handle(typeof e.data === "string" ? JSON.parse(e.data) : e.data); } catch (_) {}',
  "  });",
  "  window.__track = handle;",
  "",
  "  map.whenReady(function () {",
  '    setTimeout(function () { map.invalidateSize(); post({ type: "ready" }); }, 60);',
  "  });",
  "})();",
  "</script>",
  "</body>",
  "</html>",
].join("\n");

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** يقبل {coordinates:[lng,lat]} أو {latitude,longitude} أو [lng,lat] */
function toLatLng(value) {
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

export default function TrackingMap({ origin, destination, height = 300, onRouteInfo, style }) {
  const webRef = useRef(null);
  const iframeRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [follow, setFollow] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const lastSentAt = useRef(0);

  const dest = useMemo(() => toLatLng(destination), [destination]);
  const car = useMemo(() => toLatLng(origin), [origin]);
  // مفتاح نصّي: الكائن الجديد عند كل تصيير كان يُعيد تشغيل الإرسال بلا تغيّر
  const carKey = car ? `${car.lat},${car.lng}` : "";

  const html = useMemo(() => {
    if (!dest) return null;
    const cfg = {
      dest,
      tile: tileTemplate(),
      routingUrl: routingUrl(),
      color: { primary: colors.primary, success: colors.success },
      text: { destination: "موقع العميل", origin: "أنت" },
    };
    return (
      MAP_HTML.replace("__CFG__", JSON.stringify(cfg))
        // الفاتح **قبل** العادي: `__PRIMARY__` بادئة لـ`__PRIMARY_LIGHT__`،
        // فاستبداله أوّلاً كان يترك النصّ `_LIGHT__` معلّقاً في الـCSS.
        .split("__PRIMARY_LIGHT__")
        .join(colors.primaryLight || colors.primary)
        .split("__PRIMARY__")
        .join(colors.primary)
        .split("__SUCCESS__")
        .join(colors.success)
    );
  }, [dest]);

  // بلا إشارة جاهزية خلال مهلة نعرض بديلاً مع إعادة محاولة، لا مساحة صامتة
  useEffect(() => {
    if (ready) return undefined;
    const timer = setTimeout(() => setFailed(true), 14000);
    return () => clearTimeout(timer);
  }, [ready, reloadKey]);

  const send = useCallback((payload) => {
    const msg = JSON.stringify(payload);
    if (Platform.OS === "web") iframeRef.current?.contentWindow?.postMessage(msg, "*");
    else webRef.current?.injectJavaScript(`window.__track && window.__track(${msg}); true;`);
  }, []);

  const routeInfoRef = useRef(onRouteInfo);
  routeInfoRef.current = onRouteInfo;

  const handleMessage = useCallback((raw) => {
    try {
      const d = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!d) return;
      if (d.type === "ready") {
        setReady(true);
        setFailed(false);
        return;
      }
      if (d.type === "follow") {
        setFollow(!!d.value);
        return;
      }
      if (d.type === "route") {
        routeInfoRef.current?.({
          distanceKm: num(d.distanceKm),
          durationMin: num(d.durationMin),
          source: d.source,
        });
      }
    } catch {
      // رسالة غير مفهومة من الخريطة — لا شيء يُفعل
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return undefined;
    const onMsg = (e) => {
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      handleMessage(e.data);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [handleMessage]);

  // مدّة الحركة = الفاصل الفعلي بين قراءتين، فتصل السيارة إلى نقطتها تماماً
  // حين تصل القراءة التالية بدل أن تقف منتظرة أو تُقطع في منتصف الطريق.
  useEffect(() => {
    if (!ready || !car) return;
    const now = Date.now();
    const gap = lastSentAt.current ? now - lastSentAt.current : 0;
    lastSentAt.current = now;
    send({
      type: "origin",
      lat: car.lat,
      lng: car.lng,
      heading: num(origin?.heading),
      animMs: gap > 0 ? Math.min(gap, 6000) : 1200,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, carKey, origin?.heading, send]);

  const fill = height === "fill";
  const wrapStyle = [s.wrap, fill ? StyleSheet.absoluteFill : { height }, style];

  if (!dest || !html) {
    return (
      <View style={wrapStyle}>
        <View style={s.fallback}>
          <WarningCircle size={30} weight="fill" color={colors.textMuted2} />
          <Text style={s.fallbackText}>موقع العميل غير متوفّر لهذا الطلب</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={wrapStyle}>
      {Platform.OS === "web" ? (
        <iframe
          key={reloadKey}
          ref={iframeRef}
          title="خريطة التوجيه إلى العميل"
          srcDoc={html}
          style={{ border: 0, width: "100%", height: "100%" }}
        />
      ) : (
        <WebView
          key={reloadKey}
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html }}
          style={{ backgroundColor: colors.mapSurface }}
          onMessage={(e) => handleMessage(e.nativeEvent.data)}
          onError={() => setFailed(true)}
        />
      )}

      {!ready && !failed ? (
        <View style={s.overlay} pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
          <Text style={s.overlayText}>جارٍ تحميل الخريطة…</Text>
        </View>
      ) : null}

      {failed && !ready ? (
        <View style={s.overlay}>
          <WarningCircle size={32} weight="fill" color={colors.danger} />
          <Text style={s.overlayText}>تعذّر تحميل الخريطة. تحقّق من اتصالك.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="إعادة تحميل الخريطة"
            style={s.overlayBtn}
            onPress={() => {
              setFailed(false);
              setReady(false);
              setReloadKey((k) => k + 1);
            }}
          >
            <Text style={s.overlayBtnText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      ) : null}

      {/* بلا موقع بعدُ: نقول ذلك صراحةً بدل خريطة تبدو معطّلة */}
      {ready && !car ? (
        <View style={s.notice} pointerEvents="none">
          <Text style={s.noticeText}>جارٍ تحديد موقعك…</Text>
        </View>
      ) : null}

      {/* يظهر فقط بعد أن تحرّك الخريطة يدوياً — قبلها لا معنى له */}
      {ready && !follow ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="إعادة توسيط الخريطة على المسار"
          style={s.recenter}
          onPress={() => send({ type: "recenter" })}
        >
          <Crosshair size={20} weight="fill" color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: providerRadius.card,
    overflow: "hidden",
    backgroundColor: colors.mapSurface,
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: "#eee6f6ee",
  },
  overlayText: { fontSize: font.size.sm, color: colors.textBody, textAlign: "center", lineHeight: 21 },
  overlayBtn: {
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: colors.tint,
    borderRadius: providerRadius.tileSm,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  overlayBtnText: { fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.primary },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  fallbackText: { fontSize: font.size.sm, color: colors.textMuted, textAlign: "center" },
  notice: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: "#ffffffee",
    borderRadius: providerRadius.tileSm,
    paddingVertical: 9,
    paddingHorizontal: 14,
    ...shadow.card,
  },
  noticeText: { fontSize: font.size.xs, color: colors.textBody, textAlign: "center" },
  recenter: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    width: 44,
    height: 44,
    borderRadius: providerRadius.tileSm,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
});
