/**
 * Instagram scraping utilities.
 *
 * Instagram's story/highlight endpoints require an authenticated session.
 * Configure the following environment variables (in .env.local) to enable them:
 *
 *   INSTAGRAM_SESSION_ID   — required  (from instagram.com cookie "sessionid")
 *   INSTAGRAM_CSRFTOKEN    — optional  (from instagram.com cookie "csrftoken")
 *   INSTAGRAM_DS_USER_ID   — optional  (from instagram.com cookie "ds_user_id")
 *
 * How to get these values:
 *   1. Log in to instagram.com in Chrome / Firefox
 *   2. Open DevTools → Application → Cookies → https://www.instagram.com
 *   3. Copy the values for sessionid, csrftoken, ds_user_id
 *
 * Endpoints used (unofficial):
 *  - Profile:    https://i.instagram.com/api/v1/users/web_profile_info/?username=X
 *  - Stories:    https://i.instagram.com/api/v1/feed/user/<userId>/story/
 *  - Highlights: https://i.instagram.com/api/v1/highlights/<userId>/highlights_tray/
 *  - Highlight:  https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight:<id>
 */

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import {
  InstagramUser,
  StoryItem,
  Highlight,
  HighlightDetail,
  ProfileData,
} from "@/types/instagram";
import { getSession, hasValidSession, markExpired } from "@/lib/sessionStore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IG_APP_ID = "936619743392459";
const BASE_URL = "https://i.instagram.com/api/v1";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
];

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/** Returns true when a session is configured AND not expired */
export function hasSession(): boolean {
  return hasValidSession();
}

/**
 * Build Cookie and X-CSRFToken headers from the session store.
 * Returns an empty object when no valid session exists.
 */
function sessionHeaders(): Record<string, string> {
  const session = getSession();
  if (!session?.sessionId || session.expired) return {};

  const cookieParts = [`sessionid=${session.sessionId}`];
  if (session.csrfToken) cookieParts.push(`csrftoken=${session.csrfToken}`);
  if (session.dsUserId) cookieParts.push(`ds_user_id=${session.dsUserId}`);

  const headers: Record<string, string> = {
    Cookie: cookieParts.join("; "),
  };
  if (session.csrfToken) headers["X-CSRFToken"] = session.csrfToken;
  return headers;
}

// ---------------------------------------------------------------------------
// Auth error sentinel
// ---------------------------------------------------------------------------

export class InstagramAuthError extends Error {
  constructor(message = "Instagram session required. Configure INSTAGRAM_SESSION_ID.") {
    super(message);
    this.name = "InstagramAuthError";
  }
}

export class InstagramNotFoundError extends Error {
  constructor(username: string) {
    super(`Instagram account "@${username}" not found.`);
    this.name = "InstagramNotFoundError";
  }
}

// ---------------------------------------------------------------------------
// Core HTTP helper
// ---------------------------------------------------------------------------

async function igFetch<T>(
  url: string,
  extraHeaders: Record<string, string> = {}
): Promise<T> {
  const config: AxiosRequestConfig = {
    url,
    method: "GET",
    timeout: 15_000,
    headers: {
      "User-Agent": randomUserAgent(),
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Referer: "https://www.instagram.com/",
      Origin: "https://www.instagram.com",
      "X-IG-App-ID": IG_APP_ID,
      "X-Requested-With": "XMLHttpRequest",
      ...sessionHeaders(),
      ...extraHeaders,
    },
    maxRedirects: 5,
  };

  try {
    const response = await axios(config);
    return response.data as T;
  } catch (err) {
    const axiosErr = err as AxiosError;
    const status = axiosErr.response?.status;
    const isTimeout = axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout');
    const isNetworkErr = axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ENOTFOUND' || axiosErr.code === 'ECONNRESET';

    console.error(`[igFetch] url=${url} status=${status ?? 'none'} code=${axiosErr.code ?? 'none'} msg=${axiosErr.message}`);

    if (status === 400 || status === 401 || status === 403) {
      if (status === 401 || status === 403) markExpired();
      throw new InstagramAuthError();
    }
    if (status === 404) {
      throw new InstagramNotFoundError(url);
    }
    if (status === 429) {
      throw Object.assign(new Error('Instagram rate limit hit. Try again later.'), { igStatus: 429 });
    }
    if (isTimeout) {
      throw Object.assign(new Error('Instagram API timed out.'), { igStatus: 'timeout' });
    }
    if (isNetworkErr) {
      throw Object.assign(new Error(`Network error reaching Instagram: ${axiosErr.code}`), { igStatus: axiosErr.code });
    }
    if (status) {
      throw Object.assign(new Error(`Instagram API returned HTTP ${status}`), { igStatus: status });
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeUser(raw: any): InstagramUser {
  const u = raw?.user ?? raw;
  return {
    id: String(u.pk ?? u.id ?? ""),
    username: u.username ?? "",
    fullName: u.full_name ?? "",
    biography: u.biography ?? "",
    profilePicUrl: u.profile_pic_url ?? "",
    profilePicUrlHd: u.profile_pic_url_hd ?? u.hd_profile_pic_url_info?.url,
    followerCount: u.follower_count ?? u.edge_followed_by?.count ?? 0,
    followingCount: u.following_count ?? u.edge_follow?.count ?? 0,
    mediaCount: u.media_count ?? u.edge_owner_to_timeline_media?.count ?? 0,
    isPrivate: u.is_private ?? false,
    isVerified: u.is_verified ?? false,
    externalUrl: u.external_url ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStoryItem(raw: any): StoryItem {
  const isVideo = raw.media_type === 2;

  const imageCandidates: { url: string; width: number }[] =
    raw.image_versions2?.candidates ?? [];
  imageCandidates.sort((a, b) => b.width - a.width);
  const imageUrl = imageCandidates[0]?.url ?? "";

  const videoCandidates: { url: string; bandwidth?: number }[] =
    raw.video_versions ?? [];
  videoCandidates.sort((a, b) => (b.bandwidth ?? 0) - (a.bandwidth ?? 0));
  const videoUrl = videoCandidates[0]?.url;

  return {
    id: String(raw.id ?? raw.pk ?? ""),
    pk: String(raw.pk ?? raw.id ?? ""),
    mediaType: isVideo ? "video" : "photo",
    imageUrl,
    videoUrl,
    videoDuration: raw.video_duration,
    thumbnailUrl: imageUrl,
    takenAt: raw.taken_at ?? 0,
    expiringAt: raw.expiring_at ?? 0,
    width: raw.original_width ?? raw.width ?? 0,
    height: raw.original_height ?? raw.height ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeHighlight(raw: any): Highlight {
  const coverMedia = raw.cover_media?.cropped_image_version;
  const coverUrl =
    coverMedia?.url ??
    raw.cover_media_cropped_thumbnail?.url ??
    raw.cover_image_url ??
    "";
  const reelId = String(raw.id ?? "").replace("highlight:", "");

  return {
    id: String(raw.id ?? ""),
    reelId,
    title: raw.title ?? "",
    coverImageUrl: coverUrl,
    mediaCount: raw.media_count ?? 0,
    createdAt: raw.created_at ?? 0,
    latestReelMedia: raw.latest_reel_media ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch a user's public profile (works without session for public accounts) */
export async function fetchUserProfile(username: string): Promise<InstagramUser> {
  const sanitized = username.replace(/[^a-zA-Z0-9._]/g, "").toLowerCase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await igFetch<any>(
    `${BASE_URL}/users/web_profile_info/?username=${sanitized}`
  );
  const rawUser = data?.data?.user;
  if (!rawUser) throw new InstagramNotFoundError(sanitized);
  return normalizeUser(rawUser);
}

/**
 * Fetch current active stories for a user.
 * Requires an authenticated session — throws InstagramAuthError without one.
 */
export async function fetchStories(userId: string): Promise<StoryItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await igFetch<any>(`${BASE_URL}/feed/user/${userId}/story/`);
  const reel = data?.reel ?? data?.reels?.[userId];
  if (!reel?.items?.length) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return reel.items.map((item: any) => normalizeStoryItem(item));
}

/**
 * Fetch highlight tray (album list) for a user.
 * Requires an authenticated session — throws InstagramAuthError without one.
 */
export async function fetchHighlightTray(userId: string): Promise<Highlight[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await igFetch<any>(
    `${BASE_URL}/highlights/${userId}/highlights_tray/`
  );
  const trays: unknown[] = data?.tray ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return trays.map((t: any) => normalizeHighlight(t));
}

/**
 * Fetch all items inside a specific highlight album.
 * Requires an authenticated session.
 */
export async function fetchHighlightItems(
  highlightId: string
): Promise<HighlightDetail | null> {
  const reelId = highlightId.startsWith("highlight:")
    ? highlightId
    : `highlight:${highlightId}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await igFetch<any>(
    `${BASE_URL}/feed/reels_media/?reel_ids=${encodeURIComponent(reelId)}`
  );

  const reel = data?.reels?.[reelId] ?? data?.reels_media?.[0];
  if (!reel) return null;

  const highlight = normalizeHighlight(reel);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: StoryItem[] = (reel.items ?? []).map((i: any) =>
    normalizeStoryItem(i)
  );

  return { ...highlight, items };
}

/**
 * One-shot fetch: profile + stories + highlights.
 * Stories and highlights gracefully degrade when session is not configured
 * or when Instagram returns 401, flagging the reason in the result.
 */
export async function fetchProfileData(username: string): Promise<ProfileData> {
  const user = await fetchUserProfile(username);

  if (user.isPrivate) {
    throw Object.assign(
      new Error("This account is private. Only public accounts are supported."),
      { code: "PRIVATE_ACCOUNT" }
    );
  }

  const session = hasValidSession();

  let stories: StoryItem[] = [];
  let storiesAuthRequired = false;

  let highlights: Highlight[] = [];
  let highlightsAuthRequired = false;

  // Run both in parallel; capture auth errors independently
  const [storiesResult, highlightsResult] = await Promise.allSettled([
    fetchStories(user.id),
    fetchHighlightTray(user.id),
  ]);

  if (storiesResult.status === "fulfilled") {
    stories = storiesResult.value;
  } else {
    storiesAuthRequired = storiesResult.reason instanceof InstagramAuthError || !session;
    if (!storiesAuthRequired) {
      // Non-auth error (e.g. 404 = no active stories) — treat as empty
      stories = [];
    }
  }

  if (highlightsResult.status === "fulfilled") {
    highlights = highlightsResult.value;
  } else {
    highlightsAuthRequired = highlightsResult.reason instanceof InstagramAuthError || !session;
    if (!highlightsAuthRequired) {
      highlights = [];
    }
  }

  return {
    user,
    stories,
    highlights,
    sessionConfigured: session,
    storiesAuthRequired,
    highlightsAuthRequired,
  };
}

