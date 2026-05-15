/**
 * /api/admin/session
 *
 * GET  — returns session status (no sensitive values)
 * POST — saves new cookie values to .session.json (requires ADMIN_PASSWORD)
 */

import { NextRequest, NextResponse } from "next/server";
import { saveSession, getSessionStatus } from "@/lib/sessionStore";

function checkAdminAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) return false; // no password configured = locked

  const auth = req.headers.get("x-admin-password") ?? "";
  // Constant-time comparison to prevent timing attacks
  if (auth.length !== adminPassword.length) return false;
  let diff = 0;
  for (let i = 0; i < auth.length; i++) {
    diff |= auth.charCodeAt(i) ^ adminPassword.charCodeAt(i);
  }
  return diff === 0;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getSessionStatus());
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionId?: string; csrfToken?: string; dsUserId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // URL-decode values in case the user copies them from the browser URL bar or DevTools network tab
  const sessionId = decodeURIComponent((body.sessionId ?? "").trim());
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  saveSession({
    sessionId,
    csrfToken: decodeURIComponent((body.csrfToken ?? "").trim()),
    dsUserId: decodeURIComponent((body.dsUserId ?? "").trim()),
  });

  return NextResponse.json({ ok: true, status: getSessionStatus() });
}
