import { RestaurantMap, getCityCoords } from "~/components/RestaurantMap";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { findRestaurantsAlongRoute, addCommunityRestaurant, discoverRestaurants } from "~/db/restaurants";
import { getProfile, saveRoute, getSavedRoutes, deleteSavedRoute } from "~/db/profile";

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
  created_at: string;
}

interface RouteCity {
  name: string;
  restaurants: Restaurant[];
}

interface RouteResult {
  distance: string;
  duration: string;
  cities: RouteCity[];
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/route-planner")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Allergy-Safe Road Trip Planner — Find Safe Restaurants Along Your Route | SafePlate" },
      {
        name: "description",
        content:
          "Plan your road trip with confidence. Find allergy-safe restaurants at every exit along your route. Never worry about where to eat on the road again. Built for Celiac, gluten-free, and food allergy travelers.",
      },
      { property: "og:title", content: "Allergy-Safe Road Trip Planner — Find Safe Restaurants Along Your Route | SafePlate" },
      {
        property: "og:description",
        content:
          "Plan your road trip with confidence. Find allergy-safe restaurants at every exit along your route. Never worry about where to eat on the road again.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://safeplate.company/route-planner" },
      { property: "og:image", content: "https://safeplate.company/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Allergy-Safe Road Trip Planner — Find Safe Restaurants Along Your Route | SafePlate" },
      {
        name: "twitter:description",
        content:
          "Plan your road trip with confidence. Find allergy-safe restaurants at every exit along your route. Never worry about where to eat on the road again.",
      },
      { name: "twitter:image", content: "https://safeplate.company/og-image.svg" },
    ],
    links: [
      { rel: "canonical", href: "https://safeplate.company/route-planner" },
    ],
  }),
  component: RoutePlannerPage,
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

function IconRoute({ className }: { className?: string }) {
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
        d="M3.75 21l16.5-9M3.75 3l16.5 9"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
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
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Home
          </a>
          <a
            href="/search"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Search
          </a>
          <a
            href="/route-planner"
            className="text-sm font-semibold text-sky-600"
          >
            Route Planner
          </a>
          <a
            href="/profile"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Profile
          </a>
          <a
            href="/travel-cards"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Travel Cards
          </a>
          <a
            href="/about"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            About
          </a>
          <a
            href="/faq"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            FAQ
          </a>
          <a
            href="/list-your-venue"
            className="rounded-full border-2 border-sky-500 px-5 py-2 text-sm font-semibold text-sky-600 dark:text-sky-400 shadow-sm transition-all hover:bg-sky-50 dark:hover:bg-sky-900/50 active:scale-95"
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

function Footer() {
  return (
    <footer className="border-t border-slate-100 dark:border-slate-800 bg-[#FAFAF9] dark:bg-slate-900 py-10">
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
            className="text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Claim Your Listing
          </a>
          <a
            href="/blog/safest-celiac-restaurants-2026"
            className="text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Blog
          </a>
          <a
            href="/legal"
            className="text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
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
/*  Tier helpers                                                      */
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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Restaurant Card (reused from search page)                         */
/* ------------------------------------------------------------------ */

function RestaurantCard({ r }: { r: Restaurant }) {
  const tier = getTierStyles(r.safety_tier);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header: name + verified badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-snug">
          {r.name}
        </h3>
        {r.verified && (
          <IconVerified className="h-5 w-5 flex-shrink-0 text-emerald-500 mt-0.5" />
        )}
      </div>

      {/* Cuisine badge */}
      {r.cuisine_type && (
        <span className="mt-2 inline-block self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs font-medium text-slate-600">
          {r.cuisine_type}
        </span>
      )}

      {/* Safety tier badge */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-semibold ${tier.badge}`}
        >
          {tier.emoji} Tier {r.safety_tier} &middot; {tier.label}
        </span>
      </div>

      {/* Address */}
      <div className="mt-3 flex items-start gap-1.5 text-sm text-slate-500">
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
        <p className="mt-4 text-sm leading-relaxed text-slate-500 line-clamp-2">
          {r.description}
        </p>
      )}

      {/* Website link */}
      <div className="mt-auto pt-4">
        {r.website && (
          <a
            href={r.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
          >
            Visit website &rarr;
          </a>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

function RoutePlannerPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Premium state
  const [premiumEmail, setPremiumEmail] = useState<string | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<{ id: number; origin: string; destination: string; created_at: string }[]>([]);
  const [savingRoute, setSavingRoute] = useState(false);
  const [deletingRouteId, setDeletingRouteId] = useState<number | null>(null);

  // Suggest restaurant modal
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestName, setSuggestName] = useState("");
  const [suggestCity, setSuggestCity] = useState("");
  const [suggestState, setSuggestState] = useState("");
  const [suggestEmail, setSuggestEmail] = useState("");
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // Discover restaurants
  const [discoveringCity, setDiscoveringCity] = useState<string | null>(null);
  const [discoverResults, setDiscoverResults] = useState<{ name: string; address: string }[] | null>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [addingName, setAddingName] = useState<string | null>(null);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());

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
      const res = await addCommunityRestaurant({
        data: { name: suggestName.trim(), city: suggestCity.trim() },
      });
      if (res.inserted) {
        setSuggestMessage("Thanks! Your suggestion has been added and will be reviewed soon.");
      } else if (res.error) {
        setSuggestMessage(res.error);
      } else {
        setSuggestMessage("Thanks! Your suggestion has been added and will be reviewed soon.");
      }
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSuggestSubmitting(false);
    }
  };

  const handleDiscover = async (city: string) => {
    setDiscoveringCity(city);
    setDiscoverResults(null);
    setDiscoverError(null);
    setAddedNames(new Set());
    try {
      const res = await discoverRestaurants({ data: { city } });
      if (res.success && res.suggestions) {
        setDiscoverResults(res.suggestions);
      } else if (res.error) {
        setDiscoverError(res.error);
      } else {
        setDiscoverResults([]);
      }
    } catch (err) {
      setDiscoverError(err instanceof Error ? err.message : "Failed to discover restaurants.");
    } finally {
      setDiscoveringCity(null);
    }
  };

  const handleAddDiscovered = async (name: string, city: string) => {
    setAddingName(name);
    try {
      await addCommunityRestaurant({ data: { name, city } });
      setAddedNames((prev) => new Set(prev).add(name));
    } catch {
      // silently fail — the restaurant might already exist
    } finally {
      setAddingName(null);
    }
  };

  const handleSearch = async () => {
    if (!origin.trim() || !destination.trim()) {
      setError("Please enter both a starting point and destination.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await findRestaurantsAlongRoute({
        data: {
          origin: origin.trim(),
          destination: destination.trim(),
        },
      });

      if ((data as { error?: string }).error) {
        setError((data as { error: string }).error);
      } else {
        setResult(data as RouteResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  // Premium detection
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("safeplate_email") : null;
    if (stored) {
      getProfile({ data: { email: stored } }).then((profile) => {
        if (profile?.premium_until) {
          const premiumDate = new Date(profile.premium_until);
          if (premiumDate > new Date()) {
            setPremiumEmail(stored);
            // Load saved routes
            getSavedRoutes({ data: { userEmail: stored } }).then((routes) => {
              setSavedRoutes(routes as { id: number; origin: string; destination: string; created_at: string }[]);
            }).catch(() => {});
          }
        }
      }).catch(() => {});
    }
  }, []);

  // Save current route
  const handleSaveRoute = async () => {
    if (!premiumEmail || !origin.trim() || !destination.trim()) return;
    setSavingRoute(true);
    try {
      await saveRoute({ data: { userEmail: premiumEmail, origin: origin.trim(), destination: destination.trim() } });
      // Reload saved routes
      const routes = await getSavedRoutes({ data: { userEmail: premiumEmail } });
      setSavedRoutes(routes as { id: number; origin: string; destination: string; created_at: string }[]);
    } catch {
      // silent
    } finally {
      setSavingRoute(false);
    }
  };

  // Delete a saved route
  const handleDeleteRoute = async (routeId: number) => {
    if (!premiumEmail) return;
    setDeletingRouteId(routeId);
    try {
      await deleteSavedRoute({ data: { userEmail: premiumEmail, routeId } });
      setSavedRoutes((prev) => prev.filter((r) => r.id !== routeId));
    } catch {
      // silent
    } finally {
      setDeletingRouteId(null);
    }
  };

  // Quick-launch a saved route
  const handleLaunchRoute = (savedOrigin: string, savedDest: string) => {
    setOrigin(savedOrigin);
    setDestination(savedDest);
    // Trigger search
    setTimeout(async () => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const data = await findRestaurantsAlongRoute({
          data: { origin: savedOrigin, destination: savedDest },
        });
        if ((data as { error?: string }).error) {
          setError((data as { error: string }).error);
        } else {
          setResult(data as RouteResult);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100 antialiased">
      <NavBar />
      <main>
        {/* Hero */}
        <section className="bg-[#FAFAF9] dark:bg-slate-950 pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-5xl">
              Safe Journey{" "}
              <span className="text-sky-500">Route Planner</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Find allergy-safe restaurants along your road trip. Enter your route
              and we'll show you safe stops along the way.
            </p>
          </div>
        </section>

        {/* Saved Routes (premium) */}
        {premiumEmail && savedRoutes.length > 0 && (
          <section className="border-b border-purple-100 bg-gradient-to-b from-purple-50/30 to-white py-6 dark:from-purple-950/20 dark:to-slate-900 dark:border-purple-800">
            <div className="mx-auto max-w-3xl px-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💎</span>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">My Saved Routes</h3>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">Premium</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {savedRoutes.map((route) => (
                  <div key={route.id} className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3 py-2 shadow-sm dark:bg-slate-800 dark:border-purple-700">
                    <button
                      type="button"
                      onClick={() => handleLaunchRoute(route.origin, route.destination)}
                      className="text-sm font-medium text-purple-700 hover:text-purple-900 transition-colors cursor-pointer dark:text-purple-400 dark:hover:text-purple-200"
                    >
                      {route.origin} → {route.destination}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoute(route.id)}
                      disabled={deletingRouteId === route.id}
                      className="ml-1 rounded-full p-0.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete saved route"
                    >
                      {deletingRouteId === route.id ? (
                        <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Search form */}
        <section className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 py-8">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:flex-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  From
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Austin, TX"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-base text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                />
              </div>
              <div className="hidden sm:flex items-center justify-center pt-6">
                <IconRoute className="h-6 w-6 text-slate-400" />
              </div>
              <div className="w-full sm:flex-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  To
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. St. Louis, MO"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-base text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                />
              </div>
              <div className="pt-2 sm:pt-6 w-full sm:w-auto flex gap-2">
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full sm:w-auto rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <IconSpinner className="h-4 w-4 animate-spin" />
                      Finding Stops…
                    </span>
                  ) : (
                    "Find Safe Stops"
                  )}
                </button>
                {premiumEmail && origin.trim() && destination.trim() && (
                  <button
                    type="button"
                    onClick={handleSaveRoute}
                    disabled={savingRoute}
                    className="w-full sm:w-auto rounded-xl border-2 border-purple-300 bg-white px-4 py-3 text-sm font-semibold text-purple-600 shadow-sm transition-all hover:bg-purple-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  >
                    {savingRoute ? (
                      <span className="inline-flex items-center gap-2">
                        <IconSpinner className="h-4 w-4 animate-spin" />
                        Saving…
                      </span>
                    ) : (
                      "💎 Save Route"
                    )}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm font-medium text-red-500 text-center">{error}</p>
            )}

            {/* Premium upsell */}
            {!premiumEmail && (origin.trim() || destination.trim()) && (
              <div className="mt-4 text-center">
                <a
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                >
                  💎 Save routes with Premium
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        <section className="bg-[#FAFAF9] dark:bg-slate-950 py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-6">
            {/* Loading state */}
            {loading && (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
                  <IconSpinner className="h-8 w-8 animate-spin text-sky-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">
                  Planning your safe journey…
                </h3>
                <p className="mt-2 text-slate-500">
                  Searching for restaurants from {origin || "origin"} to{" "}
                  {destination || "destination"}
                </p>
              </div>
            )}

            {/* Results */}
            {!loading && result && (
              <>
                {/* Route summary */}
                {(result.distance || result.duration) && (
                  <div className="mb-8 mx-auto max-w-xl rounded-2xl border border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50 dark:from-sky-950 to-white dark:to-slate-900 p-6 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <IconRoute className="h-5 w-5 text-sky-500" />
                      <span className="text-sm font-semibold text-sky-600 uppercase tracking-wide">
                        Route Summary
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-3">
                      {result.distance && (
                        <div>
                          <p className="text-xs text-slate-500">Distance</p>
                          <p className="text-xl font-bold text-slate-800">{result.distance}</p>
                        </div>
                      )}
                      {result.duration && (
                        <div>
                          <p className="text-xs text-slate-500">Drive Time</p>
                          <p className="text-xl font-bold text-slate-800">{result.duration}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No restaurants found */}
                {result.cities.length === 0 && (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                      <IconRoute className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">
                      No restaurants found along this route
                    </h3>
                    <p className="mt-2 text-slate-500">
                      We don't have data for cities along this route yet. Try a
                      different route or check back soon as we expand coverage.
                    </p>
                  </div>
                )}

                {/* City groups */}
                {result.cities.map((city) => (
                  <div key={city.name} className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        📍 {city.name}
                      </h2>
                      <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold text-sky-700">
                        {city.restaurants.length} restaurant
                        {city.restaurants.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {city.restaurants.length > 0 ? (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {city.restaurants.map((r) => (
                          <RestaurantCard key={r.id} r={r} />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
                        <p className="text-slate-500 mb-4">
                          No verified restaurants in {city.name} yet.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => openSuggest(city.name)}
                            className="rounded-full border-2 border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-600 shadow-sm transition-all hover:bg-sky-50 hover:border-sky-300 active:scale-95 cursor-pointer"
                          >
                            ✏️ Suggest a restaurant in {city.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDiscover(city.name)}
                            disabled={discoveringCity === city.name}
                            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {discoveringCity === city.name ? (
                              <span className="inline-flex items-center gap-2">
                                <IconSpinner className="h-4 w-4 animate-spin" />
                                Discovering…
                              </span>
                            ) : (
                              `🔍 Discover restaurants in ${city.name}`
                            )}
                          </button>
                        </div>

                        {/* Discover results */}
                        {discoverResults !== null && discoveringCity === null && (
                          <div className="mt-6 text-left">
                            {discoverError && (
                              <p className="text-sm text-red-500 mb-3">{discoverError}</p>
                            )}
                            {discoverResults.length === 0 && !discoverError && (
                              <p className="text-sm text-slate-500">
                                No restaurants found for {city.name}. Try suggesting one manually.
                              </p>
                            )}
                            {discoverResults.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-slate-700 mb-3">
                                  Found {discoverResults.length} restaurant{discoverResults.length !== 1 ? "s" : ""} from Google Places:
                                </p>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {discoverResults.map((r) => {
                                    const isAdded = addedNames.has(r.name);
                                    const isAdding = addingName === r.name;
                                    return (
                                      <div
                                        key={r.name}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                                      >
                                        <div className="min-w-0 flex-1 mr-3">
                                          <p className="text-sm font-semibold text-slate-800 truncate">
                                            {r.name}
                                          </p>
                                          {r.address && (
                                            <p className="text-xs text-slate-500 truncate">
                                              {r.address}
                                            </p>
                                          )}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleAddDiscovered(r.name, city.name)}
                                          disabled={isAdded || isAdding}
                                          className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                            isAdded
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-sky-500 text-white hover:bg-sky-600 active:scale-95"
                                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                          {isAdding ? (
                                            <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                                          ) : isAdded ? (
                                            "Added ✓"
                                          ) : (
                                            "Add"
                                          )}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}


                {/* Route Map */}
                <div className="mt-10">
                  <RestaurantMap
                    restaurants={result.cities.flatMap((c) => c.restaurants)}
                    centerLat={getCityCoords(result.cities[0]?.name)?.lat ?? 39.8283}
                    centerLng={getCityCoords(result.cities[0]?.name)?.lng ?? -98.5795}
                    originLabel={origin}
                    destinationLabel={destination}
                    showRoute
                  />
                </div>

                {/* Write a review CTA */}
                {result.cities.length > 0 && (
                  <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500">
                      Been to one of these restaurants?{" "}
                      <a
                        href="/write-review"
                        className="font-medium text-sky-600 hover:text-sky-700 transition-colors"
                      >
                        Leave a safety review &rarr;
                      </a>
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!loading && !result && !error && (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
                  <IconRoute className="h-8 w-8 text-sky-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">
                  Plan your next safe road trip
                </h3>
                <p className="mt-2 text-slate-500">
                  Enter a starting point and destination above to find safe
                  restaurants along your route.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin("Austin, TX");
                      setDestination("St. Louis, MO");
                    }}
                    className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-600 shadow-sm transition-all hover:bg-sky-50 hover:border-sky-300 active:scale-95 cursor-pointer"
                  >
                    Austin → St. Louis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin("Austin, TX");
                      setDestination("Sarasota, FL");
                    }}
                    className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-600 shadow-sm transition-all hover:bg-sky-50 hover:border-sky-300 active:scale-95 cursor-pointer"
                  >
                    Austin → Sarasota
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin("Atlanta, GA");
                      setDestination("Nashville, TN");
                    }}
                    className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-600 shadow-sm transition-all hover:bg-sky-50 hover:border-sky-300 active:scale-95 cursor-pointer"
                  >
                    Atlanta → Nashville
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin("St. Louis, MO");
                      setDestination("Sarasota, FL");
                    }}
                    className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-600 shadow-sm transition-all hover:bg-sky-50 hover:border-sky-300 active:scale-95 cursor-pointer"
                  >
                    St. Louis → Sarasota
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Suggest Restaurant Modal */}
      {showSuggest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSuggest(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-800">
                🍽️ Suggest a Restaurant
              </h3>
              <button
                type="button"
                onClick={() => setShowSuggest(false)}
                className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-5">
              Know a restaurant that's allergy-friendly? Suggest it and we'll review it.
            </p>

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Restaurant Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={suggestName}
              onChange={(e) => setSuggestName(e.target.value)}
              placeholder="e.g. Green Leaf Bistro"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 mb-4"
            />

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              City <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={suggestCity}
              onChange={(e) => setSuggestCity(e.target.value)}
              placeholder="e.g. Portland"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 mb-4"
            />

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              State <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={suggestState}
              onChange={(e) => setSuggestState(e.target.value)}
              placeholder="e.g. OR"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 mb-4"
            />

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Your Email <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={suggestEmail}
              onChange={(e) => setSuggestEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 mb-6"
            />

            {suggestError && (
              <p className="mb-3 text-sm font-medium text-red-500">{suggestError}</p>
            )}
            {suggestMessage && (
              <p className="mb-3 text-sm font-medium text-emerald-600">{suggestMessage}</p>
            )}

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

      <Footer />
    </div>
  );
}
