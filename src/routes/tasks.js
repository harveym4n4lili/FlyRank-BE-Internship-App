import express from 'express';
import {v4 as uuidv4} from 'uuid';
import tasks from '../services/tasks.js';

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

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     responses:
 *       200:
 *         description: List of all tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   task_name:
 *                     type: string
 *                   task_description:
 *                     type: string
 *                   completed:
 *                     type: boolean
 */
router.get('/', (req, res) => {
    // MOCK DATA APPROACH
    //res.send(mockData);

    try {
        res.json(tasks.getMultiple(req.query.page)); // Fetch tasks from the database and send them in the response
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while fetching tasks' });
    }
}) // GET route to fetch all tasks

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task_name
 *             properties:
 *               task_name:
 *                 type: string
 *               task_description:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', (req, res) => {
    const newTask = req.body; // Get the new task data from the request body

    try {
        const createResult = tasks.create(newTask); // Create a new task in the database and send it in the response
        res.status(201).send({ message: 'Task created successfully' }); // Send a success message with a 201 status 
    } catch (error) {
        res.status(400).send({ error: 'An error occurred while creating the task: ' + error.message }); // Send a 400 response with an error message if task creation fails
    }

}); // POST route to create a new task

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a specific task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task found
 *       404:
 *         description: Task not found
 */
router.get('/:id', (req, res) => {
    const taskId = req.params.id; // Get the task ID from the request parameters

    const foundUser= mockData.find((task) => task.id === parseInt(taskId)); // Find the task with the matching ID in the mock data array

    if (foundUser) {
        res.send(foundUser); // If the task is found, send it in the response
    } else {
        res.status(404).send({ error: `Task ${taskId} not found` }); // If the task is not found, send a 404 response with an error message
    }
}); // GET route to fetch a specific task by ID

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 */
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

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task_name:
 *                 type: string
 *               task_description:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
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