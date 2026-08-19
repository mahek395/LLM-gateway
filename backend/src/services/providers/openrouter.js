import axios from "axios";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

export async function callOpenRouter(promptText, model) {
  // Python router returns:
  // openrouter/openai/gpt-oss-20b:free
  //
  // OpenRouter expects:
  // openai/gpt-oss-20b:free

  const providerModel = model.startsWith("openrouter/")
    ? model.slice("openrouter/".length)
    : model;

  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: providerModel,
      messages: [
        {
          role: "user",
          content: promptText,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const choice = response.data.choices?.[0];

  if (!choice) {
    throw new Error("OpenRouter returned no choices");
  }

  return {
    text: choice.message.content,
    promptTokens:
      response.data.usage?.prompt_tokens ?? null,
    completionTokens:
      response.data.usage?.completion_tokens ?? null,
  };
}