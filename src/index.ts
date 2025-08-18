import app from "./app";
import { createServer } from "http";
import dotenv from "dotenv";
import { initializeRedisSubscriber } from "./services/redisSubscriber";
import { createSocketServer } from "./config/socket";

dotenv.config();

const server = createServer(app);

const io = createSocketServer(server);

initializeRedisSubscriber(io);

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.info(`Server is running at http://localhost:${PORT}`);
});
