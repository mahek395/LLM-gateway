import express from "express";
import { pool } from "../db/pool.js";

export const statsRouter = express.Router();

statsRouter.get("/v1/stats", async (req, res) => {
  const totals = await pool.query(`
    SELECT
      COUNT(*) AS total_requests,
      COUNT(*) FILTER (WHERE cache_hit) AS cache_hits,
      COALESCE(SUM(estimated_cost_usd), 0) AS total_cost_usd,
      COALESCE(AVG(latency_ms) FILTER (WHERE cache_hit), 0) AS avg_latency_cache_hit_ms,
      COALESCE(AVG(latency_ms) FILTER (WHERE NOT cache_hit), 0) AS avg_latency_cache_miss_ms
    FROM request_log
  `);

  const byProvider = await pool.query(`
    SELECT provider, model, COUNT(*) AS requests, COALESCE(SUM(estimated_cost_usd), 0) AS cost_usd
    FROM request_log
    WHERE NOT cache_hit
    GROUP BY provider, model
    ORDER BY requests DESC
  `);

  const row = totals.rows[0];
  const cacheHitRate = row.total_requests > 0 ? row.cache_hits / row.total_requests : 0;

  res.json({
    totalRequests: Number(row.total_requests),
    cacheHits: Number(row.cache_hits),
    cacheHitRate: Number(cacheHitRate.toFixed(4)),
    totalCostUsd: Number(row.total_cost_usd),
    avgLatencyCacheHitMs: Number(row.avg_latency_cache_hit_ms),
    avgLatencyCacheMissMs: Number(row.avg_latency_cache_miss_ms),
    byProvider: byProvider.rows,
  });
});