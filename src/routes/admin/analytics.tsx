import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { getCurrentUser } from "~/db/auth";
import { getSessionToken } from "~/session";
import {
  getAnalyticsOverview,
  getTopCities,
  getRecentSignups,
  getRecentEmails,
  getRecentReviews,
  type AnalyticsOverview,
  type CityRow,
  type SignupRow,
  type EmailRow,
  type RecentReviewRow,
} from "~/db/analytics";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

/* ------------------------------------------------------------------ */
/*  Admin Auth Gate                                                    */
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
  const handleLock = () => {
    sessionStorage.removeItem("admin_authed");
    window.location.reload();
  };

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
            className="text-sm font-semibold text-sky-600 dark:text-sky-400 transition-colors hover:text-sky-500"
          >
            📊 Analytics
          </a>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            Admin
          </span>
          <button
            onClick={handleLock}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors cursor-pointer"
            title="Lock admin"
          >
            🔒
          </button>
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
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-sm">
            🍽️
          </span>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            SafePlate
          </span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} SafePlate. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function tierBadge(tier: number) {
  if (tier === 1) return { label: "Tier 1", className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", emoji: "🟢" };
  if (tier === 2) return { label: "Tier 2", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800", emoji: "🟡" };
  return { label: "Tier 3", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800", emoji: "🔴" };
}

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG)                                                */
/* ------------------------------------------------------------------ */

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */

function AnalyticsPage() {
  const [authed, setAuthed] = useState(false);

  if (!authed) {
    return <AdminGate onUnlock={() => setAuthed(true)} />;
  }

  return <AnalyticsDashboard />;
}

function AnalyticsDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [reviews, setReviews] = useState<RecentReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ov, ct, su, em, rv] = await Promise.all([
        getAnalyticsOverview(),
        getTopCities(),
        getRecentSignups(),
        getRecentEmails(),
        getRecentReviews(),
      ]);
      setOverview(ov);
      setCities(ct);
      setSignups(su);
      setEmails(em);
      setReviews(rv);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#FAFAF9] dark:bg-slate-950">
        <NavBar />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3">
            <IconSpinner className="h-8 w-8 animate-spin text-sky-500" />
            <span className="text-slate-500 dark:text-slate-400">Loading analytics…</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#FAFAF9] dark:bg-slate-950">
        <NavBar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchData}
              className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const overviewCards = [
    { label: "Total Restaurants", value: overview?.totalRestaurants ?? 0, icon: "🍽️", color: "sky" },
    { label: "Newsletter Subscribers", value: overview?.totalSubscribers ?? 0, icon: "📬", color: "emerald" },
    { label: "Emails Sent", value: overview?.totalEmailsSent ?? 0, icon: "✉️", color: "amber" },
    { label: "Restaurant Reviews", value: overview?.totalReviews ?? 0, icon: "⭐", color: "violet" },
    { label: "Active Drips", value: overview?.activeDrips ?? 0, icon: "💧", color: "rose" },
  ];

  const colorClasses: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
    sky: { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-600 dark:text-sky-400", iconBg: "bg-sky-100 dark:bg-sky-900/50", border: "border-sky-100 dark:border-sky-900/30" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/50", border: "border-emerald-100 dark:border-emerald-900/30" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/50", border: "border-amber-100 dark:border-amber-900/30" },
    violet: { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/50", border: "border-violet-100 dark:border-violet-900/30" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/50", border: "border-rose-100 dark:border-rose-900/30" },
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAF9] text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-5xl px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-3xl">
              📊 Analytics
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Key metrics and activity overview for SafePlate.
            </p>
          </div>

          {/* Metric Cards */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {overviewCards.map((card) => {
              const c = colorClasses[card.color];
              return (
                <div
                  key={card.label}
                  className={`rounded-2xl border ${c.border} ${c.bg} p-5 shadow-sm transition-shadow hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBg} text-lg`}>
                      {card.icon}
                    </span>
                  </div>
                  <div className={`text-3xl font-bold ${c.text}`}>
                    {card.value.toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {card.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Cities */}
          <Section title="🌆 Top Cities">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">City</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tier 1</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tier 2</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tier 3</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">No city data yet.</td>
                    </tr>
                  ) : (
                    cities.map((city) => (
                      <tr
                        key={city.city}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{city.city}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">{city.total}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {city.tier1}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                            {city.tier2}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                            {city.tier3}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Recent Signups */}
          <Section title="📬 Recent Signups">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Allergens</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">No signups yet.</td>
                    </tr>
                  ) : (
                    signups.map((s) => (
                      <tr
                        key={s.email}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{s.email}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{formatDate(s.created_at)}</td>
                        <td className="py-3 px-4">
                          {s.selected_allergens && s.selected_allergens.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {s.selected_allergens.map((a) => (
                                <span key={a} className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                  {a}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Recent Emails */}
          <Section title="✉️ Recent Emails">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Restaurant</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recipient</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sent</th>
                    <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Opened</th>
                    <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">No emails sent yet.</td>
                    </tr>
                  ) : (
                    emails.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{e.restaurant_name}</span>
                          <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">({e.restaurant_city})</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{e.recipient_email}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{formatDateTime(e.sent_at)}</td>
                        <td className="py-3 px-4 text-center">
                          {e.opened_at ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                              ✅ {formatDate(e.opened_at)}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {e.clicked_at ? (
                            <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 text-xs font-medium">
                              🔗 {formatDate(e.clicked_at)}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Recent Reviews */}
          <Section title="⭐ Recent Reviews">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Restaurant</th>
                    <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rating</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reviewer</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">No reviews yet.</td>
                    </tr>
                  ) : (
                    reviews.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{r.restaurant_name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                            {"⭐".repeat(r.rating)} {r.rating}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.reviewer_name}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{formatDate(r.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                   */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="mb-4 text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
        {title}
      </h2>
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}
