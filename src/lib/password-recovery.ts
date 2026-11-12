import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

const key = "swifttrack-password-recovery";
type Recovery = { userId: string; expiresAt: number };

export function validRecovery(value: Recovery | null, userId: string, now: number) {
  return !!value && value.userId === userId && value.expiresAt > now;
}

export function recordRecovery(event: AuthChangeEvent, session: Session | null) {
  if (event === "SIGNED_OUT" || event === "USER_UPDATED") {
    window.sessionStorage.removeItem(key);
  } else if (event === "PASSWORD_RECOVERY" && session?.user && session.expires_at) {
    window.sessionStorage.setItem(key, JSON.stringify({ userId: session.user.id, expiresAt: session.expires_at * 1000 }));
  }
}

export function hasRecovery(userId: string) {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(key) ?? "null") as Recovery | null;
    return validRecovery(value, userId, Date.now());
  } catch {
    return false;
  }
}

export function clearRecovery() {
  window.sessionStorage.removeItem(key);
}