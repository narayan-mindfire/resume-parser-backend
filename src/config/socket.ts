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
    console.log("Client connected:", socket.id);

    socket.on("join-upload", (uploadId: string) => {
      socket.join(uploadId);
      console.log(`Client joined upload room: ${uploadId}`);
    });

    socket.on("join-match", (trackingKey: string) => {
      socket.join(trackingKey);
      console.log(`Client joined job matching room: ${trackingKey}`);
    });

    socket.on("join-batch", (batchId: string) => {
      socket.join(batchId);
      console.log(`Client joined batch room: ${batchId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};
