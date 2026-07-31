import express from 'express';
const app = express();

const PORT = 3000;

import tasksRouter from './src/routes/tasks.js';

app.get('/', (req, res) => {
  res.send('Welcome to the Task Management API!');
}); // Root route to test the server

app.use('/tasks', tasksRouter); // Use the tasks router file  for routes starting with /tasks

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); // Start the server and listen on the specified port
