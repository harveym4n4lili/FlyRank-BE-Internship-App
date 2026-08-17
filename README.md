# Task Management API

A simple CRUD API for managing tasks, built with Node.js and Express. Fully documented with Swagger UI for easy testing.

## How to Run from Github

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install dependencies through terminal:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

4. Test the API:
   - The API will start on `http://localhost:3000`
   - Visit `http://localhost:3000/docs` for Swagger UI
   - Or use curl: `curl http://localhost:3000/tasks`

## What This Is

A REST API for creating, reading, updating, and deleting tasks. Built as part of Week 2 backend internship learning, demonstrating:
- RESTful API design principles
- Complete CRUD operations
- Input validation
- Proper HTTP status codes
- OpenAPI/Swagger documentation

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/tasks` | Get all tasks | 200 |
| GET | `/tasks/:id` | Get a specific task | 200 / 404 |
| POST | `/tasks` | Create a new task | 201 / 400 |
| PATCH | `/tasks/:id` | Update a task | 200 / 404 |
| DELETE | `/tasks/:id` | Delete a task | 204 / 404 |

## Technology Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **swagger-ui-express** - API documentation UI
- **swagger-jsdoc** - API documentation generator
- **body-parser** - Request body parsing

## Assignment Notes

This repo contains weekly branches for the FlyRank AI Internship Backend Program.
- Each week has its own branch
- Each branch contains multiple commits with a final commit of each branch represents the assignment turn-in.
- Main branch contains stable, merged versions
---