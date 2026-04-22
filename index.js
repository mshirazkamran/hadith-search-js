import express from "express";
import mongoose from "mongoose";
import { initEmbedder } from "./services/qdrantSearch.js";
import authRouter from "./routers/authRouter.js";
import userRouter from "./routers/userRouter.js";
import searchRouter from "./routers/searchRouter.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.use((req, res, next) => {
  const allowed = [
    "https://thehadith.netlify.app", // deployed on my VPS
    "http://localhost:3000",
    "http://localhost:5173",
  ];
  
  const origin = req.headers.origin;
  if (allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});


// Routes
app.get("/", (req, res) => res.json({ status: "working" }));
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1", searchRouter);

// main error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error." });
});

async function start() {
  const mongoUser = process.env.MONGO_ROOT_USERNAME;
  const mongoPass = process.env.MONGO_ROOT_PASSWORD;
  const mongoDb = process.env.MONGO_DATABASE || "hadith_search";
  const mongoUri = `mongodb://${mongoUser}:${mongoPass}@localhost:27017/${mongoDb}?authSource=admin`;

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await initEmbedder();
  console.log("Embedder warmed up.");

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
