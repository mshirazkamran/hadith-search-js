# API Client Helper

> Base URL: `http://localhost:3000`

This document shows how to manually test every endpoint using **cURL** and **Postman / Thunder Client**. Endpoints that require authentication are marked with 🔒.

---

## Prerequisites

1. Start the server: `npm run dev`
2. Make sure MongoDB and Qdrant are running (see `docker-compose.yml`).
3. Store the tokens returned by Login in a variable so you can reuse them.

### Postman Setup (one-time)

| Setting | Value |
|---------|-------|
| Base URL variable | `{{base_url}}` → `http://localhost:3000` |
| Auth header | Type: **Bearer Token** → `{{access_token}}` |

After calling **Login**, copy the `access_token` value into the `access_token` Postman variable.

---

## Module 1 — Authentication

### 1. Health Check

```bash
curl http://localhost:3000/
```

**Expected:** `{"status":"working"}`

---

### 2. Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "StrongP@ss1"
  }'
```

| Status | Meaning |
|--------|---------|
| 201 | Account created |
| 409 | Email already exists |
| 422 | Invalid email or weak password |

---

### 3. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongP@ss1"
  }'
```

**Save the response tokens:**

```bash
# Bash shortcut — parse with jq
ACCESS=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"StrongP@ss1"}' | jq -r '.access_token')

echo $ACCESS
```

| Status | Meaning |
|--------|---------|
| 200 | Returns `access_token`, `refresh_token`, `token_type` |
| 401 | Wrong credentials |
| 403 | Email not verified / account disabled |

---

### 4. Refresh Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<your_refresh_token>"
  }'
```

| Status | Meaning |
|--------|---------|
| 200 | New `access_token` returned |
| 401 | Token expired or revoked |

---

### 5. Logout 🔒

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>"
```

| Status | Meaning |
|--------|---------|
| 200 | Logged out |
| 401 | Missing or invalid token |

---

### 6. Verify Email

```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<verification_token_from_email>"
  }'
```

| Status | Meaning |
|--------|---------|
| 200 | Email verified |
| 400 | Token expired or invalid |

---

### 7. Forgot Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

Always returns **200** — does not reveal whether the email exists.

---

### 8. Reset Password

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<reset_token_from_email>",
    "new_password": "NewStr0ng!Pass"
  }'
```

| Status | Meaning |
|--------|---------|
| 200 | Password updated |
| 400 | Token expired or invalid |
| 422 | Weak password |

---

## Module 2 — User Management

> All endpoints below require 🔒 `Authorization: Bearer <access_token>`

### 9. Get Profile 🔒

```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>"
```

| Status | Meaning |
|--------|---------|
| 200 | Returns user profile object |
| 401 | Invalid or expired token |

---

### 10. Update Profile 🔒

```bash
curl -X PATCH http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newname"
  }'
```

Both `username` and `email` are optional — send only the fields you want to change.

| Status | Meaning |
|--------|---------|
| 200 | Updated profile returned |
| 409 | Username or email already taken |
| 422 | No fields provided |

---

### 11. Delete Account 🔒

```bash
curl -X DELETE http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <access_token>"
```

| Status | Meaning |
|--------|---------|
| 200 | Account deleted |
| 401 | Invalid token |

---

### 12. Get Saved Hadiths 🔒

```bash
curl http://localhost:3000/api/v1/users/me/saved \
  -H "Authorization: Bearer <access_token>"
```

Returns an array of bookmarked Hadith objects.

---

### 13. Save (Bookmark) a Hadith 🔒

```bash
curl -X POST http://localhost:3000/api/v1/users/me/saved \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "original_id": 123,
    "reference": "Sahih Bukhari Vol 1, Book 1, Hadith 1",
    "chunk_text": "Narrated Umar bin Al-Khattab...",
    "complete_english_text": "The full hadith text...",
    "collection_id": null
  }'
```

| Status | Meaning |
|--------|---------|
| 201 | Bookmark created |
| 404 | `collection_id` not found |
| 409 | Already bookmarked |

---

### 14. Remove Saved Hadith 🔒

```bash
curl -X DELETE http://localhost:3000/api/v1/users/me/saved/<saved_id> \
  -H "Authorization: Bearer <access_token>"
```

Replace `<saved_id>` with the MongoDB ObjectId of the saved Hadith.

| Status | Meaning |
|--------|---------|
| 200 | Removed |
| 404 | Not found or not owned |

---

### 15. Get Collections 🔒

```bash
curl http://localhost:3000/api/v1/users/me/collections \
  -H "Authorization: Bearer <access_token>"
```

---

### 16. Create Collection 🔒

```bash
curl -X POST http://localhost:3000/api/v1/users/me/collections \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Favorites",
    "description": "My favorite hadiths"
  }'
```

| Status | Meaning |
|--------|---------|
| 201 | Collection created |
| 422 | Missing required fields |

---

### 17. Get Search History 🔒

```bash
curl http://localhost:3000/api/v1/users/me/history \
  -H "Authorization: Bearer <access_token>"
```

---

### 18. Clear Search History 🔒

```bash
curl -X DELETE http://localhost:3000/api/v1/users/me/history \
  -H "Authorization: Bearer <access_token>"
```

---

## Module 3 — Hadith Search

### 19. Search Hadiths

This endpoint supports **optional** authentication. If a valid token is provided, the query is saved to history.

```bash
# Without auth
curl "http://localhost:3000/api/v1/search?query=patience&top_k=5"

# With auth (saves to history)
curl "http://localhost:3000/api/v1/search?query=patience&top_k=5" \
  -H "Authorization: Bearer <access_token>"
```

| Param | Type | Required | Default |
|-------|------|----------|---------|
| `query` | string | Yes | — |
| `top_k` | integer (3–10) | No | 5 |

| Status | Meaning |
|--------|---------|
| 200 | Search results + LLM validation |
| 422 | Empty query or invalid `top_k` |
| 500 | Qdrant unreachable |

---

## Manual Testing Checklist

Use this ordered checklist to walk through every endpoint:

| # | Action | Endpoint | Pass? |
|---|--------|----------|-------|
| 1 | Health check | `GET /` | ☐ |
| 2 | Register a user | `POST /api/v1/auth/register` | ☐ |
| 3 | Try duplicate register (expect 409) | `POST /api/v1/auth/register` | ☐ |
| 4 | Login | `POST /api/v1/auth/login` | ☐ |
| 5 | Save the `access_token` and `refresh_token` | — | ☐ |
| 6 | Get profile | `GET /api/v1/users/me` | ☐ |
| 7 | Update profile | `PATCH /api/v1/users/me` | ☐ |
| 8 | Search (no auth) | `GET /api/v1/search?query=prayer` | ☐ |
| 9 | Search (with auth) | `GET /api/v1/search?query=prayer` | ☐ |
| 10 | Check search history | `GET /api/v1/users/me/history` | ☐ |
| 11 | Create a collection | `POST /api/v1/users/me/collections` | ☐ |
| 12 | List collections | `GET /api/v1/users/me/collections` | ☐ |
| 13 | Save a hadith | `POST /api/v1/users/me/saved` | ☐ |
| 14 | Save same hadith again (expect 409) | `POST /api/v1/users/me/saved` | ☐ |
| 15 | List saved hadiths | `GET /api/v1/users/me/saved` | ☐ |
| 16 | Remove a saved hadith | `DELETE /api/v1/users/me/saved/:id` | ☐ |
| 17 | Clear search history | `DELETE /api/v1/users/me/history` | ☐ |
| 18 | Refresh the access token | `POST /api/v1/auth/refresh` | ☐ |
| 19 | Logout | `POST /api/v1/auth/logout` | ☐ |
| 20 | Call a protected route after logout (expect 401) | `GET /api/v1/users/me` | ☐ |
| 21 | Forgot password | `POST /api/v1/auth/forgot-password` | ☐ |
| 22 | Reset password | `POST /api/v1/auth/reset-password` | ☐ |
| 23 | Verify email | `POST /api/v1/auth/verify-email` | ☐ |
| 24 | Delete account | `DELETE /api/v1/users/me` | ☐ |

---

## Swagger UI

The project auto-generates a Swagger spec at `swagger-output.json`. You can serve it with Swagger UI by adding:

```js
import swaggerUi from "swagger-ui-express";
import swaggerDoc from "./swagger-output.json" assert { type: "json" };
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
```

Then visit `http://localhost:3000/api-docs` to interactively test all endpoints.

---

## Using Postman (step-by-step)

### 1. Create a Workspace & Environment

1. Open Postman → **Workspaces** → **Create Workspace** → name it `Hadith Search API`.
2. Go to **Environments** → **Create Environment** → name it `Local`.
3. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:3000` | `http://localhost:3000` |
| `access_token` | *(leave empty)* | *(auto-filled by script)* |
| `refresh_token` | *(leave empty)* | *(auto-filled by script)* |

4. Save the environment and select it from the top-right dropdown.

### 2. Create a Collection

Create a collection called **Hadith API** with these folders:

```
📁 Hadith API
├── 📁 Auth
│   ├── Register
│   ├── Login
│   ├── Refresh Token
│   ├── Logout
│   ├── Verify Email
│   ├── Forgot Password
│   └── Reset Password
├── 📁 User
│   ├── Get Profile
│   ├── Update Profile
│   └── Delete Account
├── 📁 Saved Hadiths
│   ├── List Saved
│   ├── Save Hadith
│   └── Remove Saved
├── 📁 Collections
│   ├── List Collections
│   └── Create Collection
├── 📁 History
│   ├── Get History
│   └── Clear History
└── 📁 Search
    └── Search Hadiths
```

### 3. Set Collection-level Auth

1. Click the **Hadith API** collection → **Authorization** tab.
2. Set Type to **Bearer Token**.
3. Set Token to `{{access_token}}`.
4. All requests inside the collection will inherit this — override individually for public endpoints.

### 4. Auto-save Tokens on Login

In the **Login** request → **Scripts** tab → **Post-response**, add:

```js
if (pm.response.code === 200) {
    const body = pm.response.json();
    pm.environment.set("access_token", body.access_token);
    pm.environment.set("refresh_token", body.refresh_token);
    console.log("✅ Tokens saved to environment");
}
```

Do the same for **Refresh Token** (but only save `access_token`):

```js
if (pm.response.code === 200) {
    const body = pm.response.json();
    pm.environment.set("access_token", body.access_token);
    console.log("✅ Access token refreshed");
}
```

### 5. Request Configuration Reference

Below is exactly how to configure each request in Postman.

#### Auth Endpoints

| Request | Method | URL | Auth | Body (raw JSON) |
|---------|--------|-----|------|------------------|
| Register | POST | `{{base_url}}/api/v1/auth/register` | No Auth | `{"username":"testuser","email":"test@example.com","password":"StrongP@ss1"}` |
| Login | POST | `{{base_url}}/api/v1/auth/login` | No Auth | `{"email":"test@example.com","password":"StrongP@ss1"}` |
| Refresh | POST | `{{base_url}}/api/v1/auth/refresh` | No Auth | `{"refresh_token":"{{refresh_token}}"}` |
| Logout | POST | `{{base_url}}/api/v1/auth/logout` | Inherit (Bearer) | *(none)* |
| Verify Email | POST | `{{base_url}}/api/v1/auth/verify-email` | No Auth | `{"token":"<token_from_email>"}` |
| Forgot Password | POST | `{{base_url}}/api/v1/auth/forgot-password` | No Auth | `{"email":"test@example.com"}` |
| Reset Password | POST | `{{base_url}}/api/v1/auth/reset-password` | No Auth | `{"token":"<reset_token>","new_password":"NewStr0ng!Pass"}` |

#### User Endpoints

| Request | Method | URL | Auth | Body (raw JSON) |
|---------|--------|-----|------|------------------|
| Get Profile | GET | `{{base_url}}/api/v1/users/me` | Inherit (Bearer) | *(none)* |
| Update Profile | PATCH | `{{base_url}}/api/v1/users/me` | Inherit (Bearer) | `{"username":"newname"}` |
| Delete Account | DELETE | `{{base_url}}/api/v1/users/me` | Inherit (Bearer) | *(none)* |

#### Saved Hadiths Endpoints

| Request | Method | URL | Auth | Body (raw JSON) |
|---------|--------|-----|------|------------------|
| List Saved | GET | `{{base_url}}/api/v1/users/me/saved` | Inherit (Bearer) | *(none)* |
| Save Hadith | POST | `{{base_url}}/api/v1/users/me/saved` | Inherit (Bearer) | `{"original_id":123,"reference":"Sahih Bukhari Vol 1","chunk_text":"Narrated by...","complete_english_text":"Full text...","collection_id":null}` |
| Remove Saved | DELETE | `{{base_url}}/api/v1/users/me/saved/<saved_id>` | Inherit (Bearer) | *(none)* |

#### Collections & History Endpoints

| Request | Method | URL | Auth | Body (raw JSON) |
|---------|--------|-----|------|------------------|
| List Collections | GET | `{{base_url}}/api/v1/users/me/collections` | Inherit (Bearer) | *(none)* |
| Create Collection | POST | `{{base_url}}/api/v1/users/me/collections` | Inherit (Bearer) | `{"name":"Favorites","description":"My favorite hadiths"}` |
| Get History | GET | `{{base_url}}/api/v1/users/me/history` | Inherit (Bearer) | *(none)* |
| Clear History | DELETE | `{{base_url}}/api/v1/users/me/history` | Inherit (Bearer) | *(none)* |

#### Search Endpoint

| Request | Method | URL | Auth | Body |
|---------|--------|-----|------|------|
| Search | GET | `{{base_url}}/api/v1/search?query=patience&top_k=5` | No Auth (or Inherit to save history) | *(none — uses query params)* |

Set query params in the **Params** tab:

| Key | Value |
|-----|-------|
| `query` | `patience` |
| `top_k` | `5` |

### 6. Running the Full Collection

1. Click the **Hadith API** collection → **Run** (▶️ button).
2. Order requests: Register → Login → Get Profile → Search → ... → Delete Account.
3. Postman Runner will execute them in sequence, using the auto-saved tokens.

---

## Using Yaak (step-by-step)

[Yaak](https://yaak.app) is a lightweight, open-source API client. Here's how to set it up for this project.

### 1. Create a Workspace

1. Open Yaak → **New Workspace** → name it `Hadith Search API`.

### 2. Set Up Environment Variables

1. Go to the environment manager (top-right gear icon or `Cmd/Ctrl + E`).
2. Create an environment named `Local`.
3. Add these variables:

| Name | Value |
|------|-------|
| `base_url` | `http://localhost:3000` |
| `access_token` | *(leave empty, fill after login)* |
| `refresh_token` | *(leave empty, fill after login)* |

### 3. Organize Requests into Folders

Create the same folder structure as the Postman section above. In Yaak, right-click the sidebar → **New Folder**.

### 4. Create Each Request

For every request, use `${base_url}` to reference the environment variable (Yaak uses `${}` syntax instead of `{{}}`).

#### Example — Register

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `${base_url}/api/v1/auth/register` |
| Headers | `Content-Type: application/json` |
| Body (JSON) | `{"username":"testuser","email":"test@example.com","password":"StrongP@ss1"}` |

#### Example — Login

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `${base_url}/api/v1/auth/login` |
| Headers | `Content-Type: application/json` |
| Body (JSON) | `{"email":"test@example.com","password":"StrongP@ss1"}` |

After sending, **manually copy** the `access_token` and `refresh_token` from the response into your environment variables.

#### Example — Authenticated Request (Get Profile)

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `${base_url}/api/v1/users/me` |
| Headers | `Authorization: Bearer ${access_token}` |

#### Example — Search (with query params)

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `${base_url}/api/v1/search` |
| Params | `query=patience`, `top_k=5` |
| Headers | *(optional)* `Authorization: Bearer ${access_token}` |

### 5. Full Request List for Yaak

Copy-paste these into Yaak. Replace `${base_url}` and `${access_token}` with your environment variables.

| # | Name | Method | URL | Auth Header | Body |
|---|------|--------|-----|-------------|------|
| 1 | Register | POST | `${base_url}/api/v1/auth/register` | — | `{"username":"testuser","email":"test@example.com","password":"StrongP@ss1"}` |
| 2 | Login | POST | `${base_url}/api/v1/auth/login` | — | `{"email":"test@example.com","password":"StrongP@ss1"}` |
| 3 | Refresh | POST | `${base_url}/api/v1/auth/refresh` | — | `{"refresh_token":"${refresh_token}"}` |
| 4 | Logout | POST | `${base_url}/api/v1/auth/logout` | `Bearer ${access_token}` | — |
| 5 | Verify Email | POST | `${base_url}/api/v1/auth/verify-email` | — | `{"token":"<token>"}` |
| 6 | Forgot Password | POST | `${base_url}/api/v1/auth/forgot-password` | — | `{"email":"test@example.com"}` |
| 7 | Reset Password | POST | `${base_url}/api/v1/auth/reset-password` | — | `{"token":"<token>","new_password":"NewStr0ng!Pass"}` |
| 8 | Get Profile | GET | `${base_url}/api/v1/users/me` | `Bearer ${access_token}` | — |
| 9 | Update Profile | PATCH | `${base_url}/api/v1/users/me` | `Bearer ${access_token}` | `{"username":"newname"}` |
| 10 | Delete Account | DELETE | `${base_url}/api/v1/users/me` | `Bearer ${access_token}` | — |
| 11 | List Saved | GET | `${base_url}/api/v1/users/me/saved` | `Bearer ${access_token}` | — |
| 12 | Save Hadith | POST | `${base_url}/api/v1/users/me/saved` | `Bearer ${access_token}` | `{"original_id":123,"reference":"Sahih Bukhari Vol 1","chunk_text":"Narrated...","complete_english_text":"Full...","collection_id":null}` |
| 13 | Remove Saved | DELETE | `${base_url}/api/v1/users/me/saved/<id>` | `Bearer ${access_token}` | — |
| 14 | List Collections | GET | `${base_url}/api/v1/users/me/collections` | `Bearer ${access_token}` | — |
| 15 | Create Collection | POST | `${base_url}/api/v1/users/me/collections` | `Bearer ${access_token}` | `{"name":"Favorites","description":"My favorite hadiths"}` |
| 16 | Get History | GET | `${base_url}/api/v1/users/me/history` | `Bearer ${access_token}` | — |
| 17 | Clear History | DELETE | `${base_url}/api/v1/users/me/history` | `Bearer ${access_token}` | — |
| 18 | Search | GET | `${base_url}/api/v1/search?query=patience&top_k=5` | *(optional)* `Bearer ${access_token}` | — |

### 6. Tips for Yaak

- **Response preview:** Yaak shows JSON responses with syntax highlighting — use the **Pretty** tab.
- **History:** Every request you send is logged in the sidebar under each request — useful for comparing responses.
- **Duplicate requests:** Right-click a request → **Duplicate** to quickly create variations (e.g., test invalid payloads).
- **Import from cURL:** You can paste any cURL command from the earlier section directly into Yaak via **Import** → **From cURL**.
