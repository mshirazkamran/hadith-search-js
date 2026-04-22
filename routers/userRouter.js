import { Router } from "express";
import {
  User,
  RefreshToken,
  SavedHadith,
  Collection,
  SearchHistory,
} from "../models/index.js";
import { authenticate } from "../auth/authMiddleware.js";

const router = Router();

router.use(authenticate);

function formatProfile(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.is_admin ? "admin" : "user",
    is_verified: user.is_verified,
    created_at: user.created_at,
  };
}

// GET /me
router.get("/me", async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: "User not found." });
  res.json(formatProfile(user));
});

// PATCH /me
router.patch("/me", async (req, res) => {
  const { username, email } = req.body;

  if (!username && !email) {
    return res.status(422).json({ error: "No fields provided." });
  }

  const updates = {};
  if (username) updates.username = username;
  if (email) updates.email = email;

  const conflict = await User.findOne({
    _id: { $ne: req.user.id },
    $or: [
      ...(username ? [{ username }] : []),
      ...(email ? [{ email }] : []),
    ],
  });

  if (conflict) {
    return res.status(409).json({ error: "Username or email already taken." });
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
  res.json(formatProfile(user));
});

// DELETE /me
router.delete("/me", async (req, res) => {
  const userId = req.user.id;
  await Promise.all([
    User.findByIdAndDelete(userId),
    RefreshToken.deleteMany({ user_id: userId }),
    SavedHadith.deleteMany({ user_id: userId }),
    Collection.deleteMany({ user_id: userId }),
    SearchHistory.deleteMany({ user_id: userId }),
  ]);
  res.json({ message: "Account deleted." });
});

// GET /me/saved
router.get("/me/saved", async (req, res) => {
  const saved = await SavedHadith.find({ user_id: req.user.id }).sort({ saved_at: -1 });
  res.json(saved);
});

// POST /me/saved
router.post("/me/saved", async (req, res) => {
  const { original_id, reference, chunk_text, complete_english_text, collection_id } = req.body;

  if (collection_id) {
    const collection = await Collection.findOne({ _id: collection_id, user_id: req.user.id });
    if (!collection) return res.status(404).json({ error: "Collection not found." });
  }

  const exists = await SavedHadith.findOne({ user_id: req.user.id, original_id });
  if (exists) return res.status(409).json({ error: "Already bookmarked." });

  const saved = await SavedHadith.create({
    user_id: req.user.id,
    original_id,
    reference,
    chunk_text,
    complete_english_text,
    collection_id: collection_id || null,
  });

  res.status(201).json(saved);
});

// DELETE /me/saved/:saved_id
router.delete("/me/saved/:saved_id", async (req, res) => {
  const result = await SavedHadith.findOneAndDelete({
    _id: req.params.saved_id,
    user_id: req.user.id,
  });
  if (!result) return res.status(404).json({ error: "Not found or not owned." });
  res.json({ message: "Removed." });
});

// GET /me/collections
router.get("/me/collections", async (req, res) => {
  const collections = await Collection.find({ user_id: req.user.id }).sort({ created_at: -1 });
  res.json(collections);
});

// POST /me/collections
router.post("/me/collections", async (req, res) => {
  const { name, description } = req.body;

  if (!name) return res.status(422).json({ error: "Name is required." });

  const collection = await Collection.create({
    user_id: req.user.id,
    name,
    description: description || "",
  });

  res.status(201).json(collection);
});

// GET /me/history
router.get("/me/history", async (req, res) => {
  const history = await SearchHistory.find({ user_id: req.user.id }).sort({ searched_at: -1 });
  res.json(history);
});

// DELETE /me/history
router.delete("/me/history", async (req, res) => {
  await SearchHistory.deleteMany({ user_id: req.user.id });
  res.json({ message: "History cleared." });
});

export default router;
