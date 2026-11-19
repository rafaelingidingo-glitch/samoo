/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for a single-instance deployment. For horizontally scaled
 * deployments, back this with a shared store (e.g. Redis / database).
 */

type Bucket = {
  hits: number[]; // timestamps (ms) of recent hits
};

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < 15 * 60_000);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * @param key     unique key, e.g. `login:1.2.3.4:user@mail.com`
 * @param limit   max hits inside the window
 * @param windowMs window size in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: limit - bucket.hits.length,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
