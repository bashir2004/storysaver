"use client";

import Image from "next/image";
import { Highlight } from "@/types/instagram";

interface Props {
  highlight: Highlight;
  onSelect: (highlight: Highlight) => void;
  isActive: boolean;
}

function proxyUrl(url: string, name: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
}

export default function HighlightCard({ highlight, onSelect, isActive }: Props) {
  return (
    <button
      onClick={() => onSelect(highlight)}
      className={`flex flex-col items-center gap-1.5 p-1 transition group w-20 md:w-24 shrink-0
                  ${isActive ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
    >
      {/* Circle cover */}
      <div
        className={`relative h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-full
                    ring-2 ring-offset-2 transition
                    ${isActive
                      ? "ring-pink-500 scale-110"
                      : "ring-gray-200 group-hover:ring-pink-400"
                    }`}
      >
        <Image
          src={proxyUrl(highlight.coverImageUrl, `highlight_${highlight.reelId}_cover`)}
          alt={highlight.title}
          fill
          sizes="(min-width:768px) 80px, 64px"
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Title */}
      <span className="w-full text-center text-[11px] md:text-xs text-gray-600 font-medium truncate leading-tight">
        {highlight.title}
      </span>

      {/* Item count badge */}
      {highlight.mediaCount > 0 && (
        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
          {highlight.mediaCount}
        </span>
      )}
    </button>
  );
}
