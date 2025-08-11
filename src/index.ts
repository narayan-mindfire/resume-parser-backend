import express from "express";
import cors from "cors";
import router from "./routes";
import rateLimit from "express-rate-limit";
import errorHandler from "./middlewares/errorHandler";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import redisClient from "./config/redisClient";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5003;

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5174",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
  },
});

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

app.use(express.json());
app.use(limiter);
app.use("/api/v1", router);
app.use(errorHandler);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-upload", (uploadId: string) => {
    socket.join(uploadId);
    console.log(`Client joined upload room: ${uploadId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const subscriber = redisClient.duplicate();
subscriber.subscribe("job-updates");

subscriber.on("message", (channel, message) => {
  if (channel === "job-updates") {
    try {
      const notification = JSON.parse(message);
      const { uploadId, status, fileName, resumeId, data, error, trackingKey } =
        notification;

      if (uploadId) {
        const eventType =
          status === "completed" ? "processing-complete" : "processing-failed";

        const eventData = {
          fileName,
          resumeId,
          status,
          trackingKey,
          timestamp: Date.now(),
          ...(status === "completed" ? { data } : { error }),
        };

        console.log(`Broadcasting ${eventType} to upload room: ${uploadId}`);
        io.to(uploadId).emit(eventType, eventData);
      }
    } catch (error) {
      console.error("Error parsing notification message:", error);
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Socket.io server initialized`);
});
