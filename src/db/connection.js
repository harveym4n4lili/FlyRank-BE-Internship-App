import pg from 'pg';
import dotenv from 'dotenv';
//const {Pool, CClient} = pg;

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;