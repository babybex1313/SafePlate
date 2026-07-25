import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useCallback } from "react";
import {
  ALLERGENS,
  LANGUAGES,
  getAllergenName,
  getTemplateMessage,
  getAlertHeader,
  getFooterText,
  type AllergenKey,
  type LanguageKey,
} from "~/data/translations";

export const Route = createFileRoute("/travel-cards")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Allergen Translation Cards — Travel Safely with Food Allergies | SafePlate" },
      {
        name: "description",
        content:
          "Generate chef-ready allergen translation cards in 13 languages. Always free. Travel safely with Celiac, food allergies, and dietary restrictions. Print or save digital cards. Built by SafePlate.",
      },
      { property: "og:title", content: "Allergen Translation Cards — Travel Safely with Food Allergies | SafePlate" },
      {
        property: "og:description",
        content:
          "Generate chef-ready allergen translation cards in 13 languages. Always free. Travel safely with Celiac, food allergies, and dietary restrictions.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://safeplate.company/travel-cards" },
      { property: "og:image", content: "https://safeplate.company/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Allergen Translation Cards — Travel Safely with Food Allergies | SafePlate" },
      {
        name: "twitter:description",
        content:
          "Generate chef-ready allergen translation cards in 13 languages. Always free. Travel safely with Celiac, food allergies, and dietary restrictions.",
      },
      { name: "twitter:image", content: "https://safeplate.company/og-image.svg" },
    ],
    links: [
      { rel: "canonical", href: "https://safeplate.company/travel-cards" },
    ],
  }),
  component: TravelCardsPage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
/* ------------------------------------------------------------------ */

function IconMedicalCross({ className }: { className?: string }) {
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
        d="M12 4v16m-8-8h16"
      />
    </svg>
  );
}

function IconShieldCheck({ className }: { className?: string }) {
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

function IconDownload({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
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
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
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
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
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
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Home
          </a>
          <a
            href="/search"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Search
          </a>
          <a
            href="/profile"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Profile
          </a>
          <a
            href="/travel-cards"
            className="text-sm font-semibold text-sky-600"
          >
            Travel Cards
          </a>
          <a
            href="/about"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            About
          </a>
          <a
            href="/faq"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            FAQ
          </a>
          <a
            href="/list-your-venue"
            className="rounded-full border-2 border-sky-500 px-5 py-2 text-sm font-semibold text-sky-600 dark:text-sky-400 shadow-sm transition-all hover:bg-sky-50 dark:hover:bg-sky-900/50 active:scale-95"
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
    <footer className="border-t border-slate-100 dark:border-slate-800 bg-[#FAFAF9] dark:bg-slate-900 py-10">
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
            className="text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Claim Your Listing
          </a>
          <a
            href="/blog/safest-celiac-restaurants-2026"
            className="text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
          >
            Blog
          </a>
          <a
            href="/legal"
            className="text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
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
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

function TravelCardsPage() {
  const [selectedAllergens, setSelectedAllergens] = useState<Set<AllergenKey>>(
    new Set(),
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey | null>(
    null,
  );
  const [showCard, setShowCard] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Common allergens used for the pre-generated demo cards
  const PREVIEW_ALLERGENS: AllergenKey[] = [
    "wheat",
    "dairy",
    "peanuts",
    "treeNuts",
  ];

  const toggleAllergen = (key: AllergenKey) => {
    setSelectedAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setShowCard(false);
  };

  const selectLanguage = (key: LanguageKey) => {
    setSelectedLanguage(key);
    setLanguageDropdownOpen(false);
    setShowCard(false);
  };

  const canGenerate =
    selectedAllergens.size > 0 && selectedLanguage !== null;

  const generateCard = () => {
    if (canGenerate) {
      setShowCard(true);
      setDownloadReady(false);
      // Delay download-ready to allow DOM to settle
      setTimeout(() => setDownloadReady(true), 300);
    }
  };

  const downloadAsImage = useCallback(async () => {
    if (!cardRef.current) return;

    try {
      // Dynamic import of html2canvas
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = "safeplate-allergy-card.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to download card:", err);
      alert("Download failed. Please try taking a screenshot instead.");
    }
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    } catch {
      alert("Could not copy link. Please copy the URL from your browser.");
    }
  }, []);

  const selectedLang = selectedLanguage
    ? LANGUAGES.find((l) => l.key === selectedLanguage)
    : null;

  const sortedAllergens = [...selectedAllergens].sort((a, b) => {
    const idxA = ALLERGENS.findIndex((al) => al.key === a);
    const idxB = ALLERGENS.findIndex((al) => al.key === b);
    return idxA - idxB;
  });

  const allergenNamesList =
    selectedLanguage && sortedAllergens.length > 0
      ? sortedAllergens.map((a) => getAllergenName(selectedLanguage!, a))
      : [];

  const translatedMessage =
    selectedLanguage && allergenNamesList.length > 0
      ? getTemplateMessage(selectedLanguage, allergenNamesList.join("、"))
      : "";

  const alertHeader =
    selectedLanguage && allergenNamesList.length > 0
      ? getAlertHeader(selectedLanguage)
      : "";

  const footerText =
    selectedLanguage && allergenNamesList.length > 0
      ? getFooterText(selectedLanguage)
      : "";

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100 antialiased">
      <NavBar />
      <main className="flex-1 bg-[#FAFAF9] dark:bg-slate-950">
        {/* Hero / Header */}
        <section className="bg-white dark:bg-slate-950 py-16 md:py-20 border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              <IconShieldCheck className="h-4 w-4" />
              Passport Translation Cards
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-5xl md:leading-tight">
              Dine safely in{" "}
              <span className="text-sky-500">any language</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Generate a chef-ready allergen translation card. Just check your
              allergies, pick a language, and show it to your server — anywhere
              in the world.
            </p>
          </div>
        </section>

        {/* Builder Section */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left: Controls */}
              <div className="space-y-8">
                {/* Allergen selector */}
                <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      <IconMedicalCross className="h-4 w-4" />
                    </span>
                    Select Your Allergens
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                    Check every allergen that applies to you. At least one is required.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {ALLERGENS.map((allergen) => {
                      const isSelected = selectedAllergens.has(allergen.key);
                      return (
                        <label
                          key={allergen.key}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all select-none ${
                            isSelected
                              ? "border-red-300 bg-red-50 text-red-800 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAllergen(allergen.key)}
                            className="sr-only"
                          />
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                              isSelected
                                ? "border-red-500 bg-red-500 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={3}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </span>
                          <span className="truncate">
                            {allergen.emoji} {allergen.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {selectedAllergens.size > 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      {selectedAllergens.size} allergen
                      {selectedAllergens.size > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>

                {/* Language picker */}
                <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                      <IconGlobe className="h-4 w-4" />
                    </span>
                    Choose Language
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                    Select the language of the country you're visiting.
                  </p>
                  <div className="relative mt-5">
                    <button
                      type="button"
                      onClick={() =>
                        setLanguageDropdownOpen(!languageDropdownOpen)
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-left text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm transition-all hover:border-sky-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15"
                    >
                      {selectedLang ? (
                        <span className="flex items-center gap-2">
                          <span>{selectedLang.flag}</span>
                          <span>{selectedLang.nameEn}</span>
                          <span className="text-slate-400">
                            — {selectedLang.nativeName}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Select a language...
                        </span>
                      )}
                      <IconChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                          languageDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {languageDropdownOpen && (
                      <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg max-h-64 overflow-y-auto">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.key}
                            type="button"
                            onClick={() => selectLanguage(lang.key)}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-sky-50 dark:hover:bg-sky-900/30 ${
                              selectedLanguage === lang.key
                                ? "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-semibold"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <span>{lang.flag}</span>
                            <span>{lang.nameEn}</span>
                            <span className="text-slate-400">
                              {lang.nativeName}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Generate button */}
                <button
                  type="button"
                  onClick={generateCard}
                  disabled={!canGenerate}
                  className={`w-full rounded-full py-4 text-base font-bold transition-all active:scale-[0.98] ${
                    canGenerate
                      ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600 shadow-emerald-200/50 cursor-pointer"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {canGenerate
                    ? `Generate Card for ${selectedLang?.nameEn ?? ""}`
                    : "Select allergens and a language to continue"}
                </button>
              </div>

              {/* Right: Card Preview */}
              <div className="flex flex-col items-center">
                {showCard && selectedLanguage ? (
                  <div className="w-full space-y-4">
                    {/* The Card */}
                    <div
                      ref={cardRef}
                      className="mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                      style={{ aspectRatio: "9/16" }}
                    >
                      <div className="flex h-full flex-col">
                        {/* Card header */}
                        <div className="bg-emerald-500 px-5 py-4 text-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-lg">
                                🍽️
                              </span>
                              <span className="text-base font-bold tracking-tight">
                                SafePlate
                              </span>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                              <IconMedicalCross className="h-6 w-6 text-red-500" />
                            </div>
                          </div>
                        </div>

                        {/* Alert header */}
                        <div className="bg-red-50 px-5 py-3 border-b border-red-100">
                          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                            Food Allergy Alert
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-red-800">
                            {alertHeader}
                          </p>
                        </div>

                        {/* Translated message */}
                        <div className="flex-1 px-5 py-4 overflow-y-auto">
                          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                            {translatedMessage}
                          </p>

                          {/* Allergen badges */}
                          <div className="mt-5 flex flex-wrap gap-2">
                            {sortedAllergens.map((key) => {
                              const info = ALLERGENS.find(
                                (a) => a.key === key,
                              )!;
                              const name = getAllergenName(
                                selectedLanguage,
                                key,
                              );
                              return (
                                <span
                                  key={key}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                                >
                                  <span>{info.emoji}</span>
                                  <span>{name}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Card footer */}
                        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                          <p className="text-center text-xs text-slate-400">
                            {footerText} — safeplate.app
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Download button */}
                    <button
                      type="button"
                      onClick={downloadAsImage}
                      disabled={!downloadReady}
                      className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                        downloadReady
                          ? "bg-sky-500 text-white shadow-md hover:bg-sky-600 cursor-pointer"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <IconDownload className="h-4 w-4" />
                      Download as Image
                    </button>

                    {/* Save to phone tip */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          Save to Phone:
                        </span>{" "}
                        Download the image above and add it to your photos. Set
                        it as your lock screen wallpaper for easy access at
                        restaurants, or keep it in a dedicated "Travel" album.
                      </p>
                    </div>

                    {/* Share Section */}
                    <div className="rounded-xl border border-sky-100 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 p-5 space-y-4">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">
                        Share this tool with someone who needs it
                      </p>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-white border border-sky-200 py-2.5 text-sm font-semibold text-sky-600 transition-all hover:bg-sky-50 hover:border-sky-300 active:scale-[0.98] cursor-pointer"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                          />
                        </svg>
                        Copy Link
                      </button>
                      <p className="text-xs text-slate-500 text-center">
                        Join 5,000+ travelers who dine safely abroad
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[400px] w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600">
                      <IconShieldCheck className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-400 dark:text-slate-500">
                      Your card will appear here
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-slate-400 dark:text-slate-500">
                      Select your allergens, pick a language, then generate your
                      translation card.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* All 13 Language Pre-Generated Cards — Always Free */}
        <section
          className="py-12 md:py-16 border-t border-slate-100 dark:border-slate-800 bg-[#FAFAF9] dark:bg-slate-950 print-only-cards"
        >
          <div className="mx-auto max-w-7xl px-6">
            {/* Section header */}
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Always Free
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                All 13 Translation Cards
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Your complete set of chef-ready allergen cards — print them
                all or save to your phone.
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-sky-600 active:scale-[0.98] cursor-pointer no-print"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
                  />
                </svg>
                🖨️ Print All Cards
              </button>
            </div>

            {/* Card grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {LANGUAGES.map((lang) => {
                const allergenNamesList = PREVIEW_ALLERGENS.map((a) =>
                  getAllergenName(lang.key, a),
                ).join("\u3001");

                return (
                  <div key={lang.key} className="relative group/card">
                    {/* Card body */}
                    <div
                      className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex flex-col h-full transition-all hover:shadow-md"
                    >
                      {/* Green header */}
                      <div className="bg-emerald-500 px-4 py-3 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{lang.flag}</span>
                          <span className="font-bold text-sm truncate">
                            {lang.nameEn}
                          </span>
                        </div>
                        <span className="text-xs opacity-80 shrink-0 ml-2">
                          {lang.nativeName}
                        </span>
                      </div>

                      {/* Alert header */}
                      <div className="bg-red-50 dark:bg-red-950/30 px-4 py-2 border-b border-red-100 dark:border-red-900/30 shrink-0">
                        <p className="text-xs font-bold text-red-800 dark:text-red-300">
                          {getAlertHeader(lang.key)}
                        </p>
                      </div>

                      {/* Message + badges */}
                      <div className="flex-1 px-4 py-3 flex flex-col">
                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 line-clamp-5">
                          {getTemplateMessage(lang.key, allergenNamesList)}
                        </p>
                        <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
                          {PREVIEW_ALLERGENS.map((key) => {
                            const info = ALLERGENS.find((a) => a.key === key)!;
                            const name = getAllergenName(lang.key, key);
                            return (
                              <span
                                key={key}
                                className="inline-flex items-center gap-1 rounded-full border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-2 py-1 text-[10px] font-semibold text-red-700 dark:text-red-300"
                              >
                                <span>{info.emoji}</span>
                                <span>{name}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 shrink-0">
                        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
                          {getFooterText(lang.key) || "Generated by SafePlate"}{" "}
                          &mdash; safeplate.app
                        </p>
                      </div>
                    </div>

                    {/* No lock overlay — all cards are free */}
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      </main>
      <Footer />

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 0.5in; size: letter; }
          body { background: #fff !important; }
          header, footer, .no-print, .Toast, nav { display: none !important; }
          .print-only-cards { background: #fff !important; border: none !important; padding: 0 !important; }
          .print-only-cards .grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 0.25in !important; }
          .print-only-cards .rounded-2xl { break-inside: avoid; }
        }
      `}</style>

      {/* Toast Notification */}
      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fadeInUp_0.3s_ease-out]">
          <div className="flex items-center gap-2.5 rounded-full bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-lg">
            <svg
              className="h-4 w-4 text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Link copied to clipboard!
          </div>
        </div>
      )}
    </div>
  );
}
