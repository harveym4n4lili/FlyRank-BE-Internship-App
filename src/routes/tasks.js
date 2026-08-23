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
router.get('/', async (req, res) => {
    try {
        res.json(await tasks.getAllTasks(req.query.page)); // Fetch tasks from the database and send them in the response
    } catch (error) {
        res.status(404).send({ error: 'An error occurred while fetching tasks' });
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
        const createResult = tasks.createTask(newTask); // Create a new task in the database and send it in the response
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
router.get('/:id', async (req, res) => {
    const taskId = req.params.id; // Get the task ID from the request parameters

    try {
        const findTaskResult = await tasks.getTaskById(taskId);
        res.status(200).send(findTaskResult); // Send the found task in the response
    } catch (error) {
        res.status(404).send({ error: `Task ${taskId} not found` }); // Send a 404 response with an error message if the task is not found});
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

    try {
        const deleteTaskResult = tasks.deleteTaskById(taskId); //
        res.status(204).send(); // Send a 204 response indicating successful deletion
    } catch (error) {
        res.status(404).send({ error: `Task ${taskId} not found` }); // Send a 404 response with an error message if the task is not found
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
router.put('/:id', (req, res) => {
    const taskId = req.params.id; // Get the task ID from the request parameters

    const { task_name, task_description, completed } = req.body; // Get the updated task data from the request body

    try {
        const updateTaskResult = tasks.updateTaskById(taskId, { task_name, task_description, completed });
        res.status(200).send(updateTaskResult); // Send the updated task in the response
    } catch (error) {
        res.status(404).send({ error: `Task ${taskId} not found` }); // Send a 404 response with an error message if the task is not found
    }
}); // PUT route to update a specific task by ID

export default router;