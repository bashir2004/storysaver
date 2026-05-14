import { NextRequest, NextResponse } from "next/server";
import { fetchHighlightItems } from "@/lib/instagram";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiResponse, HighlightDetail } from "@/types/instagram";

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<HighlightDetail>>> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait a moment.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim() ?? "";

  if (!id || !/^\d+$/.test(id.replace(/^highlight:/, ""))) {
    return NextResponse.json(
      { ok: false, error: "Invalid highlight ID.", code: "FETCH_ERROR" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchHighlightItems(id);
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Highlight not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    console.error("[/api/highlight] Unhandled error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch highlight.", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}
