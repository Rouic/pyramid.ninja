/**
 * Anonymous Auth via PaaS Managed Auth
 *
 * Simulates Firebase anonymous auth by auto-generating credentials
 * and storing them in localStorage. Uses the PaaS auth API for
 * signup/login/verify/refresh.
 */

import { v4 as uuidv4 } from "uuid";

const PAAS_SLUG = process.env.NEXT_PUBLIC_PAAS_SLUG || "pyramid-ninja";

// Use same-origin proxy through injector sidecar to avoid CORS
const isBrowser = typeof window !== "undefined";
const AUTH_URL = isBrowser
  ? `/__rouic-auth/${PAAS_SLUG}`
  : `${process.env.NEXT_PUBLIC_PAAS_URL || "https://system.rouic.com"}/api/v1/auth/${PAAS_SLUG}`;

const STORAGE_KEYS = {
  jwt: "pyramid_jwt",
  credentials: "pyramid_credentials",
  userId: "pyramid_user_id",
};

export interface AuthUser {
  id: string;
  uid: string; // alias for id, matches Firebase convention
  email: string;
}

interface AuthResult {
  user: AuthUser | null;
  token: string | null;
  error?: string;
}

async function authRequest(
  action: string,
  body: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  return res.json();
}

function getStored<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

function setStored(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function clearStored() {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

/**
 * Sign in anonymously. Tries (in order):
 * 1. Verify existing JWT
 * 2. Login with stored credentials
 * 3. Signup with fresh auto-generated credentials
 */
export async function signInAnonymously(): Promise<AuthResult> {
  // 1. Try to verify existing JWT
  const existingJwt = getStored<string>(STORAGE_KEYS.jwt);
  if (existingJwt) {
    try {
      const res = await authRequest("verify", { token: existingJwt });
      if (res.success && res.user) {
        const user = res.user as { id: string; email: string };
        return {
          user: { id: user.id, uid: user.id, email: user.email },
          token: existingJwt,
        };
      }
    } catch {
      // JWT expired or invalid, try login
    }
  }

  // 2. Try login with stored credentials
  const creds = getStored<{ email: string; password: string }>(
    STORAGE_KEYS.credentials
  );
  if (creds) {
    try {
      const res = await authRequest("login", {
        email: creds.email,
        password: creds.password,
      });
      if (res.success && res.token && res.user) {
        const user = res.user as { id: string; email: string };
        setStored(STORAGE_KEYS.jwt, res.token);
        setStored(STORAGE_KEYS.userId, user.id);
        return {
          user: { id: user.id, uid: user.id, email: user.email },
          token: res.token as string,
        };
      }
    } catch {
      // Login failed, try fresh signup
    }
  }

  // 3. Fresh signup with auto-generated credentials
  const anonId = uuidv4().replace(/-/g, "").slice(0, 16);
  const email = `anon_${anonId}@pyramid.ninja`;
  const password = uuidv4();

  try {
    const res = await authRequest("signup", {
      email,
      password,
      name: `Player ${anonId.slice(0, 6)}`,
    });

    if (res.success && res.token && res.user) {
      const user = res.user as { id: string; email: string };
      setStored(STORAGE_KEYS.jwt, res.token);
      setStored(STORAGE_KEYS.credentials, { email, password });
      setStored(STORAGE_KEYS.userId, user.id);
      return {
        user: { id: user.id, uid: user.id, email: user.email },
        token: res.token as string,
      };
    }

    return { user: null, token: null, error: (res.error as string) || "Signup failed" };
  } catch (err) {
    return {
      user: null,
      token: null,
      error: err instanceof Error ? err.message : "Auth failed",
    };
  }
}

/**
 * Sign out — clears stored credentials and JWT.
 */
export function signOut() {
  clearStored();
}

/**
 * Get the currently stored user ID (synchronous, from localStorage).
 * Returns null if not signed in.
 */
export function getStoredUserId(): string | null {
  return getStored<string>(STORAGE_KEYS.userId);
}

/**
 * Get the currently stored JWT token.
 */
export function getStoredToken(): string | null {
  return getStored<string>(STORAGE_KEYS.jwt);
}
