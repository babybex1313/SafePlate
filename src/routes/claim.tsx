import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import {
  searchRestaurantByName,
  claimRestaurant,
} from "~/db/restaurants";
import { getCurrentUser } from "~/db/auth";
import { getSessionToken, setCachedUser } from "~/session";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface SearchResult {
  id: number;
  name: string;
  city: string;
}

/* ------------------------------------------------------------------ */
/*  SVG Icons                                                         */
/* ------------------------------------------------------------------ */

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

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function IconChevronLeft({ className }: { className?: string }) {
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
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </svg>
  );
}

function IconRestaurant({ className }: { className?: string }) {
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
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/80">
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
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Home
          </a>
          <a
            href="/search"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Search
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
    <footer className="border-t border-slate-100 bg-[#FAFAF9] py-10 dark:border-slate-700 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-base">
            🍽️
          </span>
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
            SafePlate
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/claim"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Claim Your Listing
          </a>
          <a
            href="/blog/safest-celiac-restaurants-2026"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Blog
          </a>
          <a
            href="/legal"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Safety Disclaimer
          </a>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} SafePlate. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Steps                                                    */
/* ------------------------------------------------------------------ */

function ProgressSteps({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Find your restaurant" },
    { num: 2, label: "Verify ownership" },
    { num: 3, label: "Confirmation" },
  ];

  return (
    <div className="mb-10">
      <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        Step {currentStep} of 3
      </p>
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                currentStep > step.num
                  ? "bg-sky-500 text-white"
                  : currentStep === step.num
                    ? "bg-sky-500 text-white ring-4 ring-sky-500/20"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {currentStep > step.num ? "✓" : step.num}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 rounded-full transition-colors ${
                  currentStep > step.num
                    ? "bg-sky-500"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
        {steps[currentStep - 1].label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Find Your Restaurant                                       */
/* ------------------------------------------------------------------ */

function Step1Find({
  onSelect,
}: {
  onSelect: (restaurant: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchRestaurantByName({
        data: { query: trimmed },
      });
      setResults(data as SearchResult[]);
    } catch {
      setError("Failed to search. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">
        Claim Your Listing
      </h2>
      <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
        Search for your restaurant to get started.
      </p>

      {/* Search bar */}
      <div className="relative max-w-xl mx-auto mb-8">
        <IconSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Search for your restaurant..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          autoFocus
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || query.trim().length < 2}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <IconSpinner className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </button>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-10">
          <IconSpinner className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 max-w-xl mx-auto dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm max-w-xl mx-auto dark:border-slate-700 dark:bg-slate-900">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            No restaurants found
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try a different search term. If your restaurant isn&apos;t listed,
            you can{" "}
            <a href="/list-your-venue" className="text-sky-500 hover:text-sky-600 underline">
              add it here
            </a>
            .
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="max-w-xl mx-auto space-y-2">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-sky-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-600 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {r.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {r.city}
                  </p>
                </div>
                <span className="text-sky-500 text-sm font-medium">
                  Select &rarr;
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No search yet */}
      {!searched && !loading && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center max-w-xl mx-auto dark:border-slate-700 dark:bg-slate-800/50">
          <IconRestaurant className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Type your restaurant name above and click Search.
          </p>
        </div>
      )}

      {/* Don't see your restaurant? */}
      <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-6">
        Don&apos;t see your restaurant?{" "}
        <a
          href="/list-your-venue"
          className="font-medium text-sky-500 hover:text-sky-600 underline"
        >
          Add it to SafePlate
        </a>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Verify Ownership                                          */
/* ------------------------------------------------------------------ */

function Step2Verify({
  restaurant,
  loggedInUser,
  onBack,
  onComplete,
}: {
  restaurant: SearchResult;
  loggedInUser: { id: number; name: string; email: string; role: string } | null;
  onBack: () => void;
  onComplete: (autoApproved: boolean, restaurantId: number, email: string) => void;
}) {
  const [yourName, setYourName] = useState(loggedInUser?.name ?? "");
  const [yourEmail, setYourEmail] = useState(loggedInUser?.email ?? "");
  const [yourRole, setYourRole] = useState("Owner");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yourEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(yourEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!yourName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await claimRestaurant({
        data: {
          restaurantId: restaurant.id,
          name: yourName.trim(),
          email: yourEmail.trim(),
          role: yourRole,
        },
      });

      if (result.success) {
        onComplete(
          result.autoApproved,
          result.restaurantId,
          yourEmail.trim(),
        );
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">
        Verify Ownership
      </h2>
      <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
        Confirm you&apos;re authorized to manage this listing.
      </p>

      {/* Selected restaurant display */}
      <div className="max-w-lg mx-auto mb-6 rounded-xl border border-sky-200 bg-sky-50/50 p-4 dark:border-sky-800 dark:bg-sky-950/20">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {restaurant.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {restaurant.city}
        </p>
      </div>

      {/* Info box about domain matching */}
      <div className="max-w-lg mx-auto mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-900/20">
        <p className="text-sm text-sky-700 dark:text-sky-400 leading-relaxed">
          💡 We&apos;ll verify your ownership by matching your email domain with
          your restaurant&apos;s website. If they match, your claim is
          auto-approved.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-lg mx-auto mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Your Name
          </label>
          <input
            type="text"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            placeholder="Jane Smith"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Your Email
          </label>
          <input
            type="email"
            value={yourEmail}
            onChange={(e) => setYourEmail(e.target.value)}
            placeholder="jane@restaurant.com"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Your Role
          </label>
          <select
            value={yourRole}
            onChange={(e) => setYourRole(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <option value="Owner">Owner</option>
            <option value="Manager">Manager</option>
            <option value="Chef">Chef</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <IconSpinner className="h-4 w-4 animate-spin" />
                Submitting…
              </span>
            ) : (
              "Claim My Listing"
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: Confirmation                                              */
/* ------------------------------------------------------------------ */

function Step3Confirmation({
  autoApproved,
  restaurantId,
  email,
}: {
  autoApproved: boolean;
  restaurantId: number;
  email: string;
}) {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center mb-8">
        {autoApproved ? "Claim Approved!" : "Claim Submitted"}
      </h2>

      {autoApproved ? (
        /* Auto-approved */
        <div className="max-w-lg mx-auto rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
            Your claim has been approved!
          </h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-6 leading-relaxed">
            We verified your ownership via email domain matching. Your listing is
            now verified on SafePlate.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: `/dashboard?id=${restaurantId}` })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95 cursor-pointer"
          >
            Go to Your Dashboard &rarr;
          </button>
          <p className="mt-4 text-xs text-emerald-500 dark:text-emerald-500">
            Update your protocols, add photos, and manage your listing from your
            dashboard.
          </p>
        </div>
      ) : (
        /* Manual review needed */
        <div className="max-w-lg mx-auto rounded-2xl border border-sky-200 bg-sky-50 p-8 text-center shadow-sm dark:border-sky-800 dark:bg-sky-900/20">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-sky-700 dark:text-sky-400 mb-2">
            Your claim has been submitted for review.
          </h3>
          <p className="text-sm text-sky-600 dark:text-sky-400 mb-4 leading-relaxed">
            We&apos;ll verify your ownership and get back to you within 2
            business days.
          </p>
          <p className="text-sm font-medium text-sky-700 dark:text-sky-400">
            You&apos;ll receive a confirmation at{" "}
            <span className="font-semibold">{email}</span>.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-sky-600 shadow-sm transition-all hover:bg-sky-50 active:scale-95 dark:border-sky-700 dark:bg-slate-800 dark:text-sky-400 dark:hover:bg-slate-700 cursor-pointer"
            >
              Back to SafePlate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

function ClaimPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<SearchResult | null>(null);
  const [result, setResult] = useState<{
    autoApproved: boolean;
    restaurantId: number;
    email: string;
  } | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    getCurrentUser({ data: { token } }).then((u) => {
      if (u) {
        setCachedUser(u);
        setLoggedInUser(u as any);
      }
    });
  }, []);

  // Check for from= query param for messaging
  const fromParam = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("from")
    : null;

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-slate-950">
      <NavBar />

      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* Card container */}
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Show message if coming from login/signup */}
          {fromParam === "login" && loggedInUser && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              Claim your restaurant to access your dashboard.
            </div>
          )}

          <ProgressSteps currentStep={step} />

          {step === 1 && (
            <Step1Find
              onSelect={(restaurant) => {
                setSelectedRestaurant(restaurant);
                setStep(2);
              }}
            />
          )}

          {step === 2 && selectedRestaurant && (
            <Step2Verify
              restaurant={selectedRestaurant}
              loggedInUser={loggedInUser}
              onBack={() => {
                setStep(1);
                setSelectedRestaurant(null);
              }}
              onComplete={(autoApproved, restaurantId, email) => {
                setResult({ autoApproved, restaurantId, email });
                setStep(3);
              }}
            />
          )}

          {step === 3 && result && (
            <Step3Confirmation
              autoApproved={result.autoApproved}
              restaurantId={result.restaurantId}
              email={result.email}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Route export                                                      */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/claim")({
  head: () => ({
    meta: [{ title: "SafePlate — Claim Your Listing" }],
  }),
  component: ClaimPage,
});
