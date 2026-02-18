/**
 * Auth Store - Client-side auth state for React islands
 *
 * This store is hydrated from server-side data injected by the middleware.
 * It does NOT hold tokens (those are httpOnly cookies managed server-side).
 */

import { atom } from "nanostores";
import type { DirectusUser } from "../lib/types";

export const $isLoggedIn = atom<boolean>(false);
export const $currentUser = atom<DirectusUser | null>(null);

export function setUser(user: DirectusUser | null): void {
  $currentUser.set(user);
  $isLoggedIn.set(user !== null && user.status === "active");
}

export function clearUser(): void {
  $currentUser.set(null);
  $isLoggedIn.set(false);
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore errors
  }
  // Clear cart on logout - prices are user-specific, must not persist
  try {
    localStorage.removeItem("alcora-cart");
  } catch {}
  clearUser();
  window.location.href = "/login";
}
