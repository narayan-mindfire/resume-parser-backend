import { Redis } from "ioredis";

const redisClient = new Redis({ maxRetriesPerRequest: null });

export default redisClient;
