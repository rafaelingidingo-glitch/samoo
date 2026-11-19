import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isProd } from "@/lib/env";

/**
 * Session management.
 *
 * Stateless signed JWT (HS256) stored in an HttpOnly, SameSite=Lax cookie.
 * The AUTH_SECRET never leaves the server. Sessions expire after 8 hours.
 *
 * The cookie/JWT is only the transport layer — every privileged operation
 * re-reads the user from the database and re-checks `isActive` and `role`
 * (see lib/auth/guards.ts). Never trust the JWT role claim alone.
 */

export const SESSION_COOKIE_NAME = "sawee_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export type SessionPayload = {
  sub: string; // user id
  role: string; // SUPER_ADMIN | ADMIN | EDITOR
  name: string;
  email: string;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (isProd) {
      throw new Error(
        "AUTH_SECRET is missing or too weak. Set a 32+ char secret in the environment."
      );
    }
    // Development fallback so the sandbox boots without extra setup.
    return new TextEncoder().encode("sawee-dev-only-secret-do-not-use-in-production!");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || typeof payload.role !== "string") return null;
    return {
      sub: payload.sub,
      role: payload.role,
      name: typeof payload.name === "string" ? payload.name : "",
      email: typeof payload.email === "string" ? payload.email : "",
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<string> {
  const token = await signSession(payload);
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    "Path=/",
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
