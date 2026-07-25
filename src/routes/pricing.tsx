import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ThemeToggle } from "~/components/ThemeToggle";
import { getCurrentUser, upgradeToPremium, type AuthUser } from "~/db/auth";
import { getSessionToken, setCachedUser, getCachedUser } from "~/session";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Premium Allergy-Safe Dining Features | SafePlate" },
      { name: "description", content: "Unlock premium SafePlate features: route planning, saved restaurants, verified protocol alerts, and more. Free and premium plans built for Celiac and food allergy diners." },
      { property: "og:title", content: "Pricing — Premium Allergy-Safe Dining Features | SafePlate" },
      { property: "og:description", content: "Unlock premium SafePlate features: route planning, saved restaurants, verified protocol alerts, and more. Free and premium plans for allergy-safe dining." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://safeplate.company/pricing" },
      { property: "og:image", content: "https://safeplate.company/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Pricing — Premium Allergy-Safe Dining Features | SafePlate" },
      { name: "twitter:description", content: "Unlock premium SafePlate features: route planning, saved restaurants, verified protocol alerts, and more." },
      { name: "twitter:image", content: "https://safeplate.company/og-image.svg" },
    ],
    links: [
      { rel: "canonical", href: "https://safeplate.company/pricing" },
    ],
  }),
  component: Pricing,
});

/* ------------------------------------------------------------------ */
/*  Inline icons                                                      */
/* ------------------------------------------------------------------ */

function IconCheck({ className }: { className?: string }) {
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
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005z"
        clipRule="evenodd"
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
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function IconDiamond({ className }: { className?: string }) {
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
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
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
            className="text-sm font-medium text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            Pricing
          </a>
          <a
            href="/profile"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Profile
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
            href="/pricing"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            Pricing
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
/*  Pricing cards                                                     */
/* ------------------------------------------------------------------ */

interface PricingCard {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  price: string;
  period: string;
  features: string[];
  buttonLabel: string;
  buttonHref: string;
  featured?: boolean;
  badge?: string;
}

function PricingCard({ card }: { card: PricingCard }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800 ${
        card.featured
          ? "border-sky-300 shadow-lg shadow-sky-100/50 ring-1 ring-sky-200 dark:border-sky-600 dark:shadow-sky-900/20 dark:ring-sky-700 md:-mt-4 md:pb-12"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      {card.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
          {card.badge}
        </span>
      )}

      {/* Icon */}
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
      >
        <card.icon className="h-6 w-6" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
        {card.title}
      </h3>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          {card.price}
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {card.period}
        </span>
      </div>

      {/* Features */}
      <ul className="mt-6 flex-1 space-y-3">
        {card.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <a
        href={card.buttonHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-8 block rounded-full px-6 py-3 text-center text-sm font-semibold transition-all active:scale-95 ${
          card.featured
            ? "bg-sky-500 text-white shadow-sm hover:bg-sky-600"
            : "border-2 border-sky-500 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950"
        }`}
      >
        {card.buttonLabel}
      </a>
    </div>
  );
}

const pricingCards: PricingCard[] = [
  {
    icon: IconStar,
    iconBg: "bg-amber-100 dark:bg-amber-900",
    iconColor: "text-amber-600 dark:text-amber-400",
    title: "Featured Listing",
    price: "$29",
    period: "/month",
    features: [
      "Appear at the top of search results",
      "Priority placement in your city",
      "Featured badge on your card",
    ],
    buttonLabel: "Get Featured",
    buttonHref: "https://buy.stripe.com/9B614ng8Mgg2a178Ll8Ra00",
    featured: true,
    badge: "Most Popular",
  },
  {
    icon: IconVerified,
    iconBg: "bg-emerald-100 dark:bg-emerald-900",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    title: "Verified Badge",
    price: "$99",
    period: "one-time",
    features: [
      "We personally verify your kitchen protocols",
      "Green verified badge builds trust",
      "Higher conversion from diners",
    ],
    buttonLabel: "Get Verified",
    buttonHref: "https://buy.stripe.com/fZufZhcWA4xka17e5F8Ra02",
  },
  {
    icon: IconDiamond,
    iconBg: "bg-sky-100 dark:bg-sky-900",
    iconColor: "text-sky-600 dark:text-sky-400",
    title: "Premium Profile",
    price: "$9.99",
    period: "/month",
    features: [
      "Save favorite restaurants",
      "Advanced allergen filtering",
      "Priority route planning",
      "Personalized alerts",
    ],
    buttonLabel: "Get Premium",
    buttonHref: "https://buy.stripe.com/9B64gzg8M5Bo5KR1iT8Ra01",
  },
];

/* ------------------------------------------------------------------ */
/*  Page assembly                                                     */
/* ------------------------------------------------------------------ */

function PremiumActivation() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Detect post-payment redirect from Stripe
  const isPostPayment =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("premium") === "activated";

  useEffect(() => {
    const cached = getCachedUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
      return;
    }
    const token = getSessionToken();
    if (token) {
      getCurrentUser({ data: { token } }).then((u) => {
        if (u) {
          setCachedUser(u);
          setUser(u);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Auto-activate for regular users returning from Stripe payment
  useEffect(() => {
    if (isPostPayment && user && user.role !== "admin" && status === "idle") {
      handleActivate();
    }
  }, [user, isPostPayment]);

  const handleActivate = async () => {
    if (!user) return;
    setStatus("loading");
    setMessage("");
    try {
      const result = await upgradeToPremium({ data: { userId: user.id } });
      if (result.success) {
        setStatus("success");
        setMessage("✅ Premium activated! Enjoy your perks.");
        // Clean up the URL so refresh doesn't re-trigger
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("premium");
          window.history.replaceState({}, "", url.toString());
        }
      } else {
        setStatus("error");
        setMessage(result.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (loading) return null;

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="mt-10 rounded-2xl border-2 border-sky-200 bg-gradient-to-b from-sky-50/20 to-white p-6 text-center dark:border-sky-800 dark:from-sky-950/20 dark:to-slate-900">
        <span className="text-2xl">💎</span>
        <h3 className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">
          Unlock Premium Features
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sign up or log in first to activate your Premium Profile.
        </p>
        <a
          href="/signup"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
        >
          Sign Up / Log In →
        </a>
      </div>
    );
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (user.role === "admin") {
    return (
      <div className="mt-10 rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/20 to-white p-6 text-center dark:border-purple-800 dark:from-purple-950/20 dark:to-slate-900">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          🔧 Admin — Free Premium
        </span>
        <h3 className="mt-3 text-lg font-bold text-slate-800 dark:text-slate-100">
          Admin Premium Access
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          As an admin, you get free access to all premium features.
        </p>
        <button
          type="button"
          onClick={handleActivate}
          disabled={status === "loading" || status === "success"}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {status === "loading"
            ? "Activating…"
            : status === "success"
              ? "✓ Activated!"
              : "💎 Activate Premium (Free)"}
        </button>
        {message && (
          <p
            className={`mt-3 text-sm font-medium ${
              status === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    );
  }

  // ── Regular user (diner / restaurant_owner) ────────────────────────────────
  return (
    <div className="mt-10 rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/20 to-white p-6 text-center dark:border-purple-800 dark:from-purple-950/20 dark:to-slate-900">
      <span className="text-2xl">💎</span>
      <h3 className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">
        Get Premium Profile
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Unlock saved restaurants, advanced filtering, priority route planning,
        and personalized alerts — all for a one-time payment.
      </p>

      {status === "success" ? (
        <>
          <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-6 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            ✓ Activated!
          </span>
          {message && (
            <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {message}
            </p>
          )}
        </>
      ) : status === "loading" ? (
        <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-100 px-6 py-3 text-sm font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          Activating your premium…
        </span>
      ) : (
        <a
          href="https://buy.stripe.com/6oU28rcWA6Fs6OVgdN8Ra04"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-600 active:scale-95"
        >
          💎 Get Premium — $9.99
        </a>
      )}

      {status === "error" && message && (
        <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
          {message}
        </p>
      )}

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Secure payment via Stripe. One-time charge, no subscription.
      </p>
    </div>
  );
}

function Pricing() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main className="flex-1">
        {/* Header */}
        <section className="bg-[#FAFAF9] py-20 md:py-28 dark:bg-slate-950">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-800 md:text-5xl dark:text-slate-100">
              Simple, transparent pricing
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Everything you need to keep diners safe and your restaurant growing.
            </p>
          </div>
        </section>

        {/* Cards */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-8 md:grid-cols-3 md:items-start">
              {pricingCards.map((card) => (
                <PricingCard key={card.title} card={card} />
              ))}
            </div>

            {/* Premium activation */}
            <PremiumActivation />

            {/* Bottom trust note */}
            <p className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
              All payments are processed securely via{" "}
              <span className="font-medium text-slate-600 dark:text-slate-300">Stripe</span>.
              Cancel anytime from your account dashboard.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
