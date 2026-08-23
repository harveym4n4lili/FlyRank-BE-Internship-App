import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
}); // START A CONNECTION POOL TO ALLOW QUERY CONNECTION TO OUR POSTGRE SQL DATABASE IN DOCKER

const result = await pool.query('SELECT NOW()'); // TEST QUERY TO CHECK IF THE CONNECTION IS SUCCESSFUL
console.log('Database connection successful:', result.rows[0]);


export default pool;