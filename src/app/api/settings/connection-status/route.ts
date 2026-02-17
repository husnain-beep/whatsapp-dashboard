import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });
    const apiKey =
      settings?.wasenderApiKey || process.env.WASENDER_API_KEY;

    if (!apiKey?.trim()) {
      return NextResponse.json({
        connected: false,
        status: "no_key",
        message: "No API key configured",
      });
    }

    // Fetch session status and user info in parallel
    const [statusRes, userRes] = await Promise.all([
      fetch("https://www.wasenderapi.com/api/status", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }).catch(() => null),
      fetch("https://www.wasenderapi.com/api/user", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }).catch(() => null),
    ]);

    const statusData = statusRes?.ok ? await statusRes.json() : null;
    const userData = userRes?.ok ? await userRes.json() : null;

    if (!statusRes?.ok && !userRes?.ok) {
      const errorStatus = statusRes?.status || userRes?.status || 0;
      return NextResponse.json({
        connected: false,
        status: errorStatus === 401 ? "invalid_key" : "error",
        message:
          errorStatus === 401
            ? "Invalid API key"
            : `API error (${errorStatus})`,
      });
    }

    return NextResponse.json({
      connected: true,
      status: "connected",
      session: statusData?.data || statusData || null,
      user: userData?.data || userData || null,
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to check connection",
    });
  }
}
