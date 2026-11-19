import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Edge middleware (Next 16 proxy).
 *
 * First line of defence for /admin/dashboard routes: verifies the session
 * JWT signature and expiry before the request even reaches a server
 * component. Full authorization (DB lookup of user + role + isActive) is
 * performed independently in every admin page and API handler — this layer
 * never substitutes for server-side checks.
 */

const SESSION_COOKIE_NAME = "sawee_session";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    return new TextEncoder().encode("sawee-dev-only-secret-do-not-use-in-production!");
  }
  return new TextEncoder().encode(secret);
}

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/admin/dashboard")) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    let valid = false;
    if (token) {
      try {
        await jwtVerify(token, getSecretKey());
        valid = true;
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
