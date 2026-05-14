// Core Instagram data types

export interface InstagramUser {
  id: string;
  username: string;
  fullName: string;
  biography: string;
  profilePicUrl: string;
  profilePicUrlHd?: string;
  followerCount: number;
  followingCount: number;
  mediaCount: number;
  isPrivate: boolean;
  isVerified: boolean;
  externalUrl?: string;
}

export interface StoryItem {
  id: string;
  pk: string;
  mediaType: "photo" | "video";
  /** Direct CDN URL for photos */
  imageUrl: string;
  /** Direct CDN URL for videos */
  videoUrl?: string;
  /** Video duration in seconds */
  videoDuration?: number;
  /** Thumbnail for videos */
  thumbnailUrl?: string;
  takenAt: number; // unix timestamp
  expiringAt: number; // unix timestamp
  width: number;
  height: number;
}

export interface Highlight {
  id: string;
  /** Highlight reel ID (without "highlight:" prefix) */
  reelId: string;
  title: string;
  coverImageUrl: string;
  mediaCount: number;
  createdAt: number;
  latestReelMedia: number;
}

export interface HighlightDetail extends Highlight {
  items: StoryItem[];
}

export interface ProfileData {
  user: InstagramUser;
  stories: StoryItem[];
  highlights: Highlight[];
  /** Whether a valid INSTAGRAM_SESSION_ID env var is configured on the server */
  sessionConfigured: boolean;
  /** Stories endpoint returned 401 — session is required to load stories */
  storiesAuthRequired: boolean;
  /** Highlights endpoint returned 401 — session is required to load highlights */
  highlightsAuthRequired: boolean;
}

// API response shapes
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: "PRIVATE_ACCOUNT" | "NOT_FOUND" | "RATE_LIMITED" | "FETCH_ERROR";
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
