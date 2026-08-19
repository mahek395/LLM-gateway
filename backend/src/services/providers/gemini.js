import axios from "axios";

export async function callGemini(
  promptText,
  model = "gemini-flash-lite-latest"
) {
  // Python router returns gateway-qualified IDs such as:
  // gemini/gemini-flash-lite-latest
  //
  // Gemini API expects only:
  // gemini-flash-lite-latest

  const providerModel = model.startsWith("gemini/")
    ? model.slice("gemini/".length)
    : model;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${providerModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await axios.post(url, {
    contents: [
      {
        parts: [
          {
            text: promptText,
          },
        ],
      },
    ],
  });

  const candidate = response.data.candidates?.[0];

  if (!candidate) {
    throw new Error("Gemini returned no candidates");
  }

  const text =
    candidate.content?.parts
      ?.map((p) => p.text || "")
      .join("") || "";

  const usage = response.data.usageMetadata;

  return {
    text,
    promptTokens: usage?.promptTokenCount ?? null,
    completionTokens: usage?.candidatesTokenCount ?? null,
  };
}