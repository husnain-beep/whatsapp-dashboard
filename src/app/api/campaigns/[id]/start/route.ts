import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeMessageSchedule } from "@/lib/scheduling";
import { resolveTemplate } from "@/lib/template";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        contactList: {
          include: {
            members: {
              include: { contact: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (!["DRAFT", "PAUSED"].includes(campaign.status)) {
      return NextResponse.json(
        { error: "Campaign cannot be started in its current state" },
        { status: 400 }
      );
    }

    const contacts: { id: string; name: string; phone: string }[] = campaign.contactList.members.map((m: { contact: { id: string; name: string; phone: string } }) => ({
      id: m.contact.id,
      name: m.contact.name,
      phone: m.contact.phone,
    }));

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "Contact list is empty" },
        { status: 400 }
      );
    }

    // If resuming from PAUSED, don't regenerate messages
    if (campaign.status === "PAUSED") {
      await prisma.campaign.update({
        where: { id },
        data: { status: "RUNNING" },
      });
      return NextResponse.json({ success: true, status: "RUNNING" });
    }

    // Compute schedule
    const schedule = computeMessageSchedule(
      contacts,
      campaign.startDate,
      campaign.spreadOverDays,
      campaign.intervalSeconds
    );

    // Create all messages
    const messageData = schedule.map((item) => {
      const contact = contacts.find((c) => c.id === item.contactId)!;
      const text = resolveTemplate(campaign.messageTemplate, {
        name: contact.name,
      });
      return {
        campaignId: id,
        contactId: item.contactId,
        text,
        scheduledAt: item.scheduledAt,
        status: "PENDING",
      };
    });

    await prisma.message.createMany({ data: messageData });

    await prisma.campaign.update({
      where: { id },
      data: {
        status: "SCHEDULED",
        totalMessages: messageData.length,
        sentCount: 0,
        failedCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      status: "SCHEDULED",
      totalMessages: messageData.length,
    });
  } catch (error) {
    console.error("Start campaign error:", error);
    return NextResponse.json(
      { error: "Failed to start campaign" },
      { status: 500 }
    );
  }
}
