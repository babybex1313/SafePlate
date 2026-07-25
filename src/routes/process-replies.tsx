import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { addCommunityRestaurant } from "~/db/restaurants";

/* ------------------------------------------------------------------ */
/*  Batch processing server function                                   */
/* ------------------------------------------------------------------ */

interface ProcessResult {
  line: string;
  city: string;
  name: string;
  status: "added" | "skipped" | "error";
  message: string;
  id?: number;
}

const processReplies = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { rawText: string } }) => {
    const { rawText } = data;
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const results: ProcessResult[] = [];

    for (const line of lines) {
      // Parse: "City & Restaurant" or "City - Restaurant"
      const match = line.match(/^(.+?)\s*[&\-]\s*(.+)$/);
      if (!match) {
        results.push({
          line,
          city: "",
          name: "",
          status: "error",
          message: `Could not parse line: "${line}". Expected format: "City & Restaurant" or "City - Restaurant"`,
        });
        continue;
      }

      const city = match[1].trim();
      const name = match[2].trim();

      if (!city || !name) {
        results.push({
          line,
          city,
          name,
          status: "error",
          message: `Missing city or restaurant name in: "${line}"`,
        });
        continue;
      }

      try {
        const result = await addCommunityRestaurant({ data: { city, name } });
        if (result.inserted) {
          results.push({
            line,
            city,
            name,
            status: "added",
            message: `"${name}" added to ${city} (ID: ${result.id})`,
            id: result.id,
          });
        } else {
          results.push({
            line,
            city,
            name,
            status: "skipped",
            message: result.error ?? `"${name}" already exists in ${city}`,
            id: result.id,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({
          line,
          city,
          name,
          status: "error",
          message: `Error adding "${name}" in ${city}: ${msg}`,
        });
      }
    }

    return results;
  },
);

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/process-replies")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SafePlate — Process Email Replies" },
    ],
  }),
  component: ProcessRepliesPage,
});

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

function ProcessRepliesPage() {
  const [rawText, setRawText] = useState("");
  const [results, setResults] = useState<ProcessResult[] | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    if (!rawText.trim()) return;
    setProcessing(true);
    setResults(null);
    try {
      const data = await processReplies({ data: { rawText } });
      setResults(data);
    } catch (err) {
      setResults([
        {
          line: "",
          city: "",
          name: "",
          status: "error",
          message: `Server error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const added = results?.filter((r) => r.status === "added") ?? [];
  const skipped = results?.filter((r) => r.status === "skipped") ?? [];
  const errors = results?.filter((r) => r.status === "error") ?? [];

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAF9] text-slate-800 antialiased">
      {/* NavBar */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-lg">
              🍽️
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              SafePlate
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600"
            >
              Home
            </a>
            <a
              href="/search"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600"
            >
              Search
            </a>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Admin
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-3xl px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
              Process Email Replies
            </h1>
            <p className="mt-2 text-slate-600">
              Paste user reply emails below — one per line. Format:{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-700">
                City &amp; Restaurant
              </code>{" "}
              or{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-700">
                City - Restaurant
              </code>
            </p>
          </div>

          {/* Text area */}
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Sarasota & First Watch
Austin - Torchy's Tacos
St. Louis & The Shack`}
            rows={10}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y"
            disabled={processing}
          />

          {/* Process button */}
          <button
            type="button"
            onClick={handleProcess}
            disabled={processing || !rawText.trim()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing…
              </>
            ) : (
              "Process Replies"
            )}
          </button>

          {/* Results */}
          {results && (
            <div className="mt-8 space-y-6">
              {/* Summary */}
              <div className="flex flex-wrap gap-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                    Added
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">{added.length}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                    Skipped
                  </p>
                  <p className="text-2xl font-bold text-amber-700">{skipped.length}</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                    Errors
                  </p>
                  <p className="text-2xl font-bold text-red-700">{errors.length}</p>
                </div>
              </div>

              {/* Log */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Processing Log
                  </h2>
                </div>
                <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className={`px-5 py-3 text-sm ${
                        r.status === "added"
                          ? "bg-emerald-50/50"
                          : r.status === "skipped"
                            ? "bg-amber-50/50"
                            : "bg-red-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0">
                          {r.status === "added" && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
                              ✓
                            </span>
                          )}
                          {r.status === "skipped" && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                              →
                            </span>
                          )}
                          {r.status === "error" && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                              !
                            </span>
                          )}
                        </span>
                        <div>
                          <p
                            className={
                              r.status === "added"
                                ? "text-emerald-800"
                                : r.status === "skipped"
                                  ? "text-amber-800"
                                  : "text-red-800"
                            }
                          >
                            {r.message}
                          </p>
                          {r.line && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              Input: &ldquo;{r.line}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state hint */}
          {!results && !processing && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <svg
                className="mx-auto h-10 w-10 text-slate-300"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              <p className="mt-3 text-sm text-slate-500">
                Paste reply emails above and click <strong>Process Replies</strong> to
                add restaurants to the database.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-[#FAFAF9] py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-base">
              🍽️
            </span>
            <span className="text-base font-semibold text-slate-800">
              SafePlate
            </span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SafePlate. Internal admin tool.
          </p>
        </div>
      </footer>
    </div>
  );
}
