import { Router } from "express";
import { search } from "../services/qdrantSearch.js";
import { validateHadiths } from "../services/llmService.js";
import { SearchHistory } from "../models/index.js";
import { optionalAuth } from "../auth/authMiddleware.js";

const router = Router();

// GET /search
router.get("/search", optionalAuth, async (req, res) => {
  const { query } = req.query;
  let topK = parseInt(req.query.top_k, 10);

  if (!query || !query.trim()) {
    return res.status(422).json({ error: "Query is required." });
  }

  if (isNaN(topK)) topK = 5;
  if (topK < 3 || topK > 10) {
    return res.status(422).json({ error: "top_k must be between 3 and 10." });
  }

  let results;
  try {
    results = await search(query, topK);
  } catch (err) {
    console.error("Qdrant search error:", err.message);
    return res.status(500).json({ error: "Search service unavailable." });
  }

  const llm = await validateHadiths(query, results);

  // save to history if authenticated
  if (req.user) {
    SearchHistory.create({
      user_id: req.user.id,
      query,
      found: llm.found,
      llm_response: llm.llm_response,
      top_results: results,
    }).catch((err) => console.error("Failed to save search history:", err.message));
  }

  res.json({
    found: llm.found,
    llm_response: llm.llm_response,
    results,
  });
});

export default router;
