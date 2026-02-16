import { Queue } from "bullmq";

const globalForQueue = globalThis as unknown as { messageQueue: Queue };

export const messageQueue =
  globalForQueue.messageQueue ||
  new Queue("message-queue", {
    connection: {
      host: new URL(process.env.REDIS_URL || "redis://localhost:6379").hostname,
      port: parseInt(
        new URL(process.env.REDIS_URL || "redis://localhost:6379").port || "6379"
      ),
      maxRetriesPerRequest: null,
    },
  });

if (process.env.NODE_ENV !== "production")
  globalForQueue.messageQueue = messageQueue;
