import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { contactIds } = await request.json();

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: "contactIds must be a non-empty array" },
        { status: 400 }
      );
    }

    let added = 0;
    for (const contactId of contactIds as string[]) {
      try {
        await prisma.contactListMember.create({
          data: {
            contactList: { connect: { id } },
            contact: { connect: { id: contactId } },
          },
        });
        added++;
      } catch {
        // skip duplicates
      }
    }

    return NextResponse.json({ added });
  } catch {
    return NextResponse.json(
      { error: "Failed to add members" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { contactIds } = await request.json();

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: "contactIds must be a non-empty array" },
        { status: 400 }
      );
    }

    await prisma.contactListMember.deleteMany({
      where: {
        contactListId: id,
        contactId: { in: contactIds },
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove members" },
      { status: 500 }
    );
  }
}
