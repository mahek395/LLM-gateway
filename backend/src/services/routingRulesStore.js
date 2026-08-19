import { pool } from "../db/pool.js";
import { redis } from "../db/redis.js";

const CACHE_KEY = "routing_rules:active";
const CACHE_TTL_SECONDS = 10;

const DEFAULT_RULES = {
  routing_policy: "balanced",
  lambda_cost: 100.0,
  cascade_threshold: 0.60,
  capability_margin: 0.08,
  min_capability_floor: 0.0,
  enable_cascade_fallback: true,
  cache_similarity_threshold: 0.95,
};

function normalizeRules(row) {
  return {
    routing_policy:
      row.routing_policy ?? DEFAULT_RULES.routing_policy,

    lambda_cost:
      Number(row.lambda_cost ?? DEFAULT_RULES.lambda_cost),

    cascade_threshold:
      Number(
        row.cascade_threshold ??
        DEFAULT_RULES.cascade_threshold
      ),

    capability_margin:
      Number(
        row.capability_margin ??
        DEFAULT_RULES.capability_margin
      ),

    min_capability_floor:
      Number(
        row.min_capability_floor ??
        DEFAULT_RULES.min_capability_floor
      ),

    enable_cascade_fallback:
      row.enable_cascade_fallback ??
      DEFAULT_RULES.enable_cascade_fallback,

    cache_similarity_threshold:
      Number(
        row.cache_similarity_threshold ??
        DEFAULT_RULES.cache_similarity_threshold
      ),
  };
}

export async function getRoutingRules() {
  const cached = await redis.get(CACHE_KEY);

  if (cached) {
    return JSON.parse(cached);
  }

  const result = await pool.query(
    `SELECT
       routing_policy,
       lambda_cost,
       cascade_threshold,
       capability_margin,
       min_capability_floor,
       enable_cascade_fallback,
       cache_similarity_threshold
     FROM routing_rules
     WHERE id = 1`
  );

  if (!result.rows[0]) {
    throw new Error(
      "routing_rules row with id=1 does not exist"
    );
  }

  const rules = normalizeRules(result.rows[0]);

  await redis.set(
    CACHE_KEY,
    JSON.stringify(rules),
    "EX",
    CACHE_TTL_SECONDS
  );

  return rules;
}

export async function updateRoutingRules(updates) {
  const routingPolicy =
    updates.routing_policy ??
    DEFAULT_RULES.routing_policy;

  const lambdaCost = Number(
    updates.lambda_cost ??
    DEFAULT_RULES.lambda_cost
  );

  const cascadeThreshold = Number(
    updates.cascade_threshold ??
    DEFAULT_RULES.cascade_threshold
  );

  const capabilityMargin = Number(
    updates.capability_margin ??
    DEFAULT_RULES.capability_margin
  );

  const minCapabilityFloor = Number(
    updates.min_capability_floor ??
    DEFAULT_RULES.min_capability_floor
  );

  const enableCascadeFallback =
    updates.enable_cascade_fallback ??
    DEFAULT_RULES.enable_cascade_fallback;

  const cacheSimilarityThreshold = Number(
    updates.cache_similarity_threshold ??
    DEFAULT_RULES.cache_similarity_threshold
  );

  // --------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------

  const validPolicies = new Set([
    "balanced",
    "cost_minimizing",
    "quality_maximizing",
    "threshold_cascade",
    "latency_minimizing",
  ]);

  if (!validPolicies.has(routingPolicy)) {
    throw new Error(
      `Invalid routing policy: ${routingPolicy}`
    );
  }

  if (!Number.isFinite(lambdaCost) || lambdaCost < 0) {
    throw new Error(
      "lambda_cost must be a non-negative number"
    );
  }

  if (
    !Number.isFinite(cascadeThreshold) ||
    cascadeThreshold < 0 ||
    cascadeThreshold > 1
  ) {
    throw new Error(
      "cascade_threshold must be between 0 and 1"
    );
  }

  if (
    !Number.isFinite(capabilityMargin) ||
    capabilityMargin < 0 ||
    capabilityMargin > 1
  ) {
    throw new Error(
      "capability_margin must be between 0 and 1"
    );
  }

  if (
    !Number.isFinite(minCapabilityFloor) ||
    minCapabilityFloor < 0 ||
    minCapabilityFloor > 1
  ) {
    throw new Error(
      "min_capability_floor must be between 0 and 1"
    );
  }

  if (
    !Number.isFinite(cacheSimilarityThreshold) ||
    cacheSimilarityThreshold < 0 ||
    cacheSimilarityThreshold > 1
  ) {
    throw new Error(
      "cache_similarity_threshold must be between 0 and 1"
    );
  }

  const result = await pool.query(
    `UPDATE routing_rules
     SET
       routing_policy = $1,
       lambda_cost = $2,
       cascade_threshold = $3,
       capability_margin = $4,
       min_capability_floor = $5,
       enable_cascade_fallback = $6,
       cache_similarity_threshold = $7,
       updated_at = now()
     WHERE id = 1
     RETURNING
       routing_policy,
       lambda_cost,
       cascade_threshold,
       capability_margin,
       min_capability_floor,
       enable_cascade_fallback,
       cache_similarity_threshold`,
    [
      routingPolicy,
      lambdaCost,
      cascadeThreshold,
      capabilityMargin,
      minCapabilityFloor,
      Boolean(enableCascadeFallback),
      cacheSimilarityThreshold,
    ]
  );

  if (!result.rows[0]) {
    throw new Error(
      "routing_rules row with id=1 does not exist"
    );
  }

  const updated = normalizeRules(result.rows[0]);

  await redis.del(CACHE_KEY);

  return updated;
}