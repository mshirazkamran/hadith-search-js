import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User, RefreshToken } from "../models/index.js";
import { authenticate } from "../auth/authMiddleware.js";

const router = Router();
const JWT_SECRET = process.env.SALT;
const ACCESS_TTL = "1h";
const REFRESH_TTL_DAYS = 30;

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

async function createRefreshToken(userId) {
  const raw = crypto.randomBytes(48).toString("base64url");
  const expires = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user_id: userId,
    token_hash: hashToken(raw),
    expires_at: expires,
  });

  return raw;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;

// POST /register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(422).json({ error: "Invalid email format." });
  }
  if (!password || password.length < MIN_PASSWORD_LEN) {
    return res.status(422).json({ error: `Password must be at least ${MIN_PASSWORD_LEN} characters.` });
  }

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) {
    return res.status(409).json({ error: "Email or username already exists." });
  }

  await User.create({ username, email, password_hash: password });

  // TODO: send verification email with a signed JWT link
  res.status(201).json({ message: "Account created. Check your email to verify." });
});

// POST /login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ error: "Wrong email or password." });
  }
  if (!user.is_verified) {
    return res.status(403).json({ error: "Email not verified." });
  }
  if (!user.is_active) {
    return res.status(403).json({ error: "Account disabled." });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user._id);

  res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
  });
});

// POST /refresh
router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(401).json({ error: "Refresh token required." });
  }

  const hash = hashToken(refresh_token);
  const stored = await RefreshToken.findOne({ token_hash: hash });

  if (!stored || stored.expires_at < new Date()) {
    return res.status(401).json({ error: "Token expired." });
  }
  if (stored.revoked) {
    return res.status(401).json({ error: "Token revoked." });
  }

  const user = await User.findById(stored.user_id);
  if (!user) {
    return res.status(401).json({ error: "User not found." });
  }

  const accessToken = signAccessToken(user);
  res.json({ access_token: accessToken, token_type: "bearer" });
});

// POST /logout
router.post("/logout", authenticate, async (req, res) => {
  await RefreshToken.updateMany(
    { user_id: req.user.id, revoked: false },
    { revoked: true }
  );
  res.json({ message: "Logged out." });
});

// POST /verify-email
router.post("/verify-email", async (req, res) => {
  const { token } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(400).json({ error: "Token expired or invalid." });
  }

  if (payload.purpose !== "email_verification") {
    return res.status(400).json({ error: "Token expired or invalid." });
  }

  const user = await User.findById(payload.id);
  if (!user) return res.status(400).json({ error: "Token expired or invalid." });

  if (!user.is_verified) {
    user.is_verified = true;
    await user.save();
  }

  res.json({ message: "Email verified." });
});

// POST /forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // always return 200 to avoid leaking user existence
  const user = await User.findOne({ email });
  if (user) {
    const resetToken = jwt.sign(
      { id: user._id, purpose: "password_reset" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );
    // TODO: send email with resetToken link
    console.info("Password reset token:", resetToken);
  }

  res.json({ message: "If that email exists, a reset link was sent." });
});

// POST /reset-password
router.post("/reset-password", async (req, res) => {
  const { token, new_password } = req.body;

  if (!new_password || new_password.length < MIN_PASSWORD_LEN) {
    return res.status(422).json({ error: `Password must be at least ${MIN_PASSWORD_LEN} characters.` });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(400).json({ error: "Token expired or invalid." });
  }

  if (payload.purpose !== "password_reset") {
    return res.status(400).json({ error: "Token expired or invalid." });
  }

  const user = await User.findById(payload.id);
  if (!user) return res.status(400).json({ error: "Token expired or invalid." });

  user.password_hash = new_password;
  await user.save();

  // revoke all refresh tokens for security
  await RefreshToken.updateMany({ user_id: user._id }, { revoked: true });

  res.json({ message: "Password updated." });
});

export default router;
