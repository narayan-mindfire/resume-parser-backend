import { Pool, PoolClient } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "resume_parser",
  password: "postgres123",
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", (_client: PoolClient) => {
  console.info("New PostgreSQL client connected");
});

pool.on("error", (err: Error) => {
  console.error("PostgreSQL pool error:", err);
});

export default pool;
