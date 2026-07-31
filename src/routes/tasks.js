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

    if (!newTask.task_name) {
        mockData.push({...newTask, id: uuidv4() }); // Add the new task to the mock data array
        res.status(201).send(newTask); // Send a response with status 201 (Created) and the new task data
    } else {
        res.status(400).send({ error: 'Task name is required' }); // If task_name is missing, send a 400 response with an error message
    }
}); // POST route to create a new task

router.get('/:id', (req, res) => {
    const taskId = req.params.id; // Get the task ID from the request parameters

    const foundUser= mockData.find((task) => task.id === parseInt(taskId)); // Find the task with the matching ID in the mock data array

    if (foundUser) {
        res.send(foundUser); // If the task is found, send it in the response
    } else {
        res.status(404).send({ error: `Task ${taskId} not found` }); // If the task is not found, send a 404 response with an error message
    }
}); // GET route to fetch a specific task by ID

router.delete('/:id', (req, res) => {
    const taskId = req.params.id; // Get the task ID from the request parameters

    const tasks = mockData.filter((task) => task.id !== parseInt(taskId)); // Filter out the task with the matching ID from the mock data array

    if (tasks.length < mockData.length) {
        mockData.length = 0; // Clear the mock data array
        mockData.push(...tasks); // Add the filtered tasks back to the mock data array
        res.send({ message: 'Task deleted successfully' }); // If the task is found and deleted, send a success message
    } else {
        res.status(404).send({ error: `Task ${taskId} not found` }); // If the task is not found, send a 404 response with an error message
    }
}); // DELETE route to delete a specific task by ID

router.patch('/:id', (req, res) => {
    const taskId = req.params.id; // Get the task ID from the request parameters

    const { task_name, task_description, completed } = req.body; // Get the updated task data from the request body

    const tasktoUpdate = mockData.find((task) => task.id === parseInt(taskId)); // Find the task with the matching ID in the mock data array

    if (tasktoUpdate) {
        if (task_name) {
            tasktoUpdate.task_name = task_name;
        }
        if (task_description) {
            tasktoUpdate.task_description = task_description;
        }
        if (completed !== undefined) {
            tasktoUpdate.completed = completed;
        }
        res.send(tasktoUpdate); // If the task is found and updated, send the updated task data in the response
    } else {
        res.status(404).send({ error: `Task ${taskId} not found` }); // If the task is not found, send a 404 response with an error message
    }
}); // PATCH route to update a specific task by ID

export default router;