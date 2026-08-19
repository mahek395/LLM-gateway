import crypto from "crypto";
import { pool } from "../db/pool.js";

function hashKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export async function authenticateApiKey(req, res, next) {
  const rawKey = req.header("x-api-key");
  if (!rawKey) return res.status(401).json({ error: "missing_api_key" });

  const keyHash = hashKey(rawKey);
  const result = await pool.query(
    `SELECT id, label, rate_limit_capacity, refill_per_sec, revoked_at
     FROM api_keys WHERE key_hash = $1`,
    [keyHash]
  );

  const apiKey = result.rows[0];
  if (!apiKey || apiKey.revoked_at) {
    return res.status(401).json({ error: "invalid_or_revoked_api_key" });
  }

  req.apiKey = apiKey;
  next();
}