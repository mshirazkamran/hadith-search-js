import mongoose from "mongoose";

const savedHadithSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  collection_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
    default: null,
  },
  original_id: {
    type: Number,
    required: true,
  },
  reference: {
    type: String,
    default: null,
  },
  chunk_text: {
    type: String,
    default: null,
  },
  complete_english_text: {
    type: String,
    default: null,
  },
  saved_at: {
    type: Date,
    default: Date.now,
  },
});

savedHadithSchema.index({ user_id: 1, original_id: 1 }, { unique: true });

const SavedHadith = mongoose.model("SavedHadith", savedHadithSchema);
export default SavedHadith;
