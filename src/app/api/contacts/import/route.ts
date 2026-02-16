import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCsvContacts } from "@/lib/csv-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvText = await file.text();
    const { valid, errors } = parseCsvContacts(csvText);

    if (valid.length === 0) {
      return NextResponse.json(
        { error: "No valid contacts found", errors },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;

    for (const contact of valid) {
      try {
        await prisma.contact.create({ data: contact });
        imported++;
      } catch {
        skipped++; // duplicate phone number
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors,
      total: valid.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    );
  }
}
