import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { searchRestaurantByName, submitRestaurantUpdate } from "~/db/restaurants";

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

const TIERS = [
  { value: 1, label: "Tier 1 · Dedicated", emoji: "🟢", color: "emerald" },
  { value: 2, label: "Tier 2 · Protocols", emoji: "🟡", color: "amber" },
  { value: 3, label: "Tier 3 · Friendly", emoji: "🔵", color: "sky" },
] as const;

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/update-listing")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SafePlate — Claim & Update Your Listing" },
      {
        name: "description",
        content:
          "Restaurant owners: claim and update your SafePlate listing with accurate allergen protocols and safety information.",
      },
    ],
  }),
  component: UpdateListingPage,
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

function IconCheck({ className }: { className?: string }) {
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

/* ------------------------------------------------------------------ */
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-lg">
            🍽️
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            SafePlate
          </span>
        </a>
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600"
          >
            Home
          </a>
          <a
            href="/search"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600"
          >
            Search
          </a>
          <a
            href="/update-listing"
            className="text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700"
          >
            Update Listing
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
    <footer className="border-t border-slate-100 bg-[#FAFAF9] py-10">
      <div className="mx-auto max-w-7xl px-6 grid gap-8 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-base">
              🍽️
            </span>
            <span className="text-base font-semibold text-slate-800">
              SafePlate
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Dine with confidence, anywhere.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">For Restaurants</h4>
          <a
            href="/claim"
            className="block text-sm text-slate-500 hover:text-sky-600 transition-colors mb-2"
          >
            Claim Your Listing
          </a>
          <a
            href="/update-listing"
            className="block text-sm text-slate-500 hover:text-sky-600 transition-colors mb-2"
          >
            Update Your Listing
          </a>
          <a
            href="/list-your-venue"
            className="block text-sm text-slate-500 hover:text-sky-600 transition-colors"
          >
            List Your Venue
          </a>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Explore</h4>
          <a href="/search" className="block text-sm text-slate-500 hover:text-sky-600 transition-colors mb-2">
            Find Restaurants
          </a>
          <a href="/about" className="block text-sm text-slate-500 hover:text-sky-600 transition-colors mb-2">
            About
          </a>
          <a href="/faq" className="block text-sm text-slate-500 hover:text-sky-600 transition-colors">
            FAQ
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 mt-8 pt-6 border-t border-slate-200">
        <p className="text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} SafePlate. All rights reserved.
        </p>
      </div>
    </footer>
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
/*  Step Indicator                                                    */
/* ------------------------------------------------------------------ */

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
              s === step
                ? "bg-sky-500 text-white shadow-md"
                : s < step
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-slate-100 text-slate-400"
            }`}
          >
            {s < step ? "✓" : s}
          </div>
          {s < 3 && (
            <div
              className={`h-px w-8 transition-colors ${
                s < step ? "bg-emerald-300" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */

function UpdateListingPage() {
  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Search
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<{ id: number; name: string; city: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2: Form
  const [selectedRestaurant, setSelectedRestaurant] = useState<{
    id: number;
    name: string;
    city: string;
  } | null>(null);
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [safetyTier, setSafetyTier] = useState(0);
  const [hasDedicatedFryer, setHasDedicatedFryer] = useState(false);
  const [hasIsolatedPrep, setHasIsolatedPrep] = useState(false);
  const [allergenTrainedStaff, setAllergenTrainedStaff] = useState(false);
  const [freeFrom, setFreeFrom] = useState<string[]>([]);
  const [allergensHandled, setAllergensHandled] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [autoApproved, setAutoApproved] = useState(false);

  // Search handler
  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearched(true);
      try {
        const data = await searchRestaurantByName({ data: { query: val.trim() } });
        setResults(data as { id: number; name: string; city: string }[]);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  // Select restaurant → go to step 2
  const selectRestaurant = (r: { id: number; name: string; city: string }) => {
    setSelectedRestaurant(r);
    // Reset form
    setSafetyTier(0);
    setHasDedicatedFryer(false);
    setHasIsolatedPrep(false);
    setAllergenTrainedStaff(false);
    setFreeFrom([]);
    setAllergensHandled([]);
    setVerified(false);
    setChangeReason("");
    setAdditionalNotes("");
    setError("");
    setStep(2);
  };

  // Toggle helpers
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

  // Submit handler
  const handleSubmit = async () => {
    if (!submitterEmail.trim()) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!changeReason.trim()) {
      setError("Please explain what changed.");
      return;
    }

    const changes: Record<string, unknown> = {};
    if (safetyTier > 0) changes.safety_tier = safetyTier;
    if (hasDedicatedFryer) changes.has_dedicated_fryer = true;
    if (hasIsolatedPrep) changes.has_isolated_prep = true;
    if (allergenTrainedStaff) changes.allergen_trained_staff = true;
    if (freeFrom.length > 0) changes.free_from = freeFrom;
    if (allergensHandled.length > 0) changes.allergens_handled = allergensHandled;
    if (verified) changes.verified = true;

    if (Object.keys(changes).length === 0) {
      setError("Please select at least one change to submit.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const result = await submitRestaurantUpdate({
        data: {
          restaurant_id: selectedRestaurant!.id,
          submitter_email: submitterEmail.trim(),
          submitter_name: submitterName.trim() || undefined,
          changes: changes as any,
          notes: `What changed: ${changeReason.trim()}${additionalNotes.trim() ? ". Additional notes: " + additionalNotes.trim() : ""}`,
        },
      });
      if (result.success) {
        setAutoApproved(!!result.autoApproved);
        setStep(3);
      } else {
        setError(result.error ?? "Failed to submit. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAF9] text-slate-800 antialiased">
      <NavBar />
      <main className="flex-1 py-10">
        <div className="mx-auto max-w-3xl px-6">
          {/* Step Indicator */}
          <StepIndicator step={step} />

          {/* Step 1: Search */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
                  Claim & Update Your Listing
                </h1>
                <p className="mt-3 text-slate-600">
                  Search for your restaurant by name to update its allergen
                  protocols and safety information.
                </p>
              </div>

              {/* Search input */}
              <div className="relative mb-8">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Find your restaurant by name..."
                  className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                  autoFocus
                />
              </div>

              {/* Results */}
              {searching && (
                <div className="flex items-center justify-center py-12">
                  <IconSpinner className="h-6 w-6 animate-spin text-sky-500" />
                  <span className="ml-3 text-slate-500">Searching...</span>
                </div>
              )}

              {!searching && searched && results.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-slate-500 mb-3">
                    No restaurants found matching "{searchQuery}".
                  </p>
                  <p className="text-sm text-slate-400">
                    Try a different spelling, or{" "}
                    <a
                      href="/list-your-venue"
                      className="text-sky-600 hover:text-sky-700 underline"
                    >
                      list your venue
                    </a>{" "}
                    if it's not in our database yet.
                  </p>
                </div>
              )}

              {!searching && results.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 mb-3">
                    {results.length} restaurant{results.length !== 1 ? "s" : ""}{" "}
                    found. Select yours to continue:
                  </p>
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectRestaurant(r)}
                      className="w-full text-left rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-sky-300 hover:shadow-md hover:bg-sky-50/30 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-800">
                            {r.name}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                            <IconPin className="h-3.5 w-3.5" />
                            {r.city}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-sky-600">
                          Select →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!searching && !searched && (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-slate-400">
                    Type your restaurant's name above to get started.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Update Form */}
          {step === 2 && selectedRestaurant && (
            <div>
              <div className="mb-8">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-sm font-medium text-sky-600 hover:text-sky-700 mb-3 inline-flex items-center gap-1 cursor-pointer"
                >
                  ← Back to search
                </button>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
                  Update {selectedRestaurant.name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-slate-500">
                  <IconPin className="h-4 w-4" />
                  {selectedRestaurant.city}
                </p>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-white p-6 shadow-sm space-y-8">
                {/* Submitter Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Your Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={submitterEmail}
                      onChange={(e) => setSubmitterEmail(e.target.value)}
                      placeholder="you@restaurant.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                    />
                  </div>
                </div>

                {/* Safety Tier */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Safety Tier
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {TIERS.map((t) => {
                      const isSelected = safetyTier === t.value;
                      const activeBg =
                        t.color === "emerald"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-md"
                          : t.color === "amber"
                            ? "bg-amber-500 text-white border-amber-500 shadow-md"
                            : "bg-sky-500 text-white border-sky-500 shadow-md";
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() =>
                            setSafetyTier(isSelected ? 0 : t.value)
                          }
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                            isSelected
                              ? activeBg
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {t.emoji} {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Kitchen Protocols */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
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

                {/* Free From */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Free From (your kitchen excludes these)
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
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Allergens Handled (your kitchen works with these)
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

                {/* Verified */}
                <div>
                  <Toggle
                    label="This listing is verified"
                    checked={verified}
                    onChange={setVerified}
                  />
                </div>

                {/* What changed */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    What changed? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y"
                    placeholder="e.g., We've added a dedicated gluten-free fryer and our staff completed allergen safety training this month."
                  />
                </div>

                {/* Additional notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Additional notes (optional)
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y"
                    placeholder="Anything else our review team should know."
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting && <IconSpinner className="h-4 w-4 animate-spin" />}
                    {submitting ? "Submitting..." : "Submit Update for Review"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <IconCheck className="h-10 w-10 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
                {autoApproved ? "Changes Applied!" : "Thank you!"}
              </h1>
              {autoApproved ? (
                <>
                  <p className="mt-4 text-slate-600 max-w-md mx-auto leading-relaxed">
                    Your update for{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedRestaurant?.name}
                    </span>{" "}
                    has been automatically verified and applied! Changes are now
                    live on SafePlate.
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    We verified your ownership via domain match (
                    <span className="font-medium text-slate-700">
                      {submitterEmail.split("@")[1]}
                    </span>{" "}
                    matches the restaurant's website).
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-4 text-slate-600 max-w-md mx-auto leading-relaxed">
                    Your update for{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedRestaurant?.name}
                    </span>{" "}
                    has been submitted for review. We'll verify your changes and
                    update the listing within 48 hours.
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    If we have questions, we'll reach out to{" "}
                    <span className="font-medium text-slate-700">
                      {submitterEmail}
                    </span>.
                  </p>
                </>
              )}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="/search"
                  className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600"
                >
                  Search Restaurants
                </a>
                <a
                  href="/update-listing"
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50"
                >
                  Update Another Listing
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
