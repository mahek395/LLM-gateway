import { getRoutingRules } from "./routingRulesStore.js";

const SIDECAR_URL =
  process.env.HYPER_ROUTER_URL ||
  "http://localhost:8000";

const SIDECAR_TIMEOUT_MS = 800;

export async function routeRequest(
  promptText,
  {
    policy: policyOverride = null,
    lambdaCost: lambdaCostOverride = null,
  } = {}
) {
  const rules = await getRoutingRules();

  const policy =
    policyOverride ||
    rules.routing_policy ||
    "balanced";

  const lambdaCost =
    lambdaCostOverride !== null &&
      lambdaCostOverride !== undefined
      ? Number(lambdaCostOverride)
      : Number(rules.lambda_cost ?? 100.0);

  const cascadeThreshold = Number(
    rules.cascade_threshold ?? 0.60
  );

  const capabilityMargin = Number(
    rules.capability_margin ?? 0.08
  );

  const minCapabilityFloor = Number(
    rules.min_capability_floor ?? 0.0
  );

  const enableCascadeFallback =
    Boolean(
      rules.enable_cascade_fallback ?? true
    );

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, SIDECAR_TIMEOUT_MS);

  const startedAt = Date.now();

  try {
    const response = await fetch(
      `${SIDECAR_URL}/v1/route`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,

          policy,
          lambda_cost: lambdaCost,

          cascade_threshold: cascadeThreshold,
          capability_margin: capabilityMargin,
          min_capability_floor: minCapabilityFloor,
          enable_cascade_fallback:
            enableCascadeFallback,
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(
        `HyperRouter sidecar returned HTTP ${response.status}`
      );
    }

    const decision = await response.json();

    if (
      !decision.selected_model ||
      !decision.provider
    ) {
      throw new Error(
        "Invalid routing decision from HyperRouter sidecar"
      );
    }

    return {
      provider: decision.provider,
      model: decision.selected_model,

      reason: decision.decision_reason,

      promptComplexity:
        decision.prompt_complexity,

      estimatedRoutingCost:
        decision.estimated_cost_usd,

      routingLatencyMs:
        decision.routing_latency_ms,

      fallbackModel:
        decision.fallback_model,

      candidatesEvaluated:
        decision.candidates_evaluated,

      allCandidateScores:
        decision.all_candidate_scores,

      policy,
      lambdaCost,

      sidecarLatencyMs:
        Date.now() - startedAt,

      usedFallback: false,
    };
  } catch (err) {
    const reason =
      err.name === "AbortError"
        ? `sidecar_timeout_${SIDECAR_TIMEOUT_MS}ms`
        : `sidecar_failure: ${err.message}`;

    console.error(
      `[HyperRouter] ${reason}`
    );

    const fallbackModel =
      process.env.GROQ_FALLBACK_MODEL;

    if (!fallbackModel) {
      throw new Error(
        "HyperRouter sidecar failed and no legacy fallback is configured"
      );
    }

    return {
      provider: "groq",
      model: fallbackModel,

      reason,

      promptComplexity: null,
      estimatedRoutingCost: null,
      routingLatencyMs: null,

      fallbackModel: null,
      candidatesEvaluated: 0,
      allCandidateScores: {},

      policy,
      lambdaCost,

      sidecarLatencyMs:
        Date.now() - startedAt,

      usedFallback: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}