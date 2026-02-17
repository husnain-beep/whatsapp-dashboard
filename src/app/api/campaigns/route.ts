import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { campaignSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where = statusFilter
      ? { status: { in: statusFilter.split(",") } }
      : {};

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        contactList: { select: { name: true } },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = campaignSchema.parse(body);

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        messageTemplate: data.messageTemplate,
        contactList: { connect: { id: data.contactListId } },
        startDate: new Date(data.startDate),
        spreadOverDays: data.spreadOverDays,
        intervalSeconds: data.intervalSeconds,
        status: "DRAFT",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
