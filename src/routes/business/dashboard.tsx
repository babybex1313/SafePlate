import { createFileRoute, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getCurrentUser, getClaimedRestaurantForOwner } from "~/db/auth";
import { getAudit } from "~/db/business";
import { getSessionToken, clearSession, clearCachedUser } from "~/session";
import { ThemeToggle } from "~/components/ThemeToggle";

export const Route = createFileRoute("/business/dashboard")({
  head: () => ({
    meta: [{ title: "Restaurant Dashboard — SafePlate for Business" }],
  }),
  component: BusinessDashboardPage,
});

/* ── SVG Icons ────────────────────────────────────────────────────────────── */

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function IconRestaurant({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function IconBadge({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function IconExclamation({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

/* ── Tier Helpers ─────────────────────────────────────────────────────────── */

function getTierStyles(tier: number) {
  switch (tier) {
    case 1: return { badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800", dot: "text-emerald-500", label: "Medical-Grade", emoji: "🟢", color: "emerald" };
    case 2: return { badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800", dot: "text-amber-500", label: "Strong Protocols", emoji: "🟡", color: "amber" };
    case 3: return { badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-400 dark:border-sky-800", dot: "text-sky-500", label: "Basic Listing", emoji: "🔵", color: "sky" };
    default: return { badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "text-slate-500", label: "Not Rated", emoji: "⚪", color: "slate" };
  }
}

/* ── NavBar ───────────────────────────────────────────────────────────────── */

function NavBar({ user }: { user: { name: string; role: string } | null }) {
  const handleLogout = () => {
    clearSession();
    clearCachedUser();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-lg">🍽️</span>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">SafePlate</span>
          <span className="ml-1 rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">BUSINESS</span>
        </a>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 dark:text-slate-400">{user?.name}</span>
          <ThemeToggle />
          <button onClick={handleLogout} className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer">Log Out</button>
        </div>
      </div>
    </header>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */

function Sidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: <IconHome className="h-5 w-5" /> },
    { id: "audit", label: "Kitchen Audit", icon: <IconClipboard className="h-5 w-5" /> },
    { id: "listing", label: "Our Listing", icon: <IconRestaurant className="h-5 w-5" /> },
    { id: "badges", label: "Safety Badges", icon: <IconBadge className="h-5 w-5" /> },
    { id: "analytics", label: "Analytics", icon: <IconChart className="h-5 w-5" />, premium: true },
    { id: "settings", label: "Settings", icon: <IconSettings className="h-5 w-5" /> },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <nav className="p-4 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {tab.icon}
            <span className="flex-1 text-left">{tab.label}</span>
            {tab.premium && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">PRO</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}

/* ── Overview Tab ─────────────────────────────────────────────────────────── */

function OverviewTab({ audit, claimedRestaurant, user }: { audit: any; claimedRestaurant: any; user: any }) {
  const tier = audit?.tier ?? 0;
  const tierStyle = getTierStyles(tier);
  const score = audit?.safety_score ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome back, {user?.name?.split(" ")[0] ?? "Owner"}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here&apos;s your restaurant dashboard overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Audit Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Kitchen Audit</p>
          {audit ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{score}/10</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${tierStyle.badge}`}>
                  {tierStyle.emoji} {tierStyle.label}
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-2 rounded-full transition-all ${
                    tier === 1 ? "bg-emerald-500" : tier === 2 ? "bg-amber-500" : "bg-sky-500"
                  }`}
                  style={{ width: `${(score / 10) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Last updated: {new Date(audit.updated_at).toLocaleDateString()}
              </p>
            </>
          ) : (
            <div className="mt-2">
              <p className="text-lg font-bold text-slate-400 dark:text-slate-500">Not Started</p>
              <a href="/business/dashboard/audit" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-500 hover:text-sky-600">
                Start Audit <IconChevronRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Listing Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Listing Status</p>
          {claimedRestaurant ? (
            <div className="mt-2">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{claimedRestaurant.restaurantName}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                ✅ Claimed
              </span>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-lg font-bold text-slate-400 dark:text-slate-500">No Listing</p>
              <a href="/claim" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-500 hover:text-sky-600">
                Claim Your Listing <IconChevronRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Badge */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Safety Badge</p>
          {audit ? (
            <div className="mt-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold border ${tierStyle.badge}`}>
                {tierStyle.emoji} {tierStyle.label}
              </span>
              <div className="mt-3">
                <a href="/business/dashboard/badges" className="text-sm font-medium text-sky-500 hover:text-sky-600">
                  Download Badge →
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-slate-400 dark:text-slate-500">Complete your audit to unlock your badge.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Activity</h2>
        <div className="mt-4 space-y-3">
          {audit ? (
            <div className="flex items-start gap-3 rounded-xl bg-sky-50 p-3 dark:bg-sky-950/20">
              <IconClipboard className="mt-0.5 h-5 w-5 text-sky-500" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Kitchen audit completed — {tierStyle.label} ({score}/10)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(audit.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <IconExclamation className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Complete your kitchen audit to get started
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your first step toward verification</p>
              </div>
            </div>
          )}
          {claimedRestaurant && (
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/20">
              <IconRestaurant className="mt-0.5 h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Listing claimed: {claimedRestaurant.restaurantName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">You can now manage this listing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Placeholder Tabs ─────────────────────────────────────────────────────── */

function PlaceholderTab({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">{title}</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Coming soon. We&apos;re building this feature now.</p>
    </div>
  );
}

/* ── Main Dashboard Component ─────────────────────────────────────────────── */

function BusinessDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [audit, setAudit] = useState<any>(null);
  const [claimedRestaurant, setClaimedRestaurant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Sync activeTab with current URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/business/dashboard/audit")) {
      setActiveTab("audit");
    } else if (path.includes("/business/dashboard/badges")) {
      setActiveTab("badges");
    } else if (path === "/business/dashboard" || path === "/business/dashboard/") {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }
    getCurrentUser({ data: { token } }).then((u) => {
      if (!u || u.role !== "restaurant_owner") {
        // Not a restaurant owner — redirect to login
        window.location.href = "/login";
        return;
      }
      setUser(u as any);

      // Load audit
      getAudit({ data: { userId: (u as any).id } }).then((a) => {
        setAudit(a);
      });

      // Load claimed restaurant
      getClaimedRestaurantForOwner({ data: { email: (u as any).email } }).then((r) => {
        setClaimedRestaurant(r);
      });

      setAuthLoading(false);
    });
  }, []);

  // Handle tab routing overrides
  const handleTabChange = (tab: string) => {
    if (tab === "audit") {
      navigate({ to: "/business/dashboard/audit" });
      return;
    }
    if (tab === "badges") {
      navigate({ to: "/business/dashboard/badges" });
      return;
    }
    // For overview, listing, analytics, settings — navigate back to base dashboard
    navigate({ to: "/business/dashboard" });
    setActiveTab(tab);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <IconSpinner className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Access Restricted</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Please log in as a restaurant owner.</p>
          <a href="/login" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white">Log In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <NavBar user={user} />
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="flex-1 p-6 lg:p-8">
          {activeTab === "overview" && (
            <OverviewTab audit={audit} claimedRestaurant={claimedRestaurant} user={user} />
          )}
          {activeTab === "listing" && (
            <PlaceholderTab title="Our Listing" icon={<IconRestaurant className="h-8 w-8" />} />
          )}
          {activeTab === "analytics" && (
            <PlaceholderTab title="Analytics (Premium)" icon={<IconChart className="h-8 w-8" />} />
          )}
          {activeTab === "settings" && (
            <PlaceholderTab title="Settings" icon={<IconSettings className="h-8 w-8" />} />
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
