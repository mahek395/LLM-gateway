import axios from "axios";

const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

export async function callGroq(
  promptText,
  model = "llama-3.3-70b-versatile"
) {
  // Python router returns:
  // groq/llama-3.3-70b-versatile
  //
  // Groq expects:
  // llama-3.3-70b-versatile

  const providerModel = model.startsWith("groq/")
    ? model.slice("groq/".length)
    : model;

  const response = await axios.post(
    GROQ_URL,
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
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const choice = response.data.choices?.[0];

  if (!choice) {
    throw new Error("Groq returned no choices");
  }

  return {
    text: choice.message.content,
    promptTokens:
      response.data.usage?.prompt_tokens ?? null,
    completionTokens:
      response.data.usage?.completion_tokens ?? null,
  };
}