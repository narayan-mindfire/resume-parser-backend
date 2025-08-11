import express from "express";
import cors from "cors";
import router from "./routes";
import rateLimit from "express-rate-limit";
import errorHandler from "./middlewares/errorHandler";
import dotenv from "dotenv";
import pool from "./config/db";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5003;
const limiter = rateLimit({
  windowMs: 1 * 60 * 100,
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
});

(async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL Connected:", result.rows[0].now);
    await pool.query(
      `CREATE TABLE IF NOT EXISTS test_check(id SERIAL PRIMARY KEY, note TEXT)`,
    );
    await pool.query(
      `INSERT INTO test_check(note) VALUES('Hello from backend')`,
    );
  } catch (err) {
    console.error("❌ PostgreSQL Connection Error:", err);
  }
})();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5174",
      "http://localhost:5173",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(limiter);

app.use("/api/v1", router);

app.use(errorHandler);

app.listen(PORT, () => {
  // console.log(`Server is running at http://localhost:${PORT}`);
});
