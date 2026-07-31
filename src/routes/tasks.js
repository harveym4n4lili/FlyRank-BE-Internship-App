import express from 'express';
import {v4 as uuidv4} from 'uuid';

const router = express.Router();

// MOCK DATA
const mockData = [
  {
    id: 1,
    task_name: 'Implement user authentication',
    task_description: 'Implement user authentication using JWT and bcrypt.',
    completed: true,
  },
  {
    id: 2,
    task_name: 'Create RESTful API endpoints',
    task_description: 'Create RESTful API endpoints for CRUD operations on tasks.', 
    completed: false,
  },
  {
    id: 3,
    task_name: 'Integrate with frontend',
    task_description: 'Integrate the backend API with the frontend application.',
    completed: false,
  },
]; // Mock data for testing purposes

router.get('/', (req, res) => {
    res.send(mockData);
}) // GET route to fetch all tasks

router.post('/', (req, res) => {
    const newTask = req.body; // Get the new task data from the request body
    mockData.push({...newTask, id: uuidv4() }); // Add the new task to the mock data array
    res.status(201).send(newTask); // Send a response with status 201 (Created) and the new task data
}); // POST route to create a new task

export default router;