/**
 * Runtime session store — reads/writes cookie values to `.session.json`
 * in the project root so they can be updated WITHOUT restarting the server.
 *
 * Priority order for cookies:
 *   1. .session.json  (updated via admin UI at runtime)
 *   2. process.env    (fallback for initial / CI setup)
 */

import fs from "fs";
import path from "path";

export interface SessionData {
  sessionId: string;
  csrfToken: string;
  dsUserId: string;
  /** Unix ms timestamp of last successful save */
  updatedAt: number;
  /** True after a 401/403 has been received — cleared on next save */
  expired: boolean;
}

const SESSION_FILE = path.join(process.cwd(), ".session.json");

// In-memory cache — avoids hitting disk on every request
let cache: SessionData | null = null;
let cacheReadAt = 0;
const CACHE_TTL_MS = 10_000; // re-read file at most every 10 s

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

function readFile(): SessionData | null {
  try {
    if (!fs.existsSync(SESSION_FILE)) return null;
    const raw = fs.readFileSync(SESSION_FILE, "utf-8");
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

function writeFile(data: SessionData): void {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Return the current session — prefers file over env, with short TTL cache. */
export function getSession(): SessionData | null {
  const now = Date.now();

  if (cache && now - cacheReadAt < CACHE_TTL_MS) return cache;

  const fromFile = readFile();
  if (fromFile?.sessionId) {
    cache = fromFile;
    cacheReadAt = now;
    return fromFile;
  }

  // Fall back to environment variables
  const sessionId = process.env.INSTAGRAM_SESSION_ID?.trim() ?? "";
  if (!sessionId) {
    cache = null;
    return null;
  }

  const fromEnv: SessionData = {
    sessionId,
    csrfToken: process.env.INSTAGRAM_CSRFTOKEN?.trim() ?? "",
    dsUserId: process.env.INSTAGRAM_DS_USER_ID?.trim() ?? "",
    updatedAt: 0,
    expired: false,
  };
  cache = fromEnv;
  cacheReadAt = now;
  return fromEnv;
}

/** Save new cookie values to file, clear the expired flag, bust cache. */
export function saveSession(
  values: Pick<SessionData, "sessionId" | "csrfToken" | "dsUserId">
): void {
  const data: SessionData = {
    ...values,
    updatedAt: Date.now(),
    expired: false,
  };
  writeFile(data);
  cache = data;
  cacheReadAt = Date.now();
}

/**
 * Mark the current session as expired (called when Instagram returns 401/403).
 * Updates the file if a file-based session exists; otherwise just flags the cache.
 */
export function markExpired(): void {
  const current = getSession();
  if (!current) return;

  current.expired = true;

  // Only persist to file if it came from file (updatedAt > 0)
  if (current.updatedAt > 0) {
    try {
      writeFile(current);
    } catch {
      // best-effort
    }
  }

  cache = current;
}

/** True when a session is configured AND has not been marked expired. */
export function hasValidSession(): boolean {
  const s = getSession();
  return Boolean(s?.sessionId && !s.expired);
}

/** Returns a sanitised status object safe to send to the browser. */
export function getSessionStatus(): {
  configured: boolean;
  expired: boolean;
  updatedAt: number | null;
  source: "file" | "env" | "none";
} {
  const s = getSession();
  if (!s?.sessionId) return { configured: false, expired: false, updatedAt: null, source: "none" };
  return {
    configured: true,
    expired: s.expired,
    updatedAt: s.updatedAt || null,
    source: s.updatedAt > 0 ? "file" : "env",
  };
}
