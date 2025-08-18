import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export const createSocketServer = (server: HttpServer) => {
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

  io.on("connection", (socket) => {
    console.info("Client connected:", socket.id);

    socket.on("join-upload", (uploadId: string) => {
      socket.join(uploadId);
      console.info(`Client joined upload room: ${uploadId}`);
    });

    socket.on("join-match", (trackingKey: string) => {
      socket.join(trackingKey);
      console.info(`Client joined job matching room: ${trackingKey}`);
    });

    socket.on("join-batch", (batchId: string) => {
      socket.join(batchId);
      console.info(`Client joined batch room: ${batchId}`);
    });

    socket.on("disconnect", () => {
      console.info("Client disconnected:", socket.id);
    });
  });

  return io;
};
