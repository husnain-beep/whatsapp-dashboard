import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactListSchema } from "@/lib/validators";

export async function GET() {
  try {
    const lists = await prisma.contactList.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    });
    return NextResponse.json({ lists });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contact lists" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactListSchema.parse(body);
    const list = await prisma.contactList.create({ data });
    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create contact list" },
      { status: 500 }
    );
  }
}
