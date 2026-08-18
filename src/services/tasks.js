import db from '../services/db.js';
import config from '../../config.js';

/// This file is used to handle the business logic related to tasks. 
// In general, it will be used to retrieve data from the database and 
// perform any necessary processing before returning the data to the controller.
// of course, operations here are called through the route API endpoints, which are defined in the routes/tasks.js file.

function getMultiple(page = 1) {
    const offset = (page - 1) * config.listPerPage;
    const data = db.query('SELECT * FROM tasks LIMIT ?,?', [offset, config.listPerPage]);
    const meta = {page};
    return {
        data,
        meta
    }
}

export default {
    getMultiple
}