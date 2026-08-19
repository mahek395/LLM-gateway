import { pool } from "../db/pool.js";
import { decryptSecret } from "../utils/crypto.js";

export async function getRegisteredModel(modelId) {
    const result = await pool.query(
        `SELECT
        model_id,
        provider_model_id,
        provider_label,
        base_url,
        api_key_encrypted,
        input_cost_per_m,
        output_cost_per_m,
        capability_score,
        avg_latency_ms
     FROM registered_models
     WHERE model_id = $1`,
        [modelId]
    );

    const row = result.rows[0];

    if (!row) {
        return null;
    }

    return {
        modelId: row.model_id,
        providerModelId: row.provider_model_id || row.model_id,
        provider: row.provider_label,
        baseUrl: row.base_url,
        apiKey: decryptSecret(row.api_key_encrypted),
        inputCostPerM: Number(row.input_cost_per_m),
        outputCostPerM: Number(row.output_cost_per_m),
        capabilityScore: Number(row.capability_score),
        avgLatencyMs: Number(row.avg_latency_ms),
    };
}

export async function getFallbackModel() {
    const result = await pool.query(
        `SELECT
        model_id,
        provider_model_id,
        provider_label,
        base_url,
        api_key_encrypted,
        input_cost_per_m,
        output_cost_per_m,
        capability_score,
        avg_latency_ms
     FROM registered_models
     ORDER BY capability_score DESC
     LIMIT 1`
    );

    const row = result.rows[0];

    if (!row) {
        return null;
    }

    return {
        modelId: row.model_id,
        providerModelId: row.provider_model_id || row.model_id,
        provider: row.provider_label,
        baseUrl: row.base_url,
        apiKey: decryptSecret(row.api_key_encrypted),
        inputCostPerM: Number(row.input_cost_per_m),
        outputCostPerM: Number(row.output_cost_per_m),
        capabilityScore: Number(row.capability_score),
        avgLatencyMs: Number(row.avg_latency_ms),
    };
}