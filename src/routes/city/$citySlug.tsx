import { RestaurantMap, type MapRestaurant } from "~/components/RestaurantMap";
import { sql } from "~/db";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { searchRestaurants } from "~/db/restaurants";
import { ThemeToggle } from "~/components/ThemeToggle";
import { getCurrentUser } from "~/db/auth";
import { getSessionToken, setCachedUser, clearSession, clearCachedUser } from "~/session";

/* ------------------------------------------------------------------ */
/*  City -> Slug mapping                                               */
/* ------------------------------------------------------------------ */

const CITY_MAP: Record<string, { city: string; state: string; label: string }> = {
  austin: { city: "Austin", state: "TX", label: "Austin, TX" },
  "st-louis": { city: "St. Louis", state: "MO", label: "St. Louis, MO" },
  sarasota: { city: "Sarasota", state: "FL", label: "Sarasota, FL" },
  chicago: { city: "Chicago", state: "IL", label: "Chicago, IL" },
  dallas: { city: "Dallas", state: "TX", label: "Dallas, TX" },
  denver: { city: "Denver", state: "CO", label: "Denver, CO" },
  atlanta: { city: "Atlanta", state: "GA", label: "Atlanta, GA" },
  nashville: { city: "Nashville", state: "TN", label: "Nashville, TN" },
  portland: { city: "Portland", state: "OR", label: "Portland, OR" },
};

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Austin: { lat: 30.2672, lng: -97.7431 },
  Atlanta: { lat: 33.7490, lng: -84.3880 },
  Chicago: { lat: 41.8781, lng: -87.6298 },
  Dallas: { lat: 32.7767, lng: -96.7970 },
  Denver: { lat: 39.7392, lng: -104.9903 },
  Nashville: { lat: 36.1627, lng: -86.7816 },
  Portland: { lat: 45.5152, lng: -122.6784 },
  "St. Louis": { lat: 38.6270, lng: -90.1994 },
  Sarasota: { lat: 27.3364, lng: -82.5307 },
};

function getCityInfo(slug: string) {
  return CITY_MAP[slug] ?? null;
}

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

const ALLERGENS = [
  "Gluten", "Dairy", "Peanuts", "Tree Nuts", "Eggs", "Soy", "Fish", "Shellfish",
];

const TIERS = [
  { value: 1, label: "Dedicated", emoji: "🟢", color: "emerald" },
  { value: 2, label: "Protocols", emoji: "🟡", color: "amber" },
  { value: 3, label: "Friendly", emoji: "🔵", color: "sky" },
] as const;

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/city/$citySlug")({
  loader: async ({ params }) => {
    const slug = params.citySlug;
    let info = getCityInfo(slug);

    // If not in hardcoded CITY_MAP, try looking up in the database
    if (!info) {
      const cityName = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      const rows = await sql()`SELECT DISTINCT city FROM restaurants WHERE lower(city) = lower(${cityName}) LIMIT 1`;
      if (rows.length > 0) {
        const foundCity = (rows[0] as { city: string }).city;
        info = { city: foundCity, state: "", label: foundCity };
      }
    }

    if (!info) {
      throw new Error("City not found");
    }
    const data = await searchRestaurants({
      data: { city: info.city },
    });
    return {
      restaurants: data as Restaurant[],
      cityInfo: info,
      slug,
    };
  },
  head: ({ loaderData }) => {
    const info = loaderData?.cityInfo;
    const city = info?.city ?? "Unknown";
    const state = info?.state ?? "";
    const title = `Allergy-Safe Restaurants in ${city} — Verified Protocols, Trusted Reviews | SafePlate`;
    const description = `Find verified allergy-safe restaurants in ${city}. Filter by dedicated fryers, isolated prep stations, kitchen protocols. Perfect for Celiac, gluten-free, and food allergies.`;
    const canonicalPath = loaderData?.slug ? `/city/${loaderData.slug}` : "/";

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://safeplate.company${canonicalPath}` },
        { property: "og:image", content: "https://safeplate.company/og-image.svg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: "https://safeplate.company/og-image.svg" },
      ],
      links: [
        { rel: "canonical", href: `https://safeplate.company${canonicalPath}` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify((() => {
            const list = (loaderData?.restaurants ?? []) as Array<{ id: number; name: string; description: string | null; cuisine_type: string | null; address: string }>;
            return {
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: list.slice(0, 50).map((r, i) => ({
                "@type": "Restaurant",
                position: i + 1,
                name: r.name,
                description: r.description ?? `Allergy-safe restaurant in ${city}, ${state}`,
                servesCuisine: r.cuisine_type ?? "American",
                address: { "@type": "PostalAddress", addressLocality: city, addressRegion: state, streetAddress: r.address },
              })),
            };
          })()),
        },
      ],
    };
  },
  component: CityPage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
/* ------------------------------------------------------------------ */

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function IconFryer({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
    </svg>
  );
}

function IconPrep({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-2.75-2.75m0 0l-3.875-3.875a2.125 2.125 0 013.004-3.004l3.871 3.871m-.254.254l2.75 2.75a2.125 2.125 0 01-3.004 3.004L7.287 12.42m-.254-.254l5.004-5.004" />
    </svg>
  );
}

function IconStaff({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

function IconVerified({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Tier helpers                                                      */
/* ------------------------------------------------------------------ */

function getTierStyles(tier: number) {
  switch (tier) {
    case 1:
      return { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Dedicated", emoji: "🟢" };
    case 2:
      return { badge: "bg-amber-100 text-amber-700 border-amber-200", label: "Protocols", emoji: "🟡" };
    case 3:
      return { badge: "bg-sky-100 text-sky-700 border-sky-200", label: "Friendly", emoji: "🔵" };
    default:
      return { badge: "bg-slate-100 text-slate-700 border-slate-200", label: "Unknown", emoji: "⚪" };
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
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-lg">🍽️</span>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">SafePlate</span>
        </a>
        <div className="flex items-center gap-6">
          <a href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Home</a>
          <a href="/search" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Search</a>
          <a href="/route-planner" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Route Planner</a>
          <a href="/profile" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Profile</a>
          <a href="/travel-cards" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Travel Cards</a>
          <a href="/about" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">About</a>
          <a href="/faq" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">FAQ</a>
          <a href="/onboarding" className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95">Get Started</a>
        </div>
      </div>
    </header>
  );
}

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
        <p className="text-sm text-slate-500 dark:text-slate-400">&copy; {new Date().getFullYear()} SafePlate. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Keyword-rich content per city                                     */
/* ------------------------------------------------------------------ */

function cityContent(slug: string, city: string, state: string) {
  const content: Record<string, { intro: string; dining: string; safety: string; closing: string }> = {
    austin: {
      intro: `Austin is one of the most allergy-aware food cities in Texas, with a thriving gluten-free and allergen-friendly dining scene. From dedicated gluten-free bakeries to farm-to-table restaurants with rigorous kitchen protocols, ${city} offers safe dining options for people with Celiac disease, food allergies, and dietary restrictions.`,
      dining: `The ${city} dining scene spans everything from award-winning BBQ joints that accommodate gluten-free diners to entirely plant-based and gluten-free cafes. South Congress, East Austin, and downtown are particularly dense with restaurants that offer allergen menus, dedicated fryers, and staff trained in cross-contamination prevention.`,
      safety: `When dining in ${city}, look for our Tier 1 (Dedicated) restaurants for the highest level of safety — these are facilities with dedicated allergen-free kitchens, isolated prep stations, and zero cross-contamination risk. Tier 2 (Protocols) restaurants have certified allergen protocols in place, while Tier 3 (Friendly) restaurants offer accommodations but may have shared kitchen equipment. Always communicate your specific needs to the staff, even at highly-rated venues.`,
      closing: `SafePlate is constantly updating our ${city} restaurant database. If you know of an allergy-friendly restaurant we've missed, suggest it through our search page. Dining safely in ${city} is possible — let SafePlate be your guide.`,
    },
    "st-louis": {
      intro: `St. Louis has quietly become a standout Midwestern city for allergen-aware dining, with an impressive density of dedicated gluten-free bakeries, pizzerias, and restaurants that take food allergies seriously. From The Hill's Italian spots to downtown eateries, ${city} offers safe options for Celiac and food-allergic diners.`,
      dining: `${city}'s dining landscape ranges from 100% dedicated gluten-free facilities to restaurants with detailed allergen matrices and trained staff. The Central West End, The Hill, and downtown all feature restaurants with dedicated fryers and isolated prep stations.`,
      safety: `In ${city}, our Tier 1 venues are entirely dedicated allergen-free facilities — the gold standard for Celiac-safe dining. Tier 2 restaurants maintain certified allergen protocols, and Tier 3 venues offer dietary-friendly options. Always verify current protocols with the restaurant, as kitchens and menus can change.`,
      closing: `SafePlate is committed to keeping our ${city} guide accurate and up to date. If you discover a new allergy-safe spot or notice a change at an existing one, report it through our alert system to help the community dine safely.`,
    },
    sarasota: {
      intro: `${city}, Florida, is a surprisingly rich destination for allergen-safe dining, with a concentration of health-conscious restaurants catering to gluten-free, dairy-free, and allergy-restricted diners. The Gulf Coast city's farm-to-table ethos naturally extends to careful ingredient sourcing and kitchen protocols.`,
      dining: `From downtown ${city} to the beaches, restaurants here range from dedicated gluten-free facilities to flexible kitchens that can accommodate most dietary restrictions. The area's health-conscious culture means many chefs are well-versed in handling allergen requests.`,
      safety: `Our ${city} restaurant tiers help you navigate with confidence: Tier 1 for dedicated allergen-free kitchens, Tier 2 for verified protocols, and Tier 3 for dietary-friendly options. Always confirm current kitchen practices directly, especially during peak tourist seasons when protocols may shift.`,
      closing: `SafePlate is building the most comprehensive allergy-safe dining guide for ${city}. Help us grow by suggesting restaurants and reporting menu changes so every diner can eat with peace of mind.`,
    },
    chicago: {
      intro: `Chicago is one of America's great food cities, and it's also increasingly one of the most accommodating for diners with Celiac disease, food allergies, and dietary restrictions. From dedicated gluten-free bakeries in Lakeview to allergen-aware fine dining downtown, ${city} has safe options at every price point.`,
      dining: `${city}'s neighborhoods each offer distinct allergy-safe dining experiences. Wicker Park, Lincoln Park, and the West Loop are home to restaurants with dedicated fryers, gluten-free menus, and kitchen teams trained in cross-contamination prevention. The city's diverse culinary landscape means you'll find safe Italian, Mexican, Asian, and American fare.`,
      safety: `When exploring ${city}'s restaurant scene, our Tier 1 venues provide the highest confidence with dedicated allergen-free facilities. Tier 2 restaurants follow certified allergen protocols, and Tier 3 spots offer dietary-friendly modifications. Chicago's health department standards add an additional layer of safety — but always communicate your specific allergies to your server.`,
      closing: `SafePlate is constantly expanding our ${city} guide. If you discover a new Celiac-safe restaurant or notice a change at an existing spot, use our community alert system to keep fellow diners informed. Eat safely in the Windy City with SafePlate.`,
    },
    dallas: {
      intro: `${city} has emerged as a surprisingly strong market for allergen-safe dining, with dedicated gluten-free restaurants, allergen-aware BBQ joints, and health-conscious eateries spread across the metroplex. From Deep Ellum to the suburbs, ${city} takes food allergies seriously.`,
      dining: `The ${city} dining scene offers everything from 100% dedicated gluten-free kitchens to flexible restaurants that can accommodate most common allergens. Areas like Lower Greenville, Uptown, and the suburbs (Frisco, Plano) are home to the highest concentration of allergy-safe venues.`,
      safety: `In ${city}, rely on our tier system for guidance: Tier 1 venues are entirely dedicated, Tier 2 maintain certified protocols, and Tier 3 offer friendly accommodations. ${city}'s restaurant scene is competitive, and many chefs pride themselves on accommodating dietary needs — but always verify current protocols.`,
      closing: `SafePlate is building the definitive allergy-safe dining guide for ${city} and the surrounding metro area. Help our community by suggesting restaurants and reporting changes so every diner can eat with confidence in DFW.`,
    },
    denver: {
      intro: `${city} is one of the most health-conscious and allergy-aware cities in America. With a strong outdoor and wellness culture, ${city}'s restaurant scene has embraced gluten-free, dairy-free, and allergen-safe dining with enthusiasm, offering some of the best options in the Mountain West.`,
      dining: `From ${city}'s RiNo district to Capitol Hill and the Highlands, restaurants here range from dedicated gluten-free bakeries to chef-driven kitchens with rigorous allergen protocols. The city's farm-to-table movement and health-focused ethos mean many venues are well-prepared for allergy-restricted diners.`,
      safety: `Our ${city} guide uses three tiers: Tier 1 for dedicated allergen-free facilities (the gold standard), Tier 2 for restaurants with verified allergen protocols, and Tier 3 for dietary-friendly venues. ${city}'s high altitude can affect baking and cooking — always confirm that gluten-free items are prepared with dedicated equipment.`,
      closing: `SafePlate is committed to making ${city} one of the easiest cities for allergy-safe dining. Report new discoveries and menu changes through our platform so we can keep the ${city} community protected and informed.`,
    },
    nashville: {
      intro: `${city} is famous for hot chicken and Southern comfort food, but it's also home to an increasingly vibrant allergen-safe dining scene. From dedicated gluten-free kitchens to restaurants with detailed allergen protocols, Music City has safe options for diners with dietary restrictions.`,
      dining: `${city}'s food scene spans classic Southern fare, modern American cuisine, and international flavors — and many restaurants now offer dedicated gluten-free menus, allergen-trained staff, and isolated prep areas. East Nashville, The Gulch, and 12 South are hotspots for allergy-friendly dining.`,
      safety: `In ${city}, our Tier 1 restaurants are entirely dedicated allergen-free facilities. Tier 2 venues maintain certified allergen protocols with trained staff and separate prep areas. Tier 3 spots offer dietary-friendly modifications but operate in shared kitchens. ${city}'s Southern cooking traditions mean butter and flour are common — always specify your needs clearly.`,
      closing: `SafePlate is growing our ${city} guide to make Music City accessible for every diner. Help us by suggesting allergy-safe restaurants and reporting changes through our community alert system.`,
    },
    portland: {
      intro: `${city} is arguably the most allergy-aware city in the Pacific Northwest and one of the best in the nation for Celiac-safe and allergen-friendly dining. Known for its food cart culture and farm-to-table ethos, ${city} has an extraordinary density of dedicated gluten-free and allergy-conscious restaurants.`,
      dining: `From ${city}'s famous food carts to its James Beard-awarded restaurants, safe dining options abound. Neighborhoods like Hawthorne, Alberta Arts, and the Pearl District are packed with venues offering dedicated fryers, allergen menus, and staff trained in cross-contamination prevention. The city's progressive food culture means chefs take allergies seriously.`,
      safety: `In ${city}, our tier system helps you choose: Tier 1 for entirely dedicated allergen-free kitchens, Tier 2 for restaurants with verified protocols, and Tier 3 for dietary-friendly spots. ${city}'s restaurant community is exceptionally knowledgeable about food allergies, but protocols can vary — always communicate your needs.`,
      closing: `SafePlate is building the most comprehensive guide to allergy-safe dining in ${city}. If you find a great safe spot we haven't listed, suggest it through our platform. Together, we can make ${city} the most accessible food city for everyone.`,
    },
  };

  return content[slug] ?? {
    intro: `${city}, ${state} is home to a growing number of restaurants that cater to food allergies and dietary restrictions. SafePlate helps you find verified restaurants with dedicated kitchens, allergen protocols, and dietary-friendly options.`,
    dining: `Whether you're looking for a dedicated gluten-free bakery, a restaurant with certified allergen protocols, or simply a venue that understands dietary restrictions, ${city} has options to explore.`,
    safety: `SafePlate categorizes restaurants into three tiers: Tier 1 (Dedicated) for entirely allergen-free facilities, Tier 2 (Protocols) for restaurants with verified allergen safety procedures, and Tier 3 (Friendly) for venues that accommodate dietary needs. Always verify current protocols directly with the restaurant.`,
    closing: `SafePlate is constantly updating our database. Help our community by suggesting restaurants we may have missed. Dine safely in ${city} with SafePlate.`,
  };
}

/* ------------------------------------------------------------------ */
/*  City page component                                               */
/* ------------------------------------------------------------------ */

function CityPage() {
  const { restaurants, cityInfo, slug } = Route.useLoaderData();
  const city = cityInfo.city;
  const state = cityInfo.state;
  const cityCoords = CITY_COORDS[city] ?? { lat: 39.8283, lng: -98.5795 };

  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedFreeFrom, setSelectedFreeFrom] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let result = restaurants;
    if (selectedTier !== null) {
      result = result.filter((r) => r.safety_tier === selectedTier);
    }
    if (selectedFreeFrom.length > 0) {
      result = result.filter((r) =>
        selectedFreeFrom.every((a) =>
          r.free_from.some((f) => f.toLowerCase() === a.toLowerCase()),
        ),
      );
    }
    return result;
  }, [restaurants, selectedTier, selectedFreeFrom]);

  const toggleTier = (tier: number) => {
    setSelectedTier((prev) => (prev === tier ? null : tier));
  };

  const toggleFreeFrom = (allergen: string) => {
    setSelectedFreeFrom((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen],
    );
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const content = cityContent(slug, city, state);

  const tierCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    restaurants.forEach((r) => { counts[r.safety_tier] = (counts[r.safety_tier] ?? 0) + 1; });
    return counts;
  }, [restaurants]);

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Gluten-Free & Allergen-Safe Restaurants in ${city}, ${state}`,
            description: `SafePlate's curated guide to verified gluten-free, dairy-free, and allergen-safe restaurants in ${city}, ${state}. Filter by safety tier and dietary needs.`,
            url: `https://safeplate.company/city/${slug}`,
            numberOfItems: filtered.length,
            itemListElement: filtered.map((r, i) => ({
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

      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://safeplate.company/" },
              { "@type": "ListItem", position: 2, name: "Search", item: "https://safeplate.company/search" },
              { "@type": "ListItem", position: 3, name: `${city}, ${state}`, item: `https://safeplate.company/city/${slug}` },
            ],
          }),
        }}
      />

      <NavBar />
      <main>
        {/* Hero */}
        <section className="bg-[#FAFAF9] pt-16 pb-10 md:pt-24 md:pb-14">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <nav className="mb-4 text-sm text-slate-400" aria-label="Breadcrumb">
              <a href="/" className="hover:text-sky-500 transition-colors">Home</a>
              <span className="mx-2">/</span>
              <a href="/search" className="hover:text-sky-500 transition-colors">Search</a>
              <span className="mx-2">/</span>
              <span className="text-slate-600">{city}, {state}</span>
            </nav>

            <h1 className="text-3xl font-bold tracking-tight text-slate-800 md:text-5xl md:leading-tight">
              Gluten-Free &amp; Allergen-Safe<br />
              Restaurants in{" "}
              <span className="text-sky-500">{city}, {state}</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              Find verified restaurants with dedicated kitchens, allergen protocols, and dietary-friendly options
              in {city}. SafePlate helps you dine out with confidence.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <IconShield className="h-4 w-4" />
              Human-verified kitchen protocols — never AI-generated
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              <span className="rounded-full bg-emerald-100 px-4 py-1.5 font-semibold text-emerald-700">🟢 {tierCounts[1]} Dedicated</span>
              <span className="rounded-full bg-amber-100 px-4 py-1.5 font-semibold text-amber-700">🟡 {tierCounts[2]} Protocols</span>
              <span className="rounded-full bg-sky-100 px-4 py-1.5 font-semibold text-sky-700">🔵 {tierCounts[3]} Friendly</span>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b border-slate-100 bg-white py-5">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-medium text-slate-500 mr-1">Safety tier:</span>
              {TIERS.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => toggleTier(tier.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 cursor-pointer ${getTierPillStyles(tier.value, selectedTier === tier.value)}`}
                >
                  {tier.emoji} {tier.label}
                </button>
              ))}
              {selectedTier && (
                <button type="button" onClick={() => setSelectedTier(null)} className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">Clear</button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-medium text-slate-500 mr-1">Free from:</span>
              {ALLERGENS.map((allergen) => {
                const isSelected = selectedFreeFrom.includes(allergen);
                return (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => toggleFreeFrom(allergen)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95 cursor-pointer ${
                      isSelected ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {isSelected && "✓ "}{allergen}
                  </button>
                );
              })}
              {selectedFreeFrom.length > 0 && (
                <button type="button" onClick={() => setSelectedFreeFrom([])} className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">Clear all</button>
              )}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="bg-[#FAFAF9] py-10 md:py-14">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-6 text-sm text-slate-500">
              {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""} found
              {selectedTier !== null && ` (filtered by tier)`}
              {selectedFreeFrom.length > 0 && ` (free from: ${selectedFreeFrom.join(", ")})`}
            </p>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <IconSearch className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">No restaurants match your filters</h3>
                <p className="mt-2 text-slate-500">Try adjusting your tier or allergen filters to see more results in {city}.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((r) => {
                  const tier = getTierStyles(r.safety_tier);
                  return (
                    <div key={r.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-800 leading-snug">{r.name}</h3>
                        {r.verified && <IconVerified className="h-5 w-5 flex-shrink-0 text-emerald-500 mt-0.5" />}
                      </div>
                      {r.cuisine_type && (
                        <span className="mt-2 inline-block self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs font-medium text-slate-600">{r.cuisine_type}</span>
                      )}
                      <div className="mt-3">
                        <span className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-semibold ${tier.badge}`}>
                          {tier.emoji} Tier {r.safety_tier} &middot; {tier.label}
                        </span>
                      </div>
                      <div className="mt-3 flex items-start gap-1.5 text-sm text-slate-500">
                        <IconPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                        <span>{r.address}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {r.has_dedicated_fryer && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><IconFryer className="h-3.5 w-3.5" /> Dedicated Fryer</span>
                        )}
                        {r.has_isolated_prep && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><IconPrep className="h-3.5 w-3.5" /> Isolated Prep</span>
                        )}
                        {r.allergen_trained_staff && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><IconStaff className="h-3.5 w-3.5" /> Trained Staff</span>
                        )}
                      </div>
                      {r.free_from && r.free_from.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {r.free_from.map((a) => (
                            <span key={a} className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">✓ {capitalize(a)}</span>
                          ))}
                        </div>
                      )}
                      {r.description && (
                        <p className="mt-4 text-sm leading-relaxed text-slate-500 line-clamp-2">{r.description}</p>
                      )}
                      <div className="mt-auto pt-4">
                        {r.website && (
                          <a href={r.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors">Visit website &rarr;</a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>


        {/* Google Map */}
        <section className="bg-[#FAFAF9] py-8 md:py-10 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-6">
            <RestaurantMap
              restaurants={restaurants}
              centerLat={cityCoords.lat}
              centerLng={cityCoords.lng}
            />
          </div>
        </section>

        {/* Keyword-rich SEO content */}
        <section className="bg-white py-16 md:py-20 dark:bg-slate-900">
          <div className="mx-auto max-w-3xl px-6">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Allergy-Safe Dining in {city}, {state}</h2>
              <p className="text-slate-600 leading-relaxed mb-4">{content.intro}</p>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">The {city} Food Scene</h3>
              <p className="text-slate-600 leading-relaxed mb-4">{content.dining}</p>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Understanding Our Safety Tiers</h3>
              <p className="text-slate-600 leading-relaxed mb-4">{content.safety}</p>

              <div className="mt-8 rounded-2xl bg-sky-50 border border-sky-100 p-6">
                <h4 className="text-lg font-semibold text-sky-800 mb-2">Tips for Dining Safely in {city}</h4>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2"><span className="text-sky-500 mt-1">•</span><span><strong>Call ahead</strong> — Even at Tier 1 restaurants, it's wise to confirm current protocols, especially during busy seasons.</span></li>
                  <li className="flex items-start gap-2"><span className="text-sky-500 mt-1">•</span><span><strong>Use our tier filter</strong> — Tier 1 (Dedicated) venues offer the highest confidence for Celiac and severe allergy diners.</span></li>
                  <li className="flex items-start gap-2"><span className="text-sky-500 mt-1">•</span><span><strong>Check recent alerts</strong> — Community-reported menu and protocol changes help you stay current on any shifts at your favorite spots.</span></li>
                  <li className="flex items-start gap-2"><span className="text-sky-500 mt-1">•</span><span><strong>Travel with SafePlate</strong> — Our route planner and travel card features make safe dining on the go easy, anywhere in the U.S.</span></li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Help Us Keep {city} Safe</h3>
              <p className="text-slate-600 leading-relaxed mb-6">{content.closing}</p>
            </div>

            <div className="mt-10 text-center">
              <a href="/search" className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95">
                <IconSearch className="h-4 w-4" />
                Explore All Cities
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
