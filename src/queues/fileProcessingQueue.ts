import { Queue } from "bullmq";
import redisClient from "../config/redisClient";

export const fileProcessingQueue = new Queue("file-processing", {
  connection: redisClient,
});
