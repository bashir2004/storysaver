/**
 * /api/proxy
 *
 * Media proxy route — fetches Instagram CDN content server-side and
 * streams it to the client, bypassing CORS restrictions and allowing
 * direct browser downloads.
 *
 * Query params:
 *   url    — The Instagram CDN URL to proxy (must be an Instagram CDN host)
 *   name   — Suggested download filename (optional)
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import axios from "axios";

/** Allowlist of Instagram CDN hostname patterns */
const ALLOWED_HOSTS = [
  /^.*\.cdninstagram\.com$/,
  /^.*\.fbcdn\.net$/,
  /^scontent[^.]*\.instagram\.com$/,
  /^instagram\.com$/,
];

function isAllowedUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_HOSTS.some((re) => re.test(parsed.hostname));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Prefer forwarded headers (req.ip was removed in Next.js 15+)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  // Proxy serves both thumbnails and downloads — allow 200 req/min per IP
  if (!checkRateLimit(`proxy:${ip}`, 200, 60_000)) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const mediaUrl = searchParams.get("url") ?? "";
  const fileName = searchParams.get("name") ?? "story-media";

  // Validate URL
  if (!mediaUrl || !isAllowedUrl(mediaUrl)) {
    return new NextResponse("Invalid or disallowed URL", { status: 400 });
  }

  try {
    const upstream = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      timeout: 20_000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.instagram.com/",
      },
    });

    const contentType =
      (upstream.headers["content-type"] as string) || "application/octet-stream";

    // Derive file extension from content type
    const ext = contentType.includes("video")
      ? ".mp4"
      : contentType.includes("jpeg") || contentType.includes("jpg")
      ? ".jpg"
      : contentType.includes("png")
      ? ".png"
      : "";

    const safeFileName = fileName.replace(/[^a-zA-Z0-9_\-]/g, "_") + ext;

    return new NextResponse(upstream.data as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
        "Cache-Control": "no-store",
        // Prevent the proxied content from being embedded elsewhere
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[/api/proxy] Fetch error:", err);
    return new NextResponse("Failed to fetch media", { status: 502 });
  }
}
