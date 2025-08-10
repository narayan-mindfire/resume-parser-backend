import { Pool, PoolClient } from "pg";

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "resume_parser",
  password: process.env.DB_PASSWORD || "postgres123",
  port: parseInt(process.env.DB_PORT || "5432"),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", (client: PoolClient) => {
  console.log("New PostgreSQL client connected");
});

pool.on("error", (err: Error) => {
  console.error("PostgreSQL pool error:", err);
});

export default pool;
