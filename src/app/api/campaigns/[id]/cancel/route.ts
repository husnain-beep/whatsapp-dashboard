import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Cancel all pending/queued messages
    await prisma.message.updateMany({
      where: {
        campaignId: id,
        status: { in: ["PENDING", "QUEUED", "RETRY"] },
      },
      data: { status: "CANCELLED" },
    });

    await prisma.campaign.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true, status: "CANCELLED" });
  } catch {
    return NextResponse.json(
      { error: "Failed to cancel campaign" },
      { status: 500 }
    );
  }
}
