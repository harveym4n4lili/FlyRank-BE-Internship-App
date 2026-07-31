# Week 2: Key Concepts & Learnings

Add major concepts and learnings you discover this week that aren't specific to CRUD APIs.

---

## Topics Covered

### package.json - npm Scripts

**What was changed:**
Added npm scripts to make starting the server easier:
```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

**How it helps:**
- Instead of typing `node index.js` every time, you can now type `npm start`
- The `dev` script uses nodemon, which auto-restarts the server when you save file changes
- Saves time during development and reduces manual errors
- Follows industry standard npm conventions

---

### CommonJS vs ES6 Modules

**The Problem:**
Got an error when trying to use `import` in index.js: "Cannot use import statement outside a module"

**Why it happens:**
Node.js has two module systems:
- **CommonJS** (default): Uses `require()` to import files
- **ES6 Modules**: Uses `import` to import files

By default, Node.js expects CommonJS syntax. When you try to use `import`, it doesn't recognize it as valid syntax.

**The Solution:**
Add `"type": "module"` to `package.json`:
```json
{
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

**How it fixed the bug:**
- This line tells Node.js: "This project uses ES6 module syntax"
- Now Node.js interprets `import` statements correctly instead of throwing an error
- Allows modern JavaScript syntax to work in your project

**CommonJS vs ES6 - Quick Comparison:**
| CommonJS | ES6 Modules |
|----------|------------|
| `require()` | `import` |
| `module.exports` | `export` |
| Traditional Node.js | Modern standard |
| `const express = require('express')` | `import express from 'express'` |

**Why we prefer ES6 modules:**
- More modern syntax
- Better for organizing code
- Industry standard for new projects
- Cleaner and more readable

---

### curl -X Flag and DELETE Requests

**What is the -X flag:**
The `-X` flag in curl explicitly specifies the HTTP method (GET, POST, DELETE, PUT, etc.)

**Why it's important for DELETE:**
```powershell
# WITHOUT -X (will fail or behave unexpectedly)
curl.exe http://localhost:3000/tasks/1

# WITH -X DELETE (correct)
curl.exe -X DELETE http://localhost:3000/tasks/1
```

**Why -X might break DELETE requests:**
- By default, curl uses GET method if no method is specified
- Without `-X DELETE`, curl sends a GET request instead of DELETE
- The server expects DELETE but receives GET, causing the route to fail
- The wrong HTTP method reaches the wrong endpoint handler

**Key learning:**
- Always use `-X METHOD` to explicitly specify the HTTP verb
- This ensures your request reaches the correct route handler
- Different HTTP methods (GET, POST, DELETE, PUT) handle different operations

**curl HTTP Methods Reference:**
| Method | Flag | Purpose |
|--------|------|---------|
| GET | `-X GET` or omit | Retrieve data |
| POST | `-X POST` | Create data |
| DELETE | `-X DELETE` | Remove data |
| PUT | `-X PUT` | Replace data |
| PATCH | `-X PATCH` | Partial update |

---

### Express JSON Parser Middleware

**The Problem:**
When sending JSON data in curl/Postman requests:
```powershell
curl.exe -X PATCH http://localhost:3000/tasks/1 -d '{"task_name":"Updated","completed":false}'
```

Without middleware, `req.body` is `undefined`, causing: "Cannot destructure property of 'req.body' as it is undefined"

**The Solution:**
Add this middleware to `index.js`:
```javascript
app.use(express.json());
```

**How it works:**
1. Middleware sits between incoming request and your route handler
2. Intercepts all incoming requests
3. Checks if request has `Content-Type: application/json`
4. Parses the raw JSON string from request body
5. Converts it to a JavaScript object and stores in `req.body`
6. Passes control to your route handler

**Why it must be in the root file (index.js):**
- Middleware runs in order - it must be BEFORE your routes are defined
- If middleware is in the route file, it won't catch requests to that route
- Root file processes all requests first, ensuring JSON is parsed globally
- Otherwise each route file would need to add the middleware separately

**Order matters:**
```javascript
// WRONG - middleware after routes
app.use('/tasks', tasksRouter);
app.use(express.json()); // Too late!

// CORRECT - middleware before routes
app.use(express.json());
app.use('/tasks', tasksRouter);
```

**What express.json() does:**
- Reads raw request body stream
- Parses JSON string: `'{"name":"test"}'` → `{name: "test"}`
- Attaches parsed object to `req.body`
- Makes data available in all route handlers

---

### PowerShell curl vs JSON Middleware

**The Problem:**
After adding JSON parsing middleware (`express.json()` or `body-parser`), curl commands from PowerShell terminal stopped working:

```powershell
# This worked BEFORE adding middleware
curl.exe -i -X PATCH http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"task_name":"Updated"}'

# After middleware: "SyntaxError: Expected property name or '}' in JSON at position 1"
```

**Why it happens:**
- PowerShell sends the JSON string differently than other systems
- The JSON middleware validates the incoming JSON strictly
- PowerShell's shell parsing + curl's string handling = malformed JSON to the server
- Works fine for simple `{}` but fails with complex properties

**The Solution: Use Postman**
- Postman is a proper API testing tool that handles JSON correctly
- No terminal string escaping issues
- Can save requests for reuse
- Visual interface shows exactly what's being sent

**When to use what:**
| Tool | Best for | JSON Issues |
|------|----------|------------|
| PowerShell curl | Simple requests (GET, DELETE without body) | YES - string escaping problems |
| bash curl | Any request, better string handling | NO - bash handles escaping better |
| Postman | Testing API endpoints properly | NO - native JSON support |

**Workaround if you must use PowerShell:**
- Use `Invoke-WebRequest` (PowerShell native command)
- Or save JSON to file and use `curl -d @file.json`
- Or use Git Bash instead of PowerShell

---

### Using Postman to Test API Endpoints

**What is Postman:**
Postman is a GUI application for testing APIs. No terminal string escaping issues - it handles JSON natively.

**Why use Postman over curl:**
- Visual interface - easier to build requests
- Automatic JSON formatting
- Can save and organize requests
- Shows responses clearly (status code, headers, body)
- No PowerShell string encoding problems

**How to use Postman:**

**1. Download & Install**
- Go to https://www.postman.com/downloads/
- Download and install for your OS
- Launch Postman

**2. Create a Request**
- Click **+ New** → **HTTP Request**
- Select HTTP method (GET, POST, PATCH, DELETE)
- Enter URL: `http://localhost:3000/tasks` (or with `/tasks/1` for specific ID)

**3. For requests with JSON body (POST, PATCH):**
- Go to **Body** tab
- Select **raw**
- Choose **JSON** from dropdown (right side)
- Paste your JSON:
```json
{
  "task_name": "New Task",
  "task_description": "Task description",
  "completed": false
}
```

**4. Send Request**
- Click **Send**
- View response below:
  - Status code (200, 201, 404, etc.)
  - Response body (JSON returned from server)
  - Headers and metadata

**Test all CRUD operations:**
```
GET    /tasks              → See all tasks
GET    /tasks/1            → See task with ID 1
POST   /tasks              → Create new task (needs body)
PATCH  /tasks/1            → Update task (needs body)
DELETE /tasks/1            → Delete task
```

**Save requests for reuse:**
- Click **Save** in Postman
- Organize into collections
- Reuse same requests later without retyping

---

_Update as you progress through the week._
