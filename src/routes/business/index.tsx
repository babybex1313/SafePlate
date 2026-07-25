import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { ThemeToggle } from "~/components/ThemeToggle";

export const Route = createFileRoute("/business/")({
  head: () => ({
    meta: [{ title: "SafePlate for Restaurants — Attract Allergen Diners" }],
  }),
  component: BusinessLandingPage,
});

/* ── SVG Icons ────────────────────────────────────────────────────────────── */

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
    </svg>
  );
}

function IconFryer({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.313A3.75 3.75 0 0012 18z" />
    </svg>
  );
}

function IconCrossContam({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}

function IconTraining({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
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

function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
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
          <a href="/business/dashboard" className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95">
            Owner Login
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

/* ── Testimonials ──────────────────────────────────────────────────────────── */

const testimonials = [
  {
    quote: "Since displaying our SafePlate Tier 1 badge, our gluten-free diner traffic has increased 40%. It's the trust signal they've been looking for.",
    name: "Maria Chen",
    role: "Owner, Verde Kitchen — Austin, TX",
  },
  {
    quote: "The audit process was thorough but simple. Our staff now follows protocols that make us genuinely safer — and our customers can taste the confidence.",
    name: "James Rodriguez",
    role: "Executive Chef, The Gilded Fork — Chicago, IL",
  },
  {
    quote: "We went from 'gluten-friendly' to 'Medical-Grade Verified.' The number of celiac diners who specifically seek us out is incredible.",
    name: "Sarah Park",
    role: "General Manager, Hearth & Grain — Portland, OR",
  },
];

function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1)), []);
  const next = useCallback(() => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1)), []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const t = testimonials[current];

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex justify-center gap-1 mb-4">
          {[1,2,3,4,5].map((i) => (
            <IconStar key={i} className="h-5 w-5 text-amber-400" />
          ))}
        </div>
        <blockquote className="text-center text-lg font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <div className="mt-6 text-center">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{t.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.role}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <button onClick={prev} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-sky-300 hover:text-sky-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-sky-600 dark:hover:text-sky-400 cursor-pointer" aria-label="Previous testimonial">
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 w-2 rounded-full transition-all cursor-pointer ${
                i === current ? "bg-sky-500 w-6" : "bg-slate-300 dark:bg-slate-600"
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
        <button onClick={next} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-sky-300 hover:text-sky-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-sky-600 dark:hover:text-sky-400 cursor-pointer" aria-label="Next testimonial">
          <IconChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/* ── Feature Card ──────────────────────────────────────────────────────────── */

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */

function BusinessLandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <NavBar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/60 to-white pt-20 pb-16 dark:from-sky-950/30 dark:to-slate-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0IDEuNzkxIDQgNCA0IDQtMS43OTEgNC00em0wLTE2YzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0IDEuNzkxIDQgNCA0IDQtMS43OTEgNC00em0wIDE2YzAtMi4yMDktMS43OTEtNC00LTRzLTQgMS43OTEtNCA0IDEuNzkxIDQgNCA0IDQtMS43OTEgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-400">
            <IconShield className="h-4 w-4" />
            SafePlate for Restaurants
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-50">
            Attract Loyal, High-Value{" "}
            <span className="text-sky-500">Allergen Diners</span> to Your Tables
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Join the restaurants that allergy-conscious diners trust with their health. 
            Get verified, display your safety badge, and fill tables with loyal guests who 
            know their meal is prepared with care.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/business/register"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-600 hover:shadow-sky-500/40 active:scale-95"
            >
              <IconBadge className="h-5 w-5" />
              Claim & Verify Your Kitchen
            </a>
            <button
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-sky-300 hover:text-sky-600 active:scale-95 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-sky-600 dark:hover:text-sky-400"
            >
              View Demo
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl bg-sky-500/5 p-8 text-center dark:bg-sky-500/10">
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
              1 in 10 diners have food allergies
            </p>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              They trust <strong>Human-Verified protocols</strong>, not AI guesses. 
              When they find a SafePlate-verified kitchen, they become regulars.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <p className="text-3xl font-extrabold text-sky-500">32M+</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Americans with food allergies</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-sky-500">$24B</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Annual allergy-free food market</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-sky-500">73%</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Diners return to verified kitchens</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-slate-800 dark:text-slate-100 sm:text-4xl">
            How SafePlate Verification Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600 dark:text-slate-400">
            Our kitchen protocol audit goes deeper than any generic review platform. 
            We verify the specific practices that matter to allergen-conscious diners.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<IconFryer className="h-6 w-6" />}
              title="Dedicated Fryer Detection"
              description="We verify whether gluten-free items are fried in a separate, uncontaminated fryer — critical for celiac safety."
            />
            <FeatureCard
              icon={<IconCrossContam className="h-6 w-6" />}
              title="Cross-Contamination Verification"
              description="Separate prep surfaces, color-coded boards, and dedicated utensils: we check every station in your kitchen."
            />
            <FeatureCard
              icon={<IconTraining className="h-6 w-6" />}
              title="Staff Training Verification"
              description="From certified allergen management courses to front-of-house communication protocols — we audit your team."
            />
            <FeatureCard
              icon={<IconBadge className="h-6 w-6" />}
              title="Public Safety Badge"
              description="Display your SafePlate Verified badge on your website, menu, and social media. Instant trust at a glance."
            />
          </div>
        </div>
      </section>

      {/* ── Tiers ────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-slate-800 dark:text-slate-100 sm:text-4xl">
            Three Tiers. One Mission: Safety.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600 dark:text-slate-400">
            Every kitchen starts with our comprehensive 10-point audit. Your tier reflects your commitment — 
            and diners see it instantly.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Tier 1 */}
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-8 shadow-sm dark:border-emerald-800 dark:bg-slate-900">
              <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                🟢 Tier 1 — Medical-Grade
              </div>
              <p className="mt-4 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">8-10 pts</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ Dedicated GF fryer</li>
                <li>✓ Separate prep surfaces</li>
                <li>✓ Certified staff training</li>
                <li>✓ All flagged on tickets</li>
                <li>✓ Color-coded cutting boards</li>
              </ul>
              <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Recommended for diners with Celiac disease and anaphylactic allergies.
              </p>
            </div>
            {/* Tier 2 */}
            <div className="rounded-2xl border-2 border-amber-200 bg-white p-8 shadow-sm dark:border-amber-800 dark:bg-slate-900">
              <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                🟡 Tier 2 — Strong Protocols
              </div>
              <p className="mt-4 text-3xl font-extrabold text-amber-600 dark:text-amber-400">5-7 pts</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ Most protocols in place</li>
                <li>✓ Staff training underway</li>
                <li>✓ Kitchen ticket flagging</li>
                <li>• Room to reach Tier 1</li>
              </ul>
              <p className="mt-4 text-sm font-medium text-amber-700 dark:text-amber-400">
                Solid protocols. Trusted by diners with moderate dietary restrictions.
              </p>
            </div>
            {/* Tier 3 */}
            <div className="rounded-2xl border-2 border-sky-200 bg-white p-8 shadow-sm dark:border-sky-800 dark:bg-slate-900">
              <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-sm font-bold text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">
                🔵 Tier 3 — Basic Listing
              </div>
              <p className="mt-4 text-3xl font-extrabold text-sky-600 dark:text-sky-400">1-4 pts</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>✓ Basic awareness</li>
                <li>• Some protocols missing</li>
                <li>• Upgradable with training</li>
                <li>• Listed & discoverable</li>
              </ul>
              <p className="mt-4 text-sm font-medium text-sky-700 dark:text-sky-400">
                A starting point. Many kitchens use this as a roadmap to Tier 1.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-slate-800 dark:text-slate-100 sm:text-4xl">
            Trusted by Restaurant Owners
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600 dark:text-slate-400">
            Hear from kitchens that have already made safety their competitive advantage.
          </p>
          <div className="mt-12">
            <TestimonialsCarousel />
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-sky-500 dark:bg-sky-600">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Become a SafePlate Verified Kitchen?
          </h2>
          <p className="mt-4 text-lg text-sky-100">
            Take our 10-point kitchen audit in under 5 minutes. Get your safety tier, 
            download your badge, and start attracting loyal allergen-conscious diners.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/business/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-sky-600 shadow-lg transition-all hover:bg-sky-50 active:scale-95"
            >
              <IconBadge className="h-5 w-5" />
              Claim & Verify Your Kitchen
            </a>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
            >
              Create Restaurant Owner Account
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
