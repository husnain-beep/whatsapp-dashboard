import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTemplate } from "@/lib/template";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      contactListId,
      contactIds,
    } = body as {
      message: string;
      contactListId?: string;
      contactIds?: string[];
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Gather contacts from both sources
    const contactIdSet = new Set<string>();

    if (contactIds?.length) {
      for (const id of contactIds) {
        contactIdSet.add(id);
      }
    }

    if (contactListId) {
      const members = await prisma.contactListMember.findMany({
        where: { contactListId },
        select: { contactId: true },
      });
      for (const m of members) {
        contactIdSet.add(m.contactId);
      }
    }

    if (contactIdSet.size === 0) {
      return NextResponse.json(
        { error: "No contacts selected" },
        { status: 400 }
      );
    }

    const contacts = await prisma.contact.findMany({
      where: { id: { in: [...contactIdSet] } },
    });

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No valid contacts found" },
        { status: 400 }
      );
    }

    // Get settings for interval
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });
    const intervalSeconds = settings?.defaultIntervalSeconds || 300;

    // Create a campaign for tracking
    const campaign = await prisma.campaign.create({
      data: {
        name: `Quick Send - ${new Date().toLocaleString()}`,
        messageTemplate: message,
        ...(contactListId
          ? { contactList: { connect: { id: contactListId } } }
          : {}),
        startDate: new Date(),
        spreadOverDays: 1,
        intervalSeconds,
        status: "SCHEDULED",
        totalMessages: contacts.length,
      },
    });

    // Schedule messages with intervals starting now
    let scheduledAt = new Date();
    for (const contact of contacts) {
      const text = resolveTemplate(message, { name: contact.name });
      await prisma.message.create({
        data: {
          campaign: { connect: { id: campaign.id } },
          contact: { connect: { id: contact.id } },
          text,
          scheduledAt: new Date(scheduledAt),
          status: "PENDING",
        },
      });
      scheduledAt = new Date(scheduledAt.getTime() + intervalSeconds * 1000);
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalMessages: contacts.length,
    });
  } catch (error) {
    console.error("Quick send error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
