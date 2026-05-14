"use client";

import { useState, useEffect, useCallback } from "react";

interface SessionStatus {
  configured: boolean;
  expired: boolean;
  updatedAt: number | null;
  source: "file" | "env" | "none";
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [dsUserId, setDsUserId] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchStatus = useCallback(async (pw: string) => {
    const res = await fetch("/api/admin/session", {
      headers: { "x-admin-password": pw },
    });
    if (res.status === 401) return false;
    const data = await res.json();
    setStatus(data);
    return true;
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const ok = await fetchStatus(password);
    if (ok) {
      setAuthed(true);
    } else {
      setAuthError("Incorrect admin password.");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ sessionId, csrfToken, dsUserId }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setSaveMsg({ ok: false, text: data.error ?? "Failed to save." });
    } else {
      setSaveMsg({ ok: true, text: "Session saved successfully! The server will use it immediately." });
      setStatus(data.status);
      setSessionId("");
      setCsrfToken("");
      setDsUserId("");
    }
  }

  // Refresh status every 30s while on page
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => fetchStatus(password), 30_000);
    return () => clearInterval(id);
  }, [authed, password, fetchStatus]);

  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <form onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-4">
          <div className="text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl
                            bg-gradient-to-br from-pink-500 to-yellow-400 shadow mb-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500 mt-1">Session management</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                         focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              placeholder="Enter ADMIN_PASSWORD"
              required
            />
            {authError && <p className="mt-1 text-xs text-red-600">{authError}</p>}
          </div>

          <button type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-yellow-400
                       py-2.5 font-semibold text-white text-sm shadow hover:opacity-90 transition">
            Sign In
          </button>

          <p className="text-center text-xs text-gray-400">
            Set <code className="bg-gray-100 px-1 rounded">ADMIN_PASSWORD</code> in{" "}
            <code className="bg-gray-100 px-1 rounded">.env.local</code>
          </p>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition">← Back</a>
          <h1 className="text-xl font-bold text-gray-900">Session Manager</h1>
        </div>

        {/* Current status */}
        {status && (
          <div className={`rounded-2xl border p-4 text-sm
            ${!status.configured
              ? "border-gray-200 bg-gray-50"
              : status.expired
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
            }`}>
            <div className="flex items-center gap-2 font-semibold mb-1">
              <span className="text-lg">
                {!status.configured ? "⚠️" : status.expired ? "❌" : "✅"}
              </span>
              <span className={
                !status.configured ? "text-gray-700"
                  : status.expired ? "text-red-700"
                  : "text-green-700"
              }>
                {!status.configured
                  ? "No session configured"
                  : status.expired
                  ? "Session expired — Instagram returned 401"
                  : "Session active"}
              </span>
            </div>
            {status.configured && (
              <div className="text-xs text-gray-500 space-y-0.5 ml-7">
                <p>Source: <strong>{status.source}</strong></p>
                {status.updatedAt && (
                  <p>Last updated: <strong>{new Date(status.updatedAt).toLocaleString()}</strong></p>
                )}
                {!status.expired && (
                  <p className="text-gray-400 italic">
                    Instagram sessions typically last 3–6 months. Paste fresh cookies below when it expires.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Update form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-1">Update Session Cookies</h2>
          <p className="text-xs text-gray-400 mb-5">
            Get these values from Chrome DevTools →{" "}
            <strong>Application → Cookies → instagram.com</strong>
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                sessionid <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Paste sessionid cookie value"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono
                           outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">csrftoken</label>
              <input
                type="text"
                value={csrfToken}
                onChange={(e) => setCsrfToken(e.target.value)}
                placeholder="Paste csrftoken cookie value (recommended)"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono
                           outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ds_user_id</label>
              <input
                type="text"
                value={dsUserId}
                onChange={(e) => setDsUserId(e.target.value)}
                placeholder="Paste ds_user_id cookie value (recommended)"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono
                           outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>

            <button type="submit" disabled={saving}
              className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-yellow-400
                         py-2.5 font-semibold text-white text-sm shadow hover:opacity-90
                         transition disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Saving…" : "Save & Activate"}
            </button>
          </form>

          {saveMsg && (
            <div className={`mt-3 rounded-xl p-3 text-sm
              ${saveMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {saveMsg.text}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-xs text-amber-800 space-y-2">
          <p className="font-semibold text-sm">📋 Step-by-step: get fresh cookies</p>
          <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
            <li>Open <strong>Chrome</strong> and go to <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="underline">instagram.com</a> — log in if needed.</li>
            <li>Press <kbd className="bg-amber-100 px-1 rounded border border-amber-200">F12</kbd> to open DevTools.</li>
            <li>Go to <strong>Application</strong> tab → <strong>Cookies</strong> → <code className="bg-amber-100 px-1 rounded">https://www.instagram.com</code></li>
            <li>Find <code className="bg-amber-100 px-1 rounded">sessionid</code>, <code className="bg-amber-100 px-1 rounded">csrftoken</code>, <code className="bg-amber-100 px-1 rounded">ds_user_id</code> and copy their <strong>Value</strong> column.</li>
            <li>Paste them into the form above and click <strong>Save & Activate</strong>.</li>
          </ol>
          <p className="text-amber-600">
            ✅ No server restart needed — the new session is active immediately.
          </p>
        </div>
      </div>
    </main>
  );
}
