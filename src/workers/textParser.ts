import { Job, Worker } from "bullmq";
import redisClient from "../config/redisClient";

interface TextParsingJob {
  fileName: string;
}

export const parser = async (job: Job<TextParsingJob>) => {
  console.log("worker");
};

new Worker<TextParsingJob>("text-parsing", parser, {
  connection: redisClient,
});
