import mongoose from "mongoose";

export const hadithResultSchema = new mongoose.Schema(
  {
    original_id: { type: Number, default: null },
    chunk_id: { type: Number, default: null },
    reference: { type: String, default: null },
    narrator: { type: String, default: null },
    chunk_text: { type: String, default: null },
    complete_english_text: { type: String, default: null },
    score: { type: Number, default: null },
  },
  { _id: false }
);
