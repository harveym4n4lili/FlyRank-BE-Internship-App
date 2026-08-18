import sqlite from 'better-sqlite3';
import path from 'path';

/// This file is responsible for handling direct database operations using SQLite. 
// It provides a function to execute SQL queries and retrieve results.

const dbPath = path.resolve('src', 'db', 'tasks.db'); // Path to the SQLite database file
const db = new sqlite(dbPath,{fileMustExist: true}); // Create a new SQLite database instance and ensure the database file exists

// query function is used to execute SQL SELECT statements and retrieve results from the database.
function query(sql, params) {
    return db.prepare(sql).all(params);
}

// run function is used to execute SQL statements that modify the database (like INSERT, UPDATE, DELETE) and returns information about the operation.
function run(sql, params) {
    return db.prepare(sql).run(params);
}

export default {
    query,
    run
}