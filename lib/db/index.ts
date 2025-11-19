import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local if not already loaded
if (!process.env.DATABASE_URL) {
  config({ path: path.join(__dirname, '../../.env.local') });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }

  return res;
};

export const getClient = () => pool.connect();

// Tagged template literal for SQL queries (similar to postgres.js API)
export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  // Build the query string with numbered placeholders
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}${strings[i + 1]}`;
  }

  const result = await query(text, values);
  return result.rows;
};

// Helper for dynamic SQL parts (identifiers, etc.)
sql.unsafe = (value: string) => value;

export default pool;
