import "dotenv/config";
import { Worker, Queue } from "bullmq";
import cron from "node-cron";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379"),
  maxRetriesPerRequest: null as null,
};

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });
const messageQueue = new Queue("message-queue", { connection });

// --- Cron Poller: Find due messages and add to BullMQ ---
cron.schedule("* * * * *", async () => {
  try {
    const pendingMessages = await prisma.message.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: new Date() },
        campaign: {
          status: { in: ["SCHEDULED", "RUNNING"] },
        },
      },
      take: 50,
      orderBy: { scheduledAt: "asc" },
    });

    if (pendingMessages.length > 0) {
      console.log(
        `[Poller] Found ${pendingMessages.length} messages to queue`
      );
    }

    for (const msg of pendingMessages) {
      await messageQueue.add(
        "send-message",
        { messageId: msg.id },
        {
          jobId: msg.id,
          attempts: 3,
          backoff: { type: "exponential", delay: 60000 },
        }
      );

      await prisma.message.update({
        where: { id: msg.id },
        data: { status: "QUEUED", bullJobId: msg.id },
      });
    }

    // Update campaign status to RUNNING if it was SCHEDULED
    if (pendingMessages.length > 0) {
      const campaignIds = [
        ...new Set(pendingMessages.map((m) => m.campaignId)),
      ];
      await prisma.campaign.updateMany({
        where: { id: { in: campaignIds }, status: "SCHEDULED" },
        data: { status: "RUNNING" },
      });
    }
  } catch (error) {
    console.error("[Poller] Error:", error);
  }
});

// --- BullMQ Worker: Send messages via WaSender API ---
const worker = new Worker(
  "message-queue",
  async (job) => {
    const { messageId } = job.data;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { contact: true, campaign: true },
    });

    if (!message || message.status === "CANCELLED") {
      return;
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { status: "SENDING" },
    });

    try {
      // Get API key from settings or env
      const settings = await prisma.settings.findUnique({
        where: { id: "default" },
      });
      const apiKey =
        settings?.wasenderApiKey || process.env.WASENDER_API_KEY;

      if (!apiKey || apiKey === "your_wasender_api_key_here") {
        throw new Error("WaSender API key not configured");
      }

      // Send message via WaSender API
      const response = await fetch(
        "https://www.wasenderapi.com/api/send-message",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: message.contact.phone,
            text: message.text,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || result.error || `API error: ${response.status}`
        );
      }

      // Success
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          wasenderMsgId: String(result.data?.msgId ?? ""),
        },
      });

      await prisma.campaign.update({
        where: { id: message.campaignId },
        data: { sentCount: { increment: 1 } },
      });

      console.log(
        `[Worker] Sent message to ${message.contact.phone} (${message.contact.name})`
      );

      // Check rate limit headers
      const remaining = response.headers.get("X-RateLimit-Remaining");
      if (remaining && parseInt(remaining) < 5) {
        const resetHeader = response.headers.get("X-RateLimit-Reset");
        if (resetHeader) {
          const waitMs = parseInt(resetHeader) * 1000;
          if (waitMs > 0) {
            console.log(`[Worker] Rate limit low, waiting ${waitMs}ms`);
            await new Promise((r) => setTimeout(r, waitMs));
          }
        }
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[Worker] Failed to send to ${message.contact.phone}:`,
        errorMsg
      );

      if (message.retryCount < 3) {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            status: "RETRY",
            retryCount: { increment: 1 },
            errorMessage: errorMsg,
          },
        });
        throw error; // BullMQ will retry
      } else {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            status: "FAILED",
            errorMessage: errorMsg,
          },
        });
        await prisma.campaign.update({
          where: { id: message.campaignId },
          data: { failedCount: { increment: 1 } },
        });
      }
    }
  },
  {
    connection,
    concurrency: 1,
    limiter: {
      max: 1,
      duration: 5000, // 1 job per 5 seconds minimum
    },
  }
);

// --- Campaign Completion Checker (every 2 minutes) ---
cron.schedule("*/2 * * * *", async () => {
  try {
    const runningCampaigns = await prisma.campaign.findMany({
      where: { status: "RUNNING" },
    });

    for (const campaign of runningCampaigns) {
      const remaining = await prisma.message.count({
        where: {
          campaignId: campaign.id,
          status: { in: ["PENDING", "QUEUED", "SENDING", "RETRY"] },
        },
      });

      if (remaining === 0) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "COMPLETED" },
        });
        console.log(`[Checker] Campaign "${campaign.name}" completed`);
      }

      // Auto-pause if >50% failed
      const failedCount = await prisma.message.count({
        where: { campaignId: campaign.id, status: "FAILED" },
      });
      if (
        campaign.totalMessages > 0 &&
        failedCount / campaign.totalMessages > 0.5
      ) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "PAUSED" },
        });
        console.log(
          `[Checker] Campaign "${campaign.name}" auto-paused (>50% failures)`
        );
      }
    }
  } catch (error) {
    console.error("[Checker] Error:", error);
  }
});

// --- Event handlers ---
worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

// --- Graceful Shutdown ---
async function shutdown() {
  console.log("[Worker] Shutting down...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[Worker] Message sender worker started.");
console.log("[Worker] Poller: checking for due messages every minute.");
console.log("[Worker] Completion checker: running every 2 minutes.");
