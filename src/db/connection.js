import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Give database time to start in docker compose
await new Promise(resolve => setTimeout(resolve, 2000));

try {
  const result = await pool.query('SELECT NOW()');
  console.log('Database connection successful:', result.rows[0]);
} catch (error) {
  console.log('Database connection test failed, will retry on queries:', error.message);
}

export default pool;