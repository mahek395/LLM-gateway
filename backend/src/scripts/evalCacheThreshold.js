import dotenv from "dotenv";
dotenv.config();
import { embedText } from "../services/embeddings.js";

// Each pair is a (prompt A, prompt B) with a label of whether they SHOULD
// be treated as a cache hit of each other.
const TEST_PAIRS = [
  { a: "What is the capital of France?", b: "What is the capital of France?", shouldMatch: true, label: "exact duplicate" },
  { a: "What is the capital of France?", b: "What's France's capital city?", shouldMatch: true, label: "paraphrase" },
  { a: "How do I reset my password?", b: "How can I change my password?", shouldMatch: true, label: "paraphrase" },
  { a: "What is the capital of France?", b: "What was the capital of France in 1800?", shouldMatch: false, label: "near-miss, different intent" },
  { a: "How do I reset my password?", b: "How do I reset my router?", shouldMatch: false, label: "near-miss, different subject" },
  { a: "What is the capital of France?", b: "Explain quantum entanglement", shouldMatch: false, label: "unrelated" },
];

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function run() {
  console.log("Embedding test pairs...\n");

  const scored = [];
  for (const pair of TEST_PAIRS) {
    const [embA, embB] = await Promise.all([
      embedText(pair.a, "search_document"),
      embedText(pair.b, "search_document"),
    ]);
    const similarity = cosineSimilarity(embA, embB);
    scored.push({ ...pair, similarity });
  }

  console.log("Raw similarities:");
  console.table(scored.map(({ label, shouldMatch, similarity }) => ({
    label, shouldMatch, similarity: similarity.toFixed(4),
  })));

  console.log("\nThreshold sweep — accuracy at each cutoff:");
  const thresholds = [0.99, 0.97, 0.95, 0.93, 0.90, 0.85, 0.80];
  const sweepResults = thresholds.map((threshold) => {
    let correct = 0;
    for (const pair of scored) {
      const predictedMatch = pair.similarity >= threshold;
      if (predictedMatch === pair.shouldMatch) correct++;
    }
    return { threshold, accuracy: `${((correct / scored.length) * 100).toFixed(0)}%` };
  });
  console.table(sweepResults);

  process.exit(0);
}

run();