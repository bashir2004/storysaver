"use client";

import { useState } from "react";

interface Props {
  storiesRequired: boolean;
  highlightsRequired: boolean;
}

export default function SessionNotice({ storiesRequired, highlightsRequired }: Props) {
  const [open, setOpen] = useState(false);

  const both = storiesRequired && highlightsRequired;
  const label = both
    ? "Stories & Highlights"
    : storiesRequired
    ? "Stories"
    : "Highlights";

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">🔐</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-800 text-sm">
            Session required to load {label}
          </p>
          <p className="mt-1 text-amber-700 text-xs leading-relaxed">
            Instagram requires an authenticated session to access stories and highlights.
            Configure your <code className="bg-amber-100 px-1 rounded font-mono">INSTAGRAM_SESSION_ID</code> via the{" "}
            <a href="/admin" className="font-semibold underline underline-offset-2 hover:text-amber-900">
              Admin Panel
            </a>{" "}
            or in <code className="bg-amber-100 px-1 rounded font-mono">.env.local</code>.
          </p>
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-2 text-xs font-semibold text-amber-600 hover:text-amber-800 underline underline-offset-2 transition"
          >
            {open ? "Hide instructions ▲" : "How to set this up ▼"}
          </button>

          {open && (
            <div className="mt-3 space-y-3 text-xs text-amber-800">
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>
                  Log in to{" "}
                  <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer"
                    className="underline">instagram.com</a>{" "}
                  in Chrome or Firefox using <strong>your own account</strong>.
                </li>
                <li>
                  Open <strong>DevTools</strong> →{" "}
                  <strong>Application</strong> → <strong>Cookies</strong> →{" "}
                  <code className="bg-amber-100 px-1 rounded">https://www.instagram.com</code>
                </li>
                <li>
                  Copy the values for{" "}
                  <code className="bg-amber-100 px-1 rounded">sessionid</code>,{" "}
                  <code className="bg-amber-100 px-1 rounded">csrftoken</code>, and{" "}
                  <code className="bg-amber-100 px-1 rounded">ds_user_id</code>.
                </li>
                <li>
                  Create a file called{" "}
                  <code className="bg-amber-100 px-1 rounded">.env.local</code> in the
                  project root with:
                </li>
              </ol>

              <pre className="overflow-x-auto rounded-xl bg-gray-900 p-3 text-green-400 font-mono text-[11px] leading-relaxed">
{`INSTAGRAM_SESSION_ID=your_sessionid_value
INSTAGRAM_CSRFTOKEN=your_csrftoken_value
INSTAGRAM_DS_USER_ID=your_ds_user_id_value`}
              </pre>

              <p className="leading-relaxed">
                5. Restart the dev server (<code className="bg-amber-100 px-1 rounded">npm run dev</code>)
                and search again.
              </p>

              <div className="rounded-xl border border-amber-200 bg-amber-100 p-2.5">
                <strong>⚠️ Important:</strong> Never commit <code className="bg-amber-200 px-1 rounded">.env.local</code> to
                Git — it contains your personal session. It is already in <code className="bg-amber-200 px-1 rounded">.gitignore</code>.
                The session is used only on the server and never sent to the browser.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
