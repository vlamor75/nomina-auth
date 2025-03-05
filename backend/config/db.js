import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false
});
