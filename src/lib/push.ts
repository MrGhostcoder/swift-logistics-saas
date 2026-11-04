// Browser push via Firebase Cloud Messaging. Browser-only: call from event handlers / effects.
import { supabase } from "@/integrations/supabase/client";

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string | undefined) ?? "",
  projectId: (import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string | undefined) ?? "",
  appId: appId ?? "",
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export type PushStatus =
  | "registered"
  | "not-configured"
  | "unsupported"
  | "open-in-new-tab"
  | "denied"
  | "error";

export function pushConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && appId && vapidKey && firebaseConfig.messagingSenderId);
}

export function inIframe() {
  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
}

export function browserPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function deviceLabel() {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

async function getMessagingToken(): Promise<string | null> {
  const [{ initializeApp, getApps }, { getMessaging, getToken, isSupported }] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);
  if (!(await isSupported())) return null;
  const query = new URLSearchParams(firebaseConfig).toString();
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  await navigator.serviceWorker.ready;
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return (await getToken(getMessaging(app), { vapidKey: vapidKey ?? "", serviceWorkerRegistration: registration })) || null;
}

const TOKEN_KEY = "swifttrack-push-token";

/** Must be called from a click: browsers ignore permission prompts without a user gesture. */
export async function enablePush(): Promise<{ status: PushStatus; message?: string }> {
  if (!pushConfigured()) return { status: "not-configured" };
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return { status: "unsupported" };
  if (inIframe()) return { status: "open-in-new-tab" };
  try {
    const { isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return { status: "unsupported" };
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") return { status: "denied" };
    const token = await getMessagingToken();
    if (!token) return { status: "denied" };
    const { error } = await supabase.rpc("register_push_token", { _token: token, _label: deviceLabel() });
    if (error) return { status: "error", message: error.message };
    localStorage.setItem(TOKEN_KEY, token);
    return { status: "registered" };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

/** Removes this browser's device registration. */
export async function disablePushOnThisDevice() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    await supabase.from("push_tokens").delete().eq("token", token);
    localStorage.removeItem(TOKEN_KEY);
  }
  try {
    const { getApps } = await import("firebase/app");
    const { getMessaging, deleteToken } = await import("firebase/messaging");
    const app = getApps()[0];
    if (app) await deleteToken(getMessaging(app));
  } catch {
    // token may already be gone
  }
}

export function thisDeviceToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
}
