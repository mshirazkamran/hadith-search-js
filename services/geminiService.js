import { GoogleGenAI, Type } from "@google/genai";

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    found: { type: Type.BOOLEAN },
    llm_response: { type: Type.STRING },
  },
  required: ["found", "llm_response"],
};

export async function callGemini(systemPrompt, userMessage) {
  const modelId = process.env.GEMINI_LLM_MODEL || "gemma-3-27b-it";
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: modelId,
    contents: systemPrompt + "\n\n\n" + userMessage,
    config: {
      responseMimeType: "application/json",
      // responseSchema,
      temperature: 0.2,
    },
  });

  return JSON.parse(response.text);
}
