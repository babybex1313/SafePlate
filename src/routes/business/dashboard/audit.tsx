import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getCurrentUser, getClaimedRestaurantForOwner } from "~/db/auth";
import { submitAudit, getAudit } from "~/db/business";
import { getSessionToken, clearSession, clearCachedUser } from "~/session";
import { ThemeToggle } from "~/components/ThemeToggle";

export const Route = createFileRoute("/business/dashboard/audit")({
  head: () => ({
    meta: [{ title: "Kitchen Audit — SafePlate for Business" }],
  }),
  component: AuditWizardPage,
});

/* ── SVG Icons ────────────────────────────────────────────────────────────── */

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
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

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

/* ── NavBar ───────────────────────────────────────────────────────────────── */

function NavBar({ user }: { user: { name: string } | null }) {
  const handleLogout = () => {
    clearSession();
    clearCachedUser();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-lg">🍽️</span>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">SafePlate</span>
          <span className="ml-1 rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">BUSINESS</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/business/dashboard" className="text-sm font-medium text-slate-600 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">
            ← Dashboard
          </a>
          <ThemeToggle />
          {user && <button onClick={handleLogout} className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer">Log Out</button>}
        </div>
      </div>
    </header>
  );
}

/* ── Toggle Switch ────────────────────────────────────────────────────────── */

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-600"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ── Progress Bar ────────────────────────────────────────────────────────── */

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Step {step} of {total}</p>
        <p className="text-sm font-medium text-sky-600 dark:text-sky-400">{Math.round((step / total) * 100)}%</p>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-2 rounded-full bg-sky-500 transition-all duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ── Audit Question ───────────────────────────────────────────────────────── */

function AuditQuestion({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-700">
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 pr-4">{label}</span>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

/* ── Tier Helpers ─────────────────────────────────────────────────────────── */

function getTierStyles(tier: number) {
  switch (tier) {
    case 1: return { name: "Tier 1 — Medical-Grade", emoji: "🟢", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", desc: "Your kitchen meets the highest safety standards. Recommended for celiac and anaphylactic diners." };
    case 2: return { name: "Tier 2 — Strong Protocols", emoji: "🟡", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400", desc: "Strong protocols in place. A few more steps and you can reach Medical-Grade." };
    case 3: return { name: "Tier 3 — Basic Listing", emoji: "🔵", bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-800", text: "text-sky-700 dark:text-sky-400", desc: "You're on the map. Use the audit as a roadmap to strengthen your kitchen protocols." };
    default: return { name: "Not Rated", emoji: "⚪", bg: "bg-slate-50 border-slate-200", text: "text-slate-700", desc: "" };
  }
}

/* ── Main Wizard ──────────────────────────────────────────────────────────── */

function AuditWizardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [claimedRestaurant, setClaimedRestaurant] = useState<any>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; tier: number; tierLabel: string } | null>(null);

  // Step 1 answers
  const [dedicatedGfFryer, setDedicatedGfFryer] = useState(false);
  const [gfSeparateSurfaces, setGfSeparateSurfaces] = useState(false);
  const [gfSeparateUtensils, setGfSeparateUtensils] = useState(false);
  const [gfSeparateWater, setGfSeparateWater] = useState(false);

  // Step 2 answers
  const [labeledSealedContainers, setLabeledSealedContainers] = useState(false);
  const [colorCodedBoards, setColorCodedBoards] = useState(false);
  const [flaggedOnTickets, setFlaggedOnTickets] = useState(false);

  // Step 3 answers
  const [certifiedAllergyTraining, setCertifiedAllergyTraining] = useState(false);
  const [fohAllergenTrained, setFohAllergenTrained] = useState(false);
  const [managerAllergenOrders, setManagerAllergenOrders] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }
    getCurrentUser({ data: { token } }).then((u) => {
      if (!u || u.role !== "restaurant_owner") {
        window.location.href = "/login";
        return;
      }
      setUser(u as any);

      // Load existing audit to pre-fill
      getAudit({ data: { userId: (u as any).id } }).then((existingAudit) => {
        if (existingAudit) {
          const a = existingAudit.answers as any;
          setDedicatedGfFryer(a.dedicated_gf_fryer ?? false);
          setGfSeparateSurfaces(a.gf_separate_surfaces ?? false);
          setGfSeparateUtensils(a.gf_separate_utensils ?? false);
          setGfSeparateWater(a.gf_separate_water ?? false);
          setLabeledSealedContainers(a.labeled_sealed_containers ?? false);
          setColorCodedBoards(a.color_coded_boards ?? false);
          setFlaggedOnTickets(a.flagged_on_tickets ?? false);
          setCertifiedAllergyTraining(a.certified_allergy_training ?? false);
          setFohAllergenTrained(a.foh_allergen_trained ?? false);
          setManagerAllergenOrders(a.manager_allergen_orders ?? false);
        }
      });

      // Load claimed restaurant
      getClaimedRestaurantForOwner({ data: { email: (u as any).email } }).then((r) => {
        setClaimedRestaurant(r);
      });

      setAuthLoading(false);
    });
  }, []);

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);

    const answers = {
      dedicated_gf_fryer: dedicatedGfFryer,
      gf_separate_surfaces: gfSeparateSurfaces,
      gf_separate_utensils: gfSeparateUtensils,
      gf_separate_water: gfSeparateWater,
      labeled_sealed_containers: labeledSealedContainers,
      color_coded_boards: colorCodedBoards,
      flagged_on_tickets: flaggedOnTickets,
      certified_allergy_training: certifiedAllergyTraining,
      foh_allergen_trained: fohAllergenTrained,
      manager_allergen_orders: managerAllergenOrders,
    };

    try {
      const res = await submitAudit({
        data: {
          userId: user.id,
          userEmail: user.email,
          answers,
          restaurantName: claimedRestaurant?.restaurantName,
          restaurantId: claimedRestaurant?.restaurantId,
          city: undefined,
        },
      });

      if (res.success) {
        setResult({ score: res.score, tier: res.tier, tierLabel: res.tierLabel });
        setSubmitted(true);
      } else {
        setSaveError(res.error ?? "Something went wrong.");
      }
    } catch {
      setSaveError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <IconSpinner className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Access Restricted</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Please log in as a restaurant owner.</p>
          <a href="/login" className="mt-4 inline-block rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white">Log In</a>
        </div>
      </div>
    );
  }

  const totalSteps = 4; // 3 question steps + 1 submit

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <NavBar user={user} />
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <a href="/business/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 mb-4">
            <IconArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Kitchen Protocol Audit
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Complete this 10-point audit to receive your safety tier and downloadable badge.
          </p>
        </div>

        {/* Results (after submission) */}
        {submitted && result ? (
          <div className="space-y-6">
            <div className={`rounded-2xl border-2 p-8 text-center ${getTierStyles(result.tier).bg}`}>
              <div className="text-5xl mb-4">{getTierStyles(result.tier).emoji}</div>
              <h2 className={`text-2xl font-bold ${getTierStyles(result.tier).text}`}>
                {getTierStyles(result.tier).name}
              </h2>
              <p className="mt-2 text-lg font-bold text-slate-700 dark:text-slate-200">
                {result.score}/10 Points
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {getTierStyles(result.tier).desc}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="/business/dashboard/badges"
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
              >
                <IconBadge className="h-5 w-5" />
                Download Your Badge
              </a>
              <button
                onClick={() => { setSubmitted(false); setStep(1); }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Retake Audit
              </button>
              <a
                href="/business/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        ) : (
          <>
            <ProgressBar step={step} total={totalSteps} />

            {/* Error message */}
            {saveError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                {saveError}
              </div>
            )}

            {/* Step 1: Gluten & Celiac Safety */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  🥖 Step 1: Gluten & Celiac Safety
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  These questions help us assess your kitchen&apos;s cross-contamination prevention for gluten-free diners.
                </p>
                <AuditQuestion
                  label="Do you have a dedicated gluten-free fryer?"
                  checked={dedicatedGfFryer}
                  onChange={setDedicatedGfFryer}
                />
                <AuditQuestion
                  label="Are GF pizzas prepared on separate surfaces?"
                  checked={gfSeparateSurfaces}
                  onChange={setGfSeparateSurfaces}
                />
                <AuditQuestion
                  label="Do you use separate utensils for GF meals?"
                  checked={gfSeparateUtensils}
                  onChange={setGfSeparateUtensils}
                />
                <AuditQuestion
                  label="Is GF pasta boiled in separate water?"
                  checked={gfSeparateWater}
                  onChange={setGfSeparateWater}
                />
              </div>
            )}

            {/* Step 2: Prep & Storage */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  📦 Step 2: Prep & Storage
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  We verify how you store and prepare allergen-safe ingredients to prevent cross-contact.
                </p>
                <AuditQuestion
                  label="Are allergen-safe ingredients stored in labeled, sealed containers?"
                  checked={labeledSealedContainers}
                  onChange={setLabeledSealedContainers}
                />
                <AuditQuestion
                  label="Do you have color-coded cutting boards for different allergens?"
                  checked={colorCodedBoards}
                  onChange={setColorCodedBoards}
                />
                <AuditQuestion
                  label="Are allergen orders flagged on kitchen tickets?"
                  checked={flaggedOnTickets}
                  onChange={setFlaggedOnTickets}
                />
              </div>
            )}

            {/* Step 3: Staff Training */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  🎓 Step 3: Staff Training
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Training ensures every team member knows how to handle allergen orders safely.
                </p>
                <AuditQuestion
                  label="Does kitchen staff undergo certified food allergy management training?"
                  checked={certifiedAllergyTraining}
                  onChange={setCertifiedAllergyTraining}
                />
                <AuditQuestion
                  label="Are front-of-house staff trained to communicate allergen requests?"
                  checked={fohAllergenTrained}
                  onChange={setFohAllergenTrained}
                />
                <AuditQuestion
                  label="Is there a manager on duty responsible for allergen orders?"
                  checked={managerAllergenOrders}
                  onChange={setManagerAllergenOrders}
                />
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  📋 Step 4: Review & Submit
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Review your answers below. You can go back to adjust any response. When ready, submit to calculate your safety tier.
                </p>

                {/* Summary */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Gluten & Celiac Safety</h3>
                  {[
                    { q: "Dedicated GF fryer", v: dedicatedGfFryer },
                    { q: "Separate GF prep surfaces", v: gfSeparateSurfaces },
                    { q: "Separate GF utensils", v: gfSeparateUtensils },
                    { q: "GF pasta in separate water", v: gfSeparateWater },
                  ].map((item) => (
                    <div key={item.q} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{item.q}</span>
                      <span className={item.v ? "text-emerald-600 font-medium" : "text-slate-400"}>{item.v ? "Yes" : "No"}</span>
                    </div>
                  ))}

                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 mt-4">Prep & Storage</h3>
                  {[
                    { q: "Labeled sealed containers", v: labeledSealedContainers },
                    { q: "Color-coded cutting boards", v: colorCodedBoards },
                    { q: "Allergen orders flagged on tickets", v: flaggedOnTickets },
                  ].map((item) => (
                    <div key={item.q} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{item.q}</span>
                      <span className={item.v ? "text-emerald-600 font-medium" : "text-slate-400"}>{item.v ? "Yes" : "No"}</span>
                    </div>
                  ))}

                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 mt-4">Staff Training</h3>
                  {[
                    { q: "Certified allergy training", v: certifiedAllergyTraining },
                    { q: "FOH allergen communication training", v: fohAllergenTrained },
                    { q: "Manager responsible for allergen orders", v: managerAllergenOrders },
                  ].map((item) => (
                    <div key={item.q} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{item.q}</span>
                      <span className={item.v ? "text-emerald-600 font-medium" : "text-slate-400"}>{item.v ? "Yes" : "No"}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full rounded-xl bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <IconSpinner className="h-5 w-5 animate-spin" />
                      Calculating Your Tier…
                    </span>
                  ) : (
                    "Submit Audit & Get My Tier"
                  )}
                </button>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                ← Previous
              </button>
              {step < totalSteps ? (
                <button
                  onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
                  className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 cursor-pointer"
                >
                  Next Step →
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
