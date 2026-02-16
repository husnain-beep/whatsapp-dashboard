import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validators";

async function getOrCreateSettings() {
  let settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: "default" },
    });
  }

  return settings;
}

export async function GET() {
  try {
    const settings = await getOrCreateSettings();

    return NextResponse.json({
      ...settings,
      wasenderApiKey: settings.wasenderApiKey
        ? "••••" + settings.wasenderApiKey.slice(-4)
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = settingsSchema.parse(body);

    await getOrCreateSettings();

    const updateData: Record<string, unknown> = {};
    if (data.wasenderApiKey !== undefined)
      updateData.wasenderApiKey = data.wasenderApiKey;
    if (data.defaultIntervalSeconds !== undefined)
      updateData.defaultIntervalSeconds = data.defaultIntervalSeconds;
    if (data.maxMessagesPerDay !== undefined)
      updateData.maxMessagesPerDay = data.maxMessagesPerDay;

    const settings = await prisma.settings.update({
      where: { id: "default" },
      data: updateData,
    });

    return NextResponse.json({
      ...settings,
      wasenderApiKey: settings.wasenderApiKey
        ? "••••" + settings.wasenderApiKey.slice(-4)
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
