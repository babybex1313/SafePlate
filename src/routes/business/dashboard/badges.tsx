import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { getCurrentUser, getClaimedRestaurantForOwner } from "~/db/auth";
import { getAudit } from "~/db/business";
import { getSessionToken, clearSession, clearCachedUser } from "~/session";
import { ThemeToggle } from "~/components/ThemeToggle";

export const Route = createFileRoute("/business/dashboard/badges")({
  head: () => ({
    meta: [{ title: "Safety Badges — SafePlate for Business" }],
  }),
  component: BadgesPage,
});

/* ── SVG Icons ────────────────────────────────────────────────────────────── */

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

/* ── NavBar ───────────────────────────────────────────────────────────────── */

function NavBar({ user }: { user: { name: string } | null }) {
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
          <a href="/business/dashboard" className="text-sm font-medium text-slate-600 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">← Dashboard</a>
          <ThemeToggle />
          {user && <button onClick={handleLogout} className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer">Log Out</button>}
        </div>
      </div>
    </header>
  );
}

/* ── Tier Helpers ─────────────────────────────────────────────────────────── */

function getTierStyles(tier: number) {
  switch (tier) {
    case 1: return { name: "Medical-Grade", emoji: "🟢", bgClass: "bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400", borderClass: "border-emerald-200 dark:border-emerald-800", lightBg: "bg-emerald-50 dark:bg-emerald-950/20", rgb: [16, 185, 129] };
    case 2: return { name: "Strong Protocols", emoji: "🟡", bgClass: "bg-amber-500", textClass: "text-amber-600 dark:text-amber-400", borderClass: "border-amber-200 dark:border-amber-800", lightBg: "bg-amber-50 dark:bg-amber-950/20", rgb: [245, 158, 11] };
    case 3: return { name: "Basic Listing", emoji: "🔵", bgClass: "bg-sky-500", textClass: "text-sky-600 dark:text-sky-400", borderClass: "border-sky-200 dark:border-sky-800", lightBg: "bg-sky-50 dark:bg-sky-950/20", rgb: [14, 165, 233] };
    default: return { name: "Not Rated", emoji: "⚪", bgClass: "bg-slate-500", textClass: "text-slate-600", borderClass: "border-slate-200", lightBg: "bg-slate-50", rgb: [100, 116, 139] };
  }
}

/* ── Generate SVG Badge ───────────────────────────────────────────────────── */

function generateBadgeSVG(tier: number, restaurantName: string, score: number): string {
  const styles = getTierStyles(tier);
  const [r, g, b] = styles.rgb;
  const color = `rgb(${r},${g},${b})`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.05" />
    </linearGradient>
  </defs>
  <rect width="400" height="240" rx="20" fill="white" stroke="${color}" stroke-width="3" />
  <rect width="400" height="240" rx="20" fill="url(#bg)" />
  <!-- Shield icon -->
  <g transform="translate(185, 35)">
    <path d="M15 4a2 2 0 012-2h2a2 2 0 012 2v4a6 6 0 01-12 0V4z" fill="none" stroke="${color}" stroke-width="2.5" />
    <path d="M9 14l3 3 6-6" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  </g>
  <!-- Text -->
  <text x="200" y="110" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="#64748b" font-weight="600">SafePlate Verified 2026</text>
  <text x="200" y="140" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" fill="${color}" font-weight="800">${styles.name}</text>
  <text x="200" y="168" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8">${escapeXml(restaurantName)} • ${score}/10 Points</text>
  <!-- Footer -->
  <line x1="40" y1="190" x2="360" y2="190" stroke="#e2e8f0" stroke-width="1" />
  <text x="200" y="215" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Verified kitchen protocols for allergen safety</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ── Badge Preview Card ───────────────────────────────────────────────────── */

function BadgePreview({ tier, restaurantName, score }: { tier: number; restaurantName: string; score: number }) {
  const styles = getTierStyles(tier);

  return (
    <div
      className={`mx-auto flex h-60 w-full max-w-md flex-col items-center justify-center rounded-2xl border-2 bg-white shadow-lg dark:bg-slate-900 ${styles.borderClass}`}
    >
      <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke={tier === 1 ? "#10b981" : tier === 2 ? "#f59e0b" : "#0ea5e9"} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-400">SafePlate Verified 2026</p>
      <p className={`mt-1 text-xl font-extrabold ${styles.textClass}`}>{styles.name}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{restaurantName} • {score}/10 Points</p>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Verified kitchen protocols for allergen safety</p>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */

function BadgesPage() {
  const [user, setUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [audit, setAudit] = useState<any>(null);
  const [claimedRestaurant, setClaimedRestaurant] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"svg">("svg");

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }
    getCurrentUser({ data: { token } }).then((u) => {
      if (!u || u.role !== "restaurant_owner") {
        window.location.href = "/login";
        return;
      }
      setUser(u as any);

      getAudit({ data: { userId: (u as any).id } }).then((a) => setAudit(a));
      getClaimedRestaurantForOwner({ data: { email: (u as any).email } }).then((r) => setClaimedRestaurant(r));

      setAuthLoading(false);
    });
  }, []);

  const handleDownloadSVG = () => {
    if (!audit) return;
    const restaurantName = claimedRestaurant?.restaurantName ?? "Your Restaurant";
    const svgContent = generateBadgeSVG(audit.tier, restaurantName, audit.safety_score);

    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safeplate-badge-tier-${audit.tier}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const embedCode = audit
    ? `<a href="https://safeplate.company" target="_blank" rel="noopener">
  <img src="https://safeplate.company/badges/tier-${audit.tier}.svg" alt="SafePlate Verified ${getTierStyles(audit.tier).name}" width="200" height="120" />
</a>`
    : "";

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = embedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
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

  const restaurantName = claimedRestaurant?.restaurantName ?? "Your Restaurant";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <NavBar user={user} />
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <a href="/business/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 mb-4">
            <IconArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Safety Badges
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Download your SafePlate Verified badge and display it on your website, menu, and social media.
          </p>
        </div>

        {!audit ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">No Badge Available Yet</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Complete your kitchen protocol audit to unlock your safety badge.
            </p>
            <a
              href="/business/dashboard/audit"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
            >
              Start Kitchen Audit
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Badge Preview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Badge Preview</h2>
              <BadgePreview
                tier={audit.tier}
                restaurantName={restaurantName}
                score={audit.safety_score}
              />
              <div className="mt-4 text-center">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold border ${getTierStyles(audit.tier).borderClass} ${getTierStyles(audit.tier).lightBg} ${getTierStyles(audit.tier).textClass}`}>
                  {getTierStyles(audit.tier).emoji} {getTierStyles(audit.tier).name} — {audit.safety_score}/10 Points
                </span>
              </div>
            </div>

            {/* Download & Embed */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* SVG Download */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Download SVG Badge</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Vector format — scales perfectly for websites, menus, and print.
                </p>
                <button
                  onClick={handleDownloadSVG}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 cursor-pointer"
                >
                  <IconDownload className="h-5 w-5" />
                  Download SVG
                </button>
              </div>

              {/* Embed Code */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Embed on Your Website</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Copy this HTML snippet and paste it on your restaurant&apos;s website.
                </p>
                <div className="relative">
                  <pre className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 overflow-x-auto dark:bg-slate-800 dark:text-slate-300">
                    {embedCode}
                  </pre>
                  <button
                    onClick={handleCopyEmbed}
                    className="absolute top-2 right-2 rounded-lg bg-white p-2 text-slate-500 shadow-sm transition-all hover:text-sky-600 active:scale-95 cursor-pointer dark:bg-slate-700 dark:text-slate-300 dark:hover:text-sky-400"
                    aria-label="Copy embed code"
                  >
                    {copied ? <IconCheck className="h-4 w-4 text-emerald-500" /> : <IconCopy className="h-4 w-4" />}
                  </button>
                </div>
                {copied && (
                  <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">Copied to clipboard!</p>
                )}
              </div>
            </div>

            {/* Usage Tips */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Where to Display Your Badge</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-sky-50 p-4 text-center dark:bg-sky-950/20">
                  <p className="text-2xl">🌐</p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">Your Website</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Homepage & menus</p>
                </div>
                <div className="rounded-xl bg-sky-50 p-4 text-center dark:bg-sky-950/20">
                  <p className="text-2xl">📱</p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">Social Media</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Instagram, Facebook</p>
                </div>
                <div className="rounded-xl bg-sky-50 p-4 text-center dark:bg-sky-950/20">
                  <p className="text-2xl">🪟</p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">Storefront</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Window decal or print</p>
                </div>
                <div className="rounded-xl bg-sky-50 p-4 text-center dark:bg-sky-950/20">
                  <p className="text-2xl">📋</p>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">Physical Menu</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Print on your menus</p>
                </div>
              </div>
            </div>

            {/* Retake Audit */}
            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Need to update your audit? Improved your protocols?
              </p>
              <a
                href="/business/dashboard/audit"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-500 hover:text-sky-600"
              >
                Retake Kitchen Audit →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
