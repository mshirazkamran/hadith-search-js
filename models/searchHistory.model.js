import mongoose from "mongoose";
import { hadithResultSchema } from "./hadithResult.schema.js";

const searchHistorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  query: {
    type: String,
    required: true,
  },
  found: {
    type: Boolean,
    required: true,
  },
  llm_response: {
    type: String,
    required: true,
  },
  top_results: {
    type: [hadithResultSchema],
    default: [],
  },
  searched_at: {
    type: Date,
    default: Date.now,
  },
});

const SearchHistory = mongoose.model("SearchHistory", searchHistorySchema);
export default SearchHistory;
