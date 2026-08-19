import express from "express";
import { pool } from "../../db/pool.js";
import { encryptSecret } from "../../utils/crypto.js";
import { requireAdminAuth } from "../../middleware/requireAdminAuth.js";

const HYPER_ROUTER_URL =
    process.env.HYPER_ROUTER_URL || "http://localhost:8000";

export const modelsAdminRouter = express.Router();

function validateModelInput({
    modelId,
    providerModelId,
    baseUrl,
    inputCostPerM,
    outputCostPerM,
    capabilityScore,
    contextWindow,
    maxOutputTokens,
    avgLatencyMs,
}) {
    if (!modelId) {
        return "modelId is required";
    }

    if (!providerModelId) {
        return "providerModelId is required";
    }

    if (!baseUrl) {
        return "baseUrl is required";
    }

    if (
        inputCostPerM != null &&
        (!Number.isFinite(Number(inputCostPerM)) ||
            Number(inputCostPerM) < 0)
    ) {
        return "inputCostPerM must be a non-negative number";
    }

    if (
        outputCostPerM != null &&
        (!Number.isFinite(Number(outputCostPerM)) ||
            Number(outputCostPerM) < 0)
    ) {
        return "outputCostPerM must be a non-negative number";
    }

    if (
        capabilityScore != null &&
        (!Number.isFinite(Number(capabilityScore)) ||
            Number(capabilityScore) < 0 ||
            Number(capabilityScore) > 1)
    ) {
        return "capabilityScore must be between 0 and 1";
    }

    if (
        contextWindow != null &&
        (!Number.isInteger(Number(contextWindow)) ||
            Number(contextWindow) <= 0)
    ) {
        return "contextWindow must be a positive integer";
    }

    if (
        maxOutputTokens != null &&
        (!Number.isInteger(Number(maxOutputTokens)) ||
            Number(maxOutputTokens) <= 0)
    ) {
        return "maxOutputTokens must be a positive integer";
    }

    if (
        avgLatencyMs != null &&
        (!Number.isFinite(Number(avgLatencyMs)) ||
            Number(avgLatencyMs) < 0)
    ) {
        return "avgLatencyMs must be non-negative";
    }

    return null;
}

// ------------------------------------------------------------------
// Create / update model
// ------------------------------------------------------------------

modelsAdminRouter.post(
    "/admin/models",
    requireAdminAuth,
    async (req, res) => {
        try {
            const {
                modelId,
                providerModelId,
                providerLabel,
                baseUrl,
                apiKey,
                inputCostPerM,
                outputCostPerM,
                capabilityScore,
                contextWindow,
                maxOutputTokens,
                features,
                avgLatencyMs,
                description,
            } = req.body;

            const validationError = validateModelInput({
                modelId,
                providerModelId,
                baseUrl,
                inputCostPerM,
                outputCostPerM,
                capabilityScore,
                contextWindow,
                maxOutputTokens,
                avgLatencyMs,
            });

            if (validationError) {
                return res.status(400).json({
                    error: "invalid_model",
                    detail: validationError,
                });
            }

            const existing = await pool.query(
                `SELECT model_id, api_key_encrypted
         FROM registered_models
         WHERE model_id = $1`,
                [modelId]
            );

            const existingRow = existing.rows[0];

            if (!existingRow && !apiKey) {
                return res.status(400).json({
                    error: "apiKey is required when registering a new model",
                });
            }

            const encryptedApiKey = apiKey
                ? encryptSecret(apiKey)
                : existingRow.api_key_encrypted;

            await pool.query(
                `INSERT INTO registered_models
        (
          model_id,
          provider_model_id,
          provider_label,
          base_url,
          api_key_encrypted,
          input_cost_per_m,
          output_cost_per_m,
          capability_score,
          context_window,
          max_output_tokens,
          features,
          avg_latency_ms,
          description
        )
        VALUES
        (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13
        )
        ON CONFLICT (model_id)
        DO UPDATE SET
          provider_model_id = EXCLUDED.provider_model_id,
          provider_label = EXCLUDED.provider_label,
          base_url = EXCLUDED.base_url,
          api_key_encrypted = EXCLUDED.api_key_encrypted,
          input_cost_per_m = EXCLUDED.input_cost_per_m,
          output_cost_per_m = EXCLUDED.output_cost_per_m,
          capability_score = EXCLUDED.capability_score,
          context_window = EXCLUDED.context_window,
          max_output_tokens = EXCLUDED.max_output_tokens,
          features = EXCLUDED.features,
          avg_latency_ms = EXCLUDED.avg_latency_ms,
          description = EXCLUDED.description,
          updated_at = now()`,
                [
                    modelId,
                    providerModelId,
                    providerLabel ?? "",
                    baseUrl,
                    encryptedApiKey,
                    inputCostPerM ?? 0,
                    outputCostPerM ?? 0,
                    capabilityScore ?? 0,
                    contextWindow ?? 128000,
                    maxOutputTokens ?? 4096,
                    JSON.stringify(features ?? []),
                    avgLatencyMs ?? 600,
                    description ?? "",
                ]
            );

            await triggerSidecarReload();

            return res.status(existingRow ? 200 : 201).json({
                saved: modelId,
                providerModelId,
                mode: existingRow ? "updated" : "created",
            });
        } catch (err) {
            console.error("save model failed:", err);

            return res.status(500).json({
                error: "model_save_failed",
                detail: err.message,
            });
        }
    }
);

// ------------------------------------------------------------------
// Delete
// ------------------------------------------------------------------

modelsAdminRouter.delete(
    "/admin/models/:modelId(*)",
    requireAdminAuth,
    async (req, res) => {
        try {
            const modelId = req.params.modelId;

            const result = await pool.query(
                `DELETE FROM registered_models
         WHERE model_id = $1`,
                [modelId]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({
                    error: "model_not_found",
                    modelId,
                });
            }

            await triggerSidecarReload();

            return res.json({
                deleted: modelId,
            });
        } catch (err) {
            console.error("delete model failed:", err);

            return res.status(500).json({
                error: "model_delete_failed",
                detail: err.message,
            });
        }
    }
);

// ------------------------------------------------------------------
// List
// ------------------------------------------------------------------

modelsAdminRouter.get(
    "/admin/models",
    requireAdminAuth,
    async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT
            model_id,
            provider_model_id,
            provider_label,
            base_url,
            input_cost_per_m,
            output_cost_per_m,
            capability_score,
            context_window,
            max_output_tokens,
            features,
            avg_latency_ms,
            description,
            updated_at
         FROM registered_models
         ORDER BY model_id`
            );

            return res.json(result.rows);
        } catch (err) {
            console.error("list models failed:", err);

            return res.status(500).json({
                error: "model_list_failed",
                detail: err.message,
            });
        }
    }
);

async function triggerSidecarReload() {
    try {
        const response = await fetch(
            `${HYPER_ROUTER_URL}/internal/models/reload`,
            {
                method: "POST",
            }
        );

        if (!response.ok) {
            throw new Error(
                `Sidecar reload returned HTTP ${response.status}`
            );
        }
    } catch (err) {
        console.error(
            "sidecar reload trigger failed:",
            err.message
        );
    }
}