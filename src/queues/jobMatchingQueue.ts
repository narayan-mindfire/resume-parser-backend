import { Queue } from "bullmq";
import redisClient from "../config/redisClient";

export const jobMatchingQueue = new Queue("matcher", {
  connection: redisClient,
});
