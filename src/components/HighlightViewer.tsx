"use client";

import { useState } from "react";
import Image from "next/image";
import { HighlightDetail, StoryItem } from "@/types/instagram";
import StoryCard from "./StoryCard";

interface Props {
  highlight: HighlightDetail;
  username: string;
  onClose: () => void;
}

function proxyUrl(url: string, name: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
}

export default function HighlightViewer({ highlight, username, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeItem: StoryItem | null =
    activeIndex !== null ? highlight.items[activeIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative flex w-full sm:max-w-3xl flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh]">
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 p-4">
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-pink-400">
            <Image
              src={proxyUrl(highlight.coverImageUrl, `hl_cover_${highlight.reelId}`)}
              alt={highlight.title}
              fill sizes="40px" className="object-cover" unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{highlight.title}</p>
            <p className="text-xs text-gray-400">{highlight.items.length} items</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-full p-2 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Story grid — flex-1 min-h-0 needed so overflow-y-auto actually constrains inside the flex-col modal */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {highlight.items.length === 0 ? (
            <p className="py-8 text-center text-gray-400">No items in this highlight.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
              {highlight.items.map((item, i) => (
                <div key={item.id} onClick={() => setActiveIndex(i)} className="cursor-pointer">
                  <StoryCard item={item} index={i} username={username} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Download all button */}
        {highlight.items.length > 0 && (
          <div className="border-t border-gray-100 p-4">
            <p className="text-center text-xs text-gray-400">
              Click each story to download individually, or use the download buttons on hover.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox overlay */}
      {activeItem && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/85"
          onClick={() => setActiveIndex(null)}
        >
          <div className="relative max-h-[80vh] max-w-sm md:max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {activeItem.mediaType === "video" && activeItem.videoUrl ? (
              <video
                src={proxyUrl(activeItem.videoUrl, `${username}_hl_${activeIndex}`)}
                controls autoPlay
                className="w-full rounded-2xl shadow-2xl"
              />
            ) : (
              <div className="relative aspect-[9/16] w-full">
                <Image
                  src={proxyUrl(activeItem.imageUrl, `${username}_hl_${activeIndex}`)}
                  alt="Story" fill className="object-contain rounded-2xl" unoptimized
                />
              </div>
            )}
            {/* Lightbox download */}
            <a
              href={
                activeItem.mediaType === "video" && activeItem.videoUrl
                  ? proxyUrl(activeItem.videoUrl, `${username}_hl_${activeIndex}`)
                  : proxyUrl(activeItem.imageUrl, `${username}_hl_${activeIndex}`)
              }
              download
              className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl
                         bg-gradient-to-r from-pink-500 to-yellow-400 py-2.5
                         font-semibold text-white text-sm shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download
            </a>
            <button
              onClick={() => setActiveIndex(null)}
              className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-white/90 hover:text-white active:scale-95 transition"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
