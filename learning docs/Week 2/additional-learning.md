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

_Update as you progress through the week._
