import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  bulkMatchRestaurants,
  bulkImportEmails,
} from "~/db/restaurants";
import type { BulkMatchResult } from "~/db/restaurants";
import { getCurrentUser } from "~/db/auth";
import { getSessionToken } from "~/session";

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/admin/import-emails")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SafePlate — Admin: Import Emails" },
    ],
  }),
  component: AdminImportEmailsPage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
/* ------------------------------------------------------------------ */

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Password Gate                                                     */
/* ------------------------------------------------------------------ */

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setChecking(false);
      setDenied(true);
      return;
    }
    getCurrentUser({ data: { token } }).then((user) => {
      if (user?.role === "admin") {
        onUnlock();
      } else {
        setDenied(true);
      }
      setChecking(false);
    });
  }, [onUnlock]);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAFAF9] dark:bg-slate-950 p-6">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 animate-spin text-sky-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round" />
          </svg>
          <span className="text-slate-500 dark:text-slate-400">Checking access…</span>
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAFAF9] dark:bg-slate-950 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-500 text-2xl shadow-md">🔒</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You need admin privileges to access this page.
          </p>
          <a href="/login" className="inline-block rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95">
            Log In
          </a>
        </div>
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-lg">
            🍽️
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            SafePlate
          </span>
        </a>
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Home
          </a>
          <a
            href="/search"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Search
          </a>
          <a
            href="/admin/restaurants"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            🍽️ Restaurants
          </a>
          <a
            href="/admin/analytics"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            📊 Analytics
          </a>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            Admin
          </span>
          <a href="/admin/restaurants" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors">
            🔒
          </a>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                            */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-[#FAFAF9] py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-base">
            🍽️
          </span>
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
            SafePlate
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} SafePlate. Internal admin tool.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Sample data                                                       */
/* ------------------------------------------------------------------ */

const SAMPLE_DATA = `Torchy's Tacos, owner@torchystacos.com
Picnik, hello@picnikaustin.com
True Food Kitchen, contact@truefoodkitchen.com
Flower Child, info@flowerchild.com
NonExistent Restaurant, someone@nowhere.com`;

/* ------------------------------------------------------------------ */
/*  Parsing helpers                                                   */
/* ------------------------------------------------------------------ */

interface ParsedRow {
  name: string;
  email: string;
}

function parseInput(text: string): ParsedRow[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const rows: ParsedRow[] = [];

  for (const line of lines) {
    // CSV detection: if line has multiple commas, try columns
    const commaCount = (line.match(/,/g) || []).length;
    if (commaCount >= 2) {
      // Try CSV parsing: assume first column is name, some later column is email
      const parts = line.split(",").map((p) => p.trim());
      const emailPart = parts.find((p) => p.includes("@"));
      const namePart = parts.find((p) => !p.includes("@") && p.length > 0);
      if (emailPart && namePart) {
        rows.push({ name: namePart, email: emailPart });
        continue;
      }
    }

    // Standard format: "Restaurant Name, email@example.com"
    const lastCommaIdx = line.lastIndexOf(",");
    if (lastCommaIdx > 0) {
      const name = line.substring(0, lastCommaIdx).trim();
      const email = line.substring(lastCommaIdx + 1).trim();
      if (name && email) {
        rows.push({ name, email });
        continue;
      }
    }

    // Fallback: treat entire line as name with empty email
    rows.push({ name: line.trim(), email: "" });
  }

  return rows;
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

function AdminImportEmailsPage() {
  const [authed, setAuthed] = useState(false);

  // Input state
  const [inputText, setInputText] = useState("");
  const [matchResults, setMatchResults] = useState<BulkMatchResult[] | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    updated: number;
    skipped: number;
    notFound: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const parsedRows = useMemo(() => parseInput(inputText), [inputText]);

  const handlePreview = async () => {
    if (parsedRows.length === 0) return;
    setMatching(true);
    setMatchError(null);
    setMatchResults(null);
    setImportResult(null);
    try {
      const results = await bulkMatchRestaurants({
        data: { rows: parsedRows },
      });
      setMatchResults(results as BulkMatchResult[]);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Failed to match.");
    } finally {
      setMatching(false);
    }
  };

  const handleImport = async () => {
    if (!matchResults) return;
    const toImport = matchResults
      .filter((r) => r.matchType === "exact" && r.restaurantId)
      .map((r) => ({ id: r.restaurantId!, email: r.email }));

    if (toImport.length === 0) return;

    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await bulkImportEmails({
        data: { rows: toImport },
      });
      const skipped = matchResults.filter((r) => r.matchType !== "exact").length;
      const notFound = matchResults.filter((r) => r.matchType === "none").length;
      setImportResult({
        updated: (res as { updated: number }).updated,
        skipped,
        notFound,
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import.");
    } finally {
      setImporting(false);
    }
  };

  const exactMatches = matchResults?.filter((r) => r.matchType === "exact") ?? [];
  const partialMatches = matchResults?.filter((r) => r.matchType === "partial") ?? [];
  const noMatches = matchResults?.filter((r) => r.matchType === "none") ?? [];

  // ── Password gate (early return) ────────────────────────────────────
  if (!authed) {
    return <AdminGate onUnlock={() => setAuthed(true)} />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAF9] text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-4xl px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl dark:text-slate-100">
              📥 Import Emails
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Bulk-assign contact emails to restaurants by pasting names and emails.
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50/50 dark:bg-sky-950/20 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-400 mb-2">
              📋 Instructions
            </h3>
            <p className="text-sm text-sky-600 dark:text-sky-400 leading-relaxed">
              Paste restaurant names and emails — one per line, separated by a comma:
            </p>
            <code className="mt-2 block rounded-lg bg-sky-100 dark:bg-sky-900/40 px-3 py-2 text-xs text-sky-700 dark:text-sky-300 font-mono">
              Restaurant Name, email@example.com
            </code>
            <p className="mt-2 text-xs text-sky-500 dark:text-sky-400">
              CSV format is also detected (if a line has multiple commas, we'll try to find the name and email columns).
            </p>
          </div>

          {/* Sample data */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 dark:text-slate-400">
              💡 Sample Data
            </p>
            <pre className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">
              {SAMPLE_DATA}
            </pre>
          </div>

          {/* Textarea */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Paste restaurant names and emails
            </label>
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setMatchResults(null);
                setImportResult(null);
              }}
              placeholder={`Torchy's Tacos, owner@torchystacos.com\nPicnik, hello@picnikaustin.com\n...`}
              rows={10}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 font-mono resize-y"
              style={{ minHeight: "400px" }}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {parsedRows.length} row{parsedRows.length !== 1 ? "s" : ""} parsed
              </span>
              <button
                type="button"
                onClick={handlePreview}
                disabled={parsedRows.length === 0 || matching}
                className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {matching ? (
                  <span className="inline-flex items-center gap-2">
                    <IconSpinner className="h-4 w-4 animate-spin" />
                    Matching…
                  </span>
                ) : (
                  "🔍 Preview Matches"
                )}
              </button>
            </div>
          </div>

          {/* Match error */}
          {matchError && (
            <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
              ❌ {matchError}
            </div>
          )}

          {/* Preview table */}
          {matchResults && matchResults.length > 0 && (
            <div className="mb-6">
              {/* Summary */}
              <div className="mb-4 flex flex-wrap gap-3">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  ✅ {exactMatches.length} Matched
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  ⚠️ {partialMatches.length} Partial
                </span>
                <span className="rounded-full border border-red-200 bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400">
                  ❌ {noMatches.length} Not Found
                </span>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left">
                        <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Restaurant Name</th>
                        <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Email</th>
                        <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Matched</th>
                        <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchResults.map((row, idx) => {
                        const statusBadge =
                          row.matchType === "exact" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              ✅ Matched
                            </span>
                          ) : row.matchType === "partial" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                              ⚠️ Partial match
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 dark:bg-red-900/20 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                              ❌ Not found
                            </span>
                          );

                        return (
                          <tr
                            key={idx}
                            className={`border-b border-slate-100 dark:border-slate-700 ${
                              row.matchType === "exact"
                                ? "bg-emerald-50/20 dark:bg-emerald-900/5"
                                : row.matchType === "partial"
                                  ? "bg-amber-50/20 dark:bg-amber-900/5"
                                  : ""
                            }`}
                          >
                            <td className="px-5 py-3">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {row.inputName}
                              </span>
                              {row.restaurantName && row.matchType !== "exact" && (
                                <span className="block text-xs text-slate-400 dark:text-slate-500">
                                  → {row.restaurantName}
                                  {row.restaurantCity ? ` (${row.restaurantCity})` : ""}
                                </span>
                              )}
                              {row.matchType === "exact" && (
                                <span className="block text-xs text-slate-400 dark:text-slate-500">
                                  {row.restaurantCity}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                              {row.email}
                            </td>
                            <td className="px-5 py-3">
                              {row.matchType === "exact" ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">{row.restaurantName}</span>
                              ) : row.matchType === "partial" ? (
                                <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">{row.restaurantName}</span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3">{statusBadge}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import button */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={exactMatches.length === 0 || importing}
                  className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {importing ? (
                    <span className="inline-flex items-center gap-2">
                      <IconSpinner className="h-4 w-4 animate-spin" />
                      Importing…
                    </span>
                  ) : (
                    `📥 Import ${exactMatches.length} Matched`
                  )}
                </button>
                {importError && (
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    ❌ {importError}
                  </span>
                )}
              </div>

              {/* Import result summary */}
              {importResult && (
                <div className="mt-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  ✅ {importResult.updated} imported, {importResult.skipped} skipped, {importResult.notFound} not found
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
