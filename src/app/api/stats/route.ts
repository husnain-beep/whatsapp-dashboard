import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalContacts,
      activeCampaigns,
      messagesSentToday,
      totalSent,
      totalFailed,
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.campaign.count({
        where: { status: { in: ["RUNNING", "SCHEDULED"] } },
      }),
      prisma.message.count({
        where: { status: "SENT", sentAt: { gte: todayStart } },
      }),
      prisma.message.count({ where: { status: "SENT" } }),
      prisma.message.count({ where: { status: "FAILED" } }),
    ]);

    const totalProcessed = totalSent + totalFailed;
    const successRate =
      totalProcessed > 0 ? Math.round((totalSent / totalProcessed) * 100) : 0;

    return NextResponse.json({
      totalContacts,
      activeCampaigns,
      messagesSentToday,
      successRate,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
