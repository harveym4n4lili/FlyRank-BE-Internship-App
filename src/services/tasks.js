import db from '../services/db.js';
import config from '../../config.js';
import pool from '../db/connection.js';

/// This file is used to handle the business logic related to tasks. 
// In general, it will be used to retrieve data from the database and 
// perform any necessary processing before returning the data to the controller.
// of course, operations here are called through the route API endpoints, which are defined in the routes/tasks.js file.

async function getAllTasks(page = 1) {
    const offset = (page - 1) * config.listPerPage;
    const data = await pool.query('SELECT * FROM tasks LIMIT $1 OFFSET $2', [config.listPerPage, offset]);
    const meta = {page};
    console.log('Retrieved tasks:', data.rows); // Log the retrieved tasks for debugging purposes
    return {
        data: data.rows,
        meta
    }
}

function validateCreate(task) {
    let messages = []; // initialize list of error messages

    if (!task) {
        messages.push('Task object is required'); // add error message if task object is missing
    }

    if (!task.task_name) {
        messages.push('Task name is required'); // add error message if task_name is missing
    }

    if (!task.task_description) {
        messages.push('Task description is required'); // add error message if task_description is missing
    }

    if (task.created_at > task.updated_at) {
        messages.push('Created date cannot be later than updated date'); // add error message if created_at is later than updated_at
    }

    if (messages.length) {
        let error = new Error(messages.join()); // throw an error with all the collected messages if there are any
        error.status = 400; // set the error status to 400 (Bad Request)
        
        throw error;
    }
}

async function createTask(task) {
    validateCreate(task); // validate the task object before creating it
    const { task_name, task_description, completed} = task; // destructure the task object to get its properties

    const currentTimestamp = new Date().toISOString(); // get the current date and time in ISO format

    const isCompleted = completed ? 1 : 0; // convert the boolean completed value to an integer (1 for true, 0 for false)

    const result = await pool.query(
        'INSERT INTO tasks (task_name, task_description, completed, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
        [task_name, task_description, isCompleted, currentTimestamp, currentTimestamp]
    );

    let message = 'Error in creating task'; // default error message

    if (result.rowCount > 0) {
        message = 'Task created successfully'; // success message if the task was created
    }

    return { message }; // return the message indicating the result of the operation
}

async function getTaskById(id) {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]); // query the database for a task with the given id

    if (!task.rows.length) {
        let error = new Error('Task not found'); // throw an error if the task is not found
        error.status = 404; // set the error status to 404 (Not Found)
        throw error;
    }

    return { task: task.rows[0] }; // return the found task
}

async function updateTaskById(id, task) {
    validateCreate(task); // validate the task object before updating it
    const { task_name, task_description, completed } = task; // destructure the task object to get its properties

    const currentTimestamp = new Date().toISOString(); // get the current date and time in ISO format

    const isCompleted = completed ? 1 : 0; // convert the boolean completed value to an integer (1 for true, 0 for false)

    const result = await pool.query(
        'UPDATE tasks SET task_name = $1, task_description = $2, completed = $3, updated_at = $4 WHERE id = $5',
        [task_name, task_description, isCompleted, currentTimestamp, id]
    );

    if (result.rowCount === 0) {
        let error = new Error('Task not found'); // throw an error if the task is not found
        error.status = 404; // set the error status to 404 (Not Found)
        throw error;
    }

    return { message: 'Task updated successfully' }; // return a success message
}

async function deleteTaskById(id) {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]); // delete the task with the given id from the database

    if (result.rowCount === 0) {
        let error = new Error('Task not found'); // throw an error if the task is not found
        error.status = 404; // set the error status to 404 (Not Found)
        throw error;
    }
}
export default {
    getAllTasks,
    getTaskById,
    deleteTaskById,
    updateTaskById,
    createTask
}