import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { submitReview, type ReviewData } from "~/db/reviews";
import { submitDinerReview, checkVerifiedDiner, type DinerReviewData } from "~/db/reviews";
import { searchRestaurantByName } from "~/db/restaurants";
import { ThemeToggle } from "~/components/ThemeToggle";
import { getCurrentUser } from "~/db/auth";
import { getSessionToken, setCachedUser } from "~/session";

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/write-review")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SafePlate — Write a Review" },
      {
        name: "description",
        content:
          "Leave a diner review or detailed safety review for allergy-safe restaurants. Help the allergen community dine confidently.",
      },
    ],
  }),
  component: WriteReviewPage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
/* ------------------------------------------------------------------ */

function IconStar({ className, filled }: { className?: string; filled: boolean }) {
  return (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

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

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function IconVerifiedBadge({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80">
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
          <a href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Home</a>
          <a href="/search" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Search</a>
          <a href="/profile" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Profile</a>
          <a href="/about" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">About</a>
          <a href="/faq" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">FAQ</a>
          <ThemeToggle />
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
    <footer className="border-t border-slate-100 bg-[#FAFAF9] py-10 dark:border-slate-700 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-base">🍽️</span>
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100">SafePlate</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/claim" className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Claim Your Listing</a>
          <a href="/blog/safest-celiac-restaurants-2026" className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Blog</a>
          <a href="/legal" className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Safety Disclaimer</a>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} SafePlate. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Steps enum (for safety review)                                    */
/* ------------------------------------------------------------------ */

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: "Safety Score",
  2: "Protocol Verification",
  3: "Your Experience",
  4: "Wellness Outcome",
};

/* ------------------------------------------------------------------ */
/*  Time ago helper                                                   */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

type Mode = "diner" | "safety";

function WriteReviewPage() {
  // Restaurant from URL params
  const [restaurantId, setRestaurantId] = useState<number>(0);
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("restaurant_id") ?? "0", 10);
    const name = params.get("restaurant_name") ?? "";
    setRestaurantId(id);
    setRestaurantName(name);

    // Pre-fill user info from auth
    const token = getSessionToken();
    if (token) {
      getCurrentUser({ data: { token } }).then((u) => {
        if (u) {
          setCachedUser(u);
          setDinerName(u.name);
          setDinerEmail(u.email);
        }
      });
    }
  }, []);

  // Mode toggle
  const [mode, setMode] = useState<Mode>("diner");

  // ── Diner review state ──
  const [dinerRating, setDinerRating] = useState(0);
  const [dinerHover, setDinerHover] = useState(0);
  const [dinerText, setDinerText] = useState("");
  const [dinerName, setDinerName] = useState("");
  const [dinerEmail, setDinerEmail] = useState("");
  const [dinerSubmitting, setDinerSubmitting] = useState(false);
  const [dinerDone, setDinerDone] = useState(false);
  const [dinerError, setDinerError] = useState("");

  // ── Restaurant search state (when no restaurant pre-selected) ──
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; name: string; city: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<{ id: number; name: string; city: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Verified diner check ──
  const [emailVerified, setEmailVerified] = useState(false);
  const emailCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await searchRestaurantByName({ data: { query: q.trim() } });
      setSearchResults(results as { id: number; name: string; city: string }[]);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, handleSearch]);

  // Check verified diner when email changes
  useEffect(() => {
    if (emailCheckRef.current) clearTimeout(emailCheckRef.current);
    if (!dinerEmail.trim() || !dinerEmail.includes("@")) { setEmailVerified(false); return; }
    emailCheckRef.current = setTimeout(async () => {
      try {
        const result = await checkVerifiedDiner({ data: { email: dinerEmail.trim() } });
        setEmailVerified(result.verified);
      } catch {
        setEmailVerified(false);
      }
    }, 500);
    return () => { if (emailCheckRef.current) clearTimeout(emailCheckRef.current); };
  }, [dinerEmail]);

  // Pick a restaurant from search results
  const pickRestaurant = (r: { id: number; name: string; city: string }) => {
    setSelectedRestaurant(r);
    setRestaurantId(r.id);
    setRestaurantName(r.name);
    setSearchQuery("");
    setSearchResults([]);
  };

  const effectiveId = restaurantId || selectedRestaurant?.id || 0;
  const effectiveName = restaurantName || selectedRestaurant?.name || "";

  // ── Submit diner review ──
  const handleDinerSubmit = async () => {
    if (!dinerName.trim()) { setDinerError("Please enter your name."); return; }
    if (dinerRating < 1) { setDinerError("Please select a star rating."); return; }
    if (!effectiveId) { setDinerError("Please select a restaurant."); return; }

    setDinerSubmitting(true);
    setDinerError("");

    const data: DinerReviewData = {
      restaurant_id: effectiveId,
      rating: dinerRating,
      review_text: dinerText,
      reviewer_name: dinerName.trim(),
      reviewer_email: dinerEmail.trim() || undefined,
    };

    try {
      const result = await submitDinerReview({ data });
      if (result.success) {
        setDinerDone(true);
      } else {
        setDinerError(result.error ?? "Failed to submit review.");
      }
    } catch {
      setDinerError("Something went wrong. Please try again.");
    } finally {
      setDinerSubmitting(false);
    }
  };

  // Show diner success
  if (dinerDone && mode === "diner") {
    return (
      <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
        <NavBar />
        <main className="flex flex-1 items-center justify-center py-20">
          <div className="text-center px-6 max-w-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
              <IconShield className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Thanks for your review!</h2>
            <p className="mt-3 text-slate-600 leading-relaxed dark:text-slate-400">
              It helps the allergen community eat safely.
            </p>
            <div className="mt-8 flex gap-4 justify-center">
              <a href="/search" className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 transition-all">
                Back to Search
              </a>
              <button
                type="button"
                onClick={() => { setDinerDone(false); setDinerRating(0); setDinerText(""); setDinerName(""); setDinerEmail(""); }}
                className="rounded-xl border-2 border-sky-500 px-6 py-3 text-sm font-semibold text-sky-600 hover:bg-sky-50 transition-all dark:hover:bg-sky-950 cursor-pointer"
              >
                Write Another
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Safety review state (existing) ──
  const [step, setStep] = useState<Step>(1);
  const [safetyEmail, setSafetyEmail] = useState("");
  const [safetyRating, setSafetyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [protocolGloves, setProtocolGloves] = useState(false);
  const [protocolDedicatedFryer, setProtocolDedicatedFryer] = useState(false);
  const [protocolAllergenMenu, setProtocolAllergenMenu] = useState(false);
  const [protocolManagerVerified, setProtocolManagerVerified] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [wellnessSafe, setWellnessSafe] = useState<boolean | null>(null);
  const [safetySubmitting, setSafetySubmitting] = useState(false);
  const [safetyDone, setSafetyDone] = useState(false);
  const [safetyError, setSafetyError] = useState("");

  const handleSafetySubmit = async () => {
    if (!safetyEmail.trim() || !effectiveId || safetyRating < 1) {
      setSafetyError("Please complete all required fields.");
      return;
    }
    setSafetySubmitting(true);
    setSafetyError("");

    const data: ReviewData = {
      restaurant_id: effectiveId,
      user_email: safetyEmail.trim().toLowerCase(),
      safety_rating: safetyRating,
      protocol_gloves: protocolGloves,
      protocol_dedicated_fryer: protocolDedicatedFryer,
      protocol_allergen_menu: protocolAllergenMenu,
      protocol_manager_verified: protocolManagerVerified,
      review_text: reviewText,
      wellness_safe: wellnessSafe ?? false,
    };

    try {
      const result = await submitReview({ data });
      if (result.success) {
        setSafetyDone(true);
      } else {
        setSafetyError(result.error ?? "Failed to submit review.");
      }
    } catch {
      setSafetyError("Something went wrong. Please try again.");
    } finally {
      setSafetySubmitting(false);
    }
  };

  const canGoNext = () => {
    switch (step) {
      case 1: return safetyRating > 0;
      case 2: return true;
      case 3: return true;
      case 4: return wellnessSafe !== null;
    }
  };

  // Safety review success
  if (safetyDone && mode === "safety") {
    return (
      <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
        <NavBar />
        <main className="flex flex-1 items-center justify-center py-20">
          <div className="text-center px-6 max-w-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
              <IconShield className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Thank you!</h2>
            <p className="mt-3 text-slate-600 leading-relaxed dark:text-slate-400">
              Your safety review for <strong>{effectiveName}</strong> has been
              submitted. You're helping the allergen community dine with confidence.
            </p>
            <div className="mt-8 flex gap-4 justify-center">
              <a href="/search" className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 transition-all">
                Back to Search
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main>
        {/* Header */}
        <section className="bg-[#FAFAF9] pt-12 pb-8 md:pt-16 md:pb-10 dark:bg-slate-950">
          <div className="mx-auto max-w-2xl px-6">
            <a href="/search" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-sky-600 transition-colors mb-4 dark:text-slate-400 dark:hover:text-sky-400">
              <IconArrowLeft className="h-4 w-4" />
              Back to search
            </a>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl dark:text-slate-100">
              {effectiveName ? `Review: ${effectiveName}` : "Write a Review"}
            </h1>

            {/* Mode toggle */}
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("diner")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
                  mode === "diner"
                    ? "bg-sky-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                ⭐ Quick Review
              </button>
              <button
                type="button"
                onClick={() => setMode("safety")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all cursor-pointer ${
                  mode === "safety"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                🛡️ Safety Review
              </button>
            </div>
          </div>
        </section>

        {/* ── DINER REVIEW MODE ── */}
        {mode === "diner" && (
          <section className="bg-white py-8 md:py-12 dark:bg-slate-900">
            <div className="mx-auto max-w-2xl px-6">
              {/* Restaurant search (if no pre-selected restaurant) */}
              {!effectiveId && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-slate-800 mb-2 dark:text-slate-100">Find Restaurant</h2>
                  <p className="text-slate-600 mb-4 dark:text-slate-400">Search for the restaurant you want to review.</p>
                  <div className="relative">
                    <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search restaurants by name..."
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>
                  {searching && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <IconSpinner className="h-4 w-4 animate-spin" />
                      Searching…
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-lg divide-y divide-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:divide-slate-700 max-h-64 overflow-y-auto">
                      {searchResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => pickRestaurant(r)}
                          className="w-full text-left px-4 py-3 hover:bg-sky-50 transition-colors cursor-pointer dark:hover:bg-sky-950"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-100">{r.name}</span>
                          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{r.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Show selected restaurant */}
              {effectiveId > 0 && (
                <div className="mb-8 rounded-xl border-2 border-sky-100 bg-sky-50/50 p-4 dark:border-sky-900 dark:bg-sky-950/30">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Reviewing</p>
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{effectiveName}</p>
                  {!restaurantId && (
                    <button
                      type="button"
                      onClick={() => { setSelectedRestaurant(null); setRestaurantId(0); setRestaurantName(""); }}
                      className="mt-1 text-sm text-sky-600 hover:underline cursor-pointer dark:text-sky-400"
                    >
                      Change restaurant
                    </button>
                  )}
                </div>
              )}

              {/* Star rating */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-3 dark:text-slate-100">
                  Your Rating <span className="text-red-400">*</span>
                </h2>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDinerRating(n)}
                      onMouseEnter={() => setDinerHover(n)}
                      onMouseLeave={() => setDinerHover(0)}
                      className="transition-all cursor-pointer text-3xl select-none"
                      aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                    >
                      <span className={(dinerHover || dinerRating) >= n ? "grayscale-0 scale-110 inline-block" : "grayscale opacity-30 inline-block"}>
                        ⭐
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-1 flex justify-between max-w-[280px]">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Not great</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Excellent!</span>
                </div>
              </div>

              {/* Review text */}
              <div className="mb-6">
                <label htmlFor="diner-text" className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                  Your Review <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="diner-text"
                  value={dinerText}
                  onChange={(e) => setDinerText(e.target.value)}
                  placeholder="e.g. Amazing gluten-free options! Dedicated fryer is legit. The staff was super knowledgeable..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Name + Email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="diner-name" className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="diner-name"
                    type="text"
                    value={dinerName}
                    onChange={(e) => setDinerName(e.target.value)}
                    placeholder="Jane D."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="diner-email" className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                    Your Email <span className="text-slate-400 font-normal">(optional)</span>
                    {emailVerified && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800">
                        <IconVerifiedBadge className="h-3 w-3" />
                        Verified Diner
                      </span>
                    )}
                  </label>
                  <input
                    id="diner-email"
                    type="email"
                    value={dinerEmail}
                    onChange={(e) => setDinerEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Submit */}
              {dinerError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                  {dinerError}
                </div>
              )}

              <button
                type="button"
                onClick={handleDinerSubmit}
                disabled={dinerSubmitting || !effectiveId}
                className="w-full rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {dinerSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <IconSpinner className="h-4 w-4 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </section>
        )}

        {/* ── SAFETY REVIEW MODE ── */}
        {mode === "safety" && (
          <>
            {/* Step progress */}
            <section className="bg-[#FAFAF9] pt-6 pb-6 md:pt-8 md:pb-8 dark:bg-slate-950">
              <div className="mx-auto max-w-2xl px-6">
                {!effectiveId && (
                  <div className="text-center mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Please search and select a restaurant above first, or{" "}
                      <a href="/search" className="font-semibold underline">go to search</a> to find one.
                    </p>
                  </div>
                )}

                {effectiveId > 0 && (
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {([1, 2, 3, 4] as Step[]).map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => s < step ? setStep(s) : undefined}
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                            s < step
                              ? "bg-emerald-500 text-white cursor-pointer"
                              : s === step
                                ? "bg-sky-500 text-white"
                                : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                          }`}
                        >
                          {s < step ? <IconCheck className="h-4 w-4" /> : s}
                        </button>
                        <span className={`text-xs font-medium hidden sm:inline ${
                          s === step ? "text-sky-600 dark:text-sky-400" : s < step ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                        }`}>
                          {STEP_LABELS[s]}
                        </span>
                        {s < 4 && <div className="h-0.5 w-6 rounded bg-slate-200 dark:bg-slate-600" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {effectiveId > 0 && (
              <section className="bg-white py-8 md:py-12 dark:bg-slate-900">
                <div className="mx-auto max-w-2xl px-6">
                  {/* Step 1: Safety rating */}
                  {step === 1 && (
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 mb-2 dark:text-slate-100">
                        Cross-Contamination Score
                      </h2>
                      <p className="text-slate-600 mb-6 dark:text-slate-400">
                        Rate the kitchen's safety transparency and cross-contamination
                        handling — <strong>not taste</strong>. How safe did the kitchen feel?
                      </p>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setSafetyRating(n)}
                            onMouseEnter={() => setHoverRating(n)}
                            onMouseLeave={() => setHoverRating(0)}
                            className={`transition-all cursor-pointer ${
                              (hoverRating || safetyRating) >= n
                                ? "text-amber-400 scale-110"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          >
                            <IconStar className="h-10 w-10" filled={(hoverRating || safetyRating) >= n} />
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-between max-w-[320px]">
                        <span className="text-xs text-slate-400 dark:text-slate-500">Risky kitchen</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">100% safe</span>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Protocol verification */}
                  {step === 2 && (
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 mb-2 dark:text-slate-100">Protocol Verification</h2>
                      <p className="text-slate-600 mb-6 dark:text-slate-400">Check each protocol the kitchen followed during your visit.</p>
                      <div className="space-y-3">
                        {[
                          { key: "gloves", value: protocolGloves, set: setProtocolGloves, label: "Server changed gloves", icon: "🧤" },
                          { key: "fryer", value: protocolDedicatedFryer, set: setProtocolDedicatedFryer, label: "Dedicated fryer used", icon: "🍟" },
                          { key: "menu", value: protocolAllergenMenu, set: setProtocolAllergenMenu, label: "Allergen menu provided", icon: "📋" },
                          { key: "manager", value: protocolManagerVerified, set: setProtocolManagerVerified, label: "Manager verified ingredients", icon: "👨‍🍳" },
                        ].map((proto) => (
                          <label
                            key={proto.key}
                            className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                              proto.value
                                ? "border-emerald-200 bg-emerald-50/50 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/20"
                                : "border-slate-100 bg-white hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                            }`}
                          >
                            <input type="checkbox" checked={proto.value} onChange={(e) => proto.set(e.target.checked)} className="sr-only" />
                            <button
                              type="button"
                              onClick={() => proto.set(!proto.value)}
                              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all cursor-pointer ${
                                proto.value ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white dark:border-slate-500 dark:bg-slate-700"
                              }`}
                            >
                              {proto.value && <IconCheck className="h-4 w-4" />}
                            </button>
                            <span className="text-lg mr-1">{proto.icon}</span>
                            <span className="text-base font-medium text-slate-700 dark:text-slate-200">{proto.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Validation text */}
                  {step === 3 && (
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 mb-2 dark:text-slate-100">SafePlate Validation</h2>
                      <p className="text-slate-600 mb-6 dark:text-slate-400">
                        What did you order and how did the kitchen handle your dietary needs?
                      </p>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="e.g. I ordered the grilled chicken with steamed vegetables. The server confirmed it was gluten-free..."
                        rows={6}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </div>
                  )}

                  {/* Step 4: Wellness outcome */}
                  {step === 4 && (
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 mb-2 dark:text-slate-100">Wellness Outcome</h2>
                      <p className="text-slate-600 mb-6 dark:text-slate-400">After your meal, did you feel safe?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setWellnessSafe(true)}
                          className={`rounded-2xl border-2 p-6 text-center transition-all cursor-pointer ${
                            wellnessSafe === true
                              ? "border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-700 dark:bg-emerald-950/30"
                              : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-800"
                          }`}
                        >
                          <span className="text-3xl">✅</span>
                          <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">I felt safe</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No reaction, kitchen handled it well</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWellnessSafe(false)}
                          className={`rounded-2xl border-2 p-6 text-center transition-all cursor-pointer ${
                            wellnessSafe === false
                              ? "border-red-300 bg-red-50 shadow-sm dark:border-red-800 dark:bg-red-950/30"
                              : "border-slate-100 bg-white hover:border-red-200 hover:bg-red-50/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-red-800"
                          }`}
                        >
                          <span className="text-3xl">⚠️</span>
                          <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">I did not feel safe</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Had a reaction or felt at risk</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700">
                    {step > 1 ? (
                      <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className="text-sm font-medium text-slate-500 hover:text-sky-600 transition-colors cursor-pointer dark:text-slate-400 dark:hover:text-sky-400">
                        ← Back
                      </button>
                    ) : <div />}

                    {step < 4 ? (
                      <button type="button" onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canGoNext()}
                        className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                        Next step
                      </button>
                    ) : (
                      <button type="button" onClick={handleSafetySubmit} disabled={safetySubmitting || !canGoNext()}
                        className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                        {safetySubmitting ? (
                          <span className="flex items-center gap-2"><IconSpinner className="h-4 w-4 animate-spin" />Submitting…</span>
                        ) : "Submit Review"}
                      </button>
                    )}
                  </div>

                  {/* Email field (always visible in safety mode) */}
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                    <label htmlFor="review-email" className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                      Your Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="review-email"
                      type="email"
                      value={safetyEmail}
                      onChange={(e) => setSafetyEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                      required
                    />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Links your review to your health profile badge.</p>
                  </div>

                  {safetyError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                      {safetyError}
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
