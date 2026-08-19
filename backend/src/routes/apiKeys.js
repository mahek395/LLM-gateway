import express from "express";
import crypto from "crypto";
import { pool } from "../db/pool.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const apiKeysRouter = express.Router();
apiKeysRouter.use(requireAdminAuth);

function generateRawKey() {
  return "gwk_" + crypto.randomBytes(24).toString("hex");
}

function hashKey(rawKey) {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

apiKeysRouter.get("/admin/api-keys", async (req, res) => {
  const result = await pool.query(
    `SELECT id, label, rate_limit_capacity, refill_per_sec, created_at, revoked_at
     FROM api_keys ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

apiKeysRouter.post("/admin/api-keys", async (req, res) => {
  const { label, rateLimitCapacity = 20, refillPerSec = 0.5 } = req.body;
  if (!label) return res.status(400).json({ error: "label is required" });

  const rawKey = generateRawKey();
  const keyHash = hashKey(rawKey);

  const result = await pool.query(
    `INSERT INTO api_keys (key_hash, label, rate_limit_capacity, refill_per_sec)
     VALUES ($1, $2, $3, $4) RETURNING id, label, created_at`,
    [keyHash, label, rateLimitCapacity, refillPerSec]
  );

  res.status(201).json({ ...result.rows[0], rawKey });
});

apiKeysRouter.delete("/admin/api-keys/:id", async (req, res) => {
  await pool.query("UPDATE api_keys SET revoked_at = now() WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});