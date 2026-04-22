import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

collectionSchema.index({ user_id: 1, name: 1 }, { unique: true });

const Collection = mongoose.model("Collection", collectionSchema);
export default Collection;
