// ============================================================
//  tokenStorage — حفظ/قراءة توكنات الجلسة بشكل آمن (SecureStore)
//
//  مفاتيح التخزين تحمل بادئة `chp_` لا `ch_`: التطبيقان قد يُثبَّتان على جهاز
//  واحد (فنّي هو عميل أيضاً)، والمفتاح المشترك كان سيجعل دخول أحدهما يطرد
//  الآخر من جلسته بصمت.
// ============================================================
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// SecureStore لا يعمل على الويب — نستخدم localStorage كبديل عند التشغيل في المتصفح.
const isWeb = Platform.OS === "web";

async function setItem(key, value) {
  if (isWeb) {
    try { globalThis.localStorage?.setItem(key, value); } catch {}
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key) {
  if (isWeb) {
    try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key) {
  if (isWeb) {
    try { globalThis.localStorage?.removeItem(key); } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

const ACCESS_KEY = "chp_access_token";
const REFRESH_KEY = "chp_refresh_token";
const USER_KEY = "chp_user";

export async function saveTokens({ accessToken, refreshToken }) {
  if (accessToken) await setItem(ACCESS_KEY, accessToken);
  if (refreshToken) await setItem(REFRESH_KEY, refreshToken);
}

export async function getAccessToken() {
  return getItem(ACCESS_KEY);
}

export async function getRefreshToken() {
  return getItem(REFRESH_KEY);
}

export async function saveUser(user) {
  if (user) await setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser() {
  const raw = await getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    // قيمة تالفة من إصدار سابق: تجاهلها بدل إسقاط الإقلاع كله عليها
    return null;
  }
}

export async function saveSession({ user, accessToken, refreshToken }) {
  await saveTokens({ accessToken, refreshToken });
  await saveUser(user);
}

export async function clearSession() {
  await deleteItem(ACCESS_KEY);
  await deleteItem(REFRESH_KEY);
  await deleteItem(USER_KEY);
}

export async function hasSession() {
  return !!(await getAccessToken());
}
