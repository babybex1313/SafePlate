import { createFileRoute, notFound } from "@tanstack/react-router";
import { getApprovedBlogPostBySlug } from "~/db/blog";
import { ThemeToggle } from "~/components/ThemeToggle";
import React from "react";

interface BlogRestaurant {
  name: string;
  city: string;
  citySlug: string;
  tier: number;
  description: string;
}

const SAFEST_RESTAURANTS_2026: BlogRestaurant[] = [
  {
    name: "Wilder Wood",
    city: "Austin",
    citySlug: "austin",
    tier: 1,
    description:
      "Austin's premier 100% gluten-free restaurant and bar, housed in a historic building on East 7th Street. Wilder Wood offers a completely dedicated gluten-free kitchen with zero cross-contamination risk — from their hand-breaded chicken fried steak to their house-made desserts. Their fryers have never seen gluten, and the entire facility is a Celiac-safe zone.",
  },
  {
    name: "Arepa Mia",
    city: "Atlanta",
    citySlug: "atlanta",
    tier: 1,
    description:
      "This beloved Venezuelan eatery in Avondale Estates serves naturally gluten-free arepas made from corn flour in a 100% dedicated gluten-free facility. Arepa Mia has earned the trust of Atlanta's Celiac community with transparent ingredient sourcing, dedicated kitchen equipment, and staff who deeply understand cross-contamination protocols. The entire menu is safe for gluten-free diners.",
  },
  {
    name: "Wheat's End",
    city: "Chicago",
    citySlug: "chicago",
    tier: 1,
    description:
      "A completely gluten-free bakery and café in Chicago's Lakeview neighborhood that proves you don't need wheat to make incredible pastries. Wheat's End operates a 100% dedicated gluten-free kitchen, and every item — from flaky croissants to English muffins — is crafted without compromise. They also accommodate other common allergens like dairy and soy with clearly labeled options.",
  },
  {
    name: "Company Cafe",
    city: "Dallas",
    citySlug: "dallas",
    tier: 1,
    description:
      "Company Cafe on Greenville Avenue has been a Dallas institution for gluten-free dining since 2011. Their dedicated gluten-free fryers, separate prep stations, and fully trained kitchen staff make it one of the safest spots in Texas for Celiac diners. Their gluten-free chicken fried steak and sweet potato pancakes are legendary — and entirely safe.",
  },
  {
    name: "Just BE Kitchen",
    city: "Denver",
    citySlug: "denver",
    tier: 1,
    description:
      "Denver's first 100% gluten-free, grain-free, and refined-sugar-free restaurant, Just BE Kitchen takes dietary restrictions seriously. Every dish on the menu is paleo-friendly and entirely free from gluten, grains, soy, legumes, peanuts, and refined sugar. Their dedicated kitchen means Celiac diners can order anything on the menu with complete peace of mind.",
  },
  {
    name: "Sunflower Bakehouse",
    city: "Nashville",
    citySlug: "nashville",
    tier: 1,
    description:
      "Located in Nashville's Donelson neighborhood, Sunflower Bakehouse is a 100% vegan and gluten-free bakery and café. Their entirely dedicated gluten-free kitchen produces stunning cupcakes, cinnamon rolls, and savory lunch items — all safe for Celiac diners. The bakehouse has become a cornerstone of Nashville's allergen-aware community through consistent, trustworthy kitchen practices.",
  },
  {
    name: "Ground Breaker Brewing",
    city: "Portland",
    citySlug: "portland",
    tier: 1,
    description:
      "The first dedicated gluten-free craft brewery in the United States, Ground Breaker Brewing in Portland is a Celiac beer lover's dream. Their 100% gluten-free facility — from grain storage to fermentation to the taproom kitchen — means every beer and every food item is completely safe. Their gastropub menu, featuring gluten-free fried chicken and house-brewed ales, is served in a facility where gluten has never entered.",
  },
  {
    name: "Rendezvous International",
    city: "Sarasota",
    citySlug: "sarasota",
    tier: 1,
    description:
      "A Sarasota hidden gem offering globally inspired cuisine in a kitchen that takes allergen safety to the highest level. Rendezvous International maintains dedicated gluten-free prep areas, thoroughly trains all staff on cross-contamination, and clearly labels every dish on their menu with allergen information. Their Mediterranean and Middle Eastern-inspired dishes are naturally accommodating for gluten-free diners.",
  },
  {
    name: "New Day Gluten Free",
    city: "St. Louis",
    citySlug: "st-louis",
    tier: 1,
    description:
      "St. Louis's dedicated gluten-free bakery and café, New Day Gluten Free has been serving the Celiac community for over a decade. Their 100% gluten-free facility produces everything from sandwich bread to chocolate chip cookies without a trace of gluten on the premises. Their café menu includes paninis, soups, and breakfast items — all completely safe for gluten-free diners.",
  },
  {
    name: "True Food Kitchen",
    city: "Denver",
    citySlug: "denver",
    tier: 2,
    description:
      "With a location in Denver's Cherry Creek neighborhood, True Food Kitchen offers an extensive allergen-aware menu grounded in Dr. Andrew Weil's anti-inflammatory diet principles. While not a dedicated gluten-free facility, their rigorous kitchen protocols, detailed allergen matrix, and staff training make them a standout Tier 2 pick. Gluten-free, dairy-free, and vegetarian options are clearly marked, and the kitchen follows strict cross-contamination prevention procedures.",
  },
];

interface BlogArticleData {
  slug: string;
  title: string;
  subtitle: string;
  intro?: string;
  restaurants?: BlogRestaurant[];
  publishedAt: string;
  content?: string;
  author_name?: string;
  type?: "editorial" | "community";
}

export const Route = createFileRoute("/blog/$slug")({
  head: ({ loaderData }) => {
    const article = loaderData?.article;
    if (!article) {
      return {
        meta: [
          { title: "Article Not Found — SafePlate Blog" },
          { name: "description", content: "The requested blog article could not be found." },
        ],
      };
    }
    const description = article.subtitle;
    const datePublished = article.publishedAt || "2026-01-01";
    const authorName = article.author_name || "SafePlate";
    return {
      meta: [
        { title: `${article.title} — SafePlate Blog` },
        { name: "description", content: description },
        { property: "og:title", content: `${article.title} — SafePlate Blog` },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `https://safeplate.company/blog/${article.slug}` },
        { property: "og:image", content: "https://safeplate.company/og-image.svg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${article.title} — SafePlate Blog` },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: "https://safeplate.company/og-image.svg" },
      ],
      links: [
        { rel: "canonical", href: `https://safeplate.company/blog/${article.slug}` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: article.title,
            description: description,
            url: `https://safeplate.company/blog/${article.slug}`,
            publisher: {
              "@type": "Organization",
              name: "SafePlate",
              url: "https://safeplate.company/",
            },
            author: {
              "@type": "Person",
              name: authorName,
            },
            datePublished: datePublished,
            dateModified: datePublished,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://safeplate.company/blog/${article.slug}`,
            },
          }),
        },
      ],
    };
  },
  loader: async ({ params }) => {
    const { slug } = params;

    // 1. Check hardcoded editorial posts first
    if (slug === "safest-celiac-restaurants-2026") {
      return {
        article: {
          slug,
          title: "The 10 Safest Restaurants for Celiac Travelers in 2026",
          subtitle:
            "From Austin to Atlanta, these kitchens go above and beyond for gluten-free dining",
          intro:
            "Traveling with Celiac disease means every meal is a calculated risk. These 10 restaurants across SafePlate cities have earned our highest Tier 1 (🟢 Medical-Grade) rating — meaning dedicated equipment, allergen-trained staff, and verified kitchen protocols you can trust.",
          restaurants: SAFEST_RESTAURANTS_2026,
          publishedAt: "2026-07-01",
          type: "editorial" as const,
        },
      };
    }

    // 2. Check community submissions in the database
    try {
      const dbPost = await getApprovedBlogPostBySlug({ data: { slug } });
      if (dbPost) {
        return {
          article: {
            slug: dbPost.slug!,
            title: dbPost.title,
            subtitle: `By ${dbPost.author_name} — Community Submission`,
            content: dbPost.content,
            author_name: dbPost.author_name,
            publishedAt: dbPost.created_at,
            type: "community" as const,
          },
        };
      }
    } catch {
      // DB lookup failed, fall through to notFound
    }

    throw notFound();
  },
  component: BlogArticle,
});

function TierBadge({ tier }: { tier: number }) {
  if (tier === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
        🟢 Tier 1 — Medical-Grade
      </span>
    );
  }
  if (tier === 2) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
        🟡 Tier 2 — Strong Protocols
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      Tier {tier}
    </span>
  );
}

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
            href="/blog/safest-celiac-restaurants-2026"
            className="text-sm font-semibold text-emerald-600 dark:text-emerald-400"
          >
            Blog
          </a>
          <ThemeToggle />
          <a
            href="/onboarding"
            className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
          >
            Get Started
          </a>
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

function HeroSection({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-400 via-sky-400 to-sky-500 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-tight">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
          {subtitle}
        </p>
      </div>
    </section>
  );
}

function ArticleContent({
  intro,
  restaurants,
}: {
  intro: string;
  restaurants: BlogRestaurant[];
}) {
  return (
    <section className="bg-white py-16 md:py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl px-6">
        <p className="text-lg leading-relaxed text-slate-600 md:text-xl dark:text-slate-400">
          {intro}
        </p>

        <div className="mt-12 space-y-6">
          {restaurants.map((r, i) => (
            <div
              key={i}
              className="restaurant-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {i + 1}. {r.name}
                </h3>
                <TierBadge tier={r.tier} />
              </div>
              <a
                href={`/city/${r.citySlug}`}
                className="city-pill mb-4 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600 transition-colors hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900"
              >
                📍 {r.city}
              </a>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
                {r.description}
              </p>
              <a
                href={`/search?q=${encodeURIComponent(r.name)}`}
                className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              >
                View on SafePlate →
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-gradient-to-br from-emerald-50 via-sky-50 to-white p-8 text-center border border-sky-100 dark:from-emerald-950/40 dark:via-sky-950/40 dark:to-slate-800 dark:border-sky-800">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Ready to dine safely?
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Search over 50 verified restaurants across 9 cities — all with real kitchen protocol data.
          </p>
          <a
            href="/search"
            className="mt-6 inline-block rounded-full bg-sky-500 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
          >
            Explore All Cities →
          </a>
        </div>
      </div>
    </section>
  );
}

function NotFoundArticle() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-md px-6 py-32 text-center">
          <span className="text-5xl">📝</span>
          <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
            Article not found
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            We couldn't find the blog article you're looking for. It may have been moved or doesn't exist yet.
          </p>
          <a
            href="/blog/safest-celiac-restaurants-2026"
            className="mt-6 inline-block rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
          >
            Read our latest article
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BlogArticle() {
  const data = Route.useLoaderData();

  if (!data?.article) {
    return <NotFoundArticle />;
  }

  const { article } = data;
  const isCommunity = article.type === "community";
  const authorName = article.author_name || "SafePlate";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.subtitle,
    datePublished: article.publishedAt,
    publisher: {
      "@type": "Organization",
      name: "SafePlate",
      url: "https://safeplate.company",
    },
    url: `https://safeplate.company/blog/${article.slug}`,
    image: "https://safeplate.company/og-image.svg",
    author: {
      "@type": "Person",
      name: authorName,
    },
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NavBar />
      <main>
        {isCommunity ? (
          <CommunityArticleContent title={article.title} subtitle={article.subtitle} content={article.content || ""} authorName={article.author_name || "Anonymous"} publishedAt={article.publishedAt} />
        ) : (
          <>
            <HeroSection title={article.title} subtitle={article.subtitle} />
            <ArticleContent intro={article.intro!} restaurants={article.restaurants!} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}


function CommunityArticleContent({
  title,
  subtitle,
  content,
  authorName,
  publishedAt,
}: {
  title: string;
  subtitle: string;
  content: string;
  authorName: string;
  publishedAt: string;
}) {
  const formattedDate = (() => {
    try {
      return new Date(publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return publishedAt;
    }
  })();

  const paragraphs = React.useMemo(
    () =>
      content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    [content],
  );

  const [copied, setCopied] = React.useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Community Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Community Post
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
              {subtitle}
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-white/80">
            <span className="font-medium">{authorName}</span>
            <span className="text-white/40">·</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <section className="bg-white py-16 md:py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl px-6">
          {/* Decorative separator */}
          <div className="mb-12 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-sky-400" />
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <div className="h-2 w-2 rounded-full bg-amber-400" />
            </div>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Content with left border accent */}
          <div className="relative rounded-xl border-l-4 border-sky-300 bg-sky-50/50 px-6 py-8 dark:border-sky-700 dark:bg-sky-950/20">
            {paragraphs.length > 0 ? (
              <div className="space-y-6">
                {paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="text-lg leading-relaxed text-slate-700 dark:text-slate-300"
                  >
                    {p}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {content}
              </p>
            )}
          </div>

          {/* Share Section */}
          <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Share this post
                </h3>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Help others in the allergen community discover this story.
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
              >
                {copied ? (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Related Posts Teaser */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Want to read more?{" "}
              <a
                href="/blog"
                className="font-medium text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              >
                Browse all SafePlate articles →
              </a>
            </p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              or{" "}
              <a
                href="/submit-post"
                className="font-medium text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              >
                submit your own story
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Submit CTA */}
      <section className="bg-white pb-20 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl px-6">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-sky-50 to-white p-8 text-center border border-sky-100 dark:from-emerald-950/40 dark:via-sky-950/40 dark:to-slate-800 dark:border-sky-800">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Have a story to share?
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Submit your own allergy-safe dining experience to the SafePlate
              community blog.
            </p>
            <a
              href="/submit-post"
              className="mt-6 inline-block rounded-full bg-sky-500 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
            >
              Submit Your Story →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
