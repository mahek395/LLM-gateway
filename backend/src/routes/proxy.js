import express from "express";
import { v4 as uuidv4 } from "uuid";

import { findCachedResponse, storeInCache } from "../services/cache.js";
import { routeRequest } from "../services/router.js";
import { getRegisteredModel } from "../services/registeredModels.js";
import { callGeneric } from "../services/providers/generic.js";

import { estimateCost } from "../utils/cost.js";
import { pool } from "../db/pool.js";

import { authenticateApiKey } from "../middleware/authenticateApiKey.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

export const proxyRouter = express.Router();

proxyRouter.post(
  "/v1/chat/completions",
  authenticateApiKey,
  rateLimiter,
  async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();

    // ----------------------------------------------------------
    // 1. Extract OpenAI-compatible request
    // ----------------------------------------------------------
    const {
      messages,
      model: requestedModel = "auto",
      temperature,
      max_tokens,
      tools,
      policy: requestedPolicy,
      lambda_cost: requestedLambdaCost,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "invalid_request",
        detail: "body must include a non-empty 'messages' array",
      });
    }

    // Convert messages into text for the routing engine.
    // The original messages array is preserved for the provider call.
    const prompt = messages
      .map((message) => {
        const role = message?.role ?? "user";

        const content =
          typeof message?.content === "string"
            ? message.content
            : JSON.stringify(message?.content ?? "");

        return `${role}: ${content}`;
      })
      .join("\n");

    try {
      // ----------------------------------------------------------
      // 2. Semantic cache FIRST
      // ----------------------------------------------------------
      const cached = await findCachedResponse(prompt);

      if (cached) {
        const latencyMs = Date.now() - startTime;

        await logRequest({
          requestId,
          prompt,
          cacheHit: true,
          provider: cached.provider,
          model: cached.model,
          promptTokens: null,
          completionTokens: null,
          costUsd: 0,
          latencyMs,
          promptComplexity: null,
        });

        return res.json({
          id: requestId,
          object: "chat.completion",
          cacheHit: true,
          similarity: cached.similarity,
          provider: cached.provider,
          model: cached.model,
          response: cached.responseText,
          latencyMs,
        });
      }

      // ----------------------------------------------------------
      // 3. Determine which model should handle the request
      //
      // model = "auto"
      //     -> ask Python router
      //
      // model = "some-registered-model"
      //     -> bypass Python routing
      // ----------------------------------------------------------

      let provider;
      let model;
      let reason;

      let promptComplexity = null;
      let estimatedRoutingCost = null;
      let routingLatencyMs = null;
      let fallbackModel = null;
      let candidatesEvaluated = 0;
      let allCandidateScores = {};

      let policy = requestedPolicy;
      let lambdaCost = requestedLambdaCost;
      let sidecarLatencyMs = null;
      let usedFallback = false;

      if (requestedModel === "auto") {
        // --------------------------------------------------------
        // AUTO MODE
        // --------------------------------------------------------
        const routing = await routeRequest(prompt, {
          policy: requestedPolicy,
          lambdaCost: requestedLambdaCost,
        });

        provider = routing.provider;
        model = routing.model;
        reason = routing.reason;

        promptComplexity = routing.promptComplexity;
        estimatedRoutingCost = routing.estimatedRoutingCost;
        routingLatencyMs = routing.routingLatencyMs;

        fallbackModel = routing.fallbackModel;
        candidatesEvaluated = routing.candidatesEvaluated;
        allCandidateScores = routing.allCandidateScores;

        policy = routing.policy;
        lambdaCost = routing.lambdaCost;
        sidecarLatencyMs = routing.sidecarLatencyMs;
        usedFallback = routing.usedFallback;
      } else {
        // --------------------------------------------------------
        // EXPLICIT MODEL MODE
        // --------------------------------------------------------
        const explicitModel = await getRegisteredModel(requestedModel);

        if (!explicitModel) {
          return res.status(400).json({
            error: "model_not_registered",
            detail: `Model '${requestedModel}' is not registered`,
          });
        }

        model = explicitModel.modelId;
        provider = explicitModel.provider;
        reason = "Direct user model specification";
      }

      // ----------------------------------------------------------
      // 4. Resolve the selected model from PostgreSQL
      // ----------------------------------------------------------
      const registeredModel = await getRegisteredModel(model);

      if (!registeredModel) {
        throw new Error(
          `Selected model '${model}' is not registered in registered_models`
        );
      }

      // ----------------------------------------------------------
      // 5. Call selected model through generic provider
      //
      // IMPORTANT:
      // model = our internal HyperRouter ID
      //
      // providerModelId = actual ID expected by the provider
      //
      // Example:
      //
      // model:
      //   groq/llama-3.3-70b-versatile
      //
      // providerModelId:
      //   llama-3.3-70b-versatile
      // ----------------------------------------------------------
      const result = await callGeneric({
        model: registeredModel.modelId,
        providerModelId: registeredModel.providerModelId,
        baseUrl: registeredModel.baseUrl,
        apiKey: registeredModel.apiKey,
        messages,
        temperature,
        maxTokens: max_tokens,
        tools,
      });

      // ----------------------------------------------------------
      // 6. Calculate actual request cost
      // ----------------------------------------------------------
      const latencyMs = Date.now() - startTime;

      const costUsd = estimateCost(
        registeredModel.inputCostPerM,
        registeredModel.outputCostPerM,
        result.promptTokens,
        result.completionTokens
      );

      // ----------------------------------------------------------
      // 7. Store successful response in semantic cache
      // ----------------------------------------------------------
      storeInCache(
        prompt,
        result.text,
        provider,
        model
      ).catch((err) => {
        console.error(
          "failed to store in cache:",
          err.message
        );
      });

      // ----------------------------------------------------------
      // 8. Log request
      // ----------------------------------------------------------
      await logRequest({
        requestId,
        prompt,
        cacheHit: false,
        provider,
        model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        costUsd,
        latencyMs,
        promptComplexity,
      });

      // ----------------------------------------------------------
      // 9. Return response
      // ----------------------------------------------------------
      return res.json({
        id: requestId,
        object: "chat.completion",

        cacheHit: false,

        provider,
        model,

        routing: {
          reason,
          promptComplexity,
          policy,
          lambdaCost,

          routingLatencyMs,
          sidecarLatencyMs,

          candidatesEvaluated,
          fallbackModel,

          usedFallback: Boolean(usedFallback),

          candidateScores: allCandidateScores,

          estimatedRoutingCost,
        },

        response: result.text,

        usage: {
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens:
            (result.promptTokens ?? 0) +
            (result.completionTokens ?? 0),
        },

        estimatedCostUsd: costUsd,

        latencyMs,
      });
    } catch (err) {
      // ----------------------------------------------------------
      // 10. Error handling
      // ----------------------------------------------------------
      console.error(
        "gateway request failed:",
        err.response?.data || err.message
      );

      return res.status(502).json({
        error: "upstream_provider_error",
        detail: err.message,
      });
    }
  }
);

// ----------------------------------------------------------------
// PostgreSQL request logging
// ----------------------------------------------------------------
async function logRequest({
  requestId,
  prompt,
  cacheHit,
  provider,
  model,
  promptTokens,
  completionTokens,
  costUsd,
  latencyMs,
  promptComplexity,
}) {
  await pool.query(
    `INSERT INTO request_log
      (
        request_id,
        prompt_text,
        cache_hit,
        provider,
        model,
        prompt_tokens,
        completion_tokens,
        estimated_cost_usd,
        latency_ms,
        prompt_complexity
      )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      requestId,
      prompt,
      cacheHit,
      provider,
      model,
      promptTokens,
      completionTokens,
      costUsd,
      latencyMs,
      promptComplexity,
    ]
  );
}