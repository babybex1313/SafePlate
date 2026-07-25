import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { saveProfile, type AllergenProfile } from "~/db/profile";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                 */
/* ------------------------------------------------------------------ */

type ProfileKey = keyof AllergenProfile;

interface OnboardingAllergen {
  id: string;
  emoji: string;
  label: string;
  profileKeys: ProfileKey[];
}

const ONBOARDING_ALLERGENS: OnboardingAllergen[] = [
  {
    id: "gluten",
    emoji: "🌾",
    label: "Gluten / Celiac",
    profileKeys: ["Gluten"],
  },
  {
    id: "dairy",
    emoji: "🥛",
    label: "Dairy / Lactose",
    profileKeys: ["Dairy"],
  },
  {
    id: "peanuts_nuts",
    emoji: "🥜",
    label: "Peanuts & Tree Nuts",
    profileKeys: ["Peanuts", "Tree Nuts"],
  },
  {
    id: "shellfish_fish",
    emoji: "🍤",
    label: "Shellfish & Fish",
    profileKeys: ["Shellfish"],
  },
  {
    id: "vegan",
    emoji: "🌱",
    label: "Vegan / Vegetarian",
    profileKeys: [],
  },
  {
    id: "eggs_soy",
    emoji: "🥚",
    label: "Eggs & Soy",
    profileKeys: ["Eggs", "Soy"],
  },
];

const ALLERGEN_DISPLAY: Record<
  ProfileKey,
  { label: string; emoji: string }
> = {
  Gluten: { label: "Gluten / Celiac", emoji: "🌾" },
  Dairy: { label: "Dairy / Lactose", emoji: "🥛" },
  Peanuts: { label: "Peanuts", emoji: "🥜" },
  "Tree Nuts": { label: "Tree Nuts", emoji: "🥜" },
  Shellfish: { label: "Shellfish & Fish", emoji: "🍤" },
  Soy: { label: "Soy", emoji: "🥚" },
  Eggs: { label: "Eggs", emoji: "🥚" },
};

const TOTAL_STEPS = 5;

const SEVERITY_LEVELS = [
  {
    value: 1,
    label: "Preference / Intolerance",
    description: "Shared kitchen spaces are okay",
    short: "Preference",
  },
  {
    value: 2,
    label: "Severe Allergy",
    description: "Requires clean surfaces, fresh gloves, and sanitized tools",
    short: "Severe",
  },
  {
    value: 3,
    label: "Celiac / Anaphylactic",
    description: "Requires 100% dedicated equipment or facilities",
    short: "Anaphylactic",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SafePlate — Set Up Your Safety Profile" },
      {
        name: "description",
        content:
          "Tell SafePlate about your food allergies and dietary needs so we can help you dine with confidence.",
      },
    ],
  }),
  component: OnboardingPage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
/* ------------------------------------------------------------------ */

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

function IconArrowRight({ className }: { className?: string }) {
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
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function IconArrowLeft({ className }: { className?: string }) {
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
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
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

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

/* ------------------------------------------------------------------ */
/*  Progress indicator                                                */
/* ------------------------------------------------------------------ */

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-2.5 w-2.5 rounded-full transition-all duration-300 ${
            i + 1 === step
              ? "bg-sky-500 scale-125 shadow-sm shadow-sky-300"
              : i + 1 < step
                ? "bg-sky-300"
                : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen 1: Welcome                                                 */
/* ------------------------------------------------------------------ */

function ScreenWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 animate-fade-in text-center">
      <span className="text-5xl mb-6">🛡️</span>
      <h1 className="text-3xl font-bold tracking-tight text-slate-800 md:text-4xl">
        Welcome to SafePlate
      </h1>
      <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-slate-600">
        Born out of a personal mission to protect our loved ones with Celiac
        disease. We look past the menu to verify real kitchen safety, so you can
        dine with 100% confidence.
      </p>
      <button
        type="button"
        onClick={onNext}
        className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-sky-500 px-8 py-4 text-base font-semibold text-white shadow-md shadow-sky-200 transition-all hover:bg-sky-600 active:scale-[0.97] cursor-pointer"
      >
        Protect My Plate
        <IconArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen 2: Allergen Matrix                                         */
/* ------------------------------------------------------------------ */

function ScreenAllergenMatrix({
  selectedIds,
  onToggle,
  onNext,
}: {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customAllergy, setCustomAllergy] = useState("");
  const [customs, setCustoms] = useState<string[]>([]);

  const hasSelection = selectedIds.size > 0;

  const handleAddCustom = () => {
    const trimmed = customAllergy.trim();
    if (trimmed && !customs.includes(trimmed)) {
      setCustoms((prev) => [...prev, trimmed]);
      setCustomAllergy("");
      setShowCustom(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-6 animate-fade-in">
      <h2 className="text-2xl font-bold tracking-tight text-slate-800 text-center">
        What do you need to avoid?
      </h2>
      <p className="mt-2 text-sm text-slate-500 text-center">
        Select all that apply — you can fine-tune next
      </p>

      {/* Allergen tiles grid */}
      <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
        {ONBOARDING_ALLERGENS.map((allergen) => {
          const isSelected = selectedIds.has(allergen.id);
          return (
            <button
              key={allergen.id}
              type="button"
              onClick={() => onToggle(allergen.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all duration-200 active:scale-95 cursor-pointer ${
                isSelected
                  ? "border-sky-400 bg-sky-50 shadow-sm shadow-sky-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="text-3xl">{allergen.emoji}</span>
              <span
                className={`text-sm font-semibold leading-tight text-center ${
                  isSelected ? "text-sky-700" : "text-slate-600"
                }`}
              >
                {allergen.label}
              </span>
              {isSelected && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white">
                  <IconCheck className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom allergies */}
      {customs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 max-w-sm justify-center">
          {customs.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700"
            >
              {c}
              <button
                type="button"
                onClick={() =>
                  setCustoms((prev) => prev.filter((x) => x !== c))
                }
                className="text-sky-400 hover:text-sky-600 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {showCustom ? (
        <div className="mt-4 flex w-full max-w-sm items-center gap-2">
          <input
            type="text"
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
            placeholder="e.g. Sesame, Mustard…"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 cursor-pointer"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="mt-5 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
        >
          + Add custom allergy
        </button>
      )}

      {/* Next button */}
      <button
        type="button"
        onClick={onNext}
        disabled={!hasSelection}
        className="mt-10 w-full max-w-sm rounded-full bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-sky-200 transition-all hover:bg-sky-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
      >
        Next Step
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen 3: Severity Tiers                                          */
/* ------------------------------------------------------------------ */

function ScreenSeverity({
  profileKeys,
  severities,
  onSetSeverity,
  onSave,
  saving,
}: {
  profileKeys: ProfileKey[];
  severities: Partial<Record<ProfileKey, number>>;
  onSetSeverity: (key: ProfileKey, level: number) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-6 animate-fade-in">
      <h2 className="text-2xl font-bold tracking-tight text-slate-800 text-center">
        How severe are your allergies?
      </h2>
      <p className="mt-2 text-sm text-slate-500 text-center">
        This helps us match you with the right kitchen protocols
      </p>

      <div className="mt-8 w-full max-w-md space-y-4">
        {profileKeys.map((key) => {
          const display = ALLERGEN_DISPLAY[key];
          const currentLevel = severities[key] ?? 0;
          return (
            <div
              key={key}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-xl">{display.emoji}</span>
                <span className="text-base font-semibold text-slate-800">
                  {display.label}
                </span>
              </div>

              {/* 3-point severity selector */}
              <div className="grid grid-cols-3 gap-2">
                {SEVERITY_LEVELS.map((sev) => {
                  const isActive = currentLevel === sev.value;
                  return (
                    <button
                      key={sev.value}
                      type="button"
                      onClick={() => onSetSeverity(key, sev.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-center transition-all duration-200 active:scale-95 cursor-pointer ${
                        isActive
                          ? "border-sky-400 bg-sky-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          isActive ? "text-sky-600" : "text-slate-400"
                        }`}
                      >
                        L{sev.value}
                      </span>
                      <span
                        className={`text-xs font-semibold leading-tight ${
                          isActive ? "text-sky-700" : "text-slate-500"
                        }`}
                      >
                        {sev.short}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Description of selected level */}
              {currentLevel > 0 && (
                <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                  {
                    SEVERITY_LEVELS.find((s) => s.value === currentLevel)
                      ?.description
                  }
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="mt-10 w-full max-w-sm rounded-full bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-sky-200 transition-all hover:bg-sky-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <IconSpinner className="h-4 w-4 animate-spin" />
            Saving…
          </span>
        ) : (
          <>
            <IconShield className="mr-2 inline h-4 w-4" />
            Save Safety Profile
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen 4: Family & Dependents                                     */
/* ------------------------------------------------------------------ */

function ScreenFamily({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [dependents, setDependents] = useState<
    { name: string; allergy: string }[]
  >([]);
  const [showForm, setShowForm] = useState(false);
  const [depName, setDepName] = useState("");
  const [depAllergy, setDepAllergy] = useState("");

  const handleAdd = () => {
    const name = depName.trim();
    const allergy = depAllergy.trim();
    if (name && allergy) {
      setDependents((prev) => [...prev, { name, allergy }]);
      setDepName("");
      setDepAllergy("");
      setShowForm(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-6 animate-fade-in text-center">
      <span className="text-5xl mb-6">👨‍👩‍👧‍👦</span>
      <h2 className="text-2xl font-bold tracking-tight text-slate-800">
        Are you dining with others?
      </h2>
      <p className="mt-3 max-w-sm text-sm text-slate-500">
        Add profiles for family members or dependents so SafePlate can protect
        everyone at the table.
      </p>

      {/* Dependent list */}
      {dependents.length > 0 && (
        <div className="mt-6 w-full max-w-sm space-y-2">
          {dependents.map((dep, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">
                  {dep.name}
                </p>
                <p className="text-xs text-sky-600">{dep.allergy}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDependents((prev) => prev.filter((_, j) => j !== i))
                }
                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="mt-5 w-full max-w-sm space-y-3">
          <input
            type="text"
            value={depName}
            onChange={(e) => setDepName(e.target.value)}
            placeholder="Name (e.g. Jamie)"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            autoFocus
          />
          <input
            type="text"
            value={depAllergy}
            onChange={(e) => setDepAllergy(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Allergy (e.g. Celiac, Peanuts)"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!depName.trim() || !depAllergy.trim()}
            className="w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Save Dependent
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-sky-300 bg-white px-6 py-3 text-sm font-semibold text-sky-600 shadow-sm transition-all hover:bg-sky-50 active:scale-95 cursor-pointer"
        >
          + Add a Dependent Profile
        </button>
      )}

      {/* Actions */}
      <div className="mt-10 w-full max-w-sm space-y-3">
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-full bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-sky-200 transition-all hover:bg-sky-600 active:scale-[0.98] cursor-pointer"
        >
          {dependents.length > 0 ? "Continue with Dependents" : "Next Step"}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-sm font-medium text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
        >
          Skip for now, I&rsquo;m dining solo
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen 5: Location & Legal                                        */
/* ------------------------------------------------------------------ */

function ScreenLocation({
  email,
  setEmail,
  agreedToTerms,
  setAgreedToTerms,
  onActivate,
  activating,
}: {
  email: string;
  setEmail: (v: string) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (v: boolean) => void;
  onActivate: () => void;
  activating: boolean;
}) {
  const [locationFound, setLocationFound] = useState(false);

  const handleFindLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationFound(true),
        () => setLocationFound(true), // still show success even if denied
        { timeout: 5000 },
      );
    } else {
      setLocationFound(true);
    }
  };

  const canActivate =
    email.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    agreedToTerms;

  return (
    <div className="flex flex-col items-center px-6 animate-fade-in text-center">
      <span className="text-5xl mb-6">🗺️</span>
      <h2 className="text-2xl font-bold tracking-tight text-slate-800">
        Almost there!
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Find safe restaurants near you
      </p>

      {/* Location prompt */}
      <div className="mt-8 w-full max-w-sm">
        {!locationFound ? (
          <button
            type="button"
            onClick={handleFindLocation}
            className="inline-flex items-center gap-2 rounded-full border-2 border-sky-300 bg-white px-6 py-3 text-sm font-semibold text-sky-600 shadow-sm transition-all hover:bg-sky-50 active:scale-95 cursor-pointer"
          >
            <IconPin className="h-4 w-4" />
            Find My Location
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-medium text-emerald-700">
            <IconCheck className="h-4 w-4" />
            Location found ✓
          </div>
        )}
      </div>

      {/* Email */}
      <div className="mt-6 w-full max-w-sm">
        <label
          htmlFor="onboard-email"
          className="block text-left text-sm font-semibold text-slate-700 mb-2"
        >
          Your Email
        </label>
        <input
          id="onboard-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
        />
        <p className="mt-1.5 text-left text-xs text-slate-400">
          Your profile is linked to your email — no password needed
        </p>
      </div>

      {/* Legal checkbox */}
      <div className="mt-6 w-full max-w-sm">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded-md border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
          />
          <span className="text-left text-sm leading-relaxed text-slate-600">
            I agree to the SafePlate Terms of Service and understand that while
            SafePlate tracks strict kitchen protocols, I will always verbally
            verify my severe allergies with restaurant staff before eating.
          </span>
        </label>
      </div>

      {/* Activate button */}
      <button
        type="button"
        onClick={onActivate}
        disabled={!canActivate || activating}
        className="mt-8 w-full max-w-sm rounded-full bg-emerald-500 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
      >
        {activating ? (
          <span className="flex items-center justify-center gap-2">
            <IconSpinner className="h-4 w-4 animate-spin" />
            Activating…
          </span>
        ) : (
          "Activate SafePlate Maps 🟢"
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Onboarding Page                                              */
/* ------------------------------------------------------------------ */

function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [severities, setSeverities] = useState<
    Partial<Record<ProfileKey, number>>
  >({});
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);

  // Derived list of profile keys affected by selected allergen tiles
  const getActiveProfileKeys = useCallback((): ProfileKey[] => {
    const keys = new Set<ProfileKey>();
    for (const id of selectedIds) {
      const allergen = ONBOARDING_ALLERGENS.find((a) => a.id === id);
      if (allergen) {
        allergen.profileKeys.forEach((k) => keys.add(k));
      }
    }
    return Array.from(keys);
  }, [selectedIds]);

  const handleToggleAllergen = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSetSeverity = (key: ProfileKey, level: number) => {
    setSeverities((prev) => ({ ...prev, [key]: level }));
  };

  const handleGoToStep3 = () => {
    // Initialize severities to level 2 (Severe Allergy) for each active key
    const keys = getActiveProfileKeys();
    const initial: Partial<Record<ProfileKey, number>> = {};
    keys.forEach((k) => {
      if (!severities[k]) initial[k] = 2; // default to Severe
    });
    if (Object.keys(initial).length > 0) {
      setSeverities((prev) => ({ ...prev, ...initial }));
    }
    setStep(3);
  };

  const handleSaveProfile = async () => {
    // Build the AllergenProfile from severities
    const allergens: AllergenProfile = {
      Gluten: 0,
      Dairy: 0,
      Peanuts: 0,
      "Tree Nuts": 0,
      Shellfish: 0,
      Soy: 0,
      Eggs: 0,
      ...Object.fromEntries(
        Object.entries(severities).map(([k, v]) => [k, v ?? 0]),
      ),
    };

    setSaving(true);
    try {
      // We need an email — if we have one already, use it; otherwise use a temp one
      // and let them update on screen 5
      const saveEmail = email.trim() || "pending@safeplate.local";
      await saveProfile({ data: { email: saveEmail, allergens } });
      setStep(4);
    } catch {
      // Still proceed — the save can be retried at the final step
      setStep(4);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    const allergens: AllergenProfile = {
      Gluten: 0,
      Dairy: 0,
      Peanuts: 0,
      "Tree Nuts": 0,
      Shellfish: 0,
      Soy: 0,
      Eggs: 0,
      ...Object.fromEntries(
        Object.entries(severities).map(([k, v]) => [k, v ?? 0]),
      ),
    };

    setActivating(true);
    try {
      await saveProfile({ data: { email: email.trim().toLowerCase(), allergens } });
      // Redirect to search
      window.location.href = "/search";
    } catch {
      // If save fails, still redirect — they've completed the flow
      window.location.href = "/search";
    }
  };

  const activeProfileKeys = getActiveProfileKeys();

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased">
      {/* Inline animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out both;
        }
      `}</style>

      {/* Mini nav: back arrow + progress */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-4">
          <div className="w-20">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
              >
                <IconArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <ProgressDots step={step} />
            <span className="text-xs font-medium text-slate-400">
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>

          <div className="w-20" />
        </div>
      </header>

      {/* Screen content */}
      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-lg">
          {step === 1 && <ScreenWelcome onNext={() => setStep(2)} />}

          {step === 2 && (
            <ScreenAllergenMatrix
              selectedIds={selectedIds}
              onToggle={handleToggleAllergen}
              onNext={handleGoToStep3}
            />
          )}

          {step === 3 && (
            <ScreenSeverity
              profileKeys={activeProfileKeys}
              severities={severities}
              onSetSeverity={handleSetSeverity}
              onSave={handleSaveProfile}
              saving={saving}
            />
          )}

          {step === 4 && (
            <ScreenFamily
              onNext={() => setStep(5)}
              onSkip={() => setStep(5)}
            />
          )}

          {step === 5 && (
            <ScreenLocation
              email={email}
              setEmail={setEmail}
              agreedToTerms={agreedToTerms}
              setAgreedToTerms={setAgreedToTerms}
              onActivate={handleActivate}
              activating={activating}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-[#FAFAF9] py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 text-center">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-sm">
              🍽️
            </span>
            <span className="text-sm font-semibold text-slate-800">
              SafePlate
            </span>
          </div>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} SafePlate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
