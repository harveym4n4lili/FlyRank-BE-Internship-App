# Week 2: Simple CRUD API

Learning CRUD API concepts and implementation with Node.js + Express.

---

## What is a CRUD API?

**CRUD = Create, Read, Update, Delete**

A CRUD API is a backend system that allows clients to perform four fundamental operations on data:

| Operation | HTTP Method | Action | Status Code |
|-----------|-------------|--------|------------|
| **C**reate | POST | Add new data | 201 Created |
| **R**ead | GET | Retrieve data | 200 OK |
| **U**pdate | PUT/PATCH | Modify existing data | 200 OK |
| **D**elete | DELETE | Remove data | 200 OK or 204 No Content |

---

## REST API Principles

**REST (Representational State Transfer)** uses:
- **Resources** - Things you manage (tasks, users, products)
- **HTTP Methods** - Actions on resources (GET, POST, PUT, DELETE)
- **Status Codes** - Response indicators (200, 201, 400, 404, 500)
- **Stateless** - Each request contains all info needed, no client context stored

**Example REST endpoints:**
```
GET    /health         → Check if server is running (healthcheck)
GET    /tasks          → Get all tasks
GET    /tasks/1        → Get task with ID 1
POST   /tasks          → Create new task
PUT    /tasks/1        → Replace entire task 1
PATCH  /tasks/1        → Update part of task 1
DELETE /tasks/1        → Delete task 1
```

---

## Health Check Endpoint

**What is a /health route:**
A healthcheck endpoint that returns a simple response to verify the server is running and responsive.

**Why use it:**
- Monitoring tools use it to check if server is alive
- Load balancers use it to route traffic only to healthy servers
- Quick way to verify API is responding
- No authentication needed, very lightweight

**Implementation:**
```javascript
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'Server is running' });
});
```

**Test in Postman:**
- Method: `GET`
- URL: `http://localhost:3000/health`
- Expected response: `{ "status": "Server is running" }` with status 200

---

## Implementation Steps

### 1. Set up Express Server
```javascript
import express from 'express';
const app = express();
app.use(express.json()); // Parse JSON bodies
```

### 2. Create Mock Data (for testing)
```javascript
const mockData = [
  { id: 1, task_name: "Learn CRUD", completed: false }
];
```

### 3. Implement GET (Read all)
```javascript
router.get('/', (req, res) => {
    res.send(mockData);
});
```

### 4. Implement GET by ID (Read one)
```javascript
router.get('/:id', (req, res) => {
    const task = mockData.find(t => t.id === parseInt(req.params.id));
    if (task) {
        res.send(task);
    } else {
        res.status(404).send({ message: 'Not found' });
    }
});
```

### 5. Implement POST (Create)
```javascript
router.post('/', (req, res) => {
    const newTask = req.body;
    newTask.id = uuidv4(); // Generate unique ID
    mockData.push(newTask);
    res.status(201).send(newTask); // 201 = Created
});
```

### 6. Implement PATCH (Update)
```javascript
router.patch('/:id', (req, res) => {
    const task = mockData.find(t => t.id === parseInt(req.params.id));
    if (task) {
        Object.assign(task, req.body); // Merge updates
        res.send(task);
    } else {
        res.status(404).send({ message: 'Not found' });
    }
});
```

### 7. Implement DELETE
```javascript
router.delete('/:id', (req, res) => {
    const index = mockData.findIndex(t => t.id === parseInt(req.params.id));
    if (index !== -1) {
        mockData.splice(index, 1);
        res.send({ message: 'Deleted' });
    } else {
        res.status(404).send({ message: 'Not found' });
    }
});
```

---

## Testing Your CRUD API

**Best approach:** Use Postman instead of terminal curl
- No terminal string escaping issues
- Visual interface for building requests
- Can save request collections

**Common HTTP Status Codes:**
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Client error (invalid data)
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

---

## Key Learnings

- Each HTTP method corresponds to a database operation
- Status codes tell the client what happened
- Use path parameters (`:id`) for specific resources
- Use request body for data in POST/PATCH
- Always validate/check if resource exists before updating/deleting
- Mock data is great for testing before using a real database

---

## Resource
[FreeCodeCamp: Create CRUD API Project](https://www.freecodecamp.org/news/create-crud-api-project/)
