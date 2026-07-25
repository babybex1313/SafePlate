import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { sql } from "~/db";
import { insertRestaurantFromSubmission, claimPayment } from "~/db/restaurants";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface FormData {
  /* Section 1 */
  restaurantName: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  contactEmail: string;
  dietaryNeeds: string[];
  /* Section 2 */
  dedicatedFacility: "" | "yes" | "no";
  /* Section 3 — only if dedicatedFacility = "no" */
  dedicatedFryer: "" | "yes" | "no" | "na";
  separateOven: "" | "yes" | "no" | "na";
  colorCodedTools: "" | "yes" | "no";
  handWashingGlove: "" | "yes" | "no";
  staffTraining: "" | "yes" | "no";
  allergenMenu: "" | "yes" | "no";
  ingredientTransparency: "" | "yes" | "no";
  /* Section 4 */
  authorizedName: string;
  submissionDate: string;
  verified: boolean;
}

const INITIAL_FORM: FormData = {
  restaurantName: "",
  streetAddress: "",
  city: "",
  state: "",
  zip: "",
  contactEmail: "",
  dietaryNeeds: [],
  dedicatedFacility: "",
  dedicatedFryer: "",
  separateOven: "",
  colorCodedTools: "",
  handWashingGlove: "",
  staffTraining: "",
  allergenMenu: "",
  ingredientTransparency: "",
  authorizedName: "",
  submissionDate: new Date().toISOString().split("T")[0],
  verified: false,
};

/* ------------------------------------------------------------------ */
/*  Server function: submit questionnaire                              */
/* ------------------------------------------------------------------ */

export const submitQuestionnaire = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: FormData }) => {
    // Validate required fields
    if (!data.restaurantName.trim()) return { success: false, error: "Restaurant name is required." };
    if (!data.streetAddress.trim()) return { success: false, error: "Street address is required." };
    if (!data.city.trim()) return { success: false, error: "City is required." };
    if (!data.state.trim()) return { success: false, error: "State is required." };
    if (!data.zip.trim()) return { success: false, error: "ZIP code is required." };
    if (!data.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      return { success: false, error: "A valid contact email is required." };
    }
    if (!data.dedicatedFacility) return { success: false, error: 'Please answer the facility integrity question.' };
    if (!data.authorizedName.trim()) return { success: false, error: "Authorized name/title is required." };
    if (!data.verified) return { success: false, error: "Please verify the submission." };

    // Validate Section 3 fields if shared kitchen
    if (data.dedicatedFacility === "no") {
      if (!data.dedicatedFryer) return { success: false, error: "Please answer the dedicated fryer question." };
      if (!data.separateOven) return { success: false, error: "Please answer the separate oven question." };
      if (!data.colorCodedTools) return { success: false, error: "Please answer the tool isolation question." };
      if (!data.handWashingGlove) return { success: false, error: "Please answer the hand-washing question." };
      if (!data.staffTraining) return { success: false, error: "Please answer the staff training question." };
      if (!data.allergenMenu) return { success: false, error: "Please answer the allergen menu question." };
      if (!data.ingredientTransparency) return { success: false, error: "Please answer the ingredient transparency question." };
    }

    // Tier assignment logic
    let assignedTier: number;
    if (data.dedicatedFacility === "yes") {
      assignedTier = 1;
    } else if (
      data.dedicatedFryer === "yes" ||
      data.colorCodedTools === "yes" ||
      data.staffTraining === "yes"
    ) {
      assignedTier = 2;
    } else {
      assignedTier = 3;
    }

    // Ensure table exists
    await sql()`create table if not exists restaurant_submissions (
      id serial primary key,
      restaurant_name text not null,
      street_address text not null,
      city text not null,
      state text not null,
      zip text not null,
      contact_email text not null,
      dietary_needs text[],
      dedicated_facility boolean,
      dedicated_fryer text,
      separate_oven text,
      color_coded_tools boolean,
      hand_washing_glove boolean,
      staff_training boolean,
      allergen_menu boolean,
      ingredient_transparency boolean,
      authorized_name text not null,
      submission_date date not null,
      assigned_tier integer not null check (assigned_tier in (1, 2, 3)),
      created_at timestamptz default now()
    )`;

    await sql()`insert into restaurant_submissions (
      restaurant_name, street_address, city, state, zip, contact_email,
      dietary_needs, dedicated_facility, dedicated_fryer, separate_oven,
      color_coded_tools, hand_washing_glove, staff_training,
      allergen_menu, ingredient_transparency, authorized_name,
      submission_date, assigned_tier
    ) values (
      ${data.restaurantName.trim()},
      ${data.streetAddress.trim()},
      ${data.city.trim()},
      ${data.state.trim()},
      ${data.zip.trim()},
      ${data.contactEmail.trim().toLowerCase()},
      ${data.dietaryNeeds},
      ${data.dedicatedFacility === "yes"},
      ${data.dedicatedFacility === "yes" ? null : data.dedicatedFryer},
      ${data.dedicatedFacility === "yes" ? null : data.separateOven},
      ${data.dedicatedFacility === "yes" ? null : data.colorCodedTools === "yes"},
      ${data.dedicatedFacility === "yes" ? null : data.handWashingGlove === "yes"},
      ${data.dedicatedFacility === "yes" ? null : data.staffTraining === "yes"},
      ${data.dedicatedFacility === "yes" ? null : data.allergenMenu === "yes"},
      ${data.dedicatedFacility === "yes" ? null : data.ingredientTransparency === "yes"},
      ${data.authorizedName.trim()},
      ${data.submissionDate},
      ${assignedTier}
    )`;

    // Also insert into the main restaurants table so it appears in search results
    const insertResult = await insertRestaurantFromSubmission(sql(), {
      restaurantName: data.restaurantName.trim(),
      streetAddress: data.streetAddress.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      dietaryNeeds: data.dietaryNeeds,
      assignedTier,
      dedicatedFacility: data.dedicatedFacility,
      dedicatedFryer: data.dedicatedFryer,
      colorCodedTools: data.colorCodedTools,
      staffTraining: data.staffTraining,
    });

    console.log(`[SafePlate] Restaurant sync: ${insertResult.message}`);

    // Fire-and-forget confirmation email to the restaurant
    import("../email").then(
      ({ sendVenueConfirmation }) =>
        sendVenueConfirmation({
          name: data.restaurantName.trim(),
          email: data.contactEmail.trim().toLowerCase(),
          tier: assignedTier,
        }),
      () => {},
    );

    return { success: true, tier: assignedTier };
  },
);

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/list-your-venue")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SafePlate — List Your Venue" },
      {
        name: "description",
        content:
          "Submit your restaurant's kitchen protocols for SafePlate verification. Help diners with food allergies and dietary restrictions eat safely at your venue.",
      },
    ],
  }),
  component: ListYourVenuePage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
/* ------------------------------------------------------------------ */

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function IconCheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
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
          <a href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600">Home</a>
          <a href="/search" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600">Search</a>
          <a href="/profile" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600">Profile</a>
          <a href="/travel-cards" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600">Travel Cards</a>
          <a href="/about" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600">About</a>
          <a href="/faq" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600">FAQ</a>
          <a
            href="/list-your-venue"
            className="rounded-full border-2 border-sky-500 px-5 py-2 text-sm font-semibold text-sky-600 shadow-sm transition-all hover:bg-sky-50 active:scale-95"
          >
            List Your Venue
          </a>
          <a
            href="/#signup"
            className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
          >
            Join Waitlist
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
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-sm">🍽️</span>
            <span className="text-lg font-bold text-slate-800">SafePlate</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="/about" className="hover:text-sky-600 transition-colors">About</a>
            <a href="/faq" className="hover:text-sky-600 transition-colors">FAQ</a>
            <a href="/search" className="hover:text-sky-600 transition-colors">Search</a>
            <a href="/claim" className="hover:text-sky-600 transition-colors">Claim Your Listing</a>
            <a href="/legal" className="hover:text-sky-600 transition-colors">Legal</a>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          SafePlate provides informational guidance only. Always confirm with restaurant staff before ordering.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Dietary needs options                                              */
/* ------------------------------------------------------------------ */

const DIETARY_OPTIONS = [
  "Gluten-Free / Celiac-Safe",
  "Dairy-Free",
  "Peanut / Tree Nut-Free",
  "Shellfish-Free",
  "Vegan / Plant-Based",
];

/* ------------------------------------------------------------------ */
/*  Progress indicator                                                 */
/* ------------------------------------------------------------------ */

function ProgressBar({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Basic Info" },
    { num: 2, label: "Facility" },
    { num: 3, label: "Protocols" },
    { num: 4, label: "Verify" },
  ];

  return (
    <div className="mx-auto mb-12 max-w-2xl">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  currentStep >= step.num
                    ? "bg-sky-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {currentStep > step.num ? (
                  <IconCheckCircle className="h-5 w-5" />
                ) : (
                  step.num
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  currentStep >= step.num ? "text-sky-600" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-12 sm:w-20 rounded transition-colors ${
                  currentStep > step.num ? "bg-sky-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Radio helper                                                      */
/* ------------------------------------------------------------------ */

function RadioGroup({
  name,
  value,
  onChange,
  options,
  required,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; subtitle?: string }[];
  required?: boolean;
}) {
  return (
    <fieldset>
      <div className="space-y-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all ${
              value === opt.value
                ? "border-sky-500 bg-sky-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              required={required}
              className="mt-0.5 h-4 w-4 text-sky-500 accent-sky-500"
            />
            <div>
              <div className="text-sm font-medium text-slate-800">{opt.label}</div>
              {opt.subtitle && (
                <div className="mt-0.5 text-xs text-slate-500">{opt.subtitle}</div>
              )}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/*  Tier badge                                                        */
/* ------------------------------------------------------------------ */

function TierBadge({ tier }: { tier: number }) {
  const config = {
    1: { emoji: "🟢", label: "Tier 1 — Dedicated Facility", desc: "Your venue qualifies for the highest safety tier.", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    2: { emoji: "🟡", label: "Tier 2 — Certified Protocols", desc: "Strong cross-contamination protocols in place.", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    3: { emoji: "🔵", label: "Tier 3 — Dietary-Friendly", desc: "Listed as accommodating with standard practices.", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" },
  }[tier] ?? { emoji: "", label: "", desc: "", color: "", bg: "", border: "" };

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-6 text-center`}>
      <div className="text-3xl mb-2">{config.emoji}</div>
      <div className={`text-lg font-bold ${config.color}`}>{config.label}</div>
      <div className="mt-1 text-sm text-slate-600">{config.desc}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Claim Section (already paid)                                      */
/* ------------------------------------------------------------------ */

function ClaimSection() {
  const [claimName, setClaimName] = useState("");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimProduct, setClaimProduct] = useState("featured");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimMessage, setClaimMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleClaim = async () => {
    if (!claimName.trim()) {
      setClaimMessage({ type: "error", text: "Please enter your restaurant name." });
      return;
    }
    if (!claimEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimEmail)) {
      setClaimMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    setClaimSubmitting(true);
    setClaimMessage(null);
    try {
      const result = await claimPayment({
        data: {
          restaurantName: claimName.trim(),
          email: claimEmail.trim(),
          product: claimProduct,
        },
      });
      if (result.success) {
        setClaimMessage({
          type: "success",
          text: `Claim received! We'll activate your ${claimProduct === "featured" ? "Featured Listing" : claimProduct === "verified" ? "Verified Badge" : "Premium Profile"} for "${result.restaurantName}" after verifying your payment.`,
        });
      } else {
        setClaimMessage({ type: "error", text: result.error ?? "Something went wrong." });
      }
    } catch {
      setClaimMessage({ type: "error", text: "A network error occurred. Please try again." });
    } finally {
      setClaimSubmitting(false);
    }
  };

  return (
    <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h3 className="text-lg font-bold text-slate-800 mb-1">
        Already paid? Claim your listing
      </h3>
      <p className="text-sm text-slate-500 mb-5">
        After completing your Stripe payment, enter your details below so we can activate your upgrade.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Restaurant Name
          </label>
          <input
            type="text"
            value={claimName}
            onChange={(e) => setClaimName(e.target.value)}
            placeholder="e.g. The Safe Kitchen"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Your Email
          </label>
          <input
            type="email"
            value={claimEmail}
            onChange={(e) => setClaimEmail(e.target.value)}
            placeholder="you@restaurant.com"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Product Purchased
          </label>
          <select
            value={claimProduct}
            onChange={(e) => setClaimProduct(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
          >
            <option value="featured">⭐ Featured Listing ($29/mo)</option>
            <option value="verified">✓ Verified Badge ($49 one-time)</option>
            <option value="premium">💎 Premium Profile ($4.99/mo)</option>
          </select>
        </div>
      </div>

      {claimMessage && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
            claimMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {claimMessage.text}
        </div>
      )}

      <button
        type="button"
        onClick={handleClaim}
        disabled={claimSubmitting}
        className="mt-5 w-full rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-60"
      >
        {claimSubmitting ? "Submitting…" : "Claim My Upgrade"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                               */
/* ------------------------------------------------------------------ */

function ListYourVenuePage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null); // stores tier
  const [currentSection, setCurrentSection] = useState(1);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const toggleDietary = (need: string) => {
    setForm((prev) => {
      const current = prev.dietaryNeeds;
      if (current.includes(need)) {
        return { ...prev, dietaryNeeds: current.filter((n) => n !== need) };
      }
      return { ...prev, dietaryNeeds: [...current, need] };
    });
    setError(null);
  };

  // Adjust max section based on facility type
  const hasSection3 = form.dedicatedFacility !== "yes";

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await submitQuestionnaire({ data: form });
      if (result.success) {
        setSuccess(result.tier);
      } else {
        setError(result.error || "Something went wrong.");
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (success !== null) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
        <NavBar />
        <main className="flex-1 px-6 py-12">
          <div className="mx-auto max-w-2xl">
            {/* Success header */}
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <IconCheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800">Submission Received!</h1>
              <p className="mt-3 text-slate-600">
                Thank you for submitting your kitchen protocol data. Our team will review your submission and follow up at the contact email provided.
              </p>
              <TierBadge tier={success} />
              <p className="mt-6 text-sm text-slate-500">
                Your assigned tier is based on your responses and may be adjusted after our team&apos;s review.
              </p>
            </div>

            {/* ── Monetization Cards ── */}
            <div className="mt-14">
              <h2 className="text-center text-2xl font-bold text-slate-800 mb-2">
                Boost Your Visibility
              </h2>
              <p className="text-center text-slate-500 mb-8 text-sm">
                Upgrade your listing to reach more diners searching for safe restaurants.
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Featured Listing */}
                <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-b from-amber-50/50 to-white p-6 shadow-sm">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                    ⭐ Featured
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Featured Listing</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-800">$29<span className="text-base font-normal text-slate-500">/mo</span></p>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    Appear at the top of search results in your city. Your restaurant gets a ⭐ badge and priority placement.
                  </p>
                  <a
                    href="https://buy.stripe.com/9B614ng8Mgg2a178Ll8Ra00"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-95"
                  >
                    ⭐ Get Featured
                  </a>
                </div>

                {/* Verified Badge */}
                <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white p-6 shadow-sm">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    ✓ Verified
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Verified Badge</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-800">$49<span className="text-base font-normal text-slate-500"> one-time</span></p>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    We verify your kitchen protocols and add a ✓ green verified badge. Diners trust verified restaurants more.
                  </p>
                  <a
                    href="https://buy.stripe.com/fZufZhcWA4xka17e5F8Ra02"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95"
                  >
                    ✓ Get Verified
                  </a>
                </div>
              </div>

              {/* Premium Profile card (single column, centered) */}
              <div className="mt-6 mx-auto max-w-sm">
                <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/50 to-white p-6 shadow-sm">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                    💎 Premium
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Premium Profile</h3>
                  <p className="mt-1 text-2xl font-bold text-slate-800">$4.99<span className="text-base font-normal text-slate-500">/mo</span></p>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    Save favorite restaurants, get personalized recommendations, and unlock the Saved Restaurants feature.
                  </p>
                  <a
                    href="https://buy.stripe.com/9B64gzg8M5Bo5KR1iT8Ra01"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-600 active:scale-95"
                  >
                    💎 Get Premium
                  </a>
                </div>
              </div>
            </div>

            {/* ── Already paid? Claim section ── */}
            <ClaimSection />

            <div className="mt-10 text-center">
              <a
                href="/"
                className="inline-block rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
              >
                Back to Home
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Determine which combined progress number to show (merges steps 3&4 when no section 3)
  const progressStep = () => {
    if (!hasSection3 && currentSection >= 3) return currentSection + 1;
    return currentSection;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
      <NavBar />

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100">
              <IconShield className="h-7 w-7 text-sky-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">List Your Venue</h1>
            <p className="mt-2 text-slate-600">
              Submit your restaurant&apos;s kitchen safety protocols to be featured on SafePlate.
            </p>
          </div>

          <ProgressBar currentStep={progressStep()} />

          {error && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── Section 1: Basic Information ── */}
          {currentSection === 1 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="mb-1 text-xl font-bold text-slate-800">Basic Information</h2>
              <p className="mb-6 text-sm text-slate-500">Tell us about your restaurant.</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Restaurant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.restaurantName}
                    onChange={(e) => update("restaurantName", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                    placeholder="e.g. The Safe Kitchen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.streetAddress}
                    onChange={(e) => update("streetAddress", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                      placeholder="Austin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => update("state", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                      placeholder="TX"
                      maxLength={2}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ZIP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.zip}
                      onChange={(e) => update("zip", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                      placeholder="78701"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Manager / Chef Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => update("contactEmail", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                    placeholder="chef@restaurant.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Dietary needs accommodated (select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((need) => (
                      <button
                        key={need}
                        type="button"
                        onClick={() => toggleDietary(need)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all border-2 ${
                          form.dietaryNeeds.includes(need)
                            ? "border-sky-500 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {need}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentSection(2)}
                  className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* ── Section 2: Facility Integrity ── */}
          {currentSection === 2 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="mb-1 text-xl font-bold text-slate-800">Facility Integrity</h2>
              <p className="mb-6 text-sm text-slate-500">
                This question determines whether your venue qualifies for our highest safety tier.
              </p>

              <RadioGroup
                name="dedicatedFacility"
                value={form.dedicatedFacility}
                onChange={(v) => {
                  update("dedicatedFacility", v as "" | "yes" | "no");
                  // Reset Section 3 when switching
                  if (v === "yes") {
                    update("dedicatedFryer", "");
                    update("separateOven", "");
                    update("colorCodedTools", "");
                    update("handWashingGlove", "");
                    update("staffTraining", "");
                    update("allergenMenu", "");
                    update("ingredientTransparency", "");
                  }
                }}
                options={[
                  {
                    value: "yes",
                    label: "Yes — 100% dedicated allergen-free / gluten-free facility",
                    subtitle: "No gluten or loose flour ever enters the building",
                  },
                  {
                    value: "no",
                    label: "No — We operate a shared kitchen with standard items",
                    subtitle: "We handle allergens and take cross-contamination precautions",
                  },
                ]}
                required
              />

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentSection(1)}
                  className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.dedicatedFacility) {
                      setError("Please select an option before continuing.");
                      return;
                    }
                    setError(null);
                    // Skip to Section 4 if dedicated
                    setCurrentSection(form.dedicatedFacility === "yes" ? 4 : 3);
                  }}
                  className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* ── Section 3: Shared Kitchen Protocols ── */}
          {currentSection === 3 && hasSection3 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="mb-1 text-xl font-bold text-slate-800">Shared Kitchen Protocols</h2>
              <p className="mb-6 text-sm text-slate-500">
                These questions help us determine your Tier 2 vs Tier 3 classification.
              </p>

              <div className="space-y-8">
                {/* Q6: Dedicated Fryer */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Do you use a dedicated isolated deep fryer for allergy-safe items?
                  </label>
                  <RadioGroup
                    name="dedicatedFryer"
                    value={form.dedicatedFryer}
                    onChange={(v) => update("dedicatedFryer", v as "" | "yes" | "no" | "na")}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "na", label: "N/A — We do not use deep fryers" },
                    ]}
                  />
                </div>

                {/* Q7: Separate Oven */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Do you use a separate designated oven or foil barrier for allergy items?
                  </label>
                  <RadioGroup
                    name="separateOven"
                    value={form.separateOven}
                    onChange={(v) => update("separateOven", v as "" | "yes" | "no" | "na")}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "na", label: "N/A — We do not use ovens" },
                    ]}
                  />
                </div>

                {/* Q8: Color-coded tools */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Do you use color-coded or sanitized tools exclusively for allergen-free orders?
                  </label>
                  <RadioGroup
                    name="colorCodedTools"
                    value={form.colorCodedTools}
                    onChange={(v) => update("colorCodedTools", v as "" | "yes" | "no")}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                  />
                </div>

                {/* Q9: Hand-washing */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Do you enforce mandatory hand-washing and glove change before preparing allergy orders?
                  </label>
                  <RadioGroup
                    name="handWashingGlove"
                    value={form.handWashingGlove}
                    onChange={(v) => update("handWashingGlove", v as "" | "yes" | "no")}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                  />
                </div>

                {/* Q10: Staff Training */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Have your staff completed a recognized allergen safety training program?
                  </label>
                  <p className="mb-3 text-xs text-slate-500">
                    e.g. ServSafe Allergen, ANSI-accredited, Celiac foundation certification
                  </p>
                  <RadioGroup
                    name="staffTraining"
                    value={form.staffTraining}
                    onChange={(v) => update("staffTraining", v as "" | "yes" | "no")}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                  />
                </div>

                {/* Q11: Allergen Menu */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Do you offer a dedicated allergen menu to guests?
                  </label>
                  <RadioGroup
                    name="allergenMenu"
                    value={form.allergenMenu}
                    onChange={(v) => update("allergenMenu", v as "" | "yes" | "no")}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                  />
                </div>

                {/* Q12: Ingredient Transparency */}
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Are ingredient lists and supplier packaging available for guest review?
                  </label>
                  <RadioGroup
                    name="ingredientTransparency"
                    value={form.ingredientTransparency}
                    onChange={(v) => update("ingredientTransparency", v as "" | "yes" | "no")}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentSection(2)}
                  className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSection(4)}
                  className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* ── Section 4: Owner Verification ── */}
          {currentSection === 4 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="mb-1 text-xl font-bold text-slate-800">Owner Verification</h2>
              <p className="mb-6 text-sm text-slate-500">
                Review and confirm your submission.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Authorized Name / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.authorizedName}
                    onChange={(e) => update("authorizedName", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition"
                    placeholder="e.g. Jane Smith, Executive Chef"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.submissionDate}
                    onChange={(e) => update("submissionDate", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition sm:w-56"
                  />
                </div>

                {/* Verification statement */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <strong>Verification Statement:</strong> I verify that the kitchen protocols outlined above accurately reflect our daily operations. I understand that SafePlate users rely on this data for medical well-being, and I agree to update SafePlate if our ingredients, equipment, or protocols change.
                  </p>
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.verified}
                    onChange={(e) => update("verified", e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-sky-500 accent-sky-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    I have read and agree to the verification statement above.
                  </span>
                </label>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentSection(hasSection3 ? 3 : 2)}
                  className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-full bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit for Review"}
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
