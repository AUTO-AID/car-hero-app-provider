// ============================================================
//  providerUi — تركيبات خاصة بتطبيق الفنّي
//
//  لماذا ملف منفصل ولا تُضاف إلى `ui.js`؟
//  `ui.js` **منسوخ حرفياً** من تطبيق العميل، ويُقارن به بأمر diff للتأكّد من
//  عدم انحراف التطبيقين. أي إضافة فيه تكسر تلك المقارنة وتجعل نقل التحسينات
//  بين التطبيقين تخميناً. فما كان مشتركاً يبقى هناك، وما كان للفنّي وحده
//  يُبنى هنا **فوق** أوّلياته (PressableScale · AppText · الرموز) لا بجانبها.
// ============================================================

import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "./AppText";
import { PressableScale } from "./ui";
import {
  colors,
  font,
  gradients,
  layout,
  onDark,
  providerRadius,
  radius,
  shadow,
  spacing,
} from "../theme/theme";

// ارتفاع الشريط السفلي العائم + مسافته عن الحافة. الشاشات ذات الشريط تحجز
// هذا المقدار أسفل محتواها، وإلا اختفى آخر عنصر خلف الشريط — وهو ما كان
// يحدث في «طلباتي» و«التنبيهات» قبل توحيد الرقم في مصدر واحد.
export const NAV_HEIGHT = 66;
export const NAV_GAP = 14;
export const navClearance = (bottomInset = 0) =>
  NAV_HEIGHT + NAV_GAP * 2 + Math.max(bottomInset, 0);

// ============================================================
//  ProviderScreen — جذر كل شاشة
//  يحلّ محلّ `paddingTop: 52` المكتوب يدوياً في إحدى عشرة شاشة. الرقم الثابت
//  كان يصيب هاتفاً واحداً ويخطئ كل ما عداه: يقصّ المحتوى تحت النتوء على
//  الأجهزة الطويلة، ويترك فراغاً مهدوراً على القصيرة.
//
//  **طبقتان لا واحدة:** الخلفية تملأ الشاشة، والمحتوى يجلس في عمود محصور
//  بـ`layout.contentMaxWidth` ومتوسّط. بدون الحصر كانت شاشات الفنّي تتمدّد
//  إلى حافة الشاشة على الويب واللوحي بينما يبقى العميل في عمود 560 — أي
//  تطبيقان بتخطيطين. الحصر هنا هو نفسه في `ui.screenContent` عند العميل.
// ============================================================
export function ProviderScreen({
  children,
  style,
  gradient, // تدرّج خلفية بدل اللون الصلب (شاشتا الطلب الوارد والإتمام)
  padded = true, // حشوة أفقية قياسية
  withNav = false, // احجز مكان الشريط السفلي
  topInset = true,
  bottomInset = true,
  // شاشة خريطة تملأ العرض: تطبيق العميل لا يحصر خرائطه أيضاً
  // (`InteractiveMapScreen` · `ProvidersMapScreen`)، لأن الخريطة سياق لا نصّ
  // يُقرأ سطراً سطراً، وحصرها يترك فراغاً ميتاً حولها.
  wide = false,
}) {
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        ui.content,
        !wide && ui.contentCapped,
        {
          paddingTop: topInset ? insets.top + spacing.md : 0,
          // الشريط العائم يتكفّل بحشوته، والمحتوى القابل للتمرير يحجز مساحته
          paddingBottom: withNav ? 0 : bottomInset ? Math.max(insets.bottom, spacing.lg) : 0,
        },
        padded && { paddingHorizontal: spacing.xl },
        style,
      ]}
    >
      {children}
    </View>
  );

  // التدرّج على الإطار لا على العمود: خلفية تنتهي عند 560 بيكسل وسط شاشة
  // عريضة تبدو بطاقة عائمة لا شاشة.
  if (gradient) {
    return (
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ui.screen}>
        {content}
      </LinearGradient>
    );
  }
  return <View style={[ui.screen, ui.screenBg]}>{content}</View>;
}

// ============================================================
//  ScreenTitle — عنوان شاشة جذرية (لا زرّ رجوع لها)
//  شاشات التبويبات لا تُستعمل فيها `AppHeader` لأن الأخيرة تحجز مكان زرّ رجوع
//  غير موجود، فيبدو العنوان مزاحاً عن حافته.
// ============================================================
export function ScreenTitle({ title, action, style }) {
  return (
    <View style={[ui.titleRow, style]}>
      <AppText style={ui.titleText} accessibilityRole="header">
        {title}
      </AppText>
      {action ? <View style={ui.titleAction}>{action}</View> : null}
    </View>
  );
}

// ============================================================
//  Card — السطح الأساسي
//  كانت البطاقة تُعاد كتابتها في كل شاشة بأرقام متقاربة لا متطابقة (استدارة
//  20 و22 و24، وظلّ بشفافية 0.12 و0.2 و0.35)، فبدت الشاشات من عائلتين.
// ============================================================
export function Card({ children, style, raised = false, dashed = false, padded = true, ...rest }) {
  return (
    // `...rest` يمرّر خصائص إمكانية الوصول: بطاقة تحمل معلومة (تنبيه غير
    // مقروء مثلاً) تحتاج اسماً مسموعاً، والبطاقة الصامتة لا تمرّر شيئاً.
    <View
      {...rest}
      style={[ui.card, padded && ui.cardPadded, raised && ui.cardRaised, dashed && ui.cardDashed, style]}
    >
      {children}
    </View>
  );
}

// مربّع أيقونة داخل بطاقة — بنفسجي متدرّج للخدمة، أو نغمة هادئة لغيرها.
export function IconTile({ Icon, size = 52, tone, gradient: grad = false, iconSize, weight = "fill" }) {
  const box = {
    width: size,
    height: size,
    borderRadius: size >= 56 ? providerRadius.tile : providerRadius.tileSm,
  };
  const glyph = iconSize || Math.round(size * 0.5);
  if (grad) {
    return (
      <LinearGradient colors={gradients.primary} style={[ui.tile, box]}>
        <Icon size={glyph} weight={weight} color={colors.onPrimary} />
      </LinearGradient>
    );
  }
  const [bg, fg] = tone || [colors.tint, colors.primaryLight];
  return (
    <View style={[ui.tile, box, { backgroundColor: bg }]}>
      <Icon size={glyph} weight={weight} color={fg} />
    </View>
  );
}

// ============================================================
//  ServiceRow — «الخدمة + من طلبها» — الصفّ الذي يتكرّر في ست شاشات
// ============================================================
// `tone` استثناء لا قاعدة: الخدمة الجارية بنفسجية متدرّجة دائماً، والنغمة
// تُمرَّر فقط حيث يكون التدرّج كذباً — سجلّ طلب ملغى مثلاً، فالبنفسجي هناك
// يمنح ما لم يقع مظهر الإنجاز.
export function ServiceRow({ Icon, title, subtitle, trailing, size = 52, tone, style }) {
  return (
    <View style={[ui.serviceRow, style]}>
      <IconTile Icon={Icon} size={size} tone={tone} gradient={!tone} />
      <View style={ui.serviceText}>
        <AppText style={ui.serviceTitle} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={ui.serviceSub} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

// صفّ «تسمية ← قيمة» داخل بطاقة تفاصيل.
// `Icon` اختيارية: صفوف «حسابي» تحملها لتسريع المسح البصري، وصفوف بطاقة
// التفاصيل لا تحملها لأن تسمياتها متجاورة ومتشابهة فتصير الأيقونات ضجيجاً.
export function DetailRow({ Icon, label, value, valueNode, strong = false, tone, last = false }) {
  return (
    <View style={[ui.detailRow, last && ui.detailRowLast]}>
      <View style={ui.detailLabelWrap}>
        {Icon ? <Icon size={20} color={colors.primaryLight} /> : null}
        <AppText style={ui.detailLabel}>{label}</AppText>
      </View>
      {valueNode || (
        <AppText style={[ui.detailValue, strong && ui.detailValueStrong, tone && { color: tone }]}>
          {value}
        </AppText>
      )}
    </View>
  );
}

// ============================================================
//  StatTile — رقم واحد بارز وتسميته
//  `variant`: "light" على الأبيض · "dark" فوق التدرّج الداكن
// ============================================================
export function StatTile({
  Icon,
  value,
  unit,
  label,
  variant = "light",
  style,
  onPress,
  accessibilityLabel,
}) {
  const dark = variant === "dark";
  const body = (
    <>
      {Icon ? (
        <Icon
          size={22}
          weight={dark ? "regular" : "fill"}
          color={dark ? onDark.textMuted : colors.primaryLight}
        />
      ) : null}
      <View style={ui.statValueRow}>
        <AppText style={[ui.statValue, dark && ui.statValueDark]}>{value}</AppText>
        {unit ? <AppText style={[ui.statUnit, dark && ui.statUnitDark]}>{unit}</AppText> : null}
      </View>
      <AppText style={[ui.statLabel, dark && ui.statLabelDark]} numberOfLines={1}>
        {label}
      </AppText>
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        style={[ui.stat, dark ? ui.statDark : ui.statLight, style]}
      >
        {body}
      </PressableScale>
    );
  }
  return (
    <View
      style={[ui.stat, dark ? ui.statDark : ui.statLight, style]}
      accessibilityLabel={accessibilityLabel || `${label}: ${value}${unit ? ` ${unit}` : ""}`}
    >
      {body}
    </View>
  );
}

// ============================================================
//  Segmented — مبدّل «نشطة / سابقة»
// ============================================================
export function Segmented({ items, value, onChange, style }) {
  return (
    <View style={[ui.segment, style]} accessibilityRole="tablist">
      {items.map((item) => {
        const on = item.key === value;
        return (
          <PressableScale
            key={item.key}
            onPress={() => !on && onChange?.(item.key)}
            feedback={on ? false : "selection"}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={item.label}
            style={[ui.segmentTab, on && ui.segmentTabOn]}
          >
            <AppText style={[ui.segmentText, on && ui.segmentTextOn]}>{item.label}</AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

// ============================================================
//  GradientButton — الفعل الحاسم
//  `tone`: "primary" للتنقّل · "success" لدفع الطلب خطوة للأمام
//  ظلّ الزرّ يتبع لونه: زرّ أخضر بظلّ بنفسجي يبدو مطبوعاً على الشاشة خطأً.
// ============================================================
export function GradientButton({
  label,
  onPress,
  icon,
  tone = "primary",
  height = 60,
  style,
  disabled = false,
  accessibilityHint,
}) {
  const success = tone === "success";
  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      feedback="action"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        ui.gradBtnWrap,
        success ? ui.gradBtnShadowSuccess : ui.gradBtnShadow,
        disabled && ui.disabled,
        style,
      ]}
    >
      <LinearGradient
        colors={success ? gradients.success : gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[ui.gradBtn, { height }]}
      >
        {icon}
        <AppText style={ui.gradBtnText}>{label}</AppText>
      </LinearGradient>
    </PressableScale>
  );
}

// زرّ زجاجي فوق تدرّج — لا يصلح `OutlineButton` هناك لأن حدّه الرمادي يختفي.
export function GlassButton({ label, onPress, icon, danger = false, style, accessibilityHint }) {
  return (
    <PressableScale
      onPress={onPress}
      feedback="action"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[ui.glassBtn, danger && ui.glassBtnDanger, style]}
    >
      {icon}
      <AppText style={[ui.glassBtnText, danger && ui.glassBtnTextDanger]}>{label}</AppText>
    </PressableScale>
  );
}

// ============================================================
//  HaloIcon — أيقونة داخل حلقتين
//  تتكرّر في «وصلت» و«تم الإنجاز»: الحلقتان تجعلان الأيقونة حدثاً لا زخرفة.
// ============================================================
export function HaloIcon({ Icon, size = 150, iconSize = 46, tone = "success", weight = "fill" }) {
  const inner = Math.round(size * 0.64);
  return (
    <View style={[ui.halo, { width: size, height: size }]} pointerEvents="none">
      <View style={[ui.haloOuter, { borderRadius: size / 2 }]} />
      <View style={[ui.haloMid, { borderRadius: (size - 32) / 2 }]} />
      <LinearGradient
        colors={tone === "success" ? gradients.success : gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          ui.haloCore,
          { width: inner, height: inner, borderRadius: inner / 2 },
          tone === "success" && { shadowColor: colors.successShadow },
        ]}
      >
        <Icon size={iconSize} weight={weight} color={colors.onPrimary} />
      </LinearGradient>
    </View>
  );
}

// الدائرة الزخرفية في زاوية البطاقات المتدرّجة.
export function GradientOrb({ size = 180, top = -60, left = -40 }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: onDark.glassOrb,
        top,
        left,
      }}
    />
  );
}

// ============================================================
//  MapCanvas — خريطة مبسّطة
//  عناصر `View` لا خريطة حقيقية، **مؤقّتاً**: تطبيق العميل يرسم Leaflet داخل
//  WebView، وهو ما ستصير إليه هذه الشاشات عند الربط. جمعها في مكوّن واحد
//  يجعل الاستبدال لاحقاً تعديل ملف واحد لا أربع شاشات.
//  `accessibilityLabel` إلزامي: لوحة زخرفية بلا وصف تُقرأ فراغاً.
// ============================================================
export function MapCanvas({
  height,
  style,
  children,
  accessibilityLabel,
  rounded = true,
  vertical = false,
}) {
  return (
    <View
      style={[ui.map, rounded && ui.mapRounded, height ? { height } : null, style]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={ui.roadA} pointerEvents="none" />
      <View style={ui.roadB} pointerEvents="none" />
      {vertical ? <View style={ui.roadV} pointerEvents="none" /> : null}
      {children}
    </View>
  );
}

// الطبقة السفلية المنزلقة في شاشة التوجيه.
export function BottomSheet({ children, style }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[ui.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md }, style]}
    >
      <View style={ui.grabber} pointerEvents="none" />
      {children}
    </View>
  );
}

// شارة عائمة أعلى خريطة تملأ الشاشة.
export function FloatingBar({ children, style }) {
  const insets = useSafeAreaInsets();
  return <View style={[ui.floating, { top: insets.top + spacing.sm }, style]}>{children}</View>;
}

const ui = StyleSheet.create({
  screen: { flex: 1 },
  screenBg: { backgroundColor: colors.screenBg },

  // نفس ثلاثية تطبيق العميل حرفياً (`ui.screenContent`): عرض كامل، وسقف،
  // وتوسيط. الثلاثة معاً — العرض الكامل وحده يتجاهل السقف، والسقف وحده يترك
  // العمود ملتصقاً بحافة الشاشة.
  content: { flex: 1, width: "100%" },
  contentCapped: { maxWidth: layout.contentMaxWidth, alignSelf: "center" },

  titleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: layout.touchTarget,
    gap: spacing.md,
  },
  titleText: {
    fontSize: font.size.title,
    fontWeight: font.weight.bold,
    color: colors.textDark,
    textAlign: "right",
  },
  titleAction: { flexShrink: 0 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: providerRadius.card,
  },
  cardPadded: { padding: spacing.lg },
  cardRaised: { ...shadow.soft },
  cardDashed: { borderStyle: "dashed", borderColor: colors.dashedBorder },

  tile: { alignItems: "center", justifyContent: "center" },

  serviceRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  serviceText: { flex: 1, minWidth: 0 },
  serviceTitle: {
    fontSize: font.size.body,
    fontWeight: font.weight.bold,
    color: colors.textDark,
    textAlign: "right",
  },
  serviceSub: { fontSize: font.size.sm, color: colors.textMuted, textAlign: "right", marginTop: 2 },

  detailRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderRow,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabelWrap: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm + 2, flexShrink: 1 },
  detailLabel: { fontSize: font.size.md, color: colors.textMuted, textAlign: "right" },
  detailValue: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color: colors.textDark,
    textAlign: "left",
  },
  detailValueStrong: { fontSize: font.size.body, color: colors.primary },

  stat: {
    flex: 1,
    minWidth: 0,
    borderRadius: providerRadius.tile,
    padding: spacing.md,
    alignItems: "center",
    gap: 2,
  },
  statLight: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderCard },
  statDark: { backgroundColor: onDark.glass, borderWidth: 1, borderColor: onDark.glassBorder },
  statValueRow: { flexDirection: "row-reverse", alignItems: "baseline", gap: 4 },
  statValue: { fontSize: font.size.title, fontWeight: font.weight.bold, color: colors.textDark },
  statValueDark: { color: onDark.text },
  statUnit: { fontSize: font.size.label, fontWeight: font.weight.semibold, color: colors.textMuted },
  statUnitDark: { color: onDark.textMuted2 },
  statLabel: { fontSize: font.size.xs, color: colors.textMuted, textAlign: "center" },
  statLabelDark: { color: onDark.textMuted2 },

  segment: {
    flexDirection: "row-reverse",
    backgroundColor: colors.segmentTrack,
    borderRadius: radius.md,
    padding: 5,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: layout.touchTarget - 4,
    borderRadius: radius.sm,
  },
  segmentTabOn: { backgroundColor: colors.surface, ...shadow.soft },
  segmentText: { fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.textMuted },
  segmentTextOn: { color: colors.primary, fontWeight: font.weight.bold },

  gradBtnWrap: { borderRadius: radius.lg, overflow: "hidden" },
  gradBtnShadow: { ...shadow.button },
  gradBtnShadowSuccess: { ...shadow.button, shadowColor: colors.successShadow },
  gradBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  gradBtnText: { fontSize: font.size.button + 2, fontWeight: font.weight.bold, color: colors.onPrimary },
  disabled: { opacity: 0.5 },

  glassBtn: {
    minHeight: layout.buttonHeight,
    borderRadius: radius.md,
    backgroundColor: onDark.glassRaised,
    borderWidth: 1,
    borderColor: onDark.glassBorderBright,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  glassBtnDanger: { backgroundColor: "transparent", borderColor: onDark.glassBorder },
  glassBtnText: { fontSize: font.size.body, fontWeight: font.weight.bold, color: onDark.text },
  glassBtnTextDanger: { color: onDark.danger },

  halo: { alignItems: "center", justifyContent: "center" },
  haloOuter: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.successBg },
  haloMid: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.successRingMid,
  },
  haloCore: { alignItems: "center", justifyContent: "center", ...shadow.button },

  map: { backgroundColor: colors.mapSurface, overflow: "hidden" },
  mapRounded: { borderRadius: providerRadius.card, borderWidth: 1, borderColor: colors.borderCard },
  roadA: {
    position: "absolute",
    top: "30%",
    left: "-6%",
    width: "112%",
    height: 16,
    backgroundColor: colors.mapRoad,
    transform: [{ rotate: "-7deg" }],
  },
  roadB: {
    position: "absolute",
    top: "62%",
    left: "-6%",
    width: "112%",
    height: 20,
    backgroundColor: colors.mapRoad,
    transform: [{ rotate: "5deg" }],
  },
  roadV: {
    position: "absolute",
    top: 0,
    left: "44%",
    width: 16,
    height: "100%",
    backgroundColor: colors.mapRoad,
    transform: [{ rotate: "4deg" }],
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: providerRadius.sheet,
    borderTopRightRadius: providerRadius.sheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    ...shadow.card,
    shadowOffset: { width: 0, height: -14 },
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderSoft,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },

  floating: { position: "absolute", left: spacing.xl, right: spacing.xl },
});
