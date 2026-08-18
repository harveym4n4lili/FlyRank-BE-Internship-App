import sqlite from 'better-sqlite3';
import path from 'path';

/// This file is responsible for handling direct database operations using SQLite. 
// It provides a function to execute SQL queries and retrieve results.

const dbPath = path.resolve('src', 'db', 'tasks.db'); // Path to the SQLite database file
const db = new sqlite(dbPath,{fileMustExist: true}); // Create a new SQLite database instance and ensure the database file exists

function query(sql, params) {
    return db.prepare(sql).all(params); // Prepare and execute the SQL query with the provided parameters
}

export default {
    query
}