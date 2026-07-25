import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, upgradeToPremium, updateAllergens, getClaimedRestaurantForOwner, updateUserName, type AuthUser } from "~/db/auth";
import { getSessionToken, setCachedUser, clearSession, clearCachedUser } from "~/session";
import { getSavedRestaurants } from "~/db/profile";
import { getAlertsForSavedRestaurants } from "~/db/restaurants";
import { ThemeToggle } from "~/components/ThemeToggle";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

const ALLERGENS_LIST = [
  { key: "Gluten", label: "Gluten / Celiac" },
  { key: "Dairy", label: "Dairy" },
  { key: "Peanuts", label: "Peanuts" },
  { key: "Tree Nuts", label: "Tree Nuts" },
  { key: "Shellfish", label: "Shellfish" },
  { key: "Soy", label: "Soy" },
  { key: "Eggs", label: "Eggs" },
] as const;

const SEVERITY_LEVELS = [
  {
    value: 1,
    label: "Preference / Intolerance",
    description: "Shared kitchen OK — I can eat around it",
    color: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900 dark:text-sky-300 dark:border-sky-800",
    dot: "bg-sky-400",
  },
  {
    value: 2,
    label: "Severe Allergy",
    description: "Separate tools & surfaces required",
    color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-400",
  },
  {
    value: 3,
    label: "Celiac / Anaphylactic",
    description: "100% dedicated facility required",
    color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-400",
  },
] as const;

const DEFAULT_ALLERGENS: Record<string, number> = {
  Gluten: 0,
  Dairy: 0,
  Peanuts: 0,
  "Tree Nuts": 0,
  Shellfish: 0,
  Soy: 0,
  Eggs: 0,
};

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "SafePlate — Your Health Profile" },
      {
        name: "description",
        content:
          "Set your food allergies, intolerances, and severity levels. Your health profile helps SafePlate find restaurants that match your safety needs.",
      },
    ],
  }),
  component: ProfilePage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
/* ------------------------------------------------------------------ */

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar({ user }: { user: AuthUser | null }) {
  const handleLogout = () => {
    clearSession();
    clearCachedUser();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-lg">🍽️</span>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">SafePlate</span>
        </a>
        <div className="flex items-center gap-6">
          <a href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Home</a>
          <a href="/search" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">Search</a>
          <a href="/profile" className="text-sm font-semibold text-sky-600 dark:text-sky-400">Profile</a>
          <ThemeToggle />
          {user ? (
            <>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{user.name}</span>
              <button type="button" onClick={handleLogout} className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer">Log Out</button>
            </>
          ) : (
            <a href="/login" className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95">Log In</a>
          )}
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
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-base">🍽️</span>
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100">SafePlate</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">&copy; {new Date().getFullYear()} SafePlate. All rights reserved.</p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Profile Page                                                 */
/* ------------------------------------------------------------------ */

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [allergens, setAllergens] = useState<Record<string, number>>({ ...DEFAULT_ALLERGENS });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Premium / saved state
  const [savedRestaurants, setSavedRestaurants] = useState<Record<string, unknown>[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedAlerts, setSavedAlerts] = useState<Record<string, unknown>[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Restaurant owner state
  const [ownerRestaurant, setOwnerRestaurant] = useState<{ restaurantId: number; restaurantName: string } | null>(null);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nameValue.trim()) return;
    const result = await updateUserName({ data: { userId: user.id, name: nameValue.trim() } });
    if (result.success) {
      setUser({ ...user, name: result.name! });
      setCachedUser({ ...user, name: result.name! });
      setEditingName(false);
    }
  };

  // Load user on mount
  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser({ data: { token } }).then((u) => {
      if (u) {
        setCachedUser(u);
        setUser(u);
        // Initialize allergens from user's selected_allergens
        if (u.selected_allergens?.length) {
          const mapped: Record<string, number> = { ...DEFAULT_ALLERGENS };
          u.selected_allergens.forEach((a) => {
            if (a in mapped) mapped[a] = 1;
          });
          setAllergens(mapped);
        }

        // Load saved restaurants if premium
        if (u.premium_until) {
          const premiumDate = new Date(u.premium_until);
          if (premiumDate > new Date()) {
            loadSavedData(u.email);
          }
        }

        // Load claimed restaurant if owner
        if (u.role === "restaurant_owner") {
          getClaimedRestaurantForOwner({ data: { email: u.email } }).then((claimed) => {
            if (claimed) setOwnerRestaurant(claimed);
          });
        }
      }
      setLoading(false);
    });
  }, []);

  const loadSavedData = useCallback(async (email: string) => {
    setLoadingSaved(true);
    try {
      const saved = await getSavedRestaurants({ data: { userEmail: email } });
      setSavedRestaurants(saved as Record<string, unknown>[]);
    } catch { /* silent */ }
    finally { setLoadingSaved(false); }

    setLoadingAlerts(true);
    try {
      const alerts = await getAlertsForSavedRestaurants({ data: { userEmail: email } });
      setSavedAlerts(alerts as Record<string, unknown>[]);
    } catch { /* silent */ }
    finally { setLoadingAlerts(false); }
  }, []);

  const toggleAllergen = (key: string) => {
    setAllergens((prev) => ({ ...prev, [key]: prev[key] > 0 ? 0 : 1 }));
  };

  const setSeverity = (key: string, level: number) => {
    setAllergens((prev) => ({ ...prev, [key]: level }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const activeAllergens = Object.entries(allergens)
        .filter(([, v]) => v > 0)
        .map(([k]) => k);

      await updateAllergens({ data: { userId: user.id, allergens: activeAllergens } });

      // Update cached user
      const updatedUser = { ...user, selected_allergens: activeAllergens.length > 0 ? activeAllergens : null };
      setCachedUser(updatedUser);
      setUser(updatedUser);
      setMessage({ type: "success", text: "Health profile saved! Your preferences are now active." });
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handlePremiumRefresh = async () => {
    if (!user) return;
    const token = getSessionToken();
    if (!token) return;
    const updated = await getCurrentUser({ data: { token } });
    if (updated) {
      setCachedUser(updated);
      setUser(updated);
      if (updated.premium_until) {
        loadSavedData(updated.email);
      }
      setMessage({ type: "success", text: "Premium status refreshed!" });
    }
  };

  const activeAllergenCount = Object.values(allergens).filter((v) => v > 0).length;
  const isPremium = user?.premium_until ? new Date(user.premium_until) > new Date() : false;

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
        <NavBar user={null} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3">
            <IconSpinner className="h-6 w-6 animate-spin text-sky-500" />
            <span className="text-slate-500 dark:text-slate-400">Loading profile…</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
        <NavBar user={null} />
        <main className="flex flex-1 items-center justify-center px-6 py-20">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900">
              <IconShield className="h-8 w-8 text-sky-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Sign in to view your profile</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Create an account to set your allergens and save your favorite restaurants.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <a href="/login" className="rounded-full border-2 border-sky-500 px-6 py-2.5 text-sm font-semibold text-sky-600 transition-all hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950">Log In</a>
              <a href="/signup" className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95">Sign Up</a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <NavBar user={user} />
      <main>
        {/* Hero */}
        <section className="bg-[#FAFAF9] pt-16 pb-12 md:pt-24 md:pb-16 dark:bg-slate-950">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 md:text-5xl dark:text-slate-100">
              Welcome, {user.name}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Manage your allergens, dietary needs, and premium perks.
            </p>
          </div>
        </section>

        {/* Profile Form */}
        <section className="bg-white py-10 md:py-14 dark:bg-slate-900">
          <div className="mx-auto max-w-2xl px-6">
            {/* Account Info */}
            <div className="mb-10 rounded-2xl border border-slate-100 bg-[#FAFAF9] p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Account Info</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</span>
                  <p className="text-slate-800 dark:text-slate-200">{user.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Name</span>
                  {editingName ? (
                    <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-1">
                      <input
                        autoFocus
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      />
                      <button type="submit" className="text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400">Save</button>
                      <button type="button" onClick={() => setEditingName(false)} className="text-sm text-slate-400 hover:text-slate-600 dark:text-slate-500">Cancel</button>
                    </form>
                  ) : (
                    <p className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {user.name}
                      <button onClick={() => { setNameValue(user.name || ""); setEditingName(true); }} className="text-xs text-slate-400 hover:text-sky-500 transition-colors" title="Edit name">✏️</button>
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</span>
                  <p className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {user.role === "restaurant_owner" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                        🏪 Owner
                      </span>
                    ) : user.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
                        🔧 Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-400">
                        🍽️ Diner
                      </span>
                    )}
                    <span className="capitalize">{user.role.replace("_", " ")}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Restaurant Owner Section */}
            {user.role === "restaurant_owner" && (
              <div className="mb-10 rounded-2xl border-2 border-amber-200 bg-amber-50/30 p-6 dark:border-amber-800 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🏪</span>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Your Restaurant
                  </h2>
                </div>
                {ownerRestaurant ? (
                  <div className="space-y-3">
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">
                      {ownerRestaurant.restaurantName}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/dashboard?id=${ownerRestaurant.restaurantId}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
                      >
                        View Dashboard
                      </a>
                      <a
                        href={`/dashboard?id=${ownerRestaurant.restaurantId}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-600 transition-all hover:bg-sky-50 dark:border-sky-700 dark:bg-slate-800 dark:text-sky-400 dark:hover:bg-slate-700"
                      >
                        Update Protocols
                      </a>
                      <a
                        href="/search"
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                      >
                        View on SafePlate
                      </a>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      You haven't claimed a restaurant yet. Claim your listing to access your dashboard.
                    </p>
                    <a
                      href="/claim"
                      className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
                    >
                      Claim Your Listing →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Allergens */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Your Allergens & Dietary Restrictions
                </h2>
                {activeAllergenCount > 0 && (
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                    {activeAllergenCount} active
                  </span>
                )}
              </div>

              <div className="space-y-5">
                {ALLERGENS_LIST.map((item) => {
                  const level = allergens[item.key] ?? 0;
                  const isActive = level > 0;
                  return (
                    <div
                      key={item.key}
                      className={`rounded-2xl border-2 p-5 transition-all ${isActive ? "border-sky-200 bg-sky-50/30 dark:border-sky-800 dark:bg-sky-950/30" : "border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleAllergen(item.key)}
                            className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all cursor-pointer ${isActive ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700"}`}
                          >
                            {isActive && <IconCheck className="h-4 w-4" />}
                          </button>
                          <span className={`text-base font-medium ${isActive ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                            {item.label}
                          </span>
                        </div>
                        {isActive && (
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${SEVERITY_LEVELS.find((s) => s.value === level)?.color ?? ""}`}>
                            {SEVERITY_LEVELS.find((s) => s.value === level)?.label ?? "Active"}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {SEVERITY_LEVELS.map((sev) => (
                            <button
                              key={sev.value}
                              type="button"
                              onClick={() => setSeverity(item.key, sev.value)}
                              className={`flex-1 min-w-[150px] rounded-xl border px-3 py-3 text-left text-sm transition-all cursor-pointer ${level === sev.value ? `${sev.color} border-2 shadow-sm` : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-block h-2.5 w-2.5 rounded-full ${sev.dot}`} />
                                <span className="font-semibold">{sev.label}</span>
                              </div>
                              <p className="text-xs opacity-75">{sev.description}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"}`}>
                {message.text}
              </div>
            )}

            {/* Save button */}
            <div className="mb-10">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <IconSpinner className="h-4 w-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  <>
                    <IconShield className="mr-2 inline h-4 w-4" />
                    Save Health Profile
                  </>
                )}
              </button>
            </div>

            {/* Premium Status */}
            {isPremium && (
              <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/30 to-white p-6 dark:border-purple-800 dark:from-purple-950/30 dark:to-slate-900">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">💎</span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Premium Member</h3>
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">Active</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Premium until: {new Date(user.premium_until!).toLocaleDateString()}
                </p>

                {/* Saved Restaurants */}
                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  ❤️ Saved Restaurants ({savedRestaurants.length})
                </h4>
                {loadingSaved ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
                    <IconSpinner className="h-4 w-4 animate-spin" />
                    Loading saved restaurants…
                  </div>
                ) : savedRestaurants.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                    No saved restaurants yet. Go to <a href="/search" className="text-sky-600 hover:underline">Search</a> to save some!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {savedRestaurants.map((r: Record<string, unknown>) => (
                      <div key={r.id as number} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow transition-shadow dark:border-slate-700 dark:bg-slate-800">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{r.name as string}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{r.address as string}</p>
                        </div>
                        <a href={`/search?q=${encodeURIComponent(r.name as string)}`} className="rounded-full bg-sky-50 px-4 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-100 transition-colors dark:bg-sky-900 dark:text-sky-400">View</a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alerts */}
                <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-800">
                  <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">⚠️ Alerts for Your Saved Restaurants</h4>
                  {loadingAlerts ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-slate-500 dark:text-slate-400">
                      <IconSpinner className="h-4 w-4 animate-spin" />Loading alerts…
                    </div>
                  ) : savedAlerts.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 py-2">No recent alerts for your saved restaurants.</p>
                  ) : (
                    <div className="space-y-3">
                      {savedAlerts.map((a: Record<string, unknown>) => {
                        const typeLabels: Record<string, string> = { ingredient_change: "Ingredient Change", menu_change: "Menu Change", protocol_change: "Protocol Change", other: "Other" };
                        return (
                          <div key={a.id as number} className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/30 dark:border-amber-800">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-semibold text-amber-700 uppercase dark:text-amber-400">{typeLabels[a.alert_type as string] ?? String(a.alert_type)}</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.restaurant_name as string}</p>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{a.description as string}</p>
                            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{new Date(a.created_at as string).toLocaleDateString()}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Premium upsell */}
            {!isPremium && (
              <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/20 to-white p-6 text-center dark:border-purple-800 dark:from-purple-950/20 dark:to-slate-900">
                <span className="text-2xl">💎</span>
                <h3 className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">Upgrade to Premium</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Save your favorite restaurants, get personalized recommendations, and more.
                </p>
                <a
                  href="https://buy.stripe.com/9B64gzg8M5Bo5KR1iT8Ra01"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-600 active:scale-95"
                >
                  💎 Get Premium — $4.99/mo
                </a>
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  After payment,{" "}
                  <button type="button" onClick={handlePremiumRefresh} className="text-sky-600 underline cursor-pointer">
                    click here
                  </button>{" "}
                  to refresh your status.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
