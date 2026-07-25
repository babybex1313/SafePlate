import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FAQ — How SafePlate Verifies Allergy-Safe Restaurants | SafePlate" },
      {
        name: "description",
        content:
          "How SafePlate protects diners with Celiac and food allergies. Learn about our color-coded safety tiers, verified kitchen protocols, dedicated fryer standards, and how we partner with restaurants for safer dining.",
      },
      { property: "og:title", content: "FAQ — How SafePlate Verifies Allergy-Safe Restaurants | SafePlate" },
      {
        property: "og:description",
        content:
          "How SafePlate protects diners with Celiac and food allergies. Learn about our color-coded safety tiers, verified kitchen protocols, and dedicated fryer standards.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://safeplate.company/faq" },
      { property: "og:image", content: "https://safeplate.company/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FAQ — How SafePlate Verifies Allergy-Safe Restaurants | SafePlate" },
      {
        name: "twitter:description",
        content:
          "How SafePlate protects diners with Celiac and food allergies. Learn about our color-coded safety tiers, verified kitchen protocols, and dedicated fryer standards.",
      },
      { name: "twitter:image", content: "https://safeplate.company/og-image.svg" },
    ],
    links: [
      { rel: "canonical", href: "https://safeplate.company/faq" },
    ],
  }),
  component: FAQPage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
/* ------------------------------------------------------------------ */

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
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-sky-600 dark:hover:text-sky-400"
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
            className="text-sm font-semibold text-sky-600"
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
/*  Accordion Item                                                    */
/* ------------------------------------------------------------------ */

interface AccordionItemProps {
  question: string;
  answer: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ question, answer, isOpen, onToggle }: AccordionItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
      >
        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 pr-2 leading-snug">
          {question}
        </h4>
        <IconChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-sky-500" : ""
          }`}
        />
      </button>
      <div
        style={{ height: `${height}px` }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div ref={contentRef}>
          <div className="px-6 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 border-t border-slate-50 dark:border-slate-700 pt-4 mx-6">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tier Badges                                                       */
/* ------------------------------------------------------------------ */

function TierBadges() {
  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          🟢 Tier 1
        </span>
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            100% Dedicated Facility
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Absolutely zero risk of cross-contamination. The entire venue is completely free of the specified allergen (e.g., a 100% Gluten-Free bakery).
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          🟡 Tier 2
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-700">
            Certified Allergen Protocols
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            A shared kitchen, but with strict, separate isolation zones, dedicated equipment (like isolated fryers or pizza ovens), and highly trained staff.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
          🔵 Tier 3
        </span>
        <div>
          <p className="text-sm font-semibold text-sky-700">
            Dietary-Friendly
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Offers modified options, but operates in a standard shared kitchen environment with a higher baseline risk of cross-contamination.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ Data                                                          */
/* ------------------------------------------------------------------ */

const dinerFAQs = [
  {
    q: "What makes SafePlate different from regular restaurant review apps?",
    a: (
      <p>
        Standard apps rely purely on casual customer reviews, which are highly
        subjective and often ignore cross-contamination. SafePlate focuses
        strictly on verified kitchen protocols. We track the invisible details
        that matter — like whether a restaurant uses dedicated fryers, separate
        preparation spaces, or mandates allergen training for staff.
      </p>
    ),
  },
  {
    q: "What do the color-coded safety tiers mean?",
    a: <TierBadges />,
  },
  {
    q: "How do the Real-Time Safety Alerts work?",
    a: (
      <p>
        If a diner visits a restaurant and notices a policy shift — such as a
        kitchen installing a shared fryer or changing a food supplier — they can
        instantly hit the "Report Change" button. This immediately applies a
        temporary warning banner to that restaurant's profile while our team
        verifies the update, protecting the next diner in line.
      </p>
    ),
  },
  {
    q: "Is the Safe Journey Route Planner free to use?",
    a: (
      <p>
        Yes! The Safe Journey Route Planner is completely free. Simply type in
        your starting point and your final destination, and our smart mapping
        tool will automatically drop pins on verified safe restaurants located
        within minutes of highway exits along your path.
      </p>
    ),
  },
];

const restaurantFAQs = [
  {
    q: "How does our restaurant get listed on SafePlate?",
    a: (
      <p>
        Any restaurant can submit a listing for free. To get started, click the
        "List Your Venue" button, fill out your basic location details, and
        complete our comprehensive Kitchen Protocol Questionnaire detailing your
        cross-contamination safety measures.
      </p>
    ),
  },
  {
    q: "What is a \"Verified Safe\" Badge, and how do we get one?",
    a: (
      <p>
        A "Verified Safe" Badge is a premium trust marker displayed on your
        profile. To earn this badge, our team conducts a thorough compliance
        review of your allergen protocols, which may include submitting proof of
        staff allergen training certifications (like ServSafe Allergen) or
        supplying documentation of your dedicated kitchen equipment layouts.
      </p>
    ),
  },
  {
    q: "Can we update our menu and safety protocols later?",
    a: (
      <p>
        Absolutely. We encourage total transparency. Restaurant managers can
        claim their free profile page at any time to instantly update menu
        items, edit operating hours, or modify listed kitchen protocols if
        equipment or training changes.
      </p>
    ),
  },
  {
    q: "Why should my restaurant care about being on SafePlate?",
    a: (
      <p>
        The dietary restriction community is fiercely loyal. When a family with
        a Celiac or severely allergic member finds a kitchen they can truly
        trust, they don't just visit once — they become lifelong customers and
        passionate advocates, bringing large groups of family and friends with
        them.
      </p>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Main FAQ Page                                                     */
/* ------------------------------------------------------------------ */

function FAQPage() {
  const [activeSection, setActiveSection] = useState<"diner" | "restaurant">("diner");
  const [openDinerIdx, setOpenDinerIdx] = useState<number | null>(null);
  const [openRestaurantIdx, setOpenRestaurantIdx] = useState<number | null>(null);

  const dinerRef = useRef<HTMLDivElement>(null);
  const restaurantRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((section: "diner" | "restaurant") => {
    setActiveSection(section);
    const ref = section === "diner" ? dinerRef : restaurantRef;
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const toggleDiner = (idx: number) => {
    setOpenDinerIdx((prev) => (prev === idx ? null : idx));
  };

  const toggleRestaurant = (idx: number) => {
    setOpenRestaurantIdx((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100 antialiased">
      <NavBar />
      <main className="flex-1 bg-[#FAFAF9] dark:bg-slate-950">
        {/* Hero */}
        <section className="bg-white dark:bg-slate-950 py-16 md:py-20 border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700">
              <IconShieldCheck className="h-4 w-4" />
              Frequently Asked Questions
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-5xl md:leading-tight">
              Got questions?{" "}
              <span className="text-sky-500">We've got answers.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Everything you need to know about dining safely with SafePlate —
              and how we help restaurants earn the trust of the allergy community.
            </p>
          </div>
        </section>

        {/* Audience Tabs */}
        <section className="py-10">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection("diner")}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-full text-base font-bold transition-all active:scale-[0.97] cursor-pointer ${
                  activeSection === "diner"
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-200/50"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-sky-300 hover:text-sky-600 dark:hover:text-sky-400 shadow-sm"
                }`}
              >
                🧑‍🍳 I'm a Diner
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("restaurant")}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-full text-base font-bold transition-all active:scale-[0.97] cursor-pointer ${
                  activeSection === "restaurant"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200/50"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm"
                }`}
              >
                🏢 I'm a Restaurant Owner
              </button>
            </div>
          </div>
        </section>

        {/* Diner FAQ Section */}
        <section ref={dinerRef} className="py-10 md:py-14 scroll-mt-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-3xl">
                🧑‍🍳 For Diners: How We Protect Your Plate
              </h2>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                Answers to your most common questions about dining safely with SafePlate.
              </p>
            </div>
            <div className="space-y-4">
              {dinerFAQs.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openDinerIdx === idx}
                  onToggle={() => toggleDiner(idx)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Restaurant FAQ Section */}
        <section ref={restaurantRef} className="py-10 md:py-14 scroll-mt-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-3xl">
                🏢 For Restaurants: Partnering with SafePlate
              </h2>
              <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                How your restaurant can get listed, earn trust badges, and attract loyal customers.
              </p>
            </div>
            <div className="space-y-4">
              {restaurantFAQs.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openRestaurantIdx === idx}
                  onToggle={() => toggleRestaurant(idx)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-sm p-10 md:p-14">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-3xl">
                Still have questions?
              </h2>
              <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                We're here to help. Reach out and we'll get back to you as soon as possible.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/#signup"
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-7 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-sky-600 active:scale-95"
                >
                  Join the Waitlist
                </a>
                <a
                  href="mailto:hello@safeplate.app"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-7 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:border-sky-300 hover:text-sky-600 dark:hover:text-sky-400 active:scale-95"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
