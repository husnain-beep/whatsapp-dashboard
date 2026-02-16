import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactListSchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const list = await prisma.contactList.findUnique({
      where: { id },
      include: {
        members: {
          include: { contact: true },
        },
        _count: { select: { members: true } },
      },
    });
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }
    return NextResponse.json(list);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contact list" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = contactListSchema.parse(body);
    const list = await prisma.contactList.update({
      where: { id },
      data,
    });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json(
      { error: "Failed to update contact list" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contactList.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete contact list" },
      { status: 500 }
    );
  }
}
