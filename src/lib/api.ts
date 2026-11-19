import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { isProd } from "@/lib/env";

/**
 * Consistent API error handling + security helpers.
 * Never leaks stack traces or database internals to clients.
 */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status });
}

/**
 * Standard error mapper for route handlers.
 * Returns safe messages; logs unexpected errors server-side.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return jsonError(error.status, error.message);
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    const field = first?.path?.join(".");
    return jsonError(
      400,
      field ? `Invalid value for "${field}".` : "Invalid request data."
    );
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return jsonError(409, "A record with these details already exists.");
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return jsonError(400, "The request could not be completed.");
  }
  // Unexpected — log server-side only.
  console.error("[api] unhandled error:", error);
  return jsonError(
    500,
    isProd
      ? "An unexpected error occurred. Please try again."
      : `Internal error: ${error instanceof Error ? error.message : String(error)}`
  );
}

/** Wrap a route handler with consistent error handling. */
export function withApi<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * CSRF defence for cookie-authenticated mutations:
 * verifies that the Origin header (when present) matches the request host.
 * Combined with SameSite=Lax cookies this blocks cross-site form posts.
 */
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return; // same-origin fetches may omit Origin in some clients
  const host = req.headers.get("host");
  try {
    const originHost = new URL(origin).host;
    if (host && originHost !== host) {
      throw new ApiError(403, "Cross-origin request rejected.");
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(403, "Invalid request origin.");
  }
}

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** Parse JSON body with a size ceiling to prevent abuse. */
export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}
