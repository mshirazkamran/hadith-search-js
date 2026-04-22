# API Documentation

## Module 1: Authentication Module

### 1. Register
- **Method:** POST  
- **Route:** `/api/v1/auth/register`  
- **Description:** Creates a new user account.

#### Request Body:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Response (201):
```json
{
  "message": "Account created. Check your email to verify."
}
```

#### Errors:
- 409: Email already exists  
- 422: Invalid email format  
- 422: Weak or invalid password  

---

### 2. Login
- **Method:** POST  
- **Route:** `/api/v1/auth/login`  
- **Description:** Authenticates a user and returns tokens.

#### Request Body:
```json
{
  "email": "string",
  "password": "string"
}
```

#### Response (200):
```json
{
  "access_token": "string (JWT)",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

#### Errors:
- 401: Wrong password or email not found  
- 403: Email not verified  
- 403: Account disabled  

---

### 3. Refresh Token
- **Method:** POST  
- **Route:** `/api/v1/auth/refresh`  
- **Description:** Issues a new access token from a refresh token.

#### Request Body:
```json
{
  "refresh_token": "string"
}
```

#### Response (200):
```json
{
  "access_token": "string (JWT)",
  "token_type": "bearer"
}
```

#### Errors:
- 401: Token expired  
- 401: Token revoked  

---

### 4. Logout
- **Method:** POST  
- **Route:** `/api/v1/auth/logout`  
- **Auth:** Bearer token required  
- **Description:** Revokes the user's refresh token.

#### Response (200):
```json
{
  "message": "Logged out."
}
```

#### Errors:
- 401: Missing or invalid token  

#### Alternate Flows:
- Already logged out → 200 (idempotent)

---

### 5. Verify Email
- **Method:** POST  
- **Route:** `/api/v1/auth/verify-email`  
- **Description:** Verifies a user's email using a token.

#### Request Body:
```json
{
  "token": "string"
}
```

#### Response (200):
```json
{
  "message": "Email verified."
}
```

#### Errors:
- 400: Token expired or invalid  

#### Alternate Flows:
- Already verified → 200 (idempotent)

---

### 6. Forgot Password
- **Method:** POST  
- **Route:** `/api/v1/auth/forgot-password`  
- **Description:** Sends a password reset link to the email.

#### Request Body:
```json
{
  "email": "string"
}
```

#### Response (200):
```json
{
  "message": "If that email exists, a reset link was sent."
}
```

#### Alternate Flows:
- Always returns 200 — does not reveal if email exists

---

### 7. Reset Password
- **Method:** POST  
- **Route:** `/api/v1/auth/reset-password`  
- **Description:** Resets password using the reset token.

#### Request Body:
```json
{
  "token": "string",
  "new_password": "string"
}
```

#### Response (200):
```json
{
  "message": "Password updated."
}
```

#### Errors:
- 400: Token expired or invalid  
- 422: Weak password  

---

## Module 2: User Management

### 8. Get Profile
- **Method:** GET  
- **Route:** `/api/v1/users/me`  
- **Description:** Returns the authenticated user's profile.

#### Response (200):
```json
{
  "id": "ObjectId",
  "username": "string",
  "email": "string",
  "role": "user | admin",
  "is_verified": "boolean",
  "created_at": "datetime"
}
```

#### Errors:
- 401: Invalid or expired token  

---

### 9. Update Profile
- **Method:** PATCH  
- **Route:** `/api/v1/users/me`  
- **Description:** Updates username or email (all fields optional).

#### Request Body:
```json
{
  "username": "string",
  "email": "string"
}
```

#### Response (200):
Updated profile (same as Get Profile)

#### Errors:
- 401: Invalid or expired token  
- 409: Username or email already taken  
- 422: No fields provided  

---

### 10. Delete Account
- **Method:** DELETE  
- **Route:** `/api/v1/users/me`  
- **Description:** Deletes the user account and all related data.

#### Response (200):
```json
{
  "message": "Account deleted."
}
```

#### Errors:
- 401: Invalid token  

---

### 11. Get Saved Hadiths
- **Method:** GET  
- **Route:** `/api/v1/users/me/saved`  
- **Description:** Returns all bookmarked Hadiths.

#### Response (200):
```json
[
  {
    "id": "ObjectId",
    "original_id": 123,
    "reference": "string",
    "chunk_text": "string",
    "complete_english_text": "string",
    "collection_id": "ObjectId | null",
    "saved_at": "datetime"
  }
]
```

#### Errors:
- 401: Missing or invalid token  

---

### 12. Save Hadith (Bookmark)
- **Method:** POST  
- **Route:** `/api/v1/users/me/saved`  
- **Description:** Bookmarks a Hadith.

#### Request Body:
```json
{
  "original_id": 123,
  "reference": "Sahih Bukhari Vol 1",
  "chunk_text": "Narrated by...",
  "complete_english_text": "The full text...",
  "collection_id": "ObjectId | null"
}
```

#### Response (201):
SavedHadith object

#### Errors:
- 401: Missing or invalid token  
- 404: collection_id not found  
- 409: Already bookmarked  

---

### 13. Remove Saved Hadith
- **Method:** DELETE  
- **Route:** `/api/v1/users/me/saved/{saved_id}`  

#### Response (200):
```json
{
  "message": "Removed."
}
```

#### Errors:
- 401: Missing or invalid token  
- 404: Not found or not owned  

---

### 14. Get Collections
- **Method:** GET  
- **Route:** `/api/v1/users/me/collections`

#### Errors:
- 401: Missing or invalid token  

---

### 15. Create Collection
- **Method:** POST  
- **Route:** `/api/v1/users/me/collections`

#### Request Body:
```json
{
  "name": "string",
  "description": "string | null",
  "is_public": "boolean"
}
```

#### Errors:
- 401: Missing or invalid token  
- 422: Missing required fields  

---

### 16. Get Search History
- **Method:** GET  
- **Route:** `/api/v1/users/me/history`

#### Errors:
- 401: Missing or invalid token  

---

### 17. Clear Search History
- **Method:** DELETE  
- **Route:** `/api/v1/users/me/history`

#### Response (200):
```json
{
  "message": "History cleared."
}
```

#### Errors:
- 401: Missing or invalid token  

---

## Module 3: Vector Hadith Search

### 18. Search Hadiths
- **Method:** GET  
- **Route:** `/api/v1/search`  
- **Description:** Vector search + LLM validation.

#### Query Params:
| Param | Type | Required | Default |
|------|------|----------|---------|
| query | string | Yes | — |
| top_k | integer (3–10) | No | 5 |

#### Response (200):
```json
{
  "found": "boolean",
  "llm_response": "string",
  "results": [
    {
      "original_id": "integer",
      "chunk_id": "integer",
      "reference": "string",
      "narrator": "string",
      "chunk_text": "string",
      "complete_english_text": "string",
      "score": "float"
    }
  ]
}
```

#### Errors:
- 422: Empty query  
- 422: Invalid top_k  
- 500: Qdrant unreachable  

#### Alternate Flows:
- Off-topic query → `found: false` but results returned  
- Authenticated → query saved  

---

## Module 4: LLM Validation (Internal)

### Validate Search Results
- **Description:** Validates Qdrant hits using LLM.

#### Input:
```json
{
  "query": "string",
  "hits": [
    {
      "reference": "string",
      "complete_english_text": "string",
      "chunk_text": "string"
    }
  ]
}
```

#### Output:
```json
{
  "found": "boolean",
  "llm_response": "string"
}
```

#### Alternate Flows:
- Gemini 429/503 → fallback to Groq  
- Both fail → offline fallback  
- Malformed output → handled with fallback  