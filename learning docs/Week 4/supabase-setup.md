# Week 4: Supabase Auth Setup

Authentication with Supabase — sign up, log in, verify tokens, protect routes.

---

## Stage 0: Set Up Supabase & Your Server

### 1. Create Supabase Project

- Go to [supabase.com](https://supabase.com)
- Sign up (free, no credit card)
- Create a new project (name: "Auth-Practice" or similar)
- Wait 1-2 minutes for provisioning

### 2. Get API Credentials

- Open **Project Settings → API**
- Copy:
  - `Project URL` → `SUPABASE_URL`
  - `anon key` (public key) → `SUPABASE_KEY`
  - ⚠️ Never use `service_role key` — it bypasses all security

### 3. Create `.env` (git-ignored)

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOi...
PORT=3000
```

Verify `.env` is in `.gitignore` — if not, add it:
```
echo ".env" >> .gitignore
```

### 4. Install Dependencies

```bash
npm install @supabase/supabase-js dotenv
```

### 5. Initialize Supabase Client

Create `src/db/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default supabase
```

### 6. Turn Off Email Confirmation (Testing Only)

In Supabase Dashboard:
- **Authentication → Sign In / Providers → Email**
- Toggle **Confirm email** OFF (so new signups can log in immediately)

### 7. Start Your Server

```bash
node --env-file=.env index.js
```

Should log: `Server running on http://localhost:3000` with no errors.

### 8. Verify Setup

Check that `.env` is NOT committed:
```bash
git status  # .env should not appear
```

Create `.env.example` with placeholder values:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PORT=3000
```

Commit `.env.example` (not `.env`):
```bash
git add .env.example .gitignore
git commit -m "Stage 0: setup server and supabase client"
```

---

## Key Points

- ✅ Your Supabase URL and anon key are in `.env` (git-ignored)
- ✅ Supabase client is initialized and ready to use
- ✅ Server starts without errors
- ✅ Email confirmation is OFF for testing
- ✅ No secrets in git history

---

## Next: Stage 1 — Sign Up & Log In

When ready, implement `POST /auth/signup` and `POST /auth/login`.
