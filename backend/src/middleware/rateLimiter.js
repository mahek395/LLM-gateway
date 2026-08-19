import { redis } from "../db/redis.js";

/**
 * Token bucket rate limiting, per API key. Requires authenticateApiKey to
 * have run first — each key gets its own capacity/refill rate.
 */
export async function rateLimiter(req, res, next) {
  const CAPACITY = parseFloat(req.apiKey.rate_limit_capacity);
  const REFILL_PER_SEC = parseFloat(req.apiKey.refill_per_sec);
  const bucketKey = `ratelimit:${req.apiKey.id}`;
  const now = Date.now() / 1000;

  const bucket = await redis.hgetall(bucketKey);
  let tokens = bucket.tokens ? parseFloat(bucket.tokens) : CAPACITY;
  const lastRefill = bucket.lastRefill ? parseFloat(bucket.lastRefill) : now;

  const elapsed = now - lastRefill;
  tokens = Math.min(CAPACITY, tokens + elapsed * REFILL_PER_SEC);

  if (tokens < 1) {
    const secondsToNextToken = (1 - tokens) / REFILL_PER_SEC;
    res.set("Retry-After", Math.ceil(secondsToNextToken).toString());
    return res.status(429).json({ error: "rate_limit_exceeded", retryAfterSeconds: secondsToNextToken });
  }

  tokens -= 1;
  await redis.hset(bucketKey, { tokens: tokens.toString(), lastRefill: now.toString() });
  await redis.expire(bucketKey, 3600);

  next();
}