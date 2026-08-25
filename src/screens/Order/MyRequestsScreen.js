// ============================================================
//  MyRequestsScreen  —  ٩ · طلباتي (نشطة / سابقة)
//
//  التبويبان يُجلبان من الخادم منفصلين (`scope=active|past`) لا يُرشَّحان
//  محلياً: الترشيح المحلي يعني جلب صفحة مختلطة ثم إخفاء نصفها — فيظهر تبويب
//  «سابقة» فارغاً بينما فيه عشرات الطلبات على الصفحة التالية.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Text from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin } from "phosphor-react-native";
import { AsyncContent, PressableScale, StatusPill } from "../../components/ui";
import {
  Card,
  IconTile,
  ProviderScreen,
  ScreenTitle,
  Segmented,
  navClearance,
} from "../../components/providerUi";
import ProviderNav from "../../components/ProviderNav";
import { iconForService } from "../../components/serviceIcon";
import { colors, font, spacing } from "../../theme/theme";
import { fetchRequests } from "../../services/providerApi";
import { arabicNumber, formatDateTimeLabel } from "../../services/datetime";
import { isCanceled, screenForRequest, statusMeta } from "../../services/requestStatus";
import { useSession } from "../../context/SessionContext";

const TABS = [
  { key: "active", label: "نشطة" },
  { key: "past", label: "سابقة" },
];

function RequestCard({ request, onPress }) {
  const state = statusMeta(request.status);
  const canceled = isCanceled(request.status);
  const Icon = iconForService(request);

  const place = [
    request.address,
    request.distanceKm != null ? `${arabicNumber(request.distanceKm)} كم` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${request.serviceName || "خدمة"}، ${state.label}، طلب ${request.shortNumber}`}
      style={s.cardWrap}
    >
      <Card>
        <View style={s.cardRow}>
          {request.isActive ? (
            <IconTile Icon={Icon} size={48} gradient />
          ) : (
            <IconTile
              Icon={Icon}
              size={48}
              tone={canceled ? [colors.dangerBg, colors.danger] : [colors.tint, colors.primaryLight]}
            />
          )}
          <View style={s.cardText}>
            <Text style={s.cardTitle} numberOfLines={1}>
              {request.serviceName || "خدمة"}
            </Text>
            <Text style={s.cardMeta} numberOfLines={1}>
              {`‏#${request.shortNumber} · ${formatDateTimeLabel(
                request.completedAt || request.cancelledAt || request.createdAt,
              )}`}
            </Text>
          </View>
          <StatusPill label={state.label} tone={state.tone} />
        </View>
        {place ? (
          <View style={s.placeRow}>
            <MapPin size={16} color={colors.primaryLight} />
            <Text style={s.placeText} numberOfLines={1}>
              {place}
            </Text>
          </View>
        ) : null}
      </Card>
    </PressableScale>
  );
}

export default function MyRequestsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { unreadNotifications } = useSession();

  const [tab, setTab] = useState("active");
  // ذاكرة لكل تبويب: التبديل ذهاباً وإياباً كان يعيد الجلب في كل مرّة ويومض
  // هيكلاً عظمياً فوق بيانات قُرئت قبل ثانيتين.
  const [data, setData] = useState({ active: null, past: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const load = useCallback(
    async (scope, { silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetchRequests({ scope });
        if (!aliveRef.current) return;
        setData((prev) => ({ ...prev, [scope]: res.requests || [] }));
        setError("");
      } catch (err) {
        if (!aliveRef.current) return;
        setError(err?.message || "تعذّر تحميل الطلبات.");
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(tab, { silent: data[tab] !== null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(tab, { silent: true });
    setRefreshing(false);
  };

  const goTab = (key) => {
    if (key === "home") navigation?.navigate?.("Home");
    if (key === "alerts") navigation?.navigate?.("Notifications");
    if (key === "account") navigation?.navigate?.("Profile");
  };

  const list = data[tab];

  // النشِط يفتح شاشة العمل الموافقة لحالته، والحجز المؤجّل يفتح تفاصيله،
  // والمنتهي يفتح سجلّه للقراءة. خلطها كان يعرض زرّ «بدء التوجيه» فوق طلب
  // أُغلق قبل أسبوع، أو عدّاداً يدور على موعدٍ بعد ثلاثة أيام.
  const openRequest = (request) =>
    navigation?.navigate?.(screenForRequest(request), { id: request.id, request });

  return (
    <ProviderScreen padded={false} withNav bottomInset={false}>
      <View style={s.head}>
        <ScreenTitle title="طلباتي" />
        <Segmented items={TABS} value={tab} onChange={setTab} style={s.segment} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: navClearance(insets.bottom) }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* الفراغ كان يُعرض كمساحة بيضاء صامتة: لا عنوان ولا سبب */}
        <AsyncContent
          loading={loading}
          error={error}
          hasData={!!list?.length}
          isEmpty={!!list && list.length === 0}
          onRetry={() => load(tab)}
          errorTitle="تعذّر تحميل الطلبات"
          empty={{
            title: tab === "active" ? "لا طلبات نشطة" : "لا طلبات سابقة",
            message:
              tab === "active"
                ? "ستظهر هنا الطلبات التي تقبلها حتى إتمامها."
                : "ستظهر هنا الطلبات المكتملة والملغاة.",
          }}
        >
          {(list || []).map((item) => (
            <RequestCard key={item.id} request={item} onPress={() => openRequest(item)} />
          ))}
        </AsyncContent>
      </ScrollView>

      <ProviderNav active="orders" onTab={goTab} unreadCount={unreadNotifications} />
    </ProviderScreen>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  segment: { marginTop: spacing.xs },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },

  cardWrap: { borderRadius: spacing.xl },
  cardRow: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: font.size.md, fontWeight: font.weight.bold, color: colors.textDark, textAlign: "right" },
  cardMeta: { fontSize: font.size.label, color: colors.textMuted, textAlign: "right", marginTop: 2 },
  placeRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderRow,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  placeText: { flex: 1, minWidth: 0, fontSize: font.size.sm, color: colors.textBody, textAlign: "right" },
});
