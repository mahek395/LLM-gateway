import dotenv from "dotenv";
dotenv.config();
import { routeRequest } from "../services/router.js";

// Hand-labeled: what SHOULD happen for each prompt, given the current rules.
const TEST_CASES = [
  { prompt: "What is the capital of France?", expectedTier: "cheap" },
  { prompt: "Hi there", expectedTier: "cheap" },
  { prompt: "What's 2+2?", expectedTier: "cheap" },
  { prompt: "Write a function that reverses a linked list and explain why it works step by step", expectedTier: "strong" },
  { prompt: "Compare REST and GraphQL in detail", expectedTier: "strong" },
  { prompt: "Debug this: for(i=0;i<10;i++){console.log(i)}", expectedTier: "strong" },
  { prompt: "A".repeat(500), expectedTier: "strong" }, // pure length trigger
];

async function run() {
  let correct = 0;
  const rows = [];

  for (const testCase of TEST_CASES) {
    const { provider, reason } = await routeRequest(testCase.prompt);
    // Treat "groq" as cheap, anything else as strong — adjust if your
    // cheap/strong providers differ from the defaults.
    const actualTier = provider === "groq" ? "cheap" : "strong";
    const isCorrect = actualTier === testCase.expectedTier;
    if (isCorrect) correct++;

    rows.push({
      prompt: testCase.prompt.slice(0, 40) + (testCase.prompt.length > 40 ? "..." : ""),
      expected: testCase.expectedTier,
      actual: actualTier,
      reason,
      correct: isCorrect ? "✓" : "✗",
    });
  }

  console.table(rows);
  console.log(`\nRouting accuracy: ${correct}/${TEST_CASES.length} (${((correct / TEST_CASES.length) * 100).toFixed(0)}%)`);
  process.exit(0);
}

run();