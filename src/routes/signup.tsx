import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { signup } from "~/db/auth";
import { searchRestaurantByName } from "~/db/restaurants";
import { setSessionCookie, setCachedUser } from "~/session";
import { ThemeToggle } from "~/components/ThemeToggle";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Sign Up — SafePlate" }],
  }),
  component: SignupPage,
});

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface SearchResult {
  id: number;
  name: string;
  city: string;
}

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
/* ------------------------------------------------------------------ */

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
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
          <a href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">
            Home
          </a>
          <a href="/search" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">
            Search
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Signup Form                                                       */
/* ------------------------------------------------------------------ */

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"diner" | "restaurant_owner">("diner");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Restaurant search for owners
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurantResults, setRestaurantResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<SearchResult | null>(null);
  const [searched, setSearched] = useState(false);

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  const handleRestaurantSearch = useCallback(async () => {
    const trimmed = restaurantQuery.trim();
    if (!trimmed || trimmed.length < 2) return;
    setSearching(true);
    setSearched(true);
    try {
      const data = await searchRestaurantByName({ data: { query: trimmed } });
      setRestaurantResults(data as SearchResult[]);
    } catch {
      setRestaurantResults([]);
    } finally {
      setSearching(false);
    }
  }, [restaurantQuery]);

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
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const result = await signup({
        data: {
          name: name.trim(),
          email: email.trim(),
          password,
          allergens: selectedAllergens.length > 0 ? selectedAllergens : undefined,
          role,
        },
      });

      if (result.success && result.token) {
        setSessionCookie(result.token);
        if (result.user) setCachedUser(result.user);

        // Route based on role
        if (role === "restaurant_owner") {
          navigate({ to: "/claim?from=signup" });
        } else {
          navigate({ to: "/profile" });
        }
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
    <div className="flex min-h-dvh flex-col bg-[#FAFAF9] text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-2xl shadow-md">
                🍽️
              </span>
            </div>

            <h1 className="text-center text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
              Create your account
            </h1>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
              Join SafePlate and dine with confidence
            </p>

            {/* ── Role Toggle ── */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 text-center">
                I am a…
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setRole("diner"); setSelectedRestaurant(null); }}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                    role === "diner"
                      ? "border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950 dark:text-sky-300"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  🍽️ Diner
                </button>
                <button
                  type="button"
                  onClick={() => setRole("restaurant_owner")}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                    role === "restaurant_owner"
                      ? "border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-950 dark:text-sky-300"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  🏪 Restaurant Owner
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="signup-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (status === "error") setStatus("idle"); }}
                  placeholder="Your full name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="signup-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
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

              {/* Restaurant search (owners only) */}
              {role === "restaurant_owner" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Restaurant
                  </label>
                  {selectedRestaurant ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between dark:border-emerald-800 dark:bg-emerald-900/20">
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{selectedRestaurant.name}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500">{selectedRestaurant.city}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedRestaurant(null); setRestaurantQuery(""); setSearched(false); setRestaurantResults([]); }}
                        className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={restaurantQuery}
                          onChange={(e) => setRestaurantQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleRestaurantSearch(); } }}
                          placeholder="Search for your restaurant…"
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-20 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                        <button
                          type="button"
                          onClick={handleRestaurantSearch}
                          disabled={searching || restaurantQuery.trim().length < 2}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white transition-all hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {searching ? <IconSpinner className="h-3 w-3 animate-spin" /> : "Search"}
                        </button>
                      </div>

                      {/* Results dropdown */}
                      {searched && restaurantResults.length > 0 && !selectedRestaurant && (
                        <div className="mt-1 rounded-xl border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto dark:border-slate-600 dark:bg-slate-700">
                          {restaurantResults.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => { setSelectedRestaurant(r); setRestaurantResults([]); }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-sky-50 transition-colors border-b border-slate-100 last:border-b-0 dark:hover:bg-sky-950 dark:border-slate-600 cursor-pointer"
                            >
                              <span className="font-medium text-slate-800 dark:text-slate-100">{r.name}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{r.city}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {searched && restaurantResults.length === 0 && !searching && !selectedRestaurant && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          No restaurants found. You can claim your listing after signing up.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Allergen pills (diners only) */}
              {role === "diner" && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Your dietary needs (optional)
                  </p>
                  <div className="flex flex-wrap gap-2">
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
              )}

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
                    Creating account…
                  </span>
                ) : (
                  "Create Account"
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
    </div>
  );
}
