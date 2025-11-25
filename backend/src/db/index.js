import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('Warning: DATABASE_URL not set. DB operations will fail until it is configured.');
}

const pool = new Pool({ connectionString });

export {
  pool,
};

export const query = (text, params) => pool.query(text, params);
