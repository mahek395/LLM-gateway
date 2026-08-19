import express from "express";
import { pool } from "../db/pool.js";
import { requireAdminAuth } from "../middleware/requireAdminAuth.js";

export const logsRouter = express.Router();
logsRouter.use(requireAdminAuth);

logsRouter.get("/admin/logs", async (req, res) => {
  const { provider, cacheHit, search, page = 1, pageSize = 25 } = req.query;

  const conditions = [];
  const params = [];

  if (provider) { params.push(provider); conditions.push(`provider = $${params.length}`); }
  if (cacheHit !== undefined) { params.push(cacheHit === "true"); conditions.push(`cache_hit = $${params.length}`); }
  if (search) { params.push(`%${search}%`); conditions.push(`prompt_text ILIKE $${params.length}`); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(parseInt(pageSize, 10) || 25, 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  const rows = await pool.query(
    `SELECT * FROM request_log ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    params
  );
  const countResult = await pool.query(`SELECT COUNT(*) FROM request_log ${whereClause}`, params);

  res.json({ rows: rows.rows, total: Number(countResult.rows[0].count), page: Number(page), pageSize: limit });
});