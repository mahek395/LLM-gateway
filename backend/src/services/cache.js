import { pool } from "../db/pool.js";
import { embedText } from "./embeddings.js";
import { getRoutingRules } from "./routingRulesStore.js";

export async function findCachedResponse(promptText) {
  const rules = await getRoutingRules();
  const similarityThreshold = parseFloat(rules.cache_similarity_threshold);

  const embedding = await embedText(promptText, "search_document");
  const embeddingLiteral = `[${embedding.join(",")}]`;

  const result = await pool.query(
    `SELECT id, response_text, provider, model,
            1 - (embedding <=> $1) AS similarity
     FROM cached_prompts
     ORDER BY embedding <=> $1
     LIMIT 1`,
    [embeddingLiteral]
  );

  if (result.rows.length === 0) return null;

  const match = result.rows[0];
  if (match.similarity < similarityThreshold) {
    return null;
  }

  pool
    .query(
      `UPDATE cached_prompts SET hit_count = hit_count + 1, last_hit_at = now() WHERE id = $1`,
      [match.id]
    )
    .catch((err) => console.error("cache hit-count update failed:", err.message));

  return {
    responseText: match.response_text,
    provider: match.provider,
    model: match.model,
    similarity: match.similarity,
  };
}

export async function storeInCache(promptText, responseText, provider, model) {
  const embedding = await embedText(promptText, "search_document");
  const embeddingLiteral = `[${embedding.join(",")}]`;

  await pool.query(
    `INSERT INTO cached_prompts (prompt_text, embedding, response_text, provider, model)
     VALUES ($1, $2, $3, $4, $5)`,
    [promptText, embeddingLiteral, responseText, provider, model]
  );
}