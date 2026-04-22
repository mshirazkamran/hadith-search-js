import Groq from "groq-sdk";

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set.");
    client = new Groq({ apiKey });
  }
  return client;
}

const jsonSchema = {
  name: "hadith_validation",
  strict: false,
  schema: {
    type: "object",
    properties: {
      found: { type: "boolean" },
      llm_response: { type: "string" },
    },
    required: ["found", "llm_response"],
  },
};

export async function callGroq(systemPrompt, userMessage) {
  const modelId =
    process.env.GROQ_LLM_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
  const groq = getClient();

  const response = await groq.chat.completions.create({
    model: modelId,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: jsonSchema,
    },
  });

  const raw = response.choices[0]?.message?.content || "{}";
  return JSON.parse(raw);
}
