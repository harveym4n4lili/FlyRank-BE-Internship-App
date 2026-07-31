import express from 'express';
import bodyParser from 'body-parser';

const app = express();

const PORT = 3000;

import tasksRouter from './src/routes/tasks.js';

app.use(bodyParser.json()); // Middleware to parse JSON request bodies

app.get('/', (req, res) => {
  res.send({
    name: "Task API", 
    version: "1.0", 
    endpoints: ["/tasks"]
  });
}); // Root route to test the server

app.get('/health', (req, res) => {
  res.status(200).send({ status: 'Server is running and healthy :)' });
}); // Health check route to verify if the server is running

app.use('/tasks', tasksRouter); // Use the tasks router file  for routes starting with /tasks

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); // Start the server and listen on the specified port
