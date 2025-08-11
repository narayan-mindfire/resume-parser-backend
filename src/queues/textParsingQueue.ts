import { Queue } from "bullmq";
import redisClient from "../config/redisClient";
export interface TextParsingJob {
  fileName: string;
  uploadId: string;
  trackingKey: string;
}

export const textParsingQueue = new Queue<TextParsingJob>("text-parsing", {
  connection: redisClient,
});
