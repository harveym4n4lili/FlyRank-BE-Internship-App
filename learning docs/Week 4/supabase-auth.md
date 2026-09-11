# Week 4: How Auth Works with Supabase

Understanding the complete authentication flow — and how to test it.

---

## The Trust Triangle

Three players in authentication:

```
┌─────────────────────────────────────────┐
│                                         │
│  Your Backend                           │
│  (http://localhost:3000)                │
│  ✓ Verifies tokens                      │
│  ✓ Guards protected routes              │
│                                         │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼────────┐          ┌─────▼──────┐
    │  Client    │          │ Supabase   │
    │ (Browser/  │◄────────►│ (Identity  │
    │   curl)    │          │  Provider) │
    └────────────┘          └────────────┘
```

**Flow:**
1. **Client** sends email + password to **Supabase**
2. **Supabase** verifies credentials, returns JWT token
3. **Client** sends JWT in every request to **Your Backend**
4. **Your Backend** asks **Supabase** "is this token real?"
5. **Supabase** says yes/no

---

## What Happens at Each Stage

### Stage 1: Sign Up & Login

**Client action:** POST email + password to Supabase (via your `/auth/signup` or `/auth/login`)

**Supabase action:**
- Checks if email exists (signup only)
- Verifies password against hashed version
- Creates session with JWT access token + refresh token
- Returns both tokens to client

**Your backend action:** Just forward credentials to Supabase, return the tokens

**Result:** Client has an access_token (short-lived, 1 hour) and refresh_token (long-lived)

---

### Stage 2: Client Sends Token

**Client action:** Includes token in every protected request

```
Authorization: Bearer eyJhbGc...
```

The "Bearer " prefix means "I'm using a bearer token authentication scheme"

---

### Stage 3: Your Backend Verifies Token

**Your backend action:**
1. Extract token from `Authorization: Bearer <token>` header
2. Call `supabase.auth.getUser(token)` — Supabase verifies the signature
3. If valid → Supabase returns user object, attach to request
4. If invalid/expired → return 401 "Invalid or expired token"

**Why can we trust Supabase?** The JWT is cryptographically signed. Supabase is the only one with the secret key. If someone changes even one character, the signature fails.

---

### Stage 4: Middleware Reuse

**Your backend design:**
- Extract the token verification logic into **middleware**
- Apply middleware to protected routes
- No copy-paste, no missed doors

---

### Stage 5 & 6: Swagger & GitHub

**Swagger:** Add bearer auth configuration so you can paste a token once and test all protected routes

**GitHub:** Push your code (never .env!) with a README explaining the flow

---

## How a JWT Token Works

Paste any access token into [jwt.io](https://jwt.io) to see three parts:

```
Header.Payload.Signature

eyJhbGc...     .    eyJpc3M...     .    ciL4RQZ...
(algorithm)         (claims)           (signature)
```

**Header:** Says "this is a JWT, signed with HS256"

**Payload (claims):** Contains facts about you
- `sub` (subject) = your user ID
- `email` = your email
- `exp` (expiration) = when token dies (1 hour from now)
- `iat` (issued at) = when token was created
- `role` = "authenticated"

**Signature:** Proves Supabase created this. Only Supabase has the secret key to create it.

**Important:** Anyone can READ the payload (it's just base64). But nobody can FORGE a signature without Supabase's secret key.

---

## Why This Is Secure

1. **No passwords stored on your backend** — Supabase hashes them
2. **No password sent on every request** — Only a token (which expires)
3. **Token can't be forged** — Supabase's signature proves authenticity
4. **Token expires** — Even if stolen, it dies in 1 hour
5. **Refresh token exists** — Get a new access token without logging in again

---

## How Each Route Works

| Route | Public? | Logic |
|-------|---------|-------|
| `POST /auth/signup` | Yes | Forward email+password to Supabase, return new user |
| `POST /auth/login` | Yes | Forward email+password to Supabase, return tokens |
| `GET /public/info` | Yes | No auth, just return data |
| `GET /protected/profile` | No | Extract token → verify with Supabase → return user data |
| `POST /auth/logout` | No | Required token, call Supabase signOut |

---

## Testing Auth with curl/PowerShell

Complete workflow — signup, login, protected routes, logout.

---

## Setup

**Save your access token:**

```powershell
# PowerShell variable (reuse in other commands)
$token = "eyJhbGc..."
```

**Or bash:**

```bash
TOKEN="eyJhbGc..."
```

---

## Stage 1: Sign Up & Log In

### Sign Up

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/auth/signup" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body '{"email":"john@example.com","password":"password123"}' `
  -UseBasicParsing
```

**Expected:** 201 + user object

### Log In

```powershell
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/auth/login" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body '{"email":"john@example.com","password":"password123"}' `
  -UseBasicParsing

$token = ($loginResponse.Content | ConvertFrom-Json).access_token
Write-Host "Token saved: $token"
```

**Expected:** 200 + `access_token` and `refresh_token`

---

## Stage 2 & 3: Public & Protected Routes

### Public Route (No Auth)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/public/info" `
  -UseBasicParsing
```

**Expected:** 200 + message

### Protected Route (Valid Token)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/protected/profile" `
  -Headers @{"Authorization" = "Bearer $token"} `
  -UseBasicParsing
```

**Expected:** 200 + user data

### Protected Route (No Token)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/protected/profile" `
  -UseBasicParsing
```

**Expected:** 401 + "Access token required"

### Protected Route (Bad Token)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/protected/profile" `
  -Headers @{"Authorization" = "Bearer BADTOKEN"} `
  -UseBasicParsing
```

**Expected:** 401 + "Invalid or expired token"

---

## Stage 4: Logout

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/auth/logout" `
  -Method POST `
  -Headers @{"Authorization" = "Bearer $token"} `
  -UseBasicParsing
```

**Expected:** 204 (No Content, empty response)

---

## Complete Bash Workflow

If you prefer bash/curl:

```bash
# Sign up
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Log in
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.access_token')

echo "Token: $TOKEN"

# Protected profile
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/protected/profile

# Logout
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/auth/logout
```

---

## Swagger UI Testing

Easiest way to test:

1. Open `http://localhost:3000/docs`
2. **POST /auth/login** → Try it out → Execute
3. Copy the `access_token` from response
4. Click 🔒 **"Authorize"** button at top
5. Paste token (Swagger adds "Bearer" prefix)
6. Click "Authorize"
7. Test **GET /protected/profile** → Try it out → Execute
8. Should return 200 + user data

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Access token required" | No Authorization header | Add: `-H "Authorization: Bearer $TOKEN"` |
| "Invalid or expired token" | Token tampered or expired | Get new token from login |
| 400 Bad Request | Missing email/password | Check body JSON syntax |
| 401 Invalid credentials | Wrong password | Verify email & password |
| "Email rate limit exceeded" | Too many signups same email | Use different email |

---

## Status Codes Cheat Sheet

- **201** — Signup success
- **200** — Login/Protected route success
- **204** — Logout success (no content)
- **400** — Bad request (missing fields)
- **401** — Invalid token or credentials
- **403** — Forbidden (authenticated but not allowed)

---

## Tips

✅ Save token in a variable — reuse it for multiple protected requests  
✅ Copy exact token from login response — no typos  
✅ Bearer token format: `Authorization: Bearer eyJhbGc...`  
✅ Use Swagger for interactive testing (easier than curl)  
✅ Check token expiry: paste at [jwt.io](https://jwt.io) to decode
