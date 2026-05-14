"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "storysaver_bookmarks";

export interface Bookmark {
  username: string;
  fullName?: string;
  addedAt: number;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setBookmarks(JSON.parse(raw) as Bookmark[]);
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  function persist(next: Bookmark[]) {
    setBookmarks(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }

  function addBookmark(username: string, fullName?: string) {
    if (bookmarks.some((b) => b.username === username)) return;
    persist([...bookmarks, { username, fullName, addedAt: Date.now() }]);
  }

  function removeBookmark(username: string) {
    persist(bookmarks.filter((b) => b.username !== username));
  }

  function isBookmarked(username: string) {
    return bookmarks.some((b) => b.username === username);
  }

  function toggleBookmark(username: string, fullName?: string) {
    if (isBookmarked(username)) {
      removeBookmark(username);
    } else {
      addBookmark(username, fullName);
    }
  }

  return { bookmarks, hydrated, addBookmark, removeBookmark, isBookmarked, toggleBookmark };
}
