"use client";

import Image from "next/image";
import { InstagramUser } from "@/types/instagram";

interface Props {
  user: InstagramUser;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function UserCard({ user, isBookmarked = false, onBookmarkToggle }: Props) {
  return (
    <div className="flex w-full max-w-xl md:max-w-2xl items-center gap-4 rounded-2xl border border-gray-100
                    bg-white p-4 md:p-5 shadow-sm">
      {/* Avatar */}
      <div className="relative h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-pink-400 ring-offset-2">
        <Image
          src={`/api/proxy?url=${encodeURIComponent(user.profilePicUrl)}&name=avatar`}
          alt={user.username}
          fill
          sizes="(min-width:768px) 80px, 64px"
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold text-gray-900 text-base truncate">
            {user.username}
          </span>
          {user.isVerified && (
            <svg
              className="h-4 w-4 shrink-0 text-blue-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        {user.fullName && (
          <p className="truncate text-sm text-gray-500">{user.fullName}</p>
        )}

        {/* Stats */}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          <span>
            <strong className="text-gray-700">{fmt(user.followerCount)}</strong> followers
          </span>
          <span>
            <strong className="text-gray-700">{fmt(user.followingCount)}</strong> following
          </span>
          <span>
            <strong className="text-gray-700">{fmt(user.mediaCount)}</strong> posts
          </span>
        </div>
      </div>

      {/* Bookmark toggle */}
      {onBookmarkToggle && (
        <button
          onClick={onBookmarkToggle}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this profile"}
          title={isBookmarked ? "Remove bookmark" : "Bookmark this profile"}
          className={`shrink-0 rounded-full p-2.5 transition active:scale-90
            ${isBookmarked
              ? "text-pink-500 bg-pink-50 hover:bg-pink-100"
              : "text-gray-300 hover:text-pink-500 hover:bg-pink-50"
            }`}
        >
          {isBookmarked ? (
            /* Filled bookmark */
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v16l7-3.5L17 21V5a2 2 0 00-2-2H5z" />
            </svg>
          ) : (
            /* Outline bookmark */
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M5 3a2 2 0 00-2 2v16l7-3.5L17 21V5a2 2 0 00-2-2H5z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
