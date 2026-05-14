"use client";

import { useState, useRef } from "react";

interface Props {
  onSearch: (username: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim().replace(/^@/, "");
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
    >
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-lg select-none">
          @
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter Instagram username"
          autoComplete="off"
          spellCheck={false}
          maxLength={30}
          pattern="[a-zA-Z0-9._]{1,30}"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-8 pr-4 text-gray-800
                     shadow-sm outline-none ring-0 transition
                     focus:border-pink-400 focus:ring-2 focus:ring-pink-200
                     placeholder:text-gray-300 text-base"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r
                   from-pink-500 via-red-400 to-yellow-400 px-6 py-3 font-semibold
                   text-white shadow-md transition hover:opacity-90 active:scale-95
                   disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Loading…
          </>
        ) : (
          "Download!"
        )}
      </button>
    </form>
  );
}
