import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import { useState, useEffect, useMemo } from "react";
import { ThemeToggle } from "~/components/ThemeToggle";
import { RestaurantMap, getCityCoords, type MapRestaurant } from "~/components/RestaurantMap";
import { getSubscriberCount, getRestaurantAndCityCounts, signupSubscriber } from "~/db";
import { getCurrentUser } from "~/db/auth";
import { getSessionToken, setCachedUser, clearSession, clearCachedUser } from "~/session";

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "";
  } catch {
    return "";
  }
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafePlate — Allergy-Safe Restaurant Finder | Celiac, Gluten-Free & Food Allergy Dining" },
      { name: "description", content: "Find restaurants with verified allergy protocols across 9 US cities. Safe dining for Celiac, gluten-free, dairy-free, nut-free, and more. Dine with confidence." },
      { property: "og:title", content: "SafePlate — Allergy-Safe Restaurant Finder | Celiac, Gluten-Free & Food Allergy Dining" },
      { property: "og:description", content: "Find restaurants with verified allergy protocols across 9 US cities. Safe dining for Celiac, gluten-free, dairy-free, nut-free, and more. Dine with confidence." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://safeplate.company/" },
      { property: "og:image", content: "https://safeplate.company/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SafePlate — Allergy-Safe Restaurant Finder | Celiac, Gluten-Free & Food Allergy Dining" },
      { name: "twitter:description", content: "Find restaurants with verified allergy protocols across 9 US cities. Safe dining for Celiac, gluten-free, dairy-free, nut-free, and more. Dine with confidence." },
      { name: "twitter:image", content: "https://safeplate.company/og-image.svg" },
    ],
    links: [
      { rel: "canonical", href: "https://safeplate.company/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SafePlate",
          url: "https://safeplate.company/",
          description: "Find restaurants with verified allergy protocols. Safe dining for Celiac, gluten-free, dairy-free, nut-free, and more.",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://safeplate.company/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "SafePlate",
          url: "https://safeplate.company/",
          description: "Allergy-safe restaurant finder helping people with Celiac, food allergies, and dietary restrictions dine with confidence.",
          logo: "https://safeplate.company/og-image.svg",
          sameAs: [],
        }),
      },
    ],
  }),
  loader: async () => {
    const [businessName, subCount, counts] = await Promise.all([
      getBusinessName(),
      getSubscriberCount(),
      getRestaurantAndCityCounts(),
    ]);
    // Fetch all restaurants for the homepage map
    let allRestaurants: MapRestaurant[] = [];
    try {
      const { searchRestaurants } = await import("~/db/restaurants");
      const data = await searchRestaurants({ data: {} });
      allRestaurants = (data as Array<{
        id: number; name: string; address: string; city: string;
        state: string; safety_tier: number;
      }>).map((r) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        city: r.city,
        state: r.state,
        safety_tier: r.safety_tier,
      }));
    } catch {
      // Map won't show if data fetch fails — that's fine
    }
    return { businessName, subCount, counts, allRestaurants };
  },
  component: Home,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG icons — lightweight, no dependency                     */
/* ------------------------------------------------------------------ */

function IconProfile({ className }: { className?: string }) {
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
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
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

function IconHeart({ className }: { className?: string }) {
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
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
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

function IconDatabase({ className }: { className?: string }) {
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
        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75"
      />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
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
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  );
}

function IconCheckCircle({ className }: { className?: string }) {
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

function IconExclamationTriangle({ className }: { className?: string }) {
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Section sub-components                                            */
/* ------------------------------------------------------------------ */

function NavBar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = getSessionToken();
    if (token) {
      getCurrentUser({ data: { token } }).then((u) => {
        if (u) {
          setCachedUser(u);
          setUserName(u.name);
          setUserRole(u.role);
        }
      });
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    clearCachedUser();
    setUserName(null);
    setUserRole(null);
    window.location.href = "/";
  };

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
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
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
            href="/pricing"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Pricing
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
          <ThemeToggle />
          {userName ? (
            <>
              {userRole === "restaurant_owner" ? (
                <a
                  href="/dashboard"
                  className="text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  Dashboard
                </a>
              ) : (
                <a
                  href="/profile"
                  className="text-sm font-medium text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  Profile
                </a>
              )}
              {userRole === "restaurant_owner" && (
                <a
                  href="/profile"
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                >
                  🏪 Owner
                </a>
              )}
              {userRole === "admin" && (
                <a
                  href="/admin/restaurants"
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                >
                  🔧 Admin
                </a>
              )}
              {userRole === "diner" && (
                <a
                  href="/write-review"
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
                >
                  Write Review
                </a>
              )}
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{userName}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
              >
                Log In
              </a>
              <a
                href="/signup"
                className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
              >
                Sign Up
              </a>
            </>
          )}
          <a
            href="/list-your-venue"
            className="rounded-full border-2 border-sky-500 px-5 py-2 text-sm font-semibold text-sky-600 shadow-sm transition-all hover:bg-sky-50 active:scale-95 dark:hover:bg-sky-950"
          >
            List Your Venue
          </a>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ subCount, restaurantCount, cityCount }: { subCount: number; restaurantCount: number; cityCount: number }) {
  const dietaryNeeds = [
    "Gluten-Free",
    "Dairy-Free",
    "Peanut Allergy",
    "Shellfish",
    "Vegan",
    "Keto",
  ];

  return (
    <section className="bg-[#FAFAF9] pt-20 pb-24 md:pt-28 md:pb-36 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-800 md:text-6xl md:leading-tight dark:text-slate-100">
          Dine with confidence,
          <br />
          <span className="text-sky-500">anywhere.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 md:text-xl dark:text-slate-400">
          Find dishes, ingredients, and restaurants that match your unique dietary
          needs — so you can dine out without the worry.
        </p>

        {/* Social Proof — subscriber & restaurant counts */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <svg className="h-4 w-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Join <span className="font-bold text-sky-500">{subCount.toLocaleString()}+</span> diners eating safely
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
          <span className="inline-flex items-center gap-1.5">
            <svg className="h-4 w-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
            <span className="font-bold text-sky-500">{restaurantCount.toLocaleString()}+</span> verified restaurants across <span className="font-bold text-sky-500">{cityCount}+</span> cities
          </span>
        </div>

        {/* Trust badge — explicitly NOT AI */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          Human-verified kitchen protocols — never AI-generated
        </div>

        {/* Search bar — the centerpiece */}
        <form
          className="mt-10 mx-auto max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.target as HTMLFormElement).querySelector("input");
            const q = input?.value.trim();
            if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
            else window.location.href = "/search";
          }}
        >
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search for a dish, ingredient, or restaurant..."
              className="w-full rounded-full border border-slate-200 bg-white py-4 pl-12 pr-5 text-base text-slate-800 placeholder:text-slate-400 shadow-md shadow-slate-200/50 transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-slate-900/50"
            />
          </div>
        </form>

        {/* Dietary need pill buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {dietaryNeeds.map((need) => (
            <a
              key={need}
              href={`/search?q=${encodeURIComponent(need)}`}
              className="rounded-full border border-sky-200 bg-white px-5 py-2.5 text-sm font-medium text-sky-600 shadow-sm transition-all hover:bg-sky-50 hover:border-sky-300 active:scale-95 cursor-pointer no-underline dark:border-sky-800 dark:bg-slate-800 dark:text-sky-400 dark:hover:bg-sky-950 dark:hover:border-sky-700"
            >
              {need}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      title: "Set Your Allergies",
      body: "Tell us what you need to avoid — peanuts, dairy, gluten, or any of the 14 major allergens. Your profile travels with you everywhere.",
      icon: IconProfile,
    },
    {
      number: "2",
      title: "Search Any Dish or Restaurant",
      body: "Looking up a menu item or checking out a new spot? SafePlate cross-references it against your allergen profile — and looks past the menu to verify how the food is actually prepared.",
      icon: IconSearch,
    },
    {
      number: "3",
      title: "Eat with Confidence",
      body: "See at a glance what's safe, what's risky, and what to ask about. No more guessing games at the dinner table.",
      icon: IconHeart,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-white py-24 md:py-32 dark:bg-slate-900"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-sky-600 uppercase">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 md:text-4xl dark:text-slate-100">
            Three steps to safer dining
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            No complicated setup. Just tell us your needs and start searching.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.number}
              className="group relative rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-lg font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                {s.number}
              </span>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition-colors dark:bg-sky-900 dark:text-sky-400 dark:group-hover:bg-sky-800">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: "Personalized Profiles",
      body: "Build profiles for yourself and your family. Track multiple allergies, intolerances, and dietary preferences all in one place.",
      icon: IconShield,
    },
    {
      title: "Comprehensive Database",
      body: "We look past the menu to verify how the food is actually prepared. We track kitchen protocols, dedicated fryers, and cross-contamination risks — not just ingredients.",
      icon: IconDatabase,
    },
    {
      title: "Real-Time Results",
      body: "Get instant answers when you need them most — standing at the counter, scanning a menu, or ordering safe takeout.",
      icon: IconBolt,
    },
  ];

  return (
    <section className="bg-[#FAFAF9] py-24 md:py-32 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-sky-600 uppercase">
            Why SafePlate
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 md:text-4xl dark:text-slate-100">
            Designed for peace of mind
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Built with the same care you take with every meal.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900 dark:text-sky-400">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>

        {/* Safety indicator legend */}
        <div className="mt-16 mx-auto max-w-xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 text-center mb-4 dark:text-slate-400">
            Our safety indicators
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                <IconCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Safe</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Dedicated allergen-free</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                <IconExclamationTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Caution</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Shared kitchen, protocols in place</p>
              </div>
            </div>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mt-16 mx-auto max-w-2xl rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-8 shadow-sm dark:border-sky-800 dark:from-sky-950 dark:to-slate-900">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-sm font-semibold text-sky-600 dark:border-sky-700 dark:bg-slate-800 dark:text-sky-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              What We Offer
            </span>
            <h3 className="mt-5 text-xl font-bold text-slate-800 dark:text-slate-100">Tools to help you dine safely</h3>
          </div>

          {/* Live features */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/search"
              className="group rounded-xl border border-sky-200 bg-white p-5 text-center shadow-sm transition-all hover:border-sky-300 hover:shadow-md dark:border-sky-800 dark:bg-slate-800 dark:hover:border-sky-700"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800 transition-colors group-hover:text-sky-600 dark:text-slate-200 dark:group-hover:text-sky-400">Restaurant Search</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Find safe restaurants in Austin, Atlanta, Chicago, Dallas, Denver, Nashville, Portland, St. Louis, Sarasota, and beyond</p>
            </a>

            <a
              href="/travel-cards"
              className="group rounded-xl border border-sky-200 bg-white p-5 text-center shadow-sm transition-all hover:border-sky-300 hover:shadow-md dark:border-sky-800 dark:bg-slate-800 dark:hover:border-sky-700"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
                </svg>
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800 transition-colors group-hover:text-sky-600 dark:text-slate-200 dark:group-hover:text-sky-400">Allergen Translation Cards</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">14 allergens in 13 languages — dine safely anywhere</p>
            </a>

            <a
              href="/update-listing"
              className="group rounded-xl border border-sky-200 bg-white p-5 text-center shadow-sm transition-all hover:border-sky-300 hover:shadow-md dark:border-sky-800 dark:bg-slate-800 dark:hover:border-sky-700"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800 transition-colors group-hover:text-sky-600 dark:text-slate-200 dark:group-hover:text-sky-400">Update Your Listing</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Restaurant owners: keep your protocols up to date</p>
            </a>

            <a
              href="/route-planner"
              className="group rounded-xl border border-sky-200 bg-white p-5 text-center shadow-sm transition-all hover:border-sky-300 hover:shadow-md dark:border-sky-800 dark:bg-slate-800 dark:hover:border-sky-700"
            >
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21l16.5-9M3.75 3l16.5 9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747" />
                </svg>
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800 transition-colors group-hover:text-sky-600 dark:text-slate-200 dark:group-hover:text-sky-400">Safe Journey Route Planner</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Find safe stops along any road trip route</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const MAIN_ALLERGENS = [
  "Gluten",
  "Dairy",
  "Peanuts",
  "Tree Nuts",
  "Shellfish",
  "Soy",
  "Eggs",
  "Fish",
  "Sesame",
];

function NewsletterSignupSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [successAllergens, setSuccessAllergens] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      setStatus("error");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const result = await signupSubscriber({
        data: {
          name: name.trim(),
          email: email.trim(),
          selected_allergens: selectedAllergens.length > 0 ? selectedAllergens : null,
        },
      });
      if (result.success) {
        const savedAllergens = [...selectedAllergens];
        setStatus("success");
        setName("");
        setEmail("");
        setSelectedAllergens([]);
        // Use savedAllergens for the success message (captured before reset)
        setSuccessAllergens(savedAllergens);
      } else {
        setErrorMsg(result.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section className="bg-white py-24 md:py-32 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow-md border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          <span className="text-sm font-semibold tracking-wide text-sky-600 uppercase">
            Stay Updated
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 md:text-4xl dark:text-slate-100">
            Get personalized safe dining alerts
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Join our community of diners eating safely. We'll send you new restaurant discoveries, safety tips, and alerts tailored to your allergens.
          </p>

          {/* Allergen selector pills */}
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-500 mb-3 dark:text-slate-400">
              Select your allergens for personalized updates:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {MAIN_ALLERGENS.map((allergen) => {
                const selected = selectedAllergens.includes(allergen);
                return (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => toggleAllergen(allergen)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer border ${
                      selected
                        ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:bg-sky-50 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:border-sky-600"
                    }`}
                  >
                    {allergen}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Signup form */}
          {status === "success" ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold">Welcome! You're all set.</p>
              {successAllergens.length > 0 ? (
                <p className="mt-1 text-sm">
                  We'll help you find safe dining for your {successAllergens.join(", ").toLowerCase()}.
                </p>
              ) : (
                <p className="mt-1 text-sm">
                  We'll keep you posted on the latest safe dining options.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              {status === "error" && errorMsg && (
                <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-full bg-sky-500 px-10 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Joining..." : "Join Free"}
              </button>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                No spam, ever. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

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
            href="/update-listing"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Update Your Listing
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
/*  Page assembly                                                     */
/* ------------------------------------------------------------------ */

function Home() {
  const loaderData = Route.useLoaderData();
  const subCount = loaderData?.subCount?.count ?? 0;
  const restaurantCount = loaderData?.counts?.restaurantCount ?? 0;
  const cityCount = loaderData?.counts?.cityCount ?? 0;
  const allRestaurants = loaderData?.allRestaurants ?? [];

  // City slugs mapping for map pins — hardcoded featured cities
  const citySlugs: Record<string, string> = {
    "Austin": "austin",
    "Atlanta": "atlanta",
    "Chicago": "chicago",
    "Dallas": "dallas",
    "Denver": "denver",
    "Nashville": "nashville",
    "Portland": "portland",
    "St. Louis": "st-louis",
    "Sarasota": "sarasota",
  };

  // Generate a URL slug for any city name (spaces -> hyphens, lowercase)
  const getCitySlug = (city: string): string => {
    if (citySlugs[city]) return citySlugs[city];
    return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  // Group restaurants by city for the overview map
  const cityMapData = useMemo(() => {
    const grouped: Record<string, { count: number; tier1: number; tier2: number; tier3: number }> = {};
    for (const r of allRestaurants) {
      const city = r.city || "Unknown";
      if (!grouped[city]) grouped[city] = { count: 0, tier1: 0, tier2: 0, tier3: 0 };
      grouped[city].count++;
      if (r.safety_tier === 1) grouped[city].tier1++;
      else if (r.safety_tier === 2) grouped[city].tier2++;
      else grouped[city].tier3++;
    }
    return grouped;
  }, [allRestaurants]);

  // Create synthetic "restaurants" for city-level map markers
  const cityMarkers: MapRestaurant[] = useMemo(() => {
    return Object.entries(cityMapData).map(([city, data]) => {
      const coords = getCityCoords(city);
      return {
        id: 0,
        name: `${city} (${data.count} restaurants)`,
        address: `${data.tier1} Tier 1 · ${data.tier2} Tier 2 · ${data.tier3} Tier 3`,
        city,
        state: "",
        safety_tier: data.tier1 > 0 ? 1 : data.tier2 > 0 ? 2 : 3,
        lat: coords?.lat,
        lng: coords?.lng,
      };
    });
  }, [cityMapData]);

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "SafePlate",
            description:
              "SafePlate helps people with food allergies and dietary restrictions find safe dishes, ingredients, and restaurants based on their allergen profile.",
            url: "https://safeplate.company",
            logo: "https://safeplate.company/og-image.svg",
            sameAs: [],
            numberOfEmployees: subCount > 0 ? `${subCount}+` : undefined,
            ...(restaurantCount > 0 ? {
              makesOffer: {
                "@type": "Offer",
                description: `${restaurantCount}+ verified restaurants across ${cityCount}+ cities`,
              },
            } : {}),
          }),
        }}
      />
      <NavBar />
      <main>
        <HeroSection subCount={subCount} restaurantCount={restaurantCount} cityCount={cityCount} />
        
        {/* USA Overview Map */}
        {cityMarkers.length > 0 && (
          <section className="bg-[#FAFAF9] pb-16 md:pb-24 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl px-6">
              <div className="mx-auto max-w-2xl text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl dark:text-slate-100">
                  Explore restaurants across the USA
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Click a city pin to browse its dining guide — or select a city below.
                </p>
              </div>
              <RestaurantMap
                restaurants={cityMarkers}
                centerLat={39.8283}
                centerLng={-98.5795}
              />
              {/* City quick links */}
              {(() => {
                const entries = Object.entries(cityMapData);
                const featured = entries.filter(([city]) => citySlugs[city]);
                const others = entries.filter(([city]) => !citySlugs[city]);

                const renderCityLink = ([city, data]: [string, { count: number }], isFeatured: boolean) => {
                  const slug = getCitySlug(city);
                  return (
                    <a
                      key={city}
                      href={`/city/${slug}`}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-all hover:bg-sky-50 hover:border-sky-300 dark:hover:bg-sky-950 ${
                        isFeatured
                          ? "border-sky-200 bg-white text-sky-600 dark:border-sky-800 dark:bg-slate-800 dark:text-sky-400"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }`}
                    >
                      📍 {city}
                      <span className="text-xs text-slate-400 dark:text-slate-500">({data.count})</span>
                    </a>
                  );
                };

                return (
                  <>
                    {featured.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-semibold text-slate-500 mb-3 text-center dark:text-slate-400">⭐ Featured Cities</p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {featured.map((entry) => renderCityLink(entry, true))}
                        </div>
                      </div>
                    )}
                    {others.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-slate-500 mb-3 text-center dark:text-slate-400">🗺️ More Cities</p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {others.map((entry) => renderCityLink(entry, false))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </section>
        )}
        
        <HowItWorksSection />
        <FeaturesSection />
        <NewsletterSignupSection />
      </main>
      <Footer />
    </div>
  );
}
