import db from '../services/db.js';
import config from '../../config.js';

/// This file is used to handle the business logic related to tasks. 
// In general, it will be used to retrieve data from the database and 
// perform any necessary processing before returning the data to the controller.
// of course, operations here are called through the route API endpoints, which are defined in the routes/tasks.js file.

function getAllTasks(page = 1) {
    const offset = (page - 1) * config.listPerPage;
    const data = db.query('SELECT * FROM tasks LIMIT ?,?', [offset, config.listPerPage]);
    const meta = {page};
    return {
        data,
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

function createTask(task) {
    validateCreate(task); // validate the task object before creating it
    const { task_name, task_description, completed} = task; // destructure the task object to get its properties

    const currentTimestamp = new Date().toISOString(); // get the current date and time in ISO format

    const isCompleted = completed ? 1 : 0; // convert the boolean completed value to an integer (1 for true, 0 for false)

    const result = db.run(
        'INSERT INTO tasks (task_name, task_description, completed, created_at, updated_at) VALUES (@task_name, @task_description, @completed, @created_at, @updated_at)',
        {task_name, task_description, completed: isCompleted, created_at: currentTimestamp, updated_at: currentTimestamp}
    );

    let message = 'Error in creating task'; // default error message

    if (result.changes) {
        message = 'Task created successfully'; // success message if the task was created
    }

    return { message }; // return the message indicating the result of the operation
}

function getTaskById(id) {
    const task = db.query('SELECT * FROM tasks WHERE id = ?', [id]); // query the database for a task with the given id

    if (!task.length) {
        let error = new Error('Task not found'); // throw an error if the task is not found
        error.status = 404; // set the error status to 404 (Not Found)
        throw error;
    }

    return task[0]; // return the found task
}

function updatedTaskById(id, task) {
    validateCreate(task); // validate the task object before updating it
    const { task_name, task_description, completed } = task; // destructure the task object to get its properties

    const currentTimestamp = new Date().toISOString(); // get the current date and time in ISO format

    const isCompleted = completed ? 1 : 0; // convert the boolean completed value to an integer (1 for true, 0 for false)

    const result = db.run(
        'UPDATE tasks SET task_name = @task_name, task_description = @task_description, completed = @completed, updated_at = @updated_at WHERE id = @id',
        { id, task_name, task_description, completed: isCompleted, updated_at: currentTimestamp }
    );

    if (!result.changes) {
        let error = new Error('Task not found'); // throw an error if the task is not found
        error.status = 404; // set the error status to 404 (Not Found)
        throw error;
    }

    return { message: 'Task updated successfully' }; // return a success message
}

function deleteTaskById(id) {
    const result = db.run('DELETE FROM tasks WHERE id = ?', [id]); // delete the task with the given id from the database

    if (!result.changes) {
        let error = new Error('Task not found'); // throw an error if the task is not found
        error.status = 404; // set the error status to 404 (Not Found)
        throw error;
    }
}
export default {
    getAllTasks,
    getTaskById,
    deleteTaskById,
    updatedTaskById,
    createTask
}