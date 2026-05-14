"use client";

import Image from "next/image";
import { StoryItem } from "@/types/instagram";

interface Props {
  item: StoryItem;
  index: number;
  username: string;
}

function proxyUrl(url: string, name: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
}

function formatTime(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StoryCard({ item, index, username }: Props) {
  const thumbSrc = proxyUrl(item.thumbnailUrl ?? item.imageUrl, `${username}_story_${index}_thumb`);
  const downloadUrl = item.mediaType === "video" && item.videoUrl
    ? proxyUrl(item.videoUrl, `${username}_story_${index}`)
    : proxyUrl(item.imageUrl, `${username}_story_${index}`);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gray-900 shadow-md aspect-[9/16]">
      {/* Thumbnail */}
      <Image
        src={thumbSrc}
        alt={`Story ${index + 1}`}
        fill
        sizes="(max-width:640px) 45vw, (max-width:1024px) 20vw, 180px"
        className="object-cover transition
                   [@media(hover:hover)]:group-hover:scale-105
                   [@media(hover:hover)]:group-hover:opacity-70"
        unoptimized
      />

      {/* Video badge */}
      {item.mediaType === "video" && (
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full
                        bg-black/60 px-2 py-0.5 text-white text-xs backdrop-blur-sm">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {item.videoDuration ? `${Math.round(item.videoDuration)}s` : "Video"}
        </div>
      )}

      {/* Timestamp — pointer devices only (desktop/laptop, not tablet touch) */}
      <div className="absolute bottom-8 left-0 right-0 px-2 text-center text-white text-[10px]
                      drop-shadow-md
                      hidden [@media(hover:hover)]:block
                      opacity-0 [@media(hover:hover)]:group-hover:opacity-100
                      transition">
        {formatTime(item.takenAt)}
      </div>

      {/* Download button:
          - touch devices (mobile + tablet): always visible
          - pointer devices (desktop): hidden until hover */}
      <a
        href={downloadUrl}
        download
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1
                   rounded-xl bg-gradient-to-r from-pink-500 to-yellow-400 px-3 py-1.5
                   text-white text-xs font-semibold shadow-lg
                   opacity-100
                   [@media(hover:hover)]:opacity-0
                   [@media(hover:hover)]:group-hover:opacity-100
                   transition active:scale-95 whitespace-nowrap"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
        Download
      </a>
    </div>
  );
}
