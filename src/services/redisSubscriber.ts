import { Server as SocketIOServer } from "socket.io";
import redisClient from "../config/redisClient";

export const initializeRedisSubscriber = (io: SocketIOServer) => {
  const subscriber = redisClient.duplicate();

  subscriber.subscribe("job-updates");
  subscriber.subscribe("job-matches");
  subscriber.subscribe("batch-updates");

  subscriber.on("message", (channel, message) => {
    try {
      const notification = JSON.parse(message);
      if (channel === "job-updates") {
        const {
          uploadId,
          status,
          fileName,
          resumeId,
          data,
          error,
          trackingKey,
        } = notification;
        if (uploadId) {
          const eventType =
            status === "completed"
              ? "processing-complete"
              : "processing-failed";
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
      } else if (channel === "job-matches") {
        const { trackingKey, matchResult, resumeId } = notification;
        if (trackingKey) {
          console.log(`Broadcasting job-matched to room: ${trackingKey}`);
          io.to(trackingKey).emit("job-matched", {
            resumeId,
            matchResult,
            timestamp: Date.now(),
          });
        }
      } else if (channel === "batch-updates") {
        const { batchId, status } = notification;
        if (status === "complete") {
          console.log(`Broadcasting batch-complete to room: ${batchId}`);
          io.to(batchId).emit("batch-complete", { batchId, status });
        }
      }
    } catch (error) {
      console.error("Error parsing notification message:", error);
    }
  });
};
