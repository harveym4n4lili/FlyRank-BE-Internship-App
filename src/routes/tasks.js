import express from 'express';
const router = express.Router();
const PORT = 3000;

// MOCK DATA
const mockData = [
  {
    task_name: 'Implement user authentication',
    task_description: 'Implement user authentication using JWT and bcrypt.',
    completed: true,
  },
  {
    task_name: 'Create RESTful API endpoints',
    task_description: 'Create RESTful API endpoints for CRUD operations on tasks.', 
    completed: false,
  },
  {
    task_name: 'Integrate with frontend',
    task_description: 'Integrate the backend API with the frontend application.',
    completed: false,
  },
]; // Mock data for testing purposes

router.get('/', (req, res) => {
    res.send(mockData);
}) // GET route to fetch all tasks

export default router;