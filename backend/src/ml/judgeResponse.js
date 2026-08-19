import axios from "axios";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function judgeResponse(prompt, cheapResponse, retriesLeft = 3) {
  const judgePrompt = `You are evaluating whether an AI assistant's response fully and correctly answers a user's request, or whether the request actually needed a more capable model.

User's request:
"""
${prompt}
"""

Assistant's response:
"""
${cheapResponse}
"""

Judge strictly: does this response fully satisfy the request with correct, complete reasoning where reasoning is needed? A response that is correct but shallow on a request that needed multi-step reasoning should be marked as needing a stronger model. Be a strict, skeptical grader — only mark "cheap_sufficient" if the response is genuinely complete and correct with no gaps.

Respond with ONLY valid JSON, no other text:
{"label": "cheap_sufficient" | "needs_strong", "reasoning": "one sentence why"}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: judgePrompt }] }],
    });

    const text = response.data.candidates[0].content.parts.map((p) => p.text).join("");
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!["cheap_sufficient", "needs_strong"].includes(parsed.label)) {
      throw new Error(`Judge returned unexpected label: ${parsed.label}`);
    }

    return parsed;
  } catch (err) {
    if (err.response?.status === 429 && retriesLeft > 0) {
      // Respect the API's own suggested wait time when it gives one, plus a safety buffer
      const retryDelaySeconds = parseFloat(
        err.response.data?.error?.details?.find((d) => d["@type"]?.includes("RetryInfo"))?.retryDelay
      ) || 15;
      const waitMs = (retryDelaySeconds + 3) * 1000;
      console.log(`    (rate limited — waiting ${Math.round(waitMs / 1000)}s before retry)`);
      await sleep(waitMs);
      return judgeResponse(prompt, cheapResponse, retriesLeft - 1);
    }
    throw err;
  }
}