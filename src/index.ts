import app from "./app";
import { createServer } from "http";
import dotenv from "dotenv";
import { initializeRedisSubscriber } from "./services/redisSubscriber";
import { createSocketServer } from "./config/socket";

dotenv.config();

const server = createServer(app);

const io = createSocketServer(server);

initializeRedisSubscriber(io);

const PORT = process.env.PORT || 5003;

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Socket.io server initialized`);
});
