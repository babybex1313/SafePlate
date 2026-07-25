import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { searchRestaurants, getActiveAlerts, submitSafetyAlert, addCommunityRestaurant, getDistinctCities } from "~/db/restaurants";
import { getAllReviews, getAllDinerReviews, type ReviewRow, type DinerReviewRow } from "~/db/reviews";
import { saveRestaurant, unsaveRestaurant, getSavedRestaurants, isRestaurantSaved, getProfile } from "~/db/profile";
import { ThemeToggle } from "~/components/ThemeToggle";
import { RestaurantMap, getCityCoords, type MapRestaurant } from "~/components/RestaurantMap";
import { getCurrentUser } from "~/db/auth";
import { getSessionToken, setCachedUser, clearSession, clearCachedUser } from "~/session";

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

interface AlertRow {
  id: number;
  restaurant_id: number;
  alert_type: string;
  description: string;
  submitter_email: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  restaurant_name: string;
  restaurant_city: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const ALLERGENS = [
  "Gluten",
  "Dairy",
  "Peanuts",
  "Tree Nuts",
  "Eggs",
  "Soy",
  "Fish",
  "Shellfish",
];

const CITIES = [
  { value: "Austin", label: "Austin, TX", slug: "austin" },
  { value: "Atlanta", label: "Atlanta, GA", slug: "atlanta" },
  { value: "Chicago", label: "Chicago, IL", slug: "chicago" },
  { value: "Dallas", label: "Dallas, TX", slug: "dallas" },
  { value: "Denver", label: "Denver, CO", slug: "denver" },
  { value: "Nashville", label: "Nashville, TN", slug: "nashville" },
  { value: "Portland", label: "Portland, OR", slug: "portland" },
  { value: "St. Louis", label: "St. Louis, MO", slug: "st-louis" },
  { value: "Sarasota", label: "Sarasota, FL", slug: "sarasota" },
] as const;

const TIERS = [
  { value: 1, label: "Dedicated", emoji: "🟢", color: "emerald" },
  { value: 2, label: "Protocols", emoji: "🟡", color: "amber" },
  { value: 3, label: "Friendly", emoji: "🔵", color: "sky" },
] as const;

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Search Allergy-Safe Restaurants — Filter by City, Tier & Protocol | SafePlate" },
      {
        name: "description",
        content:
          "Search 600+ restaurants with verified allergy protocols. Filter by city, safety tier, dedicated fryers, prep stations, and more. Perfect for Celiac, gluten-free, and food allergy diners.",
      },
      { property: "og:title", content: "Search Allergy-Safe Restaurants — Filter by City, Tier & Protocol | SafePlate" },
      {
        property: "og:description",
        content:
          "Search 600+ restaurants with verified allergy protocols. Filter by city, safety tier, dedicated fryers, prep stations, and more.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://safeplate.company/search" },
      { property: "og:image", content: "https://safeplate.company/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Search Allergy-Safe Restaurants — Filter by City, Tier & Protocol | SafePlate" },
      {
        name: "twitter:description",
        content:
          "Search 600+ restaurants with verified allergy protocols. Filter by city, safety tier, dedicated fryers, prep stations, and more.",
      },
      { name: "twitter:image", content: "https://safeplate.company/og-image.svg" },
    ],
    links: [
      { rel: "canonical", href: "https://safeplate.company/search" },
    ],
  }),
  component: SearchPage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
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

function IconPin({ className }: { className?: string }) {
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
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  );
}

function IconFryer({ className }: { className?: string }) {
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
        d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
      />
    </svg>
  );
}

function IconPrep({ className }: { className?: string }) {
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
        d="M11.42 15.17l-2.75-2.75m0 0l-3.875-3.875a2.125 2.125 0 013.004-3.004l3.871 3.871m-.254.254l2.75 2.75a2.125 2.125 0 01-3.004 3.004L7.287 12.42m-.254-.254l5.004-5.004"
      />
    </svg>
  );
}

function IconStaff({ className }: { className?: string }) {
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
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    </svg>
  );
}

function IconVerified({ className }: { className?: string }) {
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
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
          <a
            href="/"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Home
          </a>
          <a
            href="/search"
            className="text-sm font-semibold text-sky-600"
          >
            Search
          </a>
          <a
            href="/route-planner"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Route Planner
          </a>
          <a
            href="/profile"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Profile
          </a>
          <a
            href="/update-listing"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Update Listing
          </a>
          <a
            href="/travel-cards"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Travel Cards
          </a>
          <a
            href="/about"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            About
          </a>
          <a
            href="/faq"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            FAQ
          </a>
          <a
            href="/admin/restaurants"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-sky-600 dark:text-slate-500 dark:hover:text-sky-400"
          >
            Admin
          </a>
          <ThemeToggle />
          <a
            href="/list-your-venue"
            className="rounded-full border-2 border-sky-500 px-5 py-2 text-sm font-semibold text-sky-600 shadow-sm transition-all hover:bg-sky-50 active:scale-95 dark:hover:bg-sky-950"
          >
            List Your Venue
          </a>
          <a
            href="/#signup"
            className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
          >
            Join Waitlist
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
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100">SafePlate</span>
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
/*  Tier color helpers                                                */
/* ------------------------------------------------------------------ */

function getTierStyles(tier: number) {
  switch (tier) {
    case 1:
      return {
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dot: "text-emerald-500",
        label: "Dedicated",
        emoji: "🟢",
      };
    case 2:
      return {
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        dot: "text-amber-500",
        label: "Protocols",
        emoji: "🟡",
      };
    case 3:
      return {
        badge: "bg-sky-100 text-sky-700 border-sky-200",
        dot: "text-sky-500",
        label: "Friendly",
        emoji: "🔵",
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "text-slate-500",
        label: "Unknown",
        emoji: "⚪",
      };
  }
}

function getTierPillStyles(tier: number, isSelected: boolean) {
  switch (tier) {
    case 1:
      return isSelected
        ? "bg-emerald-500 text-white border-emerald-500 shadow-md"
        : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300";
    case 2:
      return isSelected
        ? "bg-amber-500 text-white border-amber-500 shadow-md"
        : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300";
    case 3:
      return isSelected
        ? "bg-sky-500 text-white border-sky-500 shadow-md"
        : "bg-white text-sky-600 border-sky-200 hover:bg-sky-50 hover:border-sky-300";
    default:
      return "bg-white text-slate-600 border-slate-200";
  }
}

/* ------------------------------------------------------------------ */
/*  Main Search Page                                                  */
/* ------------------------------------------------------------------ */

function SearchPage() {
  // Read query param from URL on mount
  const initialQuery = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("q") ?? ""
    : "";
  const [query, setQuery] = useState(initialQuery);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedFreeFrom, setSelectedFreeFrom] = useState<string[]>([]);
  const [allergenSeverity, setAllergenSeverity] = useState<Record<string, number>>({});
  const [matchMode, setMatchMode] = useState<"ANY" | "ALL">("ANY");
  const [allResults, setAllResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const [allReviews, setAllReviews] = useState<ReviewRow[]>([]);
  const [dinerReviews, setDinerReviews] = useState<DinerReviewRow[]>([]);
  const [dinerAverages, setDinerAverages] = useState<Record<number, { average: number; count: number }>>({});

  // Premium / saved restaurants state
  const [premiumEmail, setPremiumEmail] = useState<string | null>(null);
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null); // restaurant currently being toggled

  // Safety alerts
  const [allAlerts, setAllAlerts] = useState<AlertRow[]>([]);
  const [reportingRestaurant, setReportingRestaurant] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [alertType, setAlertType] = useState("ingredient_change");
  const [alertDescription, setAlertDescription] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  // Dynamic cities from DB (merged with hardcoded list)
  const [allCities, setAllCities] = useState<{ value: string; label: string; slug: string }[]>([...CITIES]);

  // Suggest restaurant modal
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestName, setSuggestName] = useState("");
  const [suggestCity, setSuggestCity] = useState("");
  const [suggestState, setSuggestState] = useState("");
  const [suggestEmail, setSuggestEmail] = useState("");
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const openSuggest = (city?: string) => {
    setSuggestCity(city ?? "");
    setSuggestName("");
    setSuggestState("");
    setSuggestEmail("");
    setSuggestMessage(null);
    setSuggestError(null);
    setShowSuggest(true);
  };

  const handleSuggestSubmit = async () => {
    if (!suggestName.trim() || !suggestCity.trim()) {
      setSuggestError("Restaurant name and city are required.");
      return;
    }
    setSuggestSubmitting(true);
    setSuggestError(null);
    try {
      const result = await addCommunityRestaurant({
        data: { name: suggestName.trim(), city: suggestCity.trim() },
      });
      if (result.inserted) {
        setSuggestMessage("Thanks! Your suggestion has been added and will be reviewed soon.");
      } else if (result.error) {
        setSuggestMessage(result.error);
      } else {
        setSuggestMessage("Thanks! Your suggestion has been added and will be reviewed soon.");
      }
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSuggestSubmitting(false);
    }
  };

  // Client-side search filtering: instant, case-insensitive match on name/cuisine/description
  const results = useMemo(() => {
    let filtered = query.trim()
      ? (() => {
          const q = query.toLowerCase();
          return allResults.filter((r) => {
            const name = (r.name || "").toLowerCase();
            const cuisine = (r.cuisine_type || "").toLowerCase();
            const desc = (r.description || "").toLowerCase();
            return name.includes(q) || cuisine.includes(q) || desc.includes(q);
          });
        })()
      : allResults;

    // Premium severity filtering: if any allergen has severity >= 3, require Tier 1
    // If severity == 2, require Tier 1 or 2. Severity 1 = any tier.
    if (premiumEmail) {
      const maxSeverity = Object.values(allergenSeverity).reduce((max, v) => Math.max(max, v ?? 0), 0);
      if (maxSeverity >= 3) {
        filtered = filtered.filter((r) => r.safety_tier === 1);
      } else if (maxSeverity >= 2) {
        filtered = filtered.filter((r) => r.safety_tier <= 2);
      }
    }

    return filtered;
  }, [allResults, query, allergenSeverity, premiumEmail]);

  const fetchResults = useCallback(
    async (_query: string, tier: number | null, freeFrom: string[], city: string, mode: "ANY" | "ALL" = "ANY") => {
      setLoading(true);
      try {
        // Server-side call always fetches all restaurants for the city+tier+freeFrom
        // (no text query — we filter client-side for instant feel)
        const data = await searchRestaurants({
          data: {
            tier: tier ?? undefined,
            freeFrom: freeFrom.length > 0 ? freeFrom : undefined,
            city,
            matchMode: freeFrom.length > 0 ? mode : undefined,
          },
        });
        setAllResults(data as Restaurant[]);
      } catch (err) {
        console.error("Search error:", err);
        setAllResults([]);
      } finally {
        setLoading(false);
        setInitialLoadDone(true);
      }
    },
    [],
  );

  // On mount: fire immediately (no debounce) to show results fast
  useEffect(() => {
    fetchResults("", null, [], "");
    // Fetch distinct cities from DB for dropdown
    getDistinctCities().then((dbCities) => {
      const featuredNames = new Set(CITIES.map((c) => c.value));
      const extraCities = (dbCities as string[]).filter((c) => !featuredNames.has(c));
      if (extraCities.length > 0) {
        setAllCities((prev) => [
          ...prev,
          ...extraCities.map((c) => ({
            value: c,
            label: c,
            slug: c.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          })),
        ]);
      }
    }).catch(() => {});
    // Load all reviews for display on cards
    getAllReviews().then((revs) => setAllReviews(revs as ReviewRow[])).catch(() => {});
    // Load all diner reviews with averages
    getAllDinerReviews().then((data) => {
      const result = data as { reviews: DinerReviewRow[]; averages: Record<number, { average: number; count: number }> };
      setDinerReviews(result.reviews);
      setDinerAverages(result.averages);
    }).catch(() => {});
    // Load all active alerts
    getActiveAlerts().then((alerts) => setAllAlerts(alerts as AlertRow[])).catch(() => {});
    isFirstRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for premium status from stored email
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("safeplate_email") : null;
    if (stored) {
      getProfile({ data: { email: stored } }).then((profile) => {
        if (profile?.premium_until) {
          const premiumDate = new Date(profile.premium_until);
          if (premiumDate > new Date()) {
            setPremiumEmail(stored);
            setPremiumUntil(profile.premium_until);
            // Load saved restaurants
            getSavedRestaurants({ data: { userEmail: stored } }).then((saved) => {
              setSavedRestaurants(saved as Restaurant[]);
            }).catch(() => {});
          }
        }
      }).catch(() => {});
    }
  }, []);

  // When results load, check which ones are saved
  useEffect(() => {
    if (!premiumEmail || allResults.length === 0) return;
    const ids = allResults.map((r) => r.id);
    isRestaurantSaved({ data: { userEmail: premiumEmail, restaurantIds: ids } }).then((saved) => {
      setSavedIds(new Set(saved));
    }).catch(() => {});
  }, [allResults, premiumEmail]);

  // Handle save/unsave toggle
  const handleSaveToggle = async (restaurantId: number) => {
    if (!premiumEmail) return;
    setSavingId(restaurantId);
    try {
      if (savedIds.has(restaurantId)) {
        await unsaveRestaurant({ data: { userEmail: premiumEmail, restaurantId } });
        setSavedIds((prev) => { const next = new Set(prev); next.delete(restaurantId); return next; });
        setSavedRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
      } else {
        await saveRestaurant({ data: { userEmail: premiumEmail, restaurantId } });
        setSavedIds((prev) => new Set(prev).add(restaurantId));
        // Find the restaurant and add it
        const restaurant = allResults.find((r) => r.id === restaurantId);
        if (restaurant) {
          setSavedRestaurants((prev) => [restaurant, ...prev]);
        }
      }
    } catch {
      // silent
    } finally {
      setSavingId(null);
    }
  };

  // On filter changes (tier, freeFrom, city): debounced server fetch
  useEffect(() => {
    if (isFirstRender.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(query, selectedTier, selectedFreeFrom, selectedCity, matchMode);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedTier, selectedFreeFrom, selectedCity, matchMode, fetchResults]);

  const currentCityLabel = selectedCity
    ? (allCities.find((c) => c.value === selectedCity)?.label ?? "All Cities")
    : "all cities";

  const toggleTier = (tier: number) => {
    setSelectedTier((prev) => (prev === tier ? null : tier));
  };

  const toggleFreeFrom = (allergen: string) => {
    setSelectedFreeFrom((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen],
    );
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Compute active alert counts per restaurant
  const activeAlertCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    allAlerts.forEach((a) => {
      if (a.status === "active") {
        counts[a.restaurant_id] = (counts[a.restaurant_id] ?? 0) + 1;
      }
    });
    return counts;
  }, [allAlerts]);

  // Submit alert handler
  const handleSubmitAlert = async () => {
    if (!reportingRestaurant) return;
    if (!alertDescription.trim()) {
      setAlertError("Please describe the change.");
      return;
    }
    setAlertSubmitting(true);
    setAlertError(null);
    try {
      const result = await submitSafetyAlert({
        data: {
          restaurant_id: reportingRestaurant.id,
          alert_type: alertType,
          description: alertDescription.trim(),
          submitter_email: alertEmail.trim() || undefined,
        },
      });
      if (result.success) {
        setAlertMessage("Thanks — your report helps the community!");
        // Refresh alerts
        getActiveAlerts().then((alerts) => setAllAlerts(alerts as AlertRow[])).catch(() => {});
        // Close modal after short delay
        setTimeout(() => {
          setReportingRestaurant(null);
          setAlertDescription("");
          setAlertEmail("");
          setAlertType("ingredient_change");
          setAlertMessage(null);
        }, 2000);
      } else {
        setAlertError(result.error ?? "Failed to submit.");
      }
    } catch (err) {
      setAlertError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setAlertSubmitting(false);
    }
  };

  // Open report modal
  const openReport = (r: Restaurant) => {
    setReportingRestaurant({ id: r.id, name: r.name });
    setAlertType("ingredient_change");
    setAlertDescription("");
    setAlertEmail("");
    setAlertMessage(null);
    setAlertError(null);
  };

  // Get reviews for a specific restaurant
  const reviewsForRestaurant = (restaurantId: number) =>
    allReviews.filter((r) => r.restaurant_id === restaurantId);

  const dinerReviewsForRestaurant = (restaurantId: number) =>
    dinerReviews.filter((r) => r.restaurant_id === restaurantId);

  const dinerAverageForRestaurant = (restaurantId: number) =>
    dinerAverages[restaurantId] ?? null;

  // Time ago helper
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
    return `${Math.floor(diffDay / 30)}mo ago`;
  }

  // Get a health badge for a review's allergen profile
  const healthBadge = (allergens: Record<string, number> | null | undefined) => {
    if (!allergens) return null;
    const active = Object.entries(allergens).filter(([, v]) => v > 0);
    if (active.length === 0) return null;
    // Show the most severe ones
    const severe = active.filter(([, v]) => v >= 3);
    if (severe.length > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          {severe[0][0]} L3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
        {active[0][0]} L{active[0][1]}
      </span>
    );
  };

  // Star rating display
  function StarRating({ rating }: { rating: number }) {
    return (
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rating ? "text-amber-400" : "text-slate-200"}>
            ★
          </span>
        ))}
      </span>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* JSON-LD structured data for restaurant results */}
      {results.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `Allergen-Safe Restaurants${selectedCity ? ` in ${selectedCity}` : ""}`,
              description: `Verified gluten-free, dairy-free, and allergen-safe restaurants${selectedCity ? ` in ${selectedCity}` : ""}. Filter by safety tier, dedicated kitchens, and dietary protocols.`,
              url: `https://safeplate.company/search`,
              numberOfItems: results.length,
              itemListElement: results.map((r, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Restaurant",
                  name: r.name,
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: r.address,
                    addressLocality: r.city,
                    addressRegion: r.state,
                  },
                  servesCuisine: r.cuisine_type ?? undefined,
                  description: r.description ?? undefined,
                  url: r.website ?? undefined,
                  telephone: r.phone ?? undefined,
                },
              })),
            }),
          }}
        />
      )}
      <NavBar />
      <main>
        {/* Hero */}
        <section className="bg-[#FAFAF9] pt-16 pb-12 md:pt-24 md:pb-16 dark:bg-slate-950">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 md:text-5xl dark:text-slate-100">
              Find safe restaurants in{" "}
              <span className="text-sky-500">{selectedCity || "all cities"}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Filter by safety tier, allergen protocols, and verified kitchen
              practices — so you can dine out with confidence.
            </p>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="border-b border-slate-100 bg-white py-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-6">
            {/* Text search */}
            <div className="relative mx-auto max-w-2xl">
              <IconSearch className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, cuisine, or keyword..."
                className="w-full rounded-full border border-slate-200 bg-white py-3.5 pl-12 pr-5 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            {/* City selector */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                City:
              </span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">All Cities</option>
                {allCities.map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City guide link */}
            {selectedCity && (
            <div className="mt-3 text-center">
              <a
                href={`/city/${allCities.find((c) => c.value === selectedCity)?.slug ?? ""}`}
                className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors dark:text-sky-400 dark:hover:text-sky-300"
              >
                📖 View {selectedCity} dining guide &rarr;
              </a>
            </div>
            )}

            {/* Suggest a restaurant link */}
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => openSuggest()}
                className="text-sm text-slate-400 hover:text-sky-500 transition-colors underline underline-offset-2 cursor-pointer dark:text-slate-500 dark:hover:text-sky-400"
              >
                Don't see your city? Suggest a restaurant →
              </button>
            </div>

            {/* Tier pills */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-medium text-slate-500 mr-1 dark:text-slate-400">
                Safety tier:
              </span>
              {TIERS.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => toggleTier(tier.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer ${getTierPillStyles(
                    tier.value,
                    selectedTier === tier.value,
                  )}`}
                >
                  {tier.emoji} {tier.label}
                </button>
              ))}
              {selectedTier && (
                <button
                  type="button"
                  onClick={() => setSelectedTier(null)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer dark:text-slate-500 dark:hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Allergen free-from chips + premium advanced filtering */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                <span className="text-sm font-medium text-slate-500 mr-1 dark:text-slate-400">
                  Free from:
                </span>
                {ALLERGENS.map((allergen) => {
                  const isSelected = selectedFreeFrom.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => toggleFreeFrom(allergen)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
                      }`}
                    >
                      {isSelected && "✓ "}
                      {allergen}
                    </button>
                  );
                })}
                {selectedFreeFrom.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSelectedFreeFrom([]); setAllergenSeverity({}); }}
                    className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Premium: severity selectors + match mode toggle */}
              {premiumEmail && selectedFreeFrom.length > 0 && (
                <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/30 to-white p-4 dark:from-purple-950/30 dark:to-slate-900 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">💎</span>
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">Advanced Filtering</span>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">Premium</span>
                  </div>

                  {/* Severity selectors for each selected allergen */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    {selectedFreeFrom.map((allergen) => (
                      <div key={allergen} className="flex items-center gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2 dark:bg-slate-800 dark:border-purple-800">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{allergen}</span>
                        <select
                          value={allergenSeverity[allergen] ?? 1}
                          onChange={(e) => setAllergenSeverity((prev) => ({ ...prev, [allergen]: Number(e.target.value) }))}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 cursor-pointer dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
                        >
                          <option value={1}>Mild</option>
                          <option value={2}>Moderate</option>
                          <option value={3}>Severe</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Match mode toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Match:</span>
                    <button
                      type="button"
                      onClick={() => setMatchMode("ANY")}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        matchMode === "ANY"
                          ? "bg-purple-500 text-white border-purple-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-purple-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                      }`}
                    >
                      ANY selected
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatchMode("ALL")}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        matchMode === "ALL"
                          ? "bg-purple-500 text-white border-purple-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-purple-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                      }`}
                    >
                      ALL selected
                    </button>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {matchMode === "ANY" ? "Show restaurants free from at least one" : "Show restaurants free from all selected"}
                    </span>
                  </div>
                </div>
              )}

              {/* Premium upsell for non-premium */}
              {!premiumEmail && selectedFreeFrom.length > 0 && (
                <div className="mt-3 text-center">
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    💎 Unlock advanced filtering with Premium
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="bg-[#FAFAF9] py-10 md:py-14 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl px-6">
            {/* Initial loading: data not yet arrived at all */}
            {loading && !initialLoadDone && (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
                  <IconSearch className="h-8 w-8 text-sky-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                  Start exploring
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Loading restaurants{selectedCity ? ` in ${selectedCity}` : ""}…
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <IconSpinner className="h-5 w-5 animate-spin text-sky-500" />
                </div>
              </div>
            )}

            {/* SSR / pre-mount fallback: before useEffect fires */}
            {!loading && !initialLoadDone && (
              <div className="flex items-center justify-center py-16">
                <IconSpinner className="h-8 w-8 animate-spin text-sky-500" />
                <span className="ml-3 text-slate-500 dark:text-slate-400">Loading…</span>
              </div>
            )}

            {/* Subsequent loading: data already shown, just refreshing */}
            {loading && initialLoadDone && (
              <div className="flex items-center justify-center py-8">
                <IconSpinner className="h-5 w-5 animate-spin text-sky-500" />
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Updating results…</span>
              </div>
            )}

            {/* No results after load complete */}
            {!loading && initialLoadDone && results.length === 0 && (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <IconSearch className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                  No restaurants found
                </h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Try adjusting your filters or search term to see more results.
                </p>
              </div>
            )}

            {/* Saved Restaurants (premium feature) */}
            {!loading && premiumEmail && savedRestaurants.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">💎</span>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Saved Restaurants</h3>
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                    Premium
                  </span>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {savedRestaurants.map((r) => {
                    const tier = getTierStyles(r.safety_tier);
                    const isFeatured = r.featured_until && new Date(r.featured_until) > new Date();
                    return (
                      <div
                        key={`saved-${r.id}`}
                        className="flex flex-col rounded-2xl border-2 border-purple-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-slate-800 leading-snug dark:text-slate-100">{r.name}</h3>
                            {isFeatured && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">⭐ Featured</span>
                            )}
                            {r.verified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">✓ Verified</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveToggle(r.id)}
                            disabled={savingId === r.id}
                            className="flex-shrink-0 rounded-full p-1.5 text-purple-500 hover:text-purple-600 bg-purple-50 transition-colors cursor-pointer"
                            title="Remove from saved"
                          >
                            {savingId === r.id ? (
                              <IconSpinner className="h-5 w-5 animate-spin" />
                            ) : (
                              <svg className="h-5 w-5" fill="currentColor" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {r.cuisine_type && (
                          <span className="mt-2 inline-block self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">{r.cuisine_type}</span>
                        )}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-semibold ${tier.badge}`}>
                            {tier.emoji} Tier {r.safety_tier} &middot; {tier.label}
                          </span>
                        </div>
                        <div className="mt-3 flex items-start gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                          <IconPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          <span>{r.address}</span>
                        </div>
                        {r.website && (
                          <div className="mt-auto pt-4">
                            <a href={r.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors dark:text-sky-400 dark:hover:text-sky-300">
                              Visit website &rarr;
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <hr className="mt-10 border-slate-200 dark:border-slate-700" />
              </div>
            )}

            {/* Results grid */}
            {!loading && results.length > 0 && (
              <>
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                  {results.length} restaurant{results.length !== 1 ? "s" : ""}{" "}
                  found
                </p>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((r) => {
                    const tier = getTierStyles(r.safety_tier);
                    const isFeatured = r.featured_until && new Date(r.featured_until) > new Date();
                    return (
                      <div
                        key={r.id}
                        className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                      >
                        {/* Header: name + badges */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-slate-800 leading-snug dark:text-slate-100">
                              {r.name}
                            </h3>
                            {isFeatured && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                                ⭐ Featured
                              </span>
                            )}
                            {r.verified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          {/* Bookmark button for premium users */}
                          {premiumEmail && (
                            <button
                              type="button"
                              onClick={() => handleSaveToggle(r.id)}
                              disabled={savingId === r.id}
                              className={`flex-shrink-0 rounded-full p-1.5 transition-colors cursor-pointer ${
                                savedIds.has(r.id)
                                  ? "text-purple-500 hover:text-purple-600 bg-purple-50"
                                  : "text-slate-300 hover:text-purple-400 hover:bg-slate-50"
                              }`}
                              title={savedIds.has(r.id) ? "Remove from saved" : "Save restaurant"}
                            >
                              {savingId === r.id ? (
                                <IconSpinner className="h-5 w-5 animate-spin" />
                              ) : (
                                <svg className="h-5 w-5" fill={savedIds.has(r.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Cuisine badge */}
                        {r.cuisine_type && (
                          <span className="mt-2 inline-block self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                            {r.cuisine_type}
                          </span>
                        )}

                        {/* Safety tier badge */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-semibold ${tier.badge}`}
                          >
                            {tier.emoji} Tier {r.safety_tier} &middot;{" "}
                            {tier.label}
                          </span>
                          {/* Active alerts badge */}
                          {activeAlertCounts[r.id] > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              ⚠️ {activeAlertCounts[r.id]} alert{activeAlertCounts[r.id] !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {/* Address */}
                        <div className="mt-3 flex items-start gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                          <IconPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          <span>{r.address}</span>
                        </div>

                        {/* Kitchen protocols */}
                        <div className="mt-4 flex flex-wrap gap-3">
                          {r.has_dedicated_fryer && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <IconFryer className="h-3.5 w-3.5" />
                              Dedicated Fryer
                            </span>
                          )}
                          {r.has_isolated_prep && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <IconPrep className="h-3.5 w-3.5" />
                              Isolated Prep
                            </span>
                          )}
                          {r.allergen_trained_staff && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <IconStaff className="h-3.5 w-3.5" />
                              Trained Staff
                            </span>
                          )}
                        </div>

                        {/* Free from badges */}
                        {r.free_from && r.free_from.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {r.free_from.map((a) => (
                              <span
                                key={a}
                                className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                              >
                                ✓ {capitalize(a)}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        {r.description && (
                          <p className="mt-4 text-sm leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400">
                            {r.description}
                          </p>
                        )}

                        {/* Diner Reviews: average rating + recent reviews */}
                        {(() => {
                          const avgData = dinerAverageForRestaurant(r.id);
                          const dinerRevs = dinerReviewsForRestaurant(r.id).slice(0, 3);
                          const hasDinerReviews = avgData && avgData.count > 0;
                          if (!hasDinerReviews && dinerRevs.length === 0) return null;
                          return (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                              {/* Average rating */}
                              {hasDinerReviews && (
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="inline-flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <span key={n} className={n <= Math.round(avgData!.average) ? "text-amber-400 text-sm" : "text-slate-200 text-sm dark:text-slate-600"}>
                                        ★
                                      </span>
                                    ))}
                                  </span>
                                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {avgData!.average}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    ({avgData!.count} review{avgData!.count !== 1 ? "s" : ""})
                                  </span>
                                </div>
                              )}
                              {/* Recent diner reviews */}
                              {dinerRevs.slice(0, 3).map((review) => (
                                <div key={`diner-${review.id}`} className="mb-2 rounded-lg bg-amber-50/50 p-3 dark:bg-amber-950/20">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="inline-flex items-center gap-0.5 text-sm">
                                      {[1, 2, 3, 4, 5].map((n) => (
                                        <span key={n} className={n <= review.rating ? "text-amber-400" : "text-slate-200 dark:text-slate-600"}>★</span>
                                      ))}
                                    </span>
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                      — {review.reviewer_name}
                                    </span>
                                    {review.is_verified && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800">
                                        ✓ Verified Diner
                                      </span>
                                    )}
                                    <span className="text-xs text-slate-400 dark:text-slate-500">· {timeAgo(review.created_at)}</span>
                                  </div>
                                  {review.review_text && (
                                    <p className="text-xs text-slate-600 line-clamp-2 dark:text-slate-400">
                                      {review.review_text}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Safety Reviews section */}
                        {(() => {
                          const revs = reviewsForRestaurant(r.id);
                          if (revs.length === 0) return null;
                          return (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 dark:text-slate-400">
                                Safety Reviews ({revs.length})
                              </p>
                              <div className="space-y-2">
                                {revs.slice(0, 2).map((review) => (
                                  <div key={review.id} className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-700">
                                    <div className="flex items-center gap-2 mb-1">
                                      <StarRating rating={review.safety_rating} />
                                      {healthBadge(review.user_allergens)}
                                    </div>
                                    {review.review_text && (
                                      <p className="text-xs text-slate-600 line-clamp-1 italic dark:text-slate-400">
                                        "{review.review_text}"
                                      </p>
                                    )}
                                    <div className="mt-1 flex items-center gap-2">
                                      {review.wellness_safe ? (
                                        <span className="text-xs font-medium text-emerald-600">✅ Felt safe</span>
                                      ) : (
                                        <span className="text-xs font-medium text-red-500">⚠️ Not safe</span>
                                      )}
                                      <span className="text-xs text-slate-400 dark:text-slate-500">
                                        {new Date(review.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Add Review button */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap dark:border-slate-700">
                          <a
                            href={`/write-review?restaurant_id=${r.id}&restaurant_name=${encodeURIComponent(r.name)}`}
                            className="inline-flex items-center gap-1.5 rounded-full border-2 border-sky-200 px-4 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 hover:border-sky-300 transition-all"
                          >
                            ✍️ Write a Safety Review
                          </a>
                          {/* Report Change button */}
                          <button
                            type="button"
                            onClick={() => openReport(r)}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all cursor-pointer dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950"
                          >
                            ⚠️ Report Change
                          </button>
                        </div>

                        {/* Spacer */}
                        <div className="mt-auto pt-4">
                          {r.website && (
                            <a
                              href={r.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors dark:text-sky-400 dark:hover:text-sky-300"
                            >
                              Visit website &rarr;
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Map view of results */}
                <div className="mt-10">
                  {(() => {
                    const mapRestaurants: MapRestaurant[] = results.map((r) => ({
                      id: r.id,
                      name: r.name,
                      address: r.address,
                      city: r.city,
                      state: r.state,
                      safety_tier: r.safety_tier,
                    }));
                    const cityCoords = selectedCity
                      ? getCityCoords(selectedCity)
                      : getCityCoords("Austin");
                    return (
                      <RestaurantMap
                        restaurants={mapRestaurants}
                        centerLat={cityCoords?.lat ?? 30.2672}
                        centerLng={cityCoords?.lng ?? -97.7431}
                      />
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Report Change Modal */}
        {reportingRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setReportingRestaurant(null)}
            />
            {/* Modal */}
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 dark:bg-slate-800">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  ⚠️ Report a Change
                </h3>
                <button
                  type="button"
                  onClick={() => setReportingRestaurant(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer dark:hover:text-slate-300 dark:hover:bg-slate-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-4 dark:text-slate-400">
                Reporting for: <span className="font-semibold text-slate-800">{reportingRestaurant.name}</span>
              </p>

              {/* Alert type */}
              <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                What changed?
              </label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/15 mb-4"
              >
                <option value="ingredient_change">Ingredient change</option>
                <option value="menu_change">Menu item removed/changed</option>
                <option value="protocol_change">Protocol change</option>
                <option value="other">Other</option>
              </select>

              {/* Description */}
              <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={alertDescription}
                onChange={(e) => setAlertDescription(e.target.value)}
                rows={4}
                placeholder="Describe what changed (ingredients, menu items, protocols...)"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/15 resize-y mb-4"
              />

              {/* Email */}
              <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                Your email <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/15 mb-6"
              />

              {/* Messages */}
              {alertError && (
                <p className="mb-3 text-sm font-medium text-red-500">{alertError}</p>
              )}
              {alertMessage && (
                <p className="mb-3 text-sm font-medium text-emerald-600">{alertMessage}</p>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmitAlert}
                disabled={alertSubmitting || !!alertMessage}
                className="w-full rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {alertSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <IconSpinner className="h-4 w-4 animate-spin" />
                    Submitting…
                  </span>
                ) : alertMessage ? (
                  "Submitted ✓"
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Suggest Restaurant Modal */}
        {showSuggest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSuggest(false)}
            />
            {/* Modal */}
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 dark:bg-slate-800">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  🍽️ Suggest a Restaurant
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSuggest(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer dark:hover:text-slate-300 dark:hover:bg-slate-700"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-5 dark:text-slate-400">
                Know a restaurant that's allergy-friendly? Suggest it and we'll review it.
              </p>

              {/* Restaurant Name */}
              <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                Restaurant Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={suggestName}
                onChange={(e) => setSuggestName(e.target.value)}
                placeholder="e.g. Green Leaf Bistro"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 mb-4"
              />

              {/* City */}
              <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={suggestCity}
                onChange={(e) => setSuggestCity(e.target.value)}
                placeholder="e.g. Portland"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 mb-4"
              />

              {/* State */}
              <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                State <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={suggestState}
                onChange={(e) => setSuggestState(e.target.value)}
                placeholder="e.g. OR"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 mb-4"
              />

              {/* Email */}
              <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
                Your Email <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={suggestEmail}
                onChange={(e) => setSuggestEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 mb-6"
              />

              {/* Messages */}
              {suggestError && (
                <p className="mb-3 text-sm font-medium text-red-500">{suggestError}</p>
              )}
              {suggestMessage && (
                <p className="mb-3 text-sm font-medium text-emerald-600">{suggestMessage}</p>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSuggestSubmit}
                disabled={suggestSubmitting || !!suggestMessage}
                className="w-full rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {suggestSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <IconSpinner className="h-4 w-4 animate-spin" />
                    Submitting…
                  </span>
                ) : suggestMessage ? (
                  "Submitted ✓"
                ) : (
                  "Submit Suggestion"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
