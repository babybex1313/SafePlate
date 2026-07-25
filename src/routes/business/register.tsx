import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { registerBusiness } from "~/db/business";
import { setSessionCookie } from "~/session";
import { ThemeToggle } from "~/components/ThemeToggle";

export const Route = createFileRoute("/business/register")({
  head: () => ({
    meta: [{ title: "Register Your Restaurant — SafePlate for Business" }],
  }),
  component: BusinessRegisterPage,
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

function IconBadge({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/* ── NavBar ────────────────────────────────────────────────────────────────── */

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
          <span className="ml-1 rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">
            FOR BUSINESS
          </span>
        </a>
        <div className="flex items-center gap-6">
          <a href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Home</a>
          <a href="/search" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Search</a>
          <ThemeToggle />
          <a href="/login" className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95">
            Log In
          </a>
        </div>
      </div>
    </header>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-[#FAFAF9] py-10 dark:border-slate-700 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-base">🍽️</span>
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100">SafePlate</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} SafePlate. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */

function BusinessRegisterPage() {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurantName.trim()) {
      setErrorMsg("Please enter your restaurant name.");
      setStatus("error");
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg("Please enter your name.");
      setStatus("error");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setStatus("error");
      return;
    }
    if (!city.trim()) {
      setErrorMsg("Please enter your city.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const result = await registerBusiness({
        data: {
          restaurantName: restaurantName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          city: city.trim(),
        },
      });

      if (result.success && result.token) {
        setSessionCookie(result.token);
        navigate({ to: "/business/dashboard" });
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <NavBar />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-400 mb-4">
              <IconBadge className="h-4 w-4" />
              SafePlate for Restaurants
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Register Your Restaurant
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Get verified and attract loyal allergen-conscious diners.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Restaurant Name */}
              <div>
                <label htmlFor="biz-restaurant-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Restaurant Name
                </label>
                <input
                  id="biz-restaurant-name"
                  type="text"
                  value={restaurantName}
                  onChange={(e) => { setRestaurantName(e.target.value); if (status === "error") setStatus("idle"); }}
                  placeholder="e.g. The Gilded Fork"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Owner Name */}
              <div>
                <label htmlFor="biz-owner-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Name
                </label>
                <input
                  id="biz-owner-name"
                  type="text"
                  value={ownerName}
                  onChange={(e) => { setOwnerName(e.target.value); if (status === "error") setStatus("idle"); }}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="biz-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  id="biz-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                  placeholder="you@restaurant.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="biz-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="biz-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (status === "error") setStatus("idle"); }}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent border-none p-1 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Phone (optional) */}
              <div>
                <label htmlFor="biz-phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="biz-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="biz-city" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  id="biz-city"
                  type="text"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); if (status === "error") setStatus("idle"); }}
                  placeholder="e.g. Austin"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Error */}
              {status === "error" && errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {status === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <IconSpinner className="h-4 w-4 animate-spin" />
                    Creating your account…
                  </span>
                ) : (
                  "Claim & Verify Your Kitchen"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <a href="/login" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
                Log in
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
