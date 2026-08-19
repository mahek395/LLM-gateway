import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import { SEED_PROMPTS } from "../ml/seedPrompts.js";
import { callGroq } from "../services/providers/groq.js";
import { judgeResponse } from "../ml/judgeResponse.js";
import { embedText } from "../services/embeddings.js";

const OUTPUT_PATH = "src/ml/training_data.json";

async function run() {
  const records = [];
  let cheapSufficientCount = 0;
  console.log(`Generating training data from ${SEED_PROMPTS.length} seed prompts...\n`);

  for (const [index, { prompt, category }] of SEED_PROMPTS.entries()) {
    process.stdout.write(`[${index + 1}/${SEED_PROMPTS.length}] ${category}: "${prompt.slice(0, 50)}..." `);

    try {
      // 1. Get the cheap tier's actual response
      const cheapResult = await callGroq(prompt);

      // 2. Judge whether that response was adequate
      const judgement = await judgeResponse(prompt, cheapResult.text);

      // 3. Embed the prompt — this is the feature the classifier will train on,
      //    same embedding pipeline as the semantic cache uses (search_document,
      //    matching the symmetric-comparison fix from earlier)
      const embedding = await embedText(prompt, "search_document");

      const label = judgement.label === "cheap_sufficient" ? 0 : 1; // 0 = stay cheap, 1 = escalate
      if (label === 0) cheapSufficientCount++;

      records.push({
        prompt,
        category,
        promptLength: prompt.length,
        embedding,
        label,
        judgeReasoning: judgement.reasoning,
      });

      console.log(`→ ${judgement.label}`);
    }  catch (err) {
      console.log(`→ FAILED`);
      console.log("  Status:", err.response?.status);
      console.log("  URL:", err.config?.url);
      console.log("  Body:", JSON.stringify(err.response?.data));
    }

    // Small delay to stay well under free-tier rate limits across three APIs per prompt
    // Gemini free tier caps at 15 requests/minute — pace at one judge call
    // every 4.5s to stay comfortably under that, even with real API latency added on top
    await new Promise((resolve) => setTimeout(resolve, 4500));
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(records, null, 2));

  console.log(`\nDone. ${records.length}/${SEED_PROMPTS.length} succeeded.`);
  console.log(`Label distribution: ${cheapSufficientCount} cheap_sufficient, ${records.length - cheapSufficientCount} needs_strong`);
  console.log(`Written to ${OUTPUT_PATH}`);

  process.exit(0);
}

run();