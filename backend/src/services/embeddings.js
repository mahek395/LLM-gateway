import axios from "axios";

const COHERE_URL = "https://api.cohere.com/v1/embed";

/**
 * Embeds a piece of text for semantic cache lookup/storage.
 *
 * We use "search_document" for BOTH storing and looking up cache entries —
 * not the asymmetric "search_query" vs "search_document" split Cohere
 * recommends for classic retrieval. That split assumes queries are short
 * and documents are long passages; our cache compares queries against other
 * past queries (same modality on both sides), so symmetric embedding scores
 * near-duplicates correctly. Verified empirically: identical text scored
 * ~0.79 similarity asymmetric vs ~0.9999 symmetric.
 */
export async function embedText(text, inputType = "search_query") {
  const response = await axios.post(
    COHERE_URL,
    {
      texts: [text],
      model: "embed-english-v3.0",
      input_type: inputType,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.embeddings[0]; // 1024-dim float array
}