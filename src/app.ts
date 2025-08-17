import express from "express";
import cors from "cors";
import router from "./routes";
import rateLimit from "express-rate-limit";
import errorHandler from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();

const limiter = rateLimit({
  windowMs: 1 * 60 * 100,
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
});

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

app.use(helmet());

app.use(express.json());
app.use(limiter);
app.use(cookieParser());

app.use("/api/v1", router);
app.use(errorHandler);

export default app;
