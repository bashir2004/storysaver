import { NextRequest, NextResponse } from "next/server";
import { fetchProfileData, InstagramNotFoundError, InstagramAuthError } from "@/lib/instagram";
import { checkRateLimit } from "@/lib/rateLimit";
import { ApiResponse, ApiError, ProfileData } from "@/types/instagram";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<ProfileData>>> {
  // Rate limiting: 15 requests per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip, 15, 60_000)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait a moment.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim() ?? "";

  if (!username || !/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
    return NextResponse.json(
      { ok: false, error: "Invalid Instagram username.", code: "FETCH_ERROR" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchProfileData(username);
    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string; name?: string };

    if (error.code === "PRIVATE_ACCOUNT") {
      return NextResponse.json(
        { ok: false, error: error.message ?? "Private account.", code: "PRIVATE_ACCOUNT" },
        { status: 403 }
      );
    }

    if (err instanceof InstagramAuthError) {
      return NextResponse.json(
        { ok: false, error: "Instagram session required. Configure INSTAGRAM_SESSION_ID in environment variables.", code: "AUTH_REQUIRED" } satisfies ApiError,
        { status: 401 }
      );
    }

    if (err instanceof InstagramNotFoundError) {
      return NextResponse.json(
        { ok: false, error: error.message ?? "Account not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const igStatus = (error as { igStatus?: number }).igStatus;
    console.error(`[/api/profile] Unhandled error (igStatus=${igStatus ?? 'n/a'}):`, error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch profile data. Instagram may be blocking the request.", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

