import { Queue } from "bullmq";
import redisClient from "../config/redisClient";
interface TextParsingJob {
  fileName: string;
}
export const textParsingQueue = new Queue<TextParsingJob>("text-parsing", {
  connection: redisClient,
});
