import { callGemini } from "./geminiService.js";
import { callGroq } from "./groqService.js";

const SYSTEM_PROMPT = `You are a hadith verification assistant for a Sahih Bukhari search app.

Your task is to evaluate whether the user's query is answered by any of the
hadith texts retrieved from the database.

Rules:
- ONLY consider Sahih Bukhari ahadith that are given to you; it's the only book this app supports.
- Set "found" to true ONLY when at least one of the provided hadiths clearly
  and directly answers or relates to the user's query.
- Set "found" to false when the query is off-topic, about a different book,
  too vague, or the returned hadiths are only loosely related.
- Your "llm_response" must be a single short paragraph (2-3 sentences).
  - If found=true: confirm the hadith is present in Sahih Bukhari and briefly
    state its key message.
  - If found=false: politely inform the user that their query does not appear
    to be in Sahih Bukhari and give a one-line hint about what the closest
    results are about (based on the provided texts).
- Do not mention hadith numbers or collection references in your llm_response;
  keep it natural and user-friendly.`;

const OFFLINE_RESPONSE = {
  found: false,
  llm_response:
    "The search returned the closest matching hadiths from Sahih Bukhari. " +
    "AI validation is temporarily unavailable.",
};

function buildUserMessage(query, hits) {
  const snippets = hits
    .map(
      (h, i) =>
        `[Hadith ${i + 1}]\n` +
        `Reference: ${h.reference ?? "N/A"}\n` +
        `Text: ${h.complete_english_text || h.chunk_text || "N/A"}`
    )
    .join("\n\n");

  return `User query: ${query}\n\nRetrieved hadiths from Sahih Bukhari:\n\n${snippets}`;
}

export async function validateHadiths(query, hits) {
  const userMessage = buildUserMessage(query, hits);

  try {
    return await callGemini(SYSTEM_PROMPT, userMessage);
  } catch (err) {
    const status = err.status || err.statusCode;
    if (status === 429 || status === 503) {
      console.info(`Gemini returned ${status}; falling back to Groq.`);
    } else {
      console.warn("Gemini call failed:", err.message);
    }
  }

  try {
    return await callGroq(SYSTEM_PROMPT, userMessage);
  } catch (groqErr) {
    console.warn("Groq fallback also failed:", groqErr.message);
    return OFFLINE_RESPONSE;
  }
}
