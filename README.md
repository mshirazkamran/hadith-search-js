# Hadith Search JS

Semantic search engine for Sahih Bukhari built with **Express.js**, **Qdrant**, and **MongoDB**.

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Docker](https://www.docker.com) (for MongoDB)

## Setup

**1. Clone the repo**

```bash
git clone git@github.com:mshirazkamran/hadith-search-js.git
cd hadith-search-js
```

**2. Install dependencies**

```bash
npm install
```

**3. Create a `.env` file** in the project root:

```env
# MongoDB
MONGO_ROOT_USERNAME=your_username
MONGO_ROOT_PASSWORD=your_password
MONGO_DATABASE=hadith_search

# Qdrant
QDRANT_API_KEY=your_qdrant_api_key
CLUSTER_ENDPOINT=https://your-cluster.qdrant.io
QDRANT_COLLECTION_NAME=sahih_bukhari

# Gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_LLM_MODEL=gemini-2.0-flash

# Groq
GROQ_API_KEY=your_groq_api_key
GROQ_LLM_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Auth
SALT=your_jwt_secret

# Express
PORT=3000
```

**4. Start MongoDB**

```bash
docker compose up -d
```

**5. Run the server**

```bash
node index.js
```

You should see:

```
Connected to MongoDB.
Embedder warmed up.
Server running on port 3000
```

## Verify the server is running

```bash
curl http://localhost:3000/
```

Expected response:

```json
{"status":"working"}
```

If you see `{"status":"working"}` — the server is up. ✅
