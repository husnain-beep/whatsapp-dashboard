import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let apiKey = body.apiKey as string | undefined;

    // If no key provided in request, use saved key from DB
    if (!apiKey?.trim()) {
      const settings = await prisma.settings.findUnique({
        where: { id: "default" },
      });
      apiKey = settings?.wasenderApiKey || undefined;
    }

    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: "No API key configured" },
        { status: 400 }
      );
    }

    const res = await fetch("https://www.wasenderapi.com/api/status", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ success: true, data });
    } else {
      const errorText = await res.text();
      return NextResponse.json(
        { success: false, error: `API returned ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      },
      { status: 500 }
    );
  }
}
