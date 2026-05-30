import { Pool } from 'pg'

const connStr = process.env.NEON_URL ?? process.env.DATABASE_URL ?? ''

const pool = new Pool({
  connectionString: connStr,
  ssl: connStr.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
})

export default pool
