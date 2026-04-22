import { EmbeddingModel, FlagEmbedding } from "fastembed";
import { QdrantClient } from "@qdrant/js-client-rest";

const EMBED_MODEL = EmbeddingModel.BGESmallENV15;
const TOP_K = 5;
const SCORE_THRESHOLD = 0.5;

let embedder = null;
let client = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await FlagEmbedding.init({ model: EMBED_MODEL });
  }
  return embedder;
}

function getClient() {
  if (!client) {
    const apiKey = process.env.QDRANT_API_KEY;
    const url = process.env.CLUSTER_ENDPOINT;
    if (!apiKey || !url) {
      throw new Error("QDRANT_API_KEY or CLUSTER_ENDPOINT is not set.");
    }
    client = new QdrantClient({ apiKey, url });
  }
  return client;
}

export async function initEmbedder() {
  await getEmbedder();
  getClient();
}

export async function search(query, topK = TOP_K) {
  const collectionName = process.env.QDRANT_COLLECTION_NAME || "sahih_bukhari";

  const model = await getEmbedder();
  const qdrant = getClient();

  const embeddings = model.embed([query]);
  let queryVector = [];

  for await (const batch of embeddings) {
    // batch may be a single Float32Array or a nested array
    if (batch[0] !== undefined && typeof batch[0] === "object") {
      queryVector = Array.from(batch[0]);
    } else {
      queryVector = Array.from(batch);
    }
    break;
  }

  const response = await qdrant.search(collectionName, {
    vector: queryVector,
    limit: topK,
    with_payload: true,
    score_threshold: SCORE_THRESHOLD,
  });

  return response.map((hit) => {
    const p = hit.payload || {};
    return {
      original_id: p.original_id ?? null,
      chunk_id: p.chunk_id ?? null,
      reference: p.reference ?? null,
      narrator: p.narrator ?? null,
      chunk_text: p.chunk_text ?? null,
      complete_english_text: p.complete_english_text ?? null,
      score: hit.score ?? null,
    };
  });
}
