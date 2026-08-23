import pool from './connection.js';

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                task_name VARCHAR(255) NOT NULL,
                task_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed BOOLEAN DEFAULT FALSE
            );
        `);
        console.log('Database initialized successfully');

        // check if empty
        const result = await pool.query('SELECT COUNT(*) FROM tasks');
        if (parseInt(result.rows[0].count, 10) === 0) {
            // insert sample data
            await pool.query(`
                INSERT INTO tasks (task_name, task_description, created_at, updated_at, completed)
                VALUES
                    ('Learn PostgreSQL', 'Learn the basics of PostgreSQL.', DEFAULT, DEFAULT, false),
                    ('Build API with Node.js', 'Build a REST API using Node.js and Express.', DEFAULT, DEFAULT, false),
                    ('Deploy to production', 'Deploy the application to the production environment.', DEFAULT, DEFAULT, false);
            `);
            console.log('Sample data inserted into tasks table');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

export default initDB;