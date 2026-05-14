"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import UserCard from "@/components/UserCard";
import StoryCard from "@/components/StoryCard";
import HighlightCard from "@/components/HighlightCard";
import HighlightViewer from "@/components/HighlightViewer";
import ErrorMessage from "@/components/ErrorMessage";
import SessionNotice from "@/components/SessionNotice";
import {
  ProfileData,
  Highlight,
  HighlightDetail,
  ApiResponse,
} from "@/types/instagram";
import { useBookmarks } from "@/hooks/useBookmarks";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<HighlightDetail | null>(null);
  const [hlLoading, setHlLoading] = useState(false);
  const [hlError, setHlError] = useState<string | null>(null);

  const { bookmarks, hydrated, isBookmarked, toggleBookmark } = useBookmarks();

  async function handleSearch(username: string) {
    setLoading(true);
    setError(null);
    setProfile(null);
    setActiveHighlight(null);

    try {
      const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
      const json: ApiResponse<ProfileData> = await res.json();

      if (!json.ok) {
        setError(json.error);
      } else {
        setProfile(json.data);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleHighlightSelect(highlight: Highlight) {
    setHlLoading(true);
    setHlError(null);

    try {
      const res = await fetch(`/api/highlight?id=${encodeURIComponent(highlight.reelId)}`);
      const json: ApiResponse<HighlightDetail> = await res.json();

      if (!json.ok) {
        setHlError(json.error);
      } else {
        setActiveHighlight(json.data);
      }
    } catch {
      setHlError("Failed to load highlight. Please try again.");
    } finally {
      setHlLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50">
      {/* ── Hero ── */}
      <section className="flex flex-col items-center px-4 pt-10 pb-8 sm:pt-16 sm:pb-10 text-center">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl
                          bg-gradient-to-br from-pink-500 via-red-400 to-yellow-400 shadow-lg">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-gray-800">
            Story<span className="text-pink-500">Saver</span>
          </span>
        </div>

        <h1 className="max-w-xl text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
          Download Instagram Stories&nbsp;&amp;&nbsp;Highlights
        </h1>
        <p className="mt-3 max-w-md text-gray-500 text-sm sm:text-base">
          No app required. Just enter a public username and save stories &amp; highlights
          instantly — photos and videos.
        </p>

        <div className="mt-8 w-full max-w-xl">
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {/* ── Bookmarks strip ── */}
        {hydrated && bookmarks.length > 0 && (
          <div className="mt-4 w-full max-w-xl">
            <p className="mb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Bookmarks
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {bookmarks.map((bm) => (
                <div
                  key={bm.username}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200
                             bg-white px-3 py-1.5 shadow-sm"
                >
                  <button
                    onClick={() => handleSearch(bm.username)}
                    className="text-sm font-medium text-gray-700 hover:text-pink-500 transition"
                  >
                    @{bm.username}
                  </button>
                  <button
                    onClick={() => toggleBookmark(bm.username)}
                    aria-label={`Remove ${bm.username} bookmark`}
                    className="ml-0.5 rounded-full p-0.5 text-gray-300 hover:text-red-400 transition active:scale-90"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 w-full max-w-xl">
            <ErrorMessage message={error} />
          </div>
        )}
      </section>

      {/* ── Results ── */}
      {profile && (
        <section className="mx-auto max-w-3xl px-4 md:px-8 pb-20">
          {/* User card */}
          <div className="mb-8 flex justify-center">
            <UserCard
              user={profile.user}
              isBookmarked={isBookmarked(profile.user.username)}
              onBookmarkToggle={() =>
                toggleBookmark(profile.user.username, profile.user.fullName)
              }
            />
          </div>

          {/* Active Stories */}
          <div className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
              Active Stories
              <span className="ml-auto text-xs font-normal text-gray-400">
                {profile.stories.length} item{profile.stories.length !== 1 ? "s" : ""}
              </span>
            </h2>

            {profile.storiesAuthRequired ? (
              <SessionNotice storiesRequired highlightsRequired={false} />
            ) : profile.stories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-gray-400 text-sm">
                No active stories right now.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {profile.stories.map((story, i) => (
                  <StoryCard
                    key={story.id}
                    item={story}
                    index={i}
                    username={profile.user.username}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Highlights */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-gray-800 flex items-center gap-2">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969
                         0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755
                         1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197
                         -1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588
                         -1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Highlights
              <span className="ml-auto text-xs font-normal text-gray-400">
                {profile.highlights.length} album{profile.highlights.length !== 1 ? "s" : ""}
              </span>
            </h2>

            {profile.highlightsAuthRequired ? (
              <SessionNotice storiesRequired={false} highlightsRequired />
            ) : profile.highlights.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-gray-400 text-sm">
                No highlights found.
              </div>
            ) : (
              <>
                {hlError && (
                  <div className="mb-3">
                    <ErrorMessage message={hlError} type="warning" />
                  </div>
                )}
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                  {profile.highlights.map((hl) => (
                    <HighlightCard
                      key={hl.id}
                      highlight={hl}
                      onSelect={handleHighlightSelect}
                      isActive={activeHighlight?.id === hl.id}
                    />
                  ))}
                </div>

                {hlLoading && (
                  <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2 text-pink-500 text-sm">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Loading highlight…
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      {!profile && !loading && (
        <section className="mx-auto max-w-2xl px-4 pb-20 text-center">
          <h2 className="mb-8 text-xl font-bold text-gray-800">How It Works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[
              { step: "1", icon: "👤", title: "Enter Username", desc: "Type in any public Instagram username in the search bar above." },
              { step: "2", icon: "📱", title: "Browse Content", desc: "See active stories and highlight albums listed instantly." },
              { step: "3", icon: "💾", title: "Download", desc: "Hover over any story and tap Download to save photos or videos." },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-left">
                <div className="mb-3 text-3xl">{icon}</div>
                <div className="mb-1 text-xs font-semibold text-pink-400 uppercase tracking-wide">Step {step}</div>
                <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-12 space-y-4 text-left">
            <h2 className="text-xl font-bold text-gray-800 text-center mb-6">FAQ</h2>
            {[
              { q: "❓ Which accounts can I download from?", a: "Only public Instagram accounts are supported. Private accounts require authentication and are not accessible." },
              { q: "💾 Are downloads stored on your servers?", a: "No. We never log, store, or share any downloaded content or personal data. All media is proxied directly from Instagram's CDN to your device." },
              { q: "📱 Does it work on iPhone and Android?", a: "Yes! Use Safari on iOS 13+ or Chrome on Android for the best experience. No app installation required." },
              { q: "⚠️ What are the limitations?", a: "Stories expire after 24 hours — once they're gone from Instagram, they cannot be retrieved. Highlights remain available as long as the owner keeps them." },
            ].map(({ q, a }) => (
              <details key={q} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <summary className="cursor-pointer px-5 py-4 font-semibold text-gray-800 text-sm select-none">{q}</summary>
                <p className="px-5 pb-4 text-sm text-gray-500">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-6 text-center text-xs text-gray-400">
        <p>StorySaver — For personal use only. Respects Instagram&apos;s public content policies.</p>
        <p className="mt-1">Only public accounts are supported. We do not store any user data.</p>
      </footer>

      {/* ── Highlight Viewer Modal ── */}
      {activeHighlight && (
        <HighlightViewer
          highlight={activeHighlight}
          username={profile?.user.username ?? ""}
          onClose={() => setActiveHighlight(null)}
        />
      )}
    </main>
  );
}
