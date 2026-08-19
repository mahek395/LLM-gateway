import dotenv from "dotenv";
dotenv.config();
import { pool } from "./pool.js";
import { embedText } from "../services/embeddings.js";

async function debug() {
  const prompt = "What is the capital of France?";
  const queryEmbedding = await embedText(prompt, "search_query");
  const embeddingLiteral = `[${queryEmbedding.join(",")}]`;

  const result = await pool.query(
    `SELECT id, prompt_text, 1 - (embedding <=> $1) AS similarity
     FROM cached_prompts
     ORDER BY embedding <=> $1`,
    [embeddingLiteral]
  );

  console.log("Query-vs-stored-document similarity:");
  console.table(result.rows);
  process.exit(0);
}

debug();