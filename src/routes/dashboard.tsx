import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { adminGetRestaurant, submitRestaurantUpdate } from "~/db/restaurants";
import { ThemeToggle } from "~/components/ThemeToggle";
import { getCurrentUser, getClaimedRestaurantForOwner } from "~/db/auth";
import { getSessionToken, clearSession, clearCachedUser } from "~/session";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Restaurant {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  cuisine_type: string | null;
  safety_tier: number;
  has_dedicated_fryer: boolean;
  has_isolated_prep: boolean;
  allergen_trained_staff: boolean;
  free_from: string[];
  allergens_handled: string[];
  description: string | null;
  website: string | null;
  phone: string | null;
  image_url: string | null;
  verified: boolean;
  featured_until: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Tier helpers                                                      */
/* ------------------------------------------------------------------ */

function getTierStyles(tier: number) {
  switch (tier) {
    case 1:
      return {
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800",
        dot: "text-emerald-500",
        label: "Medical-Grade",
        emoji: "🟢",
      };
    case 2:
      return {
        badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800",
        dot: "text-amber-500",
        label: "Strong Protocols",
        emoji: "🟡",
      };
    case 3:
      return {
        badge: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-400 dark:border-sky-800",
        dot: "text-sky-500",
        label: "Basic Listing",
        emoji: "🔵",
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
        dot: "text-slate-500",
        label: "Unknown",
        emoji: "⚪",
      };
  }
}

/* ------------------------------------------------------------------ */
/*  SVG Icons                                                         */
/* ------------------------------------------------------------------ */

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconDash({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar({ user }: { user: { role: string } | null }) {
  const handleLogout = () => {
    clearSession();
    clearCachedUser();
    window.location.href = "/";
  };

  const isAdmin = user?.role === "admin";
  const isOwner = user?.role === "restaurant_owner";

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
          <a href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">
            Home
          </a>
          <a href="/search" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">
            Search
          </a>
          {isAdmin && (
            <a href="/admin/restaurants" className="text-sm font-medium text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400">
              Admin
            </a>
          )}
          {isOwner && (
            <a href="/dashboard" className="text-sm font-semibold text-sky-600 dark:text-sky-400">
              Dashboard
            </a>
          )}
          <a href="/profile" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">
            Profile
          </a>
          <ThemeToggle />
          {user ? (
            <button type="button" onClick={handleLogout} className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer">
              Log Out
            </button>
          ) : (
            <a href="/login" className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95">
              Log In
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                          */
/* ------------------------------------------------------------------ */

function DashboardPage() {
  const [user, setUser] = useState<{id: number; name: string; email: string; role: string} | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [autoDetectLoading, setAutoDetectLoading] = useState(false);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }
    getCurrentUser({ data: { token } }).then((u) => {
      setUser(u as any);
      setAuthLoading(false);
    });
  }, []);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [dedicatedFryer, setDedicatedFryer] = useState(false);
  const [isolatedPrep, setIsolatedPrep] = useState(false);
  const [trainedStaff, setTrainedStaff] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get restaurant ID from query param
  const restaurantId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("id")
    : null;

  // Fetch restaurant data
  const fetchRestaurant = useCallback(async (idNum: number) => {
    try {
      const data = await adminGetRestaurant({ data: { id: idNum } });
      if (!data) {
        setError("Restaurant not found.");
      } else {
        setRestaurant(data as Restaurant);
        setDedicatedFryer(data.has_dedicated_fryer);
        setIsolatedPrep(data.has_isolated_prep);
        setTrainedStaff(data.allergen_trained_staff);
      }
    } catch (err) {
      setError("Failed to load restaurant data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    // If there's a URL param, use it (admin or explicit link)
    if (restaurantId) {
      const idNum = parseInt(restaurantId, 10);
      if (isNaN(idNum)) {
        setLoading(false);
        setError("Invalid restaurant ID.");
        return;
      }
      fetchRestaurant(idNum);
      return;
    }

    // No URL param — try auto-detect for restaurant owners
    if (user?.role === "restaurant_owner" && user?.email) {
      setAutoDetectLoading(true);
      getClaimedRestaurantForOwner({ data: { email: user.email } })
        .then((claimed) => {
          if (claimed?.restaurantId) {
            fetchRestaurant(claimed.restaurantId);
          } else {
            setLoading(false);
            setError(null); // Will show "no claimed restaurant" UI
          }
        })
        .catch(() => {
          setLoading(false);
          setError(null);
        })
        .finally(() => setAutoDetectLoading(false));
      return;
    }

    // Admin without URL param
    if (user?.role === "admin") {
      setLoading(false);
      setError("Use /dashboard?id=ID to view a specific restaurant, or browse /admin/restaurants.");
      return;
    }

    setLoading(false);
    setError("No restaurant ID provided. Use /dashboard?id=YOUR_ID");
  }, [restaurantId, user, authLoading, fetchRestaurant]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const result = await submitRestaurantUpdate({
        data: {
          restaurant_id: restaurant.id,
          submitter_email: user?.email || "dashboard@safeplate.company",
          submitter_name: user?.name || "Restaurant Owner (Dashboard)",
          changes: {
            has_dedicated_fryer: dedicatedFryer,
            has_isolated_prep: isolatedPrep,
            allergen_trained_staff: trainedStaff,
          },
          notes: notes.trim() || undefined,
        },
      });

      if (result.success) {
        setSaveSuccess(true);
        setNotes("");
        await fetchRestaurant(restaurant.id);
      } else {
        setSaveError(result.error || "Failed to save changes.");
      }
    } catch {
      setSaveError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  /* --- Auth loading --- */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] dark:bg-slate-950">
        <NavBar user={null} />
        <div className="flex items-center justify-center py-40">
          <IconSpinner className="h-10 w-10 animate-spin text-sky-500" />
        </div>
      </div>
    );
  }

  /* --- Not logged in --- */
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] dark:bg-slate-950">
        <NavBar user={null} />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Login Required</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Please log in or create an account to access the restaurant dashboard.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a href="/login?redirect=/dashboard" className="rounded-full border-2 border-sky-500 px-6 py-2.5 text-sm font-semibold text-sky-600 transition-all hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950">Log In</a>
            <a href="/signup" className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95">Sign Up</a>
          </div>
        </div>
      </div>
    );
  }

  /* --- Auto-detect loading --- */
  if (autoDetectLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] dark:bg-slate-950">
        <NavBar user={user} />
        <div className="flex items-center justify-center py-40">
          <IconSpinner className="h-10 w-10 animate-spin text-sky-500" />
        </div>
      </div>
    );
  }

  /* --- Restaurant owner without claimed restaurant --- */
  if (user.role === "restaurant_owner" && !restaurantId && !error && !restaurant) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] dark:bg-slate-950">
        <NavBar user={user} />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900">
            <span className="text-3xl">🏪</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            You haven't claimed a restaurant yet
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Claim your listing to access your restaurant dashboard, update protocols, and manage your presence on SafePlate.
          </p>
          <a
            href="/claim?from=dashboard"
            className="mt-8 inline-block rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
          >
            Claim Your Listing →
          </a>
        </div>
      </div>
    );
  }

  /* --- Loading state --- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] dark:bg-slate-950">
        <NavBar user={user} />
        <div className="flex items-center justify-center py-40">
          <IconSpinner className="h-10 w-10 animate-spin text-sky-500" />
        </div>
      </div>
    );
  }

  /* --- Error / not-found state --- */
  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] dark:bg-slate-950">
        <NavBar user={user} />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {error || "Restaurant not found"}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            The restaurant you&apos;re looking for doesn&apos;t exist or the ID is incorrect.
            Please check your dashboard link and try again.
          </p>
          <a
            href="/"
            className="mt-8 inline-block rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600"
          >
            Back to SafePlate
          </a>
        </div>
      </div>
    );
  }

  const tier = getTierStyles(restaurant.safety_tier);
  const hasChanges =
    dedicatedFryer !== restaurant.has_dedicated_fryer ||
    isolatedPrep !== restaurant.has_isolated_prep ||
    trainedStaff !== restaurant.allergen_trained_staff ||
    notes.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-slate-950">
      <NavBar user={user} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Restaurant Dashboard
          </h1>
          <p className="mt-2 text-lg font-semibold text-slate-600 dark:text-slate-400">
            {restaurant.name}
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Card 1: Current Status ──────────────────────────────── */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Current Status
            </h2>

            {/* Tier badge */}
            <div className="mt-4 flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${tier.badge}`}>
                {tier.emoji} Tier {restaurant.safety_tier} &middot; {tier.label}
              </span>
              {restaurant.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <IconCheck className="h-4 w-4" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  Unverified
                </span>
              )}
            </div>

            {/* Protocols */}
            <div className="mt-5 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Kitchen Protocols
              </h3>
              <ul className="space-y-2">
                <ProtocolItem active={restaurant.has_dedicated_fryer} label="Dedicated Fryer" />
                <ProtocolItem active={restaurant.has_isolated_prep} label="Isolated Prep Stations" />
                <ProtocolItem active={restaurant.allergen_trained_staff} label="Allergen-Trained Staff" />
              </ul>
            </div>

            {/* Last updated */}
            {restaurant.created_at && (
              <p className="mt-5 text-sm text-slate-400 dark:text-slate-500">
                Last updated: {new Date(restaurant.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>

          {/* ── Card 2: Update Your Protocols ───────────────────────── */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Update Your Protocols
            </h2>

            {/* Success message */}
            {saveSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="font-semibold">✓ Changes submitted!</span> Your protocol update has been
                received. Updates are reviewed and typically applied within 24 hours.
              </div>
            )}

            {/* Error message */}
            {saveError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                <span className="font-semibold">Error:</span> {saveError}
              </div>
            )}

            {/* Tier explanation */}
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Safety Tier Guide
              </h3>
              <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">🟢 Tier 1:</span>{" "}
                  Medical-grade safety with dedicated equipment. Suitable for severe allergies and Celiac disease.
                </p>
                <p>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">🟡 Tier 2:</span>{" "}
                  Strong protocols with some shared equipment. Well-trained staff and documented procedures.
                </p>
                <p>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">🔵 Tier 3:</span>{" "}
                  Basic listing, unverified. Allergy-aware but not independently reviewed by SafePlate.
                </p>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                To request a tier change, include details in the notes below.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dedicatedFryer}
                  onChange={(e) => {
                    setDedicatedFryer(e.target.checked);
                    setSaveSuccess(false);
                  }}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    We have a dedicated fryer
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    A separate fryer used exclusively for allergen-free items (e.g., gluten-free fryer)
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isolatedPrep}
                  onChange={(e) => {
                    setIsolatedPrep(e.target.checked);
                    setSaveSuccess(false);
                  }}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    We have isolated prep stations
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Separate preparation areas/equipment to prevent cross-contamination
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trainedStaff}
                  onChange={(e) => {
                    setTrainedStaff(e.target.checked);
                    setSaveSuccess(false);
                  }}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    We have allergen-trained staff
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Staff receive regular training on allergen handling and cross-contamination prevention
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                  Additional notes about your kitchen protocols
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setSaveSuccess(false);
                  }}
                  rows={4}
                  placeholder="Describe any additional safety measures your kitchen takes..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <IconSpinner className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>
          </div>

          {/* ── Card 3: Your Listing Preview ────────────────────────── */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Your Listing Preview
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              This is how your restaurant appears on SafePlate search.
            </p>

            {/* Mini restaurant card — mirrors search result card style */}
            <div className="mt-5 flex flex-col rounded-2xl border border-slate-100 bg-[#FAFAF9] p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-slate-800 leading-snug dark:text-slate-100">
                    {restaurant.name}
                  </h3>
                  {restaurant.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800">
                      ✓ Verified
                    </span>
                  )}
                  {restaurant.featured_until && new Date(restaurant.featured_until) > new Date() && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800">
                      ⭐ Featured
                    </span>
                  )}
                </div>
              </div>

              {restaurant.cuisine_type && (
                <span className="mt-2 inline-block self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  {restaurant.cuisine_type}
                </span>
              )}

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-semibold ${tier.badge}`}>
                  {tier.emoji} Tier {restaurant.safety_tier} &middot; {tier.label}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <IconPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <span>{restaurant.address}</span>
              </div>

              {restaurant.website && (
                <div className="mt-auto pt-4">
                  <a
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    Visit website &rarr;
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <a
                href="/search"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors dark:text-sky-400 dark:hover:text-sky-300"
              >
                View on SafePlate &rarr;
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Protocol Item                                                     */
/* ------------------------------------------------------------------ */

function ProtocolItem({ active, label }: { active: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      {active ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <IconCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </span>
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <IconDash className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </span>
      )}
      <span
        className={`text-sm ${
          active
            ? "text-slate-800 font-medium dark:text-slate-200"
            : "text-slate-400 line-through dark:text-slate-500"
        }`}
      >
        {label}
      </span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Route export                                                      */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "SafePlate — Restaurant Dashboard" }],
  }),
  component: DashboardPage,
});
