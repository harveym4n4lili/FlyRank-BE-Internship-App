# Week 3: Docker & PostgreSQL

Containerize your full stack: app + database, one command to rule them all.

---

## Why Docker?

**Before:** Run app and database manually on different ports.  
**After:** `docker compose up` — everything starts together, every time, every computer.

---

## Key Concepts

**Image** — Blueprint (PostgreSQL software + config)  
**Container** — Running instance of an image  
**Volume** — Persistent data folder (survives restarts)  
**Port** — How you talk to the container (`localhost:3000` → `container:3000`)  
**Environment Variables** — Settings (`DATABASE_URL`, `POSTGRES_PASSWORD`, etc.)  

---

## Stage 1: Connect Your App via .env

**Three things:**
1. **`.env`** (git-ignored) — `DATABASE_URL=postgres://postgres:dev@localhost:5432/tasks`
2. **`.env.example`** (committed) — Same keys, placeholder values
3. **`pg` driver** — `npm install pg`

**On startup:** Load `.env`, create pool, initialize table + seed 3 tasks (once, never again on restart).

Keep all database code in one module (`src/db/`). Routes never touch it.

---

## Stage 2: Read from Postgres

`GET /tasks` → `SELECT * FROM tasks`  
`GET /tasks/{id}` → `SELECT * FROM tasks WHERE id = $1` (parameterized)  

Unknown id → 404 + `{"error": "Task not found"}`

---

## Stage 3: Full CRUD on Postgres

`POST /tasks` → `INSERT ... RETURNING *` (returns new row, status 201)  
`PUT /tasks/{id}` → `UPDATE tasks SET ... WHERE id = $1` (status 200)  
`DELETE /tasks/{id}` → `DELETE FROM tasks WHERE id = $1` (status 204)  

---

## Stage 4: One Command for Everything

**Dockerfile** — 6 lines, builds your Node.js app

**compose.yaml** — Two services:
- `api`: built from your Dockerfile, port 3000, depends on `db`
- `db`: postgres image, volume for persistence, environment config

```yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://postgres:dev@db:5432/tasks
    depends_on: [db]
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: tasks
    volumes: [taskdata:/var/lib/postgresql/data]
volumes:
  taskdata:
```

**Inside the compose network,** your app reaches the database by service name `db`, not `localhost`.

**Start:** `docker compose up`  
**Stop:** `docker compose down` (volume keeps data)

---

## Common Docker Commands

```bash
docker ps                           # List running containers
docker logs <container-name>        # See output
docker exec -it <name> psql -U postgres -d tasks   # Connect to database
docker volume ls                    # List volumes
docker compose up -d                # Start in background
docker compose down                 # Stop everything
```
