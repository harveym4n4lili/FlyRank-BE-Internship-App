# Week 4: Auth & JWT Concepts

Secure authentication — who you are, what you can do, and how to prove it.

---

## The Trust Triangle (60 seconds)

Three players:
1. **Client** — Your frontend or curl, holds the password
2. **Supabase** — Identity Provider, stores accounts and signs tokens
3. **Your Server** — Checks the signature, guards the door

**Flow:**
1. Client sends email + password to Supabase
2. Supabase verifies, returns a JWT (access token)
3. Client sends JWT in every request to your server
4. Your server asks Supabase "is this real?" — Supabase says yes/no

That's the whole assignment.

---

## Key Concepts

**Authentication** — "Who are you?" (Supabase verifies email + password)  
**Authorization** — "What can you do?" (Your server checks permissions)  

**Identity Provider (IdP)** — Supabase stores users, hashes passwords, signs tokens. You never see the password.

**JWT (JSON Web Token)** — A signed string like `eyJhbGc.eyJzdWI.SIGNA`. Three parts:
- Header: algorithm (HMAC-SHA256)
- Payload: claims (user id, email, issued-at, expires-at)
- Signature: proof it wasn't tampered with

Anyone can READ a JWT (paste it into jwt.io). Nobody can FORGE one — the signature requires Supabase's secret key.

**Access Token** — The JWT from login. Short-lived (1 hour). Used as a bearer token on protected routes.

**Refresh Token** — Longer-lived. Used to get a fresh access token without logging in again.

**Bearer Token** — Any token sent as `Authorization: Bearer <token>`. Your access token is used as a bearer token.

---

## Stage 1: Sign Up & Log In

**POST /auth/signup**
- Body: `{"email": "user@example.com", "password": "xyz123"}`
- Call: `supabase.auth.signUp({email, password})`
- Supabase stores the account, hashes the password
- Return: 201 + user object (id, email, etc.)

**POST /auth/login**
- Body: `{"email": "user@example.com", "password": "xyz123"}`
- Call: `supabase.auth.signInWithPassword({email, password})`
- Supabase verifies, returns tokens
- Return: 200 + `{access_token, refresh_token}`

**Validation:**
- Missing email/password → 400 ("Bad Request")
- Wrong credentials → 401 ("Unauthorized")

---

## Stage 2: Public & Protected Routes

**GET /public/info**
- No auth needed
- Returns 200 + public data

**GET /protected/profile**
- Expects: `Authorization: Bearer <token>`
- Missing/malformed header → 401
- Not verifying yet, just checking the token exists

---

## Stage 3: Token Verification

Extract the token from the header:
```js
const auth = req.get('Authorization')  // "Bearer eyJhbGc..."
if (!auth || !auth.startsWith('Bearer ')) return 401

const token = auth.slice(7)  // Remove "Bearer "
```

Verify with Supabase:
```js
const { data, error } = await supabase.auth.getUser(token)
if (error || !data.user) return 401
```

If valid → user object contains `id`, `email`, `created_at`.  
If expired/tampered → error, return 401.

---

## Stage 4: Middleware & Logout

**Middleware** — Reusable guard that:
1. Extracts token
2. Verifies it
3. Attaches `req.user` to the request
4. Lets the route run (or returns 401 early)

Apply to multiple routes — write once, protect everywhere.

**POST /auth/logout**
- Protected route (needs valid token)
- Call: `supabase.auth.signOut()`
- Return: 204 ("No Content")

---

## Stage 5: Swagger UI

Swagger shows a padlock on protected routes when configured with `securitySchemes`:

```json
"securitySchemes": {
  "bearerAuth": {
    "type": "http",
    "scheme": "bearer",
    "bearerFormat": "JWT"
  }
}
```

Apply to protected routes:
```json
"security": [{"bearerAuth": []}]
```

Now Swagger shows an "Authorize" button — paste a token once, use it for all calls.

---

## Status Codes Cheat Sheet

- **201** — `POST /auth/signup` success (Created)
- **200** — `POST /auth/login` success; any GET/PUT success (OK)
- **204** — `POST /auth/logout` success (No Content)
- **400** — Missing/empty email or password (Bad Request)
- **401** — Invalid token, expired token, missing token (Unauthorized)
- **403** — Valid token but not allowed (Forbidden) — optional extra

---

## Golden Rules

1. ✅ Never store a password on your server
2. ✅ Never hash a password yourself (Supabase does it)
3. ✅ Never put secrets in a JWT (anyone can read it)
4. ✅ Always verify the token with Supabase (not local math)
5. ✅ Keep the anon key safe in `.env` (not in git)

---

## Next: Implement Stages 1–6

Start with signup/login, then add the guard (middleware), then Swagger docs.
