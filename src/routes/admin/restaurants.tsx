import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef, useMemo, Fragment } from "react";
import {
  getDrips,
  processDrips,
} from "~/db/drips";
import {
  adminListRestaurants,
  adminGetRestaurant,
  updateRestaurant,
  listPendingUpdates,
  approveUpdate,
  rejectUpdate,
  getActiveAlerts,
  resolveAlert,
  markVerified,
  sendRestaurantEmail,
  getSubmitterEmails,
  verifyAdminPassword,
  getAllRestaurantEmails,
  sendBulkEmails,
  getEmailTracking,
  quickUpdateRestaurantEmail,
  markEmailReplied,
  getReplyStats,
} from "~/db/restaurants";
import {
  getBlogSubmissions,
  approveBlogPost,
  rejectBlogPost,
  type BlogSubmission,
} from "~/db/blog";
import { getCurrentUser } from "~/db/auth";
import { getSessionToken } from "~/session";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface RestaurantListItem {
  id: number;
  name: string;
  city: string;
  safety_tier: number;
  verified: boolean;
  website: string | null;
  created_at: string;
  contact_email: string | null;
  cuisine_type: string | null;
}

interface RestaurantFull {
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
  verified: boolean;
  contact_email: string | null;
}

interface PendingUpdateItem {
  id: number;
  restaurant_id: number;
  submitter_email: string;
  submitter_name: string | null;
  changes: Record<string, unknown>;
  status: string;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  restaurant_name: string;
  restaurant_city: string;
}

interface AlertItem {
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

const ALL_ALLERGENS = [
  "gluten",
  "dairy",
  "eggs",
  "peanuts",
  "tree nuts",
  "soy",
  "shellfish",
  "fish",
  "sesame",
  "mustard",
  "sulfites",
  "corn",
  "lupin",
  "molluscs",
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/admin/restaurants")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SafePlate — Admin: Restaurants" },
    ],
  }),
  component: AdminRestaurantsPage,
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
/*  Tier helpers                                                      */
/* ------------------------------------------------------------------ */

function tierBadge(tier: number) {
  switch (tier) {
    case 1:
      return {
        label: "Tier 1 · Dedicated",
        emoji: "🟢",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    case 2:
      return {
        label: "Tier 2 · Protocols",
        emoji: "🟡",
        className: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case 3:
      return {
        label: "Tier 3 · Friendly",
        emoji: "🔵",
        className: "bg-sky-100 text-sky-700 border-sky-200",
      };
    default:
      return {
        label: "Unknown",
        emoji: "⚪",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Password Gate                                                     */
/* ------------------------------------------------------------------ */

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setChecking(false);
      setDenied(true);
      return;
    }
    getCurrentUser({ data: { token } }).then((user) => {
      if (user?.role === "admin") {
        onUnlock();
      } else {
        setDenied(true);
      }
      setChecking(false);
    });
  }, [onUnlock]);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAFAF9] dark:bg-slate-950 p-6">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 animate-spin text-sky-500" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round" />
          </svg>
          <span className="text-slate-500 dark:text-slate-400">Checking access…</span>
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAFAF9] dark:bg-slate-950 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-500 text-2xl shadow-md">🔒</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You need admin privileges to access this page.
          </p>
          <a href="/login" className="inline-block rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95">
            Log In
          </a>
        </div>
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar({
  bulkMode,
  onToggleBulkMode,
  unrepliedCount,
  onTrackingClick,
}: {
  bulkMode?: boolean;
  onToggleBulkMode?: () => void;
  unrepliedCount?: number;
  onTrackingClick?: () => void;
}) {
  const handleLock = () => {
    // No longer using sessionStorage;
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
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
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Home
          </a>
          <a
            href="/search"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Search
          </a>
          <a
            href="/process-replies"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Process Replies
          </a>
          <a
            href="/admin/analytics"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            📊 Analytics
          </a>
          <a
            href="/admin/import-emails"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            📥 Import Emails
          </a>
          {onTrackingClick && unrepliedCount != null && unrepliedCount > 0 && (
            <button
              type="button"
              onClick={onTrackingClick}
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-all cursor-pointer whitespace-nowrap"
            >
              📬 {unrepliedCount}
            </button>
          )}
          {onToggleBulkMode && (
            <button
              type="button"
              onClick={onToggleBulkMode}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                bulkMode
                  ? "bg-sky-500 text-white shadow-sm"
                  : "bg-sky-100 text-sky-600 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
              }`}
            >
              📧 Bulk Email
            </button>
          )}
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            Admin
          </span>
          <button
            onClick={handleLock}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors cursor-pointer"
            title="Lock admin"
          >
            🔒
          </button>
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
    <footer className="border-t border-slate-100 bg-[#FAFAF9] py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-base">
            🍽️
          </span>
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
            SafePlate
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} SafePlate. Internal admin tool.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Form Component                                               */
/* ------------------------------------------------------------------ */

function EditForm({
  restaurant,
  onSave,
  onCancel,
}: {
  restaurant: RestaurantFull;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [safetyTier, setSafetyTier] = useState(restaurant.safety_tier);
  const [hasDedicatedFryer, setHasDedicatedFryer] = useState(
    restaurant.has_dedicated_fryer,
  );
  const [hasIsolatedPrep, setHasIsolatedPrep] = useState(
    restaurant.has_isolated_prep,
  );
  const [allergenTrainedStaff, setAllergenTrainedStaff] = useState(
    restaurant.allergen_trained_staff,
  );
  const [freeFrom, setFreeFrom] = useState<string[]>(
    restaurant.free_from ?? [],
  );
  const [allergensHandled, setAllergensHandled] = useState<string[]>(
    restaurant.allergens_handled ?? [],
  );
  const [verified, setVerified] = useState(restaurant.verified);
  const [cuisineType, setCuisineType] = useState(
    restaurant.cuisine_type === "Recommended by community" ? "" : (restaurant.cuisine_type ?? ""),
  );
  const [description, setDescription] = useState(
    restaurant.description ?? "",
  );
  const [website, setWebsite] = useState(restaurant.website ?? "");
  const [phone, setPhone] = useState(restaurant.phone ?? "");
  const [contactEmail, setContactEmail] = useState(restaurant.contact_email ?? "");
  const [address, setAddress] = useState(restaurant.address ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const toggleFreeFrom = (a: string) => {
    setFreeFrom((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  const toggleAllergensHandled = (a: string) => {
    setAllergensHandled((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updates: Record<string, unknown> = {};
      if (safetyTier !== restaurant.safety_tier) updates.safety_tier = safetyTier;
      if (hasDedicatedFryer !== restaurant.has_dedicated_fryer)
        updates.has_dedicated_fryer = hasDedicatedFryer;
      if (hasIsolatedPrep !== restaurant.has_isolated_prep)
        updates.has_isolated_prep = hasIsolatedPrep;
      if (allergenTrainedStaff !== restaurant.allergen_trained_staff)
        updates.allergen_trained_staff = allergenTrainedStaff;
      if (verified !== restaurant.verified) updates.verified = verified;
      if (cuisineType !== (restaurant.cuisine_type === "Recommended by community" ? "" : (restaurant.cuisine_type ?? "")))
        updates.cuisine_type = cuisineType || null;
      if (description !== (restaurant.description ?? ""))
        updates.description = description || null;
      if (website !== (restaurant.website ?? ""))
        updates.website = website || null;
      if (phone !== (restaurant.phone ?? "")) updates.phone = phone || null;
      if (contactEmail !== (restaurant.contact_email ?? "")) updates.contact_email = contactEmail || null;
      if (address !== (restaurant.address ?? ""))
        updates.address = address || null;

      // Arrays: compare sorted
      const ffSorted = [...freeFrom].sort();
      const ffOrigSorted = [...(restaurant.free_from ?? [])].sort();
      if (JSON.stringify(ffSorted) !== JSON.stringify(ffOrigSorted))
        updates.free_from = freeFrom;

      const ahSorted = [...allergensHandled].sort();
      const ahOrigSorted = [...(restaurant.allergens_handled ?? [])].sort();
      if (JSON.stringify(ahSorted) !== JSON.stringify(ahOrigSorted))
        updates.allergens_handled = allergensHandled;

      await onSave(updates);
      setMessage({ type: "success", text: "Restaurant updated successfully!" });
      // Clear message after 3s
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/30 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-5">
        Editing: {restaurant.name}
      </h3>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Safety Tier */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Safety Tier
          </label>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3].map((t) => {
              const tb = tierBadge(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSafetyTier(t)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                    safetyTier === t
                      ? t === 1
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md"
                        : t === 2
                          ? "bg-amber-500 text-white border-amber-500 shadow-md"
                          : "bg-sky-500 text-white border-sky-500 shadow-md"
                      : `bg-white border-slate-200 hover:bg-slate-50 ${tb.className.split(" ")[0]}`
                  }`}
                >
                  {tb.emoji} {tb.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kitchen Protocols */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Kitchen Protocols
          </label>
          <div className="flex flex-wrap gap-4">
            <Toggle
              label="Dedicated Fryer"
              checked={hasDedicatedFryer}
              onChange={setHasDedicatedFryer}
            />
            <Toggle
              label="Isolated Prep"
              checked={hasIsolatedPrep}
              onChange={setHasIsolatedPrep}
            />
            <Toggle
              label="Allergen-Trained Staff"
              checked={allergenTrainedStaff}
              onChange={setAllergenTrainedStaff}
            />
          </div>
        </div>

        {/* Verified toggle */}
        <div className="sm:col-span-2">
          <Toggle
            label="Verified"
            checked={verified}
            onChange={setVerified}
          />
        </div>

        {/* Free From */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Free From (kitchen excludes these)
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_ALLERGENS.map((a) => (
              <CheckChip
                key={`ff-${a}`}
                label={capitalize(a)}
                checked={freeFrom.includes(a)}
                onChange={() => toggleFreeFrom(a)}
                color="emerald"
              />
            ))}
          </div>
        </div>

        {/* Allergens Handled */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Allergens Handled (kitchen works with these)
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_ALLERGENS.map((a) => (
              <CheckChip
                key={`ah-${a}`}
                label={capitalize(a)}
                checked={allergensHandled.includes(a)}
                onChange={() => toggleAllergensHandled(a)}
                color="amber"
              />
            ))}
          </div>
        </div>

        {/* Text fields */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Cuisine Type
          </label>
          <input
            type="text"
            value={cuisineType}
            onChange={(e) => setCuisineType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
            placeholder="e.g. Tex-Mex"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Website
          </label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Phone
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Contact Email
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
            placeholder="owner@restaurant.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
            placeholder="123 Main St, City, ST 12345"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y"
            placeholder="Short description of the restaurant..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving && <IconSpinner className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 cursor-pointer"
        >
          Cancel
        </button>
        {message && (
          <span
            className={`text-sm font-medium ${
              message.type === "success" ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                     */
/* ------------------------------------------------------------------ */

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 group cursor-pointer"
    >
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
      <span
        className={`text-sm font-medium transition-colors ${
          checked ? "text-emerald-700" : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  CheckChip                                                         */
/* ------------------------------------------------------------------ */

function CheckChip({
  label,
  checked,
  onChange,
  color,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  color: "emerald" | "amber";
}) {
  const baseColor = color === "emerald" ? "emerald" : "amber";
  return (
    <button
      type="button"
      onClick={onChange}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
        checked
          ? `bg-${baseColor}-500 text-white border-${baseColor}-500 shadow-sm`
          : `bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50`
      }`}
    >
      {checked && "✓ "}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Mark Verified quick action button                                  */
/* ------------------------------------------------------------------ */

function MarkVerifiedButton({
  restaurantId,
  restaurantName,
  onDone,
}: {
  restaurantId: number;
  restaurantName: string;
  onDone: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMark = async () => {
    setLoading(true);
    try {
      await markVerified({ data: { id: restaurantId } });
      onDone();
    } catch {
      // silent
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-all cursor-pointer whitespace-nowrap"
      >
        ✓ Mark Verified
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-xs text-slate-500">Verify "{restaurantName}"?</span>
      <button
        type="button"
        onClick={handleMark}
        disabled={loading}
        className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? "…" : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
      >
        No
      </button>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Email Compose Modal                                                */
/* ------------------------------------------------------------------ */

/** Extract the bare domain from a URL (e.g. "pizzeriabianco.com") */
function extractDomain(url: string): string | null {
  try {
    const hostname = new URL(
      url.startsWith("http") ? url : "https://" + url,
    ).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Email template definitions — placeholders use {restaurantName} and {tier} */
interface EmailTemplate {
  label: string;
  subject: string;
  body: string;
}

function buildTemplates(
  restaurantName: string,
  tier: number,
): EmailTemplate[] {
  const name = restaurantName;
  const tierUpgrade = tier !== 1
    ? `\n\nCurrently, ${name} is at Tier ${tier === 2 ? "2 (🟡 Good)" : "3 (🔵 Basic)"}. Tier 1 (🟢 Medical-Grade) is our highest safety rating — reserved for restaurants that verify dedicated equipment and allergen-trained staff. If you can confirm your kitchen protocols, we'll upgrade you to Tier 1 for free, which gives you the green badge and top placement in search results.`
    : "";
  return [
    {
      label: "Claim Listing",
      subject: `Claim your SafePlate listing — ${name}`,
      body: `Hi there,

I noticed ${name} is listed on SafePlate, the allergy-safe dining platform. Your restaurant currently has a Tier ${tier} safety rating.

You can claim your listing to update your protocols, add photos, and get verified — all free.${tierUpgrade}

Claim your listing here: https://safeplate.company/claim

Visit https://safeplate.company/claim to claim your listing in under 2 minutes.

Best,
[Your Name]
SafePlate Team`,
    },
    {
      label: "Verify Protocols",
      subject: `Verify your kitchen protocols — ${name}`,
      body: `Hi there,

SafePlate helps people with food allergies and dietary restrictions find safe restaurants. ${name} is currently listed on our platform, and we'd love to verify your kitchen protocols.${tierUpgrade}

Could you confirm:
- Do you have a dedicated fryer?
- Do you have isolated prep stations for allergen-free meals?
- Is your staff trained on allergen safety?

Reply to this email and we'll update your listing right away.

Best,
[Your Name]
SafePlate Team`,
    },
    {
      label: "Partner",
      subject: `Partner with SafePlate — ${name}`,
      body: `Hi there,

SafePlate is growing fast, and we'd love to feature ${name} more prominently on our platform. We offer:

• Featured Listing ($29/mo) — top placement in search results
• Verified Badge ($49 one-time) — builds trust with the allergen community${tier !== 1 ? `\n    • Tier 1 Upgrade — verify your kitchen protocols and earn our 🟢 Medical-Grade badge (free with verification)` : ""}
• Premium placement in city guides and blog content

Interested? Reply to this email or visit safeplate.company/list-your-venue to learn more.

Best,
[Your Name]
SafePlate Team`,
    },
  ];
}

function EmailModal({
  restaurantName,
  restaurantId,
  onClose,
}: {
  restaurantName: string;
  restaurantId: number;
  onClose: () => void;
}) {
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitterEmails, setSubmitterEmails] = useState<string[]>([]);
  const [emailsLoaded, setEmailsLoaded] = useState(false);

  // Restaurant details (for website + safety tier)
  const [restaurantWebsite, setRestaurantWebsite] = useState<string | null>(null);
  const [restaurantTier, setRestaurantTier] = useState(3);
  const [restaurantDataLoaded, setRestaurantDataLoaded] = useState(false);
  const [contactEmail, setContactEmail] = useState<string | null>(null);

  useEffect(() => {
    getSubmitterEmails({ data: { restaurantId } })
      .then((emails) => {
        setSubmitterEmails(emails as string[]);
        setEmailsLoaded(true);
      })
      .catch(() => setEmailsLoaded(true));
  }, [restaurantId]);

  useEffect(() => {
    adminGetRestaurant({ data: { id: restaurantId } })
      .then((data) => {
        const r = data as RestaurantFull | null;
        if (r) {
          setRestaurantWebsite(r.website ?? null);
          setRestaurantTier(r.safety_tier);
          if (r.contact_email) setContactEmail(r.contact_email as string);
        }
        setRestaurantDataLoaded(true);
      })
      .catch(() => setRestaurantDataLoaded(true));
  }, [restaurantId]);

  const domain = restaurantWebsite ? extractDomain(restaurantWebsite) : null;
  const suggestionEmails = domain
    ? [
        `info@${domain}`,
        `contact@${domain}`,
        `hello@${domain}`,
      ]
    : [];
  const templates = buildTemplates(restaurantName, restaurantTier);

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await sendRestaurantEmail({
        data: { restaurantName, toEmail, subject, body, restaurantId },
      });
      if (res.success) {
        setResult({ type: "success", text: "Email sent successfully!" });
        setTimeout(() => onClose(), 1500);
      } else {
        setResult({
          type: "error",
          text: res.error ?? "Failed to send.",
        });
      }
    } catch (err) {
      setResult({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to send.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (tpl: EmailTemplate) => {
    setSubject(tpl.subject);
    setBody(tpl.body);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !sending) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-800 overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            ✉️ Email Restaurant
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {/* Restaurant name (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Restaurant
            </label>
            <input
              type="text"
              value={restaurantName}
              readOnly
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 shadow-sm cursor-default"
            />
          </div>

          {/* To email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              To
            </label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="owner@restaurant.com"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
            />

            {/* Pre-fill hints from submitter emails */}
            {emailsLoaded && submitterEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  Use:
                </span>
                {submitterEmails.map((email) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => setToEmail(email)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                      toEmail === email
                        ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                        : "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                    }`}
                  >
                    {email}
                  </button>
                ))}
              </div>
            )}

            {/* Contact email from restaurant record */}
            {contactEmail && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  📇 Contact:
                </span>
                <button
                  type="button"
                  onClick={() => setToEmail(contactEmail)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    toEmail === contactEmail
                      ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                      : "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                  }`}
                >
                  {contactEmail}
                </button>
              </div>
            )}

            {/* Smart email suggestions from restaurant website */}
            {restaurantDataLoaded && restaurantWebsite && domain && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  🔗
                </span>
                <a
                  href={
                    restaurantWebsite.startsWith("http")
                      ? restaurantWebsite
                      : "https://" + restaurantWebsite
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-sky-100 dark:bg-sky-900/30 px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors cursor-pointer no-underline"
                >
                  {domain}
                </a>
                <a
                  href={
                    restaurantWebsite.startsWith("http")
                      ? restaurantWebsite
                      : "https://" + restaurantWebsite
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-sky-500 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer no-underline ml-1"
                >
                  ↗ Visit Website
                </a>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mx-1">
                  |
                </span>
                {suggestionEmails.map((email) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => setToEmail(email)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                      toEmail === email
                        ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                        : "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-700 hover:bg-sky-200 dark:hover:bg-sky-900/50"
                    }`}
                  >
                    {email}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Verify your safety protocols"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
            />
          </div>

          {/* Template picker */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                📋 Templates:
              </span>
              {templates.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => handleTemplateSelect(tpl)}
                  className="rounded-full border border-sky-200 dark:border-sky-700 bg-sky-100 dark:bg-sky-900/30 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Write your message to the restaurant…"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y"
            />
          </div>

          {/* Result message */}
          {result && (
            <div
              className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
                result.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
              }`}
            >
              {result.type === "success" ? "✅ " : "❌ "}
              {result.text}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !toEmail.trim() || !subject.trim() || !body.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {sending && <IconSpinner className="h-4 w-4 animate-spin" />}
            {sending ? "Sending…" : "Send Email"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bulk Email Templates & Modal                                       */
/* ------------------------------------------------------------------ */

interface BulkEmailTemplate {
  label: string;
  subject: string;
  body: string;
}

function buildBulkTemplates(): BulkEmailTemplate[] {
  return [
    {
      label: "Claim Listing",
      subject: "Claim your SafePlate listing",
      body: `Hi there,

We noticed your restaurant is listed on SafePlate, the allergy-safe dining platform.

You can claim your listing to update your protocols, add photos, and get verified — all free.

Claim your listing here: https://safeplate.company/claim

Best,
[Your Name]
SafePlate Team`,
    },
    {
      label: "Verify Protocols",
      subject: "Verify your kitchen protocols with SafePlate",
      body: `Hi there,

SafePlate helps people with food allergies and dietary restrictions find safe restaurants. Your restaurant is currently listed on our platform, and we'd love to verify your kitchen protocols.

Could you confirm:
- Do you have a dedicated fryer?
- Do you have isolated prep stations for allergen-free meals?
- Is your staff trained on allergen safety?

Reply to this email and we'll update your listing right away.

Best,
[Your Name]
SafePlate Team`,
    },
    {
      label: "Partner",
      subject: "Partner with SafePlate",
      body: `Hi there,

SafePlate is growing fast, and we'd love to feature your restaurant more prominently on our platform. We offer:

• Featured Listing ($29/mo) — top placement in search results
• Verified Badge ($49 one-time) — builds trust with the allergen community

Interested? Reply to this email or visit safeplate.company/list-your-venue to learn more.

Best,
[Your Name]
SafePlate Team`,
    },
  ];
}

function BulkEmailModal({
  selectedCount,
  selectedIds,
  onClose,
}: {
  selectedCount: number;
  selectedIds: number[];
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "sending" | "done">("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{
    sent: number;
    failed: number;
    skipped: number;
    error?: string;
  } | null>(null);

  const templates = buildBulkTemplates();

  const handleTemplateSelect = (tpl: BulkEmailTemplate) => {
    setSubject(tpl.subject);
    setBody(tpl.body);
  };

  const handleSend = async () => {
    setSending(true);
    setSendState("sending");
    setProgress({ current: 0, total: selectedIds.length });
    setResult(null);
    try {
      const res = await sendBulkEmails({
        data: { restaurantIds: selectedIds, subject, body },
      });
      if (res.success) {
        setProgress({ current: res.sent + res.failed + res.skipped, total: selectedIds.length });
        setSendState("done");
        setResult({
          sent: res.sent,
          failed: res.failed,
          skipped: res.skipped,
        });
      } else {
        setSendState("done");
        setResult({
          sent: 0,
          failed: 0,
          skipped: 0,
          error: (res as { error?: string }).error ?? "Failed to send.",
        });
      }
    } catch (err) {
      setSendState("done");
      setResult({
        sent: 0,
        failed: selectedIds.length,
        skipped: 0,
        error: err instanceof Error ? err.message : "Failed to send.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !sending) onClose();
  };

  const hasNoResult = sendState === "idle";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-800 overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            📧 Bulk Email — {selectedCount} restaurants
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {hasNoResult && (
            <>
              {/* Recipient count (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sending to
                </label>
                <input
                  type="text"
                  value={`${selectedCount} restaurant${selectedCount !== 1 ? "s" : ""}`}
                  readOnly
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 shadow-sm cursor-default"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Verify your safety protocols"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                />
              </div>

              {/* Template picker */}
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    📋 Templates:
                  </span>
                  {templates.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => handleTemplateSelect(tpl)}
                      className="rounded-full border border-sky-200 dark:border-sky-700 bg-sky-100 dark:bg-sky-900/30 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Write your message to the restaurants…"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y"
                />
              </div>
            </>
          )}

          {/* Sending state */}
          {sendState === "sending" && (
            <div className="py-8 text-center">
              <IconSpinner className="h-8 w-8 animate-spin text-sky-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sending {progress.current}/{progress.total}...
              </p>
            </div>
          )}

          {/* Done state */}
          {sendState === "done" && result && (
            <div className="py-6">
              {result.error ? (
                <div className="rounded-lg px-4 py-3 text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  ❌ {result.error}
                </div>
              ) : result.sent + result.failed + result.skipped === 0 ? (
                <div className="rounded-lg px-4 py-3 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  None of the selected restaurants have contact emails on file. Restaurants need to submit an update or claim their listing first.
                </div>
              ) : (
                <div className="rounded-lg px-4 py-3 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  ✅ {result.sent} sent{result.failed > 0 && `, ${result.failed} failed`}{result.skipped > 0 && `, ${result.skipped} skipped (no email on file)`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {hasNoResult && (
          <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {sending && <IconSpinner className="h-4 w-4 animate-spin" />}
              {sending ? "Sending…" : `Send to ${selectedCount} restaurant${selectedCount !== 1 ? "s" : ""}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {sendState === "done" && (
          <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Drips Tab                                                         */
/* ------------------------------------------------------------------ */

interface DripRow {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_city: string;
  recipient_email: string;
  template_used: string;
  drip_stage: number;
  sent_at: string;
  next_drip_at: string | null;
}

function DripsTab() {
  const [drips, setDrips] = useState<DripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<number | null>(null);

  const fetchDrips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDrips();
      setDrips(data as DripRow[]);
    } catch (err) {
      console.error("Failed to fetch drips:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrips();
  }, [fetchDrips]);

  const handleRunDrips = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const result = await processDrips();
      setRunResult((result as { processed: number }).processed);
      await fetchDrips();
    } catch (err) {
      console.error("Failed to process drips:", err);
    } finally {
      setRunning(false);
    }
  };

  const stageLabel = (stage: number) => {
    switch (stage) {
      case 1: return { label: "Initial", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" };
      case 2: return { label: "Follow-up 1", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
      case 3: return { label: "Follow-up 2", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" };
      default: return { label: "Complete", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };
    }
  };

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const ms = Date.now() - new Date(dateStr).getTime();
    if (ms < 0) return "pending";
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const pendingCount = drips.filter(d => d.drip_stage < 4).length;
  const dueCount = drips.filter(d => d.drip_stage < 4 && d.next_drip_at && new Date(d.next_drip_at) <= new Date()).length;

  if (loading) {
    return (
      <div className="py-10 text-center">
        <IconSpinner className="h-6 w-6 animate-spin text-sky-500 mx-auto" />
        <p className="mt-3 text-sm text-slate-500">Loading drip data…</p>
      </div>
    );
  }

  return (
    <>
      {/* Info Banner */}
      <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50/50 dark:bg-sky-950/20 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-400 mb-1.5">📧 How Drips Work</h3>
        <p className="text-sm text-sky-600 dark:text-sky-400 leading-relaxed">
          Drips are automatic — when someone visits the site, any follow-up emails that are due get sent. 
          Each drip sequence has 3 stages: initial email, follow-up at Day 3, and a final follow-up at Day 7. 
          After the final follow-up, the drip is marked complete.
        </p>
      </div>

      {/* Stats + Action */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center shadow-sm min-w-[120px]">
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{pendingCount}</div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Active drips</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-5 text-center shadow-sm min-w-[120px]">
          <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{dueCount}</div>
          <div className="mt-1 text-sm text-amber-600 dark:text-amber-400">Due now</div>
        </div>
        <button
          type="button"
          onClick={handleRunDrips}
          disabled={running || dueCount === 0}
          className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all cursor-pointer ${
            running || dueCount === 0
              ? "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed"
              : "bg-sky-500 text-white hover:bg-sky-600 shadow-sm"
          }`}
        >
          {running ? (
            <span className="flex items-center gap-2">
              <IconSpinner className="h-4 w-4 animate-spin" />
              Running…
            </span>
          ) : (
            "Run Drips Now"
          )}
        </button>
        {runResult !== null && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            ✅ Processed {runResult} drip{runResult !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Drips Table */}
      {drips.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center shadow-sm">
          <div className="text-4xl mb-3">📧</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No drips yet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Send bulk emails from the Restaurants tab to start drip sequences.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left">
                  <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Restaurant</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Stage</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Recipient</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Last Sent</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Next Send</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {drips.map((d) => {
                  const stage = stageLabel(d.drip_stage);
                  const isDue = d.drip_stage < 4 && d.next_drip_at && new Date(d.next_drip_at) <= new Date();
                  const isComplete = d.drip_stage >= 4;
                  return (
                    <tr
                      key={d.id}
                      className={`border-b border-slate-100 dark:border-slate-700 ${
                        isDue
                          ? "bg-amber-50/30 dark:bg-amber-900/10"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{d.restaurant_name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{d.restaurant_city}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stage.color}`}>
                          {stage.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {d.recipient_email}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {formatDate(d.sent_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs ${isDue ? "font-semibold text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
                          {isComplete ? "Complete" : (d.next_drip_at ? formatDate(d.next_drip_at) : "Complete")}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            ✅ Complete
                          </span>
                        ) : isDue ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                            ⏰ Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                            ⏳ Scheduled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Email Tracking Tab                                                */
/* ------------------------------------------------------------------ */

interface TrackingRow {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_city: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  recipient_email: string;
  replied: boolean;
  replied_at: string | null;
}

function EmailTrackingTab({ onReplyMarked }: { onReplyMarked?: () => void }) {
  const [trackingData, setTrackingData] = useState<TrackingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "awaiting" | "replied">("all");
  const [markingId, setMarkingId] = useState<number | null>(null);

  useEffect(() => {
    getEmailTracking()
      .then((data) => {
        setTrackingData(data as TrackingRow[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleMarkReplied = async (trackingId: number) => {
    setMarkingId(trackingId);
    try {
      await markEmailReplied({ data: { trackingId } });
      setTrackingData((prev) =>
        prev.map((t) =>
          t.id === trackingId
            ? { ...t, replied: true, replied_at: new Date().toISOString() }
            : t,
        ),
      );
      if (onReplyMarked) onReplyMarked();
    } catch {
      // silent
    } finally {
      setMarkingId(null);
    }
  };

  const totalSent = trackingData.length;
  const totalReplied = trackingData.filter((t) => t.replied).length;
  const totalAwaiting = totalSent - totalReplied;

  const filtered = trackingData.filter((t) => {
    if (filter === "awaiting") return !t.replied;
    if (filter === "replied") return t.replied;
    return true;
  });

  const timeAgo = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + "h ago";
    const days = Math.floor(hours / 24);
    return days + "d ago";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <IconSpinner className="h-6 w-6 animate-spin text-sky-500 mx-auto" />
        <p className="mt-3 text-sm text-slate-500">Loading tracking data\u2026</p>
      </div>
    );
  }

  return (
    <>
      {/* Tracking Info Banners */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 dark:bg-sky-950/20 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-sky-700 dark:text-sky-400 mb-1.5">📬 Open Tracking</h3>
          <p className="text-sm text-sky-600 dark:text-sky-400 leading-relaxed">
            Email opens are tracked via{" "}
            <a
              href="https://resend.com/emails"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-sky-800 dark:hover:text-sky-300"
            >
              Resend Dashboard
            </a>
            . All emails sent through SafePlate have{" "}
            <code className="bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5 rounded text-xs font-mono">
              track_opens: true
            </code>{" "}
            enabled by default.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">🔗 Click Tracking</h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 leading-relaxed">
            All links in emails include{" "}
            <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-xs font-mono">
              utm_source=safeplate&amp;utm_medium=email
            </code>{" "}
            params for attribution in Google Analytics or your analytics platform.
          </p>
        </div>
      </div>

      {/* Reply Stats */}
      <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalSent}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalReplied}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Replied</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalAwaiting}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Awaiting</div>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={"rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer " + (filter === "all" ? "bg-sky-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600")}
        >
          All ({totalSent})
        </button>
        <button
          type="button"
          onClick={() => setFilter("awaiting")}
          className={"rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer " + (filter === "awaiting" ? "bg-amber-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600")}
        >
          Awaiting Reply ({totalAwaiting})
        </button>
        <button
          type="button"
          onClick={() => setFilter("replied")}
          className={"rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer " + (filter === "replied" ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600")}
        >
          Replied ({totalReplied})
        </button>
      </div>

      {/* Email Rows Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center shadow-sm">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {filter === "all" ? "No emails sent yet" : filter === "awaiting" ? "No emails awaiting reply" : "No replied emails"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filter === "all" ? "Send an email to a restaurant from the Restaurants tab to start tracking." : "Check back after marking emails as replied."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left">
                  <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Restaurant</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Recipient</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Sent</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">Reply Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={"border-b border-slate-100 dark:border-slate-700 transition-colors " + (row.replied ? "bg-emerald-50/40 dark:bg-emerald-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50")}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{row.restaurant_name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{row.restaurant_city}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-slate-600 dark:text-slate-300 text-xs">{row.recipient_email}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {timeAgo(row.sent_at)}
                    </td>
                    <td className="px-5 py-3">
                      {row.replied ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          ✅ Replied {row.replied_at ? formatDate(row.replied_at) : ""}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkReplied(row.id)}
                          disabled={markingId === row.id}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {markingId === row.id ? "…" : "✅ Mark Replied"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

function AdminRestaurantsPage() {
  // ── Auth gate ──────────────────────────────────────────────────────
  const [authed, setAuthed] = useState(false);

  // ── Restaurant state ───────────────────────────────────────────────
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<RestaurantFull | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"restaurants" | "updates" | "alerts" | "tracking" | "drips" | "blog">("restaurants");

  // Pending updates state
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdateItem[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
    id: number;
  } | null>(null);

  // Safety alerts state
  const [allAlerts, setAllAlerts] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertResolvingId, setAlertResolvingId] = useState<number | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  // Email compose modal state
  const [emailModalId, setEmailModalId] = useState<number | null>(null);
  const [emailModalName, setEmailModalName] = useState("");

  // ── Bulk mode state ────────────────────────────────────────────────
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [hasWebsiteFilter, setHasWebsiteFilter] = useState(false);
  const [hasEmailFilter, setHasEmailFilter] = useState(false);
  const [communityFilter, setCommunityFilter] = useState(false);
  const [restaurantEmails, setRestaurantEmails] = useState<Map<number, string>>(new Map());
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
  const [unrepliedCount, setUnrepliedCount] = useState<number>(0);
  // Blog submissions state
  const [blogSubmissions, setBlogSubmissions] = useState<BlogSubmission[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogReviewingId, setBlogReviewingId] = useState<number | null>(null);
  const [blogSlug, setBlogSlug] = useState("");
  const [blogRejectNotes, setBlogRejectNotes] = useState("");
  const [blogActionLoading, setBlogActionLoading] = useState<number | null>(null);
  const [blogMessage, setBlogMessage] = useState<{ type: "success" | "error"; text: string; id: number } | null>(null);

  const fetchReplyStats = useCallback(async () => {
    try {
      const stats = await getReplyStats() as { total: number; replied: number; awaiting: number };
      setUnrepliedCount(stats.awaiting);
    } catch {
      // silent
    }
  }, []);

  // Fetch reply stats on mount and when switching to tracking tab
  useEffect(() => {
    fetchReplyStats();
  }, [fetchReplyStats]);

  // Refresh stats when switching to tracking tab
  useEffect(() => {
    if (activeTab === "tracking") {
      fetchReplyStats();
    }
  }, [activeTab, fetchReplyStats]);

  const fetchList = useCallback(async (searchTerm: string) => {
    setLoading(true);
    try {
      const data = await adminListRestaurants({
        data: searchTerm.trim() ? { search: searchTerm.trim() } : undefined,
      });
      setRestaurants(data as RestaurantListItem[]);
    } catch (err) {
      console.error("Failed to load restaurants:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchList("");
    }
  }, [fetchList]);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchList(val);
    }, 300);
  };

  const startEditing = async (id: number) => {
    setEditingId(id);
    setEditLoading(true);
    setEditData(null);
    try {
      const data = await adminGetRestaurant({ data: { id } });
      setEditData(data as RestaurantFull | null);
    } catch (err) {
      console.error("Failed to load restaurant details:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleSave = async (updates: Record<string, unknown>) => {
    if (!editingId) return;
    const result = await updateRestaurant({
      data: { id: editingId, ...updates } as {
        id: number;
        [key: string]: unknown;
      },
    });
    if (!result.success) {
      throw new Error(result.error ?? "Failed to save");
    }
    // Refresh the list (and the edit data)
    await fetchList(search);
    const updated = await adminGetRestaurant({ data: { id: editingId } });
    setEditData(updated as RestaurantFull | null);
  };

  // ── Pending Updates ──

  const fetchPendingUpdates = useCallback(async () => {
    setUpdatesLoading(true);
    try {
      const data = await listPendingUpdates();
      setPendingUpdates(data as PendingUpdateItem[]);
    } catch (err) {
      console.error("Failed to load pending updates:", err);
    } finally {
      setUpdatesLoading(false);
    }
  }, []);

  // Load pending updates when tab switches
  useEffect(() => {
    if (activeTab === "updates") {
      fetchPendingUpdates();
    }
  }, [activeTab, fetchPendingUpdates]);

  // Load alerts when tab switches
  useEffect(() => {
    if (activeTab === "alerts") {
      fetchAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  // Load blog submissions when tab switches
  useEffect(() => {
    if (activeTab === "blog") {
      fetchBlogSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  const fetchBlogSubmissions = useCallback(async () => {
    setBlogLoading(true);
    try {
      const data = await getBlogSubmissions();
      setBlogSubmissions(data as BlogSubmission[]);
    } catch (err) {
      console.error("Failed to load blog submissions:", err);
    } finally {
      setBlogLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const data = await getActiveAlerts();
      setAllAlerts(data as AlertItem[]);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const handleResolveAlert = async (alertId: number) => {
    setAlertResolvingId(alertId);
    try {
      const result = await resolveAlert({ data: { alert_id: alertId } });
      if (result.success) {
        // Move the alert to resolved locally
        setAllAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId
              ? { ...a, status: "resolved", resolved_at: new Date().toISOString() }
              : a,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    } finally {
      setAlertResolvingId(null);
    }
  };

  const activeAlerts = allAlerts.filter((a) => a.status === "active");
  const resolvedAlerts = allAlerts.filter((a) => a.status === "resolved");

  const alertTypeLabel = (t: string) => {
    const labels: Record<string, string> = {
      ingredient_change: "Ingredient change",
      menu_change: "Menu item removed/changed",
      protocol_change: "Protocol change",
      other: "Other",
    };
    return labels[t] ?? t;
  };

  const handleApprove = async (updateId: number) => {
    setActionLoading(updateId);
    setActionMessage(null);
    try {
      const result = await approveUpdate({ data: { update_id: updateId } });
      if (result.success) {
        setActionMessage({ type: "success", text: "Approved!", id: updateId });
        // Remove from list
        setPendingUpdates((prev) => prev.filter((u) => u.id !== updateId));
        setReviewingId(null);
      } else {
        setActionMessage({
          type: "error",
          text: result.error ?? "Failed to approve.",
          id: updateId,
        });
      }
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed.",
        id: updateId,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (updateId: number) => {
    setActionLoading(updateId);
    setActionMessage(null);
    try {
      const result = await rejectUpdate({ data: { update_id: updateId } });
      if (result.success) {
        setActionMessage({ type: "success", text: "Rejected.", id: updateId });
        setPendingUpdates((prev) => prev.filter((u) => u.id !== updateId));
        setReviewingId(null);
      } else {
        setActionMessage({
          type: "error",
          text: result.error ?? "Failed to reject.",
          id: updateId,
        });
      }
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed.",
        id: updateId,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Bulk mode helpers ──────────────────────────────────────────────

  const ALL_CITIES = ["Austin", "Atlanta", "Chicago", "Dallas", "Denver", "Nashville", "Portland", "St. Louis", "Sarasota"];

  // Fetch restaurant emails when entering bulk mode
  const fetchEmails = useCallback(async () => {
    try {
      const rows = await getAllRestaurantEmails() as { restaurant_id: number; submitter_email: string }[];
      const map = new Map<number, string>();
      for (const row of rows) {
        map.set(row.restaurant_id, row.submitter_email);
      }
      setRestaurantEmails(map);
    } catch {
      // silent
    }
  }, []);

  // Enter bulk mode
  const enterBulkMode = useCallback(() => {
    setBulkMode(true);
    setSelectedIds(new Set());
    setCityFilter(null);
    setTierFilter(null);
    setHasWebsiteFilter(false);
    setHasEmailFilter(false);
    setCommunityFilter(false);
    fetchEmails();
  }, [fetchEmails]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && bulkMode) {
        setBulkMode(false);
        setSelectedIds(new Set());
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [bulkMode]);

  // Toggle a single restaurant selection
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Filtered restaurant list
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    if (cityFilter) {
      filtered = filtered.filter((r) => r.city === cityFilter);
    }
    if (tierFilter) {
      filtered = filtered.filter((r) => r.safety_tier === tierFilter);
    }
    if (hasWebsiteFilter) {
      filtered = filtered.filter((r) => r.website && r.website.trim().length > 0);
    }
    if (hasEmailFilter) {
      filtered = filtered.filter((r) => restaurantEmails.has(r.id));
    }
    if (communityFilter) {
      filtered = filtered.filter((r) => r.cuisine_type === 'Recommended by community');
    }

    return filtered;
  }, [restaurants, cityFilter, tierFilter, hasWebsiteFilter, hasEmailFilter, communityFilter, restaurantEmails]);

  // Select / deselect all currently filtered restaurants
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const filteredIds = new Set(filteredRestaurants.map((r) => r.id));
      const allSelected = filteredRestaurants.every((r) => prev.has(r.id));
      if (allSelected) {
        // Deselect all filtered ones
        const next = new Set(prev);
        for (const id of filteredIds) next.delete(id);
        return next;
      } else {
        // Select all filtered ones
        const next = new Set(prev);
        for (const id of filteredIds) next.add(id);
        return next;
      }
    });
  }, [filteredRestaurants]);

  // Reset filters when changing city
  const handleCityFilter = useCallback((city: string | null) => {
    setCityFilter(city);
    setSelectedIds(new Set());
  }, []);

  const selectedCount = selectedIds.size;
  const displayList = (bulkMode || communityFilter) ? filteredRestaurants : restaurants;

  const countByCity = restaurants.reduce<Record<string, number>>((acc, r) => {
    acc[r.city] = (acc[r.city] ?? 0) + 1;
    return acc;
  }, {});

  // ── Password gate (early return) ────────────────────────────────────
  if (!authed) {
    return <AdminGate onUnlock={() => setAuthed(true)} />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAF9] text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <NavBar
        bulkMode={bulkMode}
        onToggleBulkMode={() => bulkMode ? (setBulkMode(false), setSelectedIds(new Set())) : enterBulkMode()}
        unrepliedCount={unrepliedCount}
        onTrackingClick={() => setActiveTab("tracking")}
      />
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-5xl px-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
              Restaurant Editor
            </h1>
            <p className="mt-2 text-slate-600">
              Review and update restaurant safety tiers, protocols, and allergen data.
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("restaurants")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "restaurants"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              🍽️ Restaurants
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("updates")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all cursor-pointer relative ${
                activeTab === "updates"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              ⏳ Pending Updates
              {pendingUpdates.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                  {pendingUpdates.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("alerts")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all cursor-pointer relative ${
                activeTab === "alerts"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              ⚠️ Safety Alerts
              {activeAlerts.length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                  {activeAlerts.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tracking")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "tracking"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              📊 Email Tracking
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("drips")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "drips"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              📧 Drips
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("blog")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all cursor-pointer relative ${
                activeTab === "blog"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              ✍️ Blog Submissions
              {blogSubmissions.filter(s => s.status === "pending").length > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                  {blogSubmissions.filter(s => s.status === "pending").length}
                </span>
              )}
            </button>
          </div>

          {/* RESTAURANTS TAB */}
          {activeTab === "restaurants" && (
            <>
              {/* Search */}
              <div className="relative mb-6">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by name or city..."
                  className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                />
              </div>

              {/* Filter pills (bulk mode) */}
              {bulkMode && (
                <div className="mb-4 space-y-2">
                  {/* City filters */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide self-center mr-1">
                      City:
                    </span>
                    {ALL_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleCityFilter(cityFilter === city ? null : city)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                          cityFilter === city
                            ? "bg-sky-500 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>

                  {/* Tier + attribute filters */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide self-center mr-1">
                      Tier:
                    </span>
                    {[1, 2, 3].map((t) => {
                      const tb = tierBadge(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTierFilter(tierFilter === t ? null : t)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                            tierFilter === t
                              ? "bg-sky-500 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                          }`}
                        >
                          {tb.emoji} Tier {t}
                        </button>
                      );
                    })}
                    <span className="text-[11px] font-medium text-slate-300 dark:text-slate-600 mx-1 self-center">|</span>
                    <button
                      type="button"
                      onClick={() => setHasWebsiteFilter(!hasWebsiteFilter)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                        hasWebsiteFilter
                          ? "bg-sky-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      }`}
                    >
                      🌐 Has Website
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasEmailFilter(!hasEmailFilter)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                        hasEmailFilter
                          ? "bg-sky-500 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      }`}
                    >
                      ✉️ Has Submitted Email
                    </button>
                    {/* Clear all filters */}
                    {(cityFilter || tierFilter || hasWebsiteFilter || hasEmailFilter || communityFilter) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCityFilter(null);
                          setTierFilter(null);
                          setHasWebsiteFilter(false);
                          setHasEmailFilter(false);
    setCommunityFilter(false);
                        }}
                        className="rounded-full px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                  {bulkMode && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Showing {filteredRestaurants.length} of {restaurants.length} restaurants
                      {(cityFilter || tierFilter || hasWebsiteFilter || hasEmailFilter || communityFilter) && " (filtered)"}
                    </p>
                  )}
                </div>
              )}

              {/* Summary */}
              {!loading && restaurants.length > 0 && !bulkMode && (<>
                <div className="mb-6 flex flex-wrap gap-3">
                  {Object.entries(countByCity)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([city, count]) => (
                      <span
                        key={city}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        📍 {city}: {count}
                      </span>
                    ))}
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    Total: {restaurants.length}
                  </span>
                </div>
                  <button
                    type="button"
                    onClick={() => setCommunityFilter(!communityFilter)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      communityFilter
                        ? "bg-purple-500 text-white border-purple-500 shadow-sm"
                        : "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                    }`}
                  >
                    🆕 Suggestions ({restaurants.filter(r => r.cuisine_type === 'Recommended by community').length})
                  </button>
              </>)}

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <IconSpinner className="h-8 w-8 animate-spin text-sky-500" />
                  <span className="ml-3 text-slate-500">Loading restaurants…</span>
                </div>
              )}

              {/* Empty state */}
              {!loading && restaurants.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-slate-500">
                    No restaurants found. Try a different search or seed the database first.
                  </p>
                </div>
              )}

              {/* Restaurant table */}
              {!loading && displayList.length > 0 && (
                <div className="space-y-3">
                  {/* Select All checkbox (bulk mode) */}
                  {bulkMode && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={filteredRestaurants.length > 0 && filteredRestaurants.every((r) => selectedIds.has(r.id))}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Select All ({filteredRestaurants.length})
                      </span>
                    </div>
                  )}
                  {displayList.map((r) => {
                    const tb = tierBadge(r.safety_tier);
                    const isEditing = editingId === r.id;
                    return (
                      <div key={r.id}>
                        {/* Row */}
                        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md flex-wrap">
                          {/* Bulk checkbox */}
                          {bulkMode && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(r.id)}
                              onChange={() => toggleSelect(r.id)}
                              className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer shrink-0"
                            />
                          )}
                          {/* Name */}
                          <div className="flex-1 min-w-[180px]">
                            <h3 className="text-sm font-semibold text-slate-800">
                              {r.name}
                            </h3>
                            <p className="text-xs text-slate-500">{r.city}</p>
                            {r.contact_email && (
                              <p className="text-xs text-slate-400 mt-0.5">{r.contact_email}</p>
                            )}
                          </div>

                          {/* Tier badge */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${tb.className}`}
                          >
                            {tb.emoji} {tb.label}
                          </span>

                          {/* Verified */}
                          <span className="text-xs font-medium whitespace-nowrap">
                            {r.verified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <svg
                                  className="h-4 w-4"
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
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                Unverified
                              </span>
                            )}
                          </span>

                          {/* Edit button */}
                          <div className="flex items-center gap-2">
                            {/* Mark Verified quick action */}
                            {!r.verified && (
                              <MarkVerifiedButton
                                restaurantId={r.id}
                                restaurantName={r.name}
                                onDone={() => fetchList(search)}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                isEditing ? cancelEditing() : startEditing(r.id)
                              }
                              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                isEditing
                                  ? "bg-sky-500 text-white border-sky-500"
                                  : "bg-white text-sky-600 border-sky-200 hover:bg-sky-50 hover:border-sky-300"
                            }`}
                          >
                            {isEditing ? "Close" : "Edit"}
                          </button>
                          {!bulkMode && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmailModalId(r.id);
                              setEmailModalName(r.name);
                            }}
                            className="rounded-full border border-sky-200 bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-sky-600 active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
                          >
                            ✉️ Email Restaurant
                          </button>
                          )}
                          </div>
                        </div>

                        {/* Edit form (expandable) */}
                        {isEditing && (
                          <div className="mt-2 mb-3">
                            {editLoading ? (
                              <div className="flex items-center justify-center py-8 rounded-2xl border border-slate-200 bg-white">
                                <IconSpinner className="h-5 w-5 animate-spin text-sky-500" />
                                <span className="ml-2 text-sm text-slate-500">
                                  Loading restaurant details…
                                </span>
                              </div>
                            ) : editData ? (
                              <EditForm
                                restaurant={editData}
                                onSave={handleSave}
                                onCancel={cancelEditing}
                              />
                            ) : (
                              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                                <p className="text-sm text-red-600">
                                  Failed to load restaurant data. Please try again.
                                </p>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  className="mt-2 text-xs font-medium text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Floating bulk bar */}
              {bulkMode && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg px-6 py-4">
                  <div className="mx-auto max-w-5xl flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {selectedCount} restaurant{selectedCount !== 1 ? "s" : ""} selected
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBulkMode(false)}
                        className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkEmailModalOpen(true)}
                        disabled={selectedCount === 0}
                        className="rounded-xl bg-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        ✉️ Compose Email
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk email modal */}
              {bulkEmailModalOpen && (
                <BulkEmailModal
                  selectedCount={selectedCount}
                  selectedIds={[...selectedIds]}
                  onClose={() => setBulkEmailModalOpen(false)}
                />
              )}
            </>
          )}

          {/* PENDING UPDATES TAB */}
          {activeTab === "updates" && (
            <>
              {updatesLoading && (
                <div className="flex items-center justify-center py-16">
                  <IconSpinner className="h-8 w-8 animate-spin text-sky-500" />
                  <span className="ml-3 text-slate-500">Loading pending updates…</span>
                </div>
              )}

              {!updatesLoading && pendingUpdates.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <svg
                      className="h-8 w-8 text-slate-400"
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
                  </div>
                  <p className="text-slate-500 font-medium">No pending updates</p>
                  <p className="mt-1 text-sm text-slate-400">
                    When restaurant owners submit changes, they'll appear here.
                  </p>
                </div>
              )}

              {!updatesLoading && pendingUpdates.length > 0 && (
                <div className="space-y-4">
                  {pendingUpdates.map((update) => {
                    const isReviewing = reviewingId === update.id;
                    const changes = update.changes as Record<string, unknown>;
                    const changedFields = Object.keys(changes);

                    return (
                      <div
                        key={update.id}
                        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                      >
                        {/* Summary Row */}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                              <h3 className="text-sm font-semibold text-slate-800">
                                {update.restaurant_name}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {update.restaurant_city}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                From: {update.submitter_name ?? "N/A"} (
                                {update.submitter_email})
                              </p>
                              <p className="text-xs text-slate-400">
                                {new Date(update.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {changedFields.map((field) => (
                                <span
                                  key={field}
                                  className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 whitespace-nowrap"
                                >
                                  {field.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-2">
                              {actionMessage &&
                                actionMessage.id === update.id && (
                                  <span
                                    className={`text-xs font-medium ${
                                      actionMessage.type === "success"
                                        ? "text-emerald-600"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {actionMessage.text}
                                  </span>
                                )}
                              <button
                                type="button"
                                onClick={() =>
                                  setReviewingId(
                                    isReviewing ? null : update.id,
                                  )
                                }
                                className="rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-semibold text-sky-600 transition-all hover:bg-sky-50 hover:border-sky-300 cursor-pointer"
                              >
                                {isReviewing ? "Close" : "Review"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Review Panel (expandable) */}
                        {isReviewing && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">
                              Proposed Changes
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {changedFields.map((field) => {
                                const newVal = changes[field];
                                const displayVal = Array.isArray(newVal)
                                  ? (newVal as string[]).join(", ") || "(none)"
                                  : newVal === true
                                    ? "Yes"
                                    : newVal === false
                                      ? "No"
                                      : String(newVal);
                                return (
                                  <div
                                    key={field}
                                    className="rounded-lg border border-slate-200 bg-white p-3"
                                  >
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                      {field.replace(/_/g, " ")}
                                    </span>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                        → {displayVal}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Notes */}
                            {update.notes && (
                              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  Notes
                                </span>
                                <p className="mt-1 text-sm text-slate-700">
                                  {update.notes}
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleApprove(update.id)}
                                disabled={actionLoading === update.id}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {actionLoading === update.id && (
                                  <IconSpinner className="h-4 w-4 animate-spin" />
                                )}
                                Approve & Apply
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(update.id)}
                                disabled={actionLoading === update.id}
                                className="rounded-xl border border-red-200 bg-white px-5 py-2 text-sm font-semibold text-red-600 shadow-sm transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* SAFETY ALERTS TAB */}
          {activeTab === "alerts" && (
            <>
              {alertsLoading && (
                <div className="flex items-center justify-center py-16">
                  <IconSpinner className="h-8 w-8 animate-spin text-sky-500" />
                  <span className="ml-3 text-slate-500">Loading safety alerts…</span>
                </div>
              )}

              {!alertsLoading && activeAlerts.length === 0 && resolvedAlerts.length === 0 && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <svg
                      className="h-8 w-8 text-slate-400"
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
                  </div>
                  <p className="text-slate-500 font-medium">No safety alerts</p>
                  <p className="mt-1 text-sm text-slate-400">
                    When community members report changes, they'll appear here.
                  </p>
                </div>
              )}

              {!alertsLoading && activeAlerts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Active Alerts ({activeAlerts.length})
                  </h3>
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-xl border border-amber-200 bg-white shadow-sm overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-slate-800">
                                {alert.restaurant_name}
                              </h3>
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                {alertTypeLabel(alert.alert_type)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{alert.restaurant_city}</p>
                            <p className="mt-2 text-sm text-slate-700">{alert.description}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span>
                                From: {alert.submitter_email ?? "Anonymous"}
                              </span>
                              <span>
                                {new Date(alert.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleResolveAlert(alert.id)}
                            disabled={alertResolvingId === alert.id}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                          >
                            {alertResolvingId === alert.id ? (
                              <span className="inline-flex items-center gap-1.5">
                                <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                                Resolving…
                              </span>
                            ) : (
                              "Resolve"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resolved alerts */}
              {!alertsLoading && resolvedAlerts.length > 0 && (
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => setShowResolved(!showResolved)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <svg
                      className={`h-4 w-4 transition-transform ${showResolved ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    Resolved Alerts ({resolvedAlerts.length})
                  </button>
                  {showResolved && (
                    <div className="mt-3 space-y-3">
                      {resolvedAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-slate-700">
                              {alert.restaurant_name}
                            </h4>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                              {alertTypeLabel(alert.alert_type)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{alert.restaurant_city}</p>
                          <p className="mt-1 text-sm text-slate-600">{alert.description}</p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                            {alert.submitter_email && (
                              <span>From: {alert.submitter_email}</span>
                            )}
                            <span>
                              Resolved: {alert.resolved_at
                                ? new Date(alert.resolved_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* EMAIL TRACKING TAB */}
          {activeTab === "tracking" && (
            <EmailTrackingTab onReplyMarked={fetchReplyStats} />
          )}

          {/* DRIPS TAB */}
          {activeTab === "drips" && (
            <DripsTab />
          )}
          {/* BLOG SUBMISSIONS TAB */}
          {activeTab === "blog" && (
            <BlogSubmissionsTab
              submissions={blogSubmissions}
              loading={blogLoading}
              reviewingId={blogReviewingId}
              setReviewingId={setBlogReviewingId}
              slug={blogSlug}
              setSlug={setBlogSlug}
              rejectNotes={blogRejectNotes}
              setRejectNotes={setBlogRejectNotes}
              actionLoading={blogActionLoading}
              setActionLoading={setBlogActionLoading}
              message={blogMessage}
              setMessage={setBlogMessage}
              onRefresh={fetchBlogSubmissions}
            />
          )}
        </div>
      </main>
      <Footer />

      {/* Email Compose Modal */}
      {emailModalId !== null && (
        <EmailModal
          restaurantName={emailModalName}
          restaurantId={emailModalId}
          onClose={() => {
            setEmailModalId(null);
            setEmailModalName("");
          }}
        />
      )}
    </div>
  );

/* ------------------------------------------------------------------ */
/*  Blog Submissions Tab                                              */
/* ------------------------------------------------------------------ */

interface BlogSubmissionsTabProps {
  submissions: BlogSubmission[];
  loading: boolean;
  reviewingId: number | null;
  setReviewingId: (id: number | null) => void;
  slug: string;
  setSlug: (s: string) => void;
  rejectNotes: string;
  setRejectNotes: (s: string) => void;
  actionLoading: number | null;
  setActionLoading: (id: number | null) => void;
  message: { type: "success" | "error"; text: string; id: number } | null;
  setMessage: (m: { type: "success" | "error"; text: string; id: number } | null) => void;
  onRefresh: () => void;
}

function BlogSubmissionsTab({
  submissions,
  loading,
  reviewingId,
  setReviewingId,
  slug,
  setSlug,
  rejectNotes,
  setRejectNotes,
  actionLoading,
  setActionLoading,
  message,
  setMessage,
  onRefresh,
}: BlogSubmissionsTabProps) {
  const handleApprove = async (id: number) => {
    if (!slug.trim()) {
      setMessage({ type: "error", text: "Please enter a URL slug.", id });
      return;
    }
    setActionLoading(id);
    setMessage(null);
    try {
      const result = await approveBlogPost({ data: { id, slug: slug.trim() } });
      if (result.success) {
        setMessage({ type: "success", text: "Post approved! Slug: " + (result as { slug: string }).slug, id });
        setSlug("");
        onRefresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to approve.", id });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to approve.", id });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    setMessage(null);
    try {
      const result = await rejectBlogPost({ data: { id, notes: rejectNotes.trim() || undefined } });
      if (result.success) {
        setMessage({ type: "success", text: "Post rejected.", id });
        setRejectNotes("");
        onRefresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to reject.", id });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to reject.", id });
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">🟡 Pending</span>;
      case "approved":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">🟢 Approved</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">🔴 Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <IconSpinner className="h-6 w-6 animate-spin text-sky-500 mx-auto" />
        <p className="mt-3 text-sm text-slate-500">Loading submissions...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="text-4xl mb-3">✍️</div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No blog submissions yet</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          When users submit posts via the /submit-post page, they'll appear here for review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => {
        const isReviewing = reviewingId === sub.id;
        return (
          <div key={sub.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
            {/* Header row */}
            <div className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{sub.title}</h3>
                  {statusBadge(sub.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span>👤 {sub.author_name}</span>
                  <span>📧 {sub.author_email}</span>
                  <span>📅 {formatDate(sub.created_at)}</span>
                  {sub.slug && <span>🔗 /blog/{sub.slug}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {sub.status === "pending" && (
                  <>
                    {message && message.id === sub.id && (
                      <span className={`text-xs font-medium ${message.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                        {message.text}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setReviewingId(isReviewing ? null : sub.id)}
                      className="rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-semibold text-sky-600 hover:bg-sky-50 hover:border-sky-300 transition-all cursor-pointer"
                    >
                      {isReviewing ? "Close" : "Review"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Review panel (expandable) */}
            {isReviewing && sub.status === "pending" && (
              <div className="border-t border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50 p-5">
                {/* Full content */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Content</h4>
                  <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-700 p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {sub.content}
                  </div>
                </div>

                {/* Approve section */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">✅ Approve</h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="URL slug (e.g. my-great-post)"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApprove(sub.id)}
                      disabled={actionLoading === sub.id}
                      className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {actionLoading === sub.id ? "..." : "Approve"}
                    </button>
                  </div>
                </div>

                {/* Reject section */}
                <div>
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">❌ Reject</h4>
                  <div className="flex items-start gap-3">
                    <textarea
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      placeholder="Reason for rejection (optional)"
                      rows={2}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleReject(sub.id)}
                      disabled={actionLoading === sub.id}
                      className="rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {actionLoading === sub.id ? "..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Show rejected notes */}
            {sub.status === "rejected" && sub.review_notes && (
              <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-3 bg-red-50/50 dark:bg-red-900/10">
                <span className="text-xs font-medium text-red-600 dark:text-red-400">Notes: </span>
                <span className="text-xs text-red-700 dark:text-red-300">{sub.review_notes}</span>
              </div>
            )}

            {/* Show approved slug */}
            {sub.status === "approved" && sub.slug && (
              <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-3 bg-emerald-50/50 dark:bg-emerald-900/10">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Live at: <a href={`/blog/${sub.slug}`} className="underline hover:text-emerald-800 dark:hover:text-emerald-300" target="_blank" rel="noopener noreferrer">/blog/{sub.slug}</a>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


}
