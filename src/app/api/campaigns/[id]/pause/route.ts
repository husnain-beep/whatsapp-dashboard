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

    if (!["RUNNING", "SCHEDULED"].includes(campaign.status)) {
      return NextResponse.json(
        { error: "Campaign cannot be paused in its current state" },
        { status: 400 }
      );
    }

    await prisma.campaign.update({
      where: { id },
      data: { status: "PAUSED" },
    });

    return NextResponse.json({ success: true, status: "PAUSED" });
  } catch {
    return NextResponse.json(
      { error: "Failed to pause campaign" },
      { status: 500 }
    );
  }
}
