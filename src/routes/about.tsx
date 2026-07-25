import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "About SafePlate — Our Mission for Allergy-Safe Dining | SafePlate" },
      {
        name: "description",
        content:
          "SafePlate was built for the people we love most. Our mission: eliminate the fear, anxiety, and social isolation of dining out with Celiac, food allergies, and dietary restrictions. Learn our story and values.",
      },
      { property: "og:title", content: "About SafePlate — Our Mission for Allergy-Safe Dining | SafePlate" },
      {
        property: "og:description",
        content:
          "SafePlate was built for the people we love most. Our mission: eliminate the fear, anxiety, and social isolation of dining out with dietary restrictions.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://safeplate.company/about" },
      { property: "og:image", content: "https://safeplate.company/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "About SafePlate — Our Mission for Allergy-Safe Dining | SafePlate" },
      {
        name: "twitter:description",
        content:
          "SafePlate was built for the people we love most. Our mission: eliminate the fear, anxiety, and social isolation of dining out with dietary restrictions.",
      },
      { name: "twitter:image", content: "https://safeplate.company/og-image.svg" },
    ],
    links: [
      { rel: "canonical", href: "https://safeplate.company/about" },
    ],
  }),
  component: AboutPage,
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

function IconGroup({ className }: { className?: string }) {
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
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function IconGlobeRoute({ className }: { className?: string }) {
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21l16.5-9M3.75 3l16.5 9"
      />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
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
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
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
            className="text-sm font-semibold text-emerald-600"
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
/*  Section: Hero                                                     */
/* ------------------------------------------------------------------ */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-400 via-sky-400 to-sky-300 py-28 md:py-40">
      {/* Abstract decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl md:leading-tight">
          Built for the people
          <br />
          we love most.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
          Every feature, every design decision, every line of code — driven by a
          deeply personal mission to protect the people we care about.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Our Story                                                */
/* ------------------------------------------------------------------ */

function OurStorySection() {
  return (
    <section className="bg-white dark:bg-slate-950 py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <span className="text-sm font-semibold tracking-wide text-emerald-600 uppercase">
          Our Story
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-4xl">
          The Spark Behind the SafePlate Shield
        </h2>

        <div className="mt-10 space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-xl">
          <p>
            SafePlate was born from a deeply personal mission. For years, I
            watched my stepmom navigate the daily, exhausting minefield of
            living with Celiac disease. I saw firsthand how a simple family
            dinner out could turn into days of severe illness just because a
            kitchen used a shared fryer or cross-contaminated a cutting board.
          </p>
          <p>
            For millions of people living with severe food allergies, autoimmune
            diseases, or strict dietary restrictions, eating out isn&rsquo;t just
            an inconvenience — it is a high-stakes gamble. Standard review apps
            fail this community because they don&rsquo;t look past the menu. We
            built SafePlate because eating safely shouldn&rsquo;t be a game of
            culinary roulette.
          </p>
          <p>
            <strong>We never use AI to evaluate restaurant safety.</strong> Every 
            kitchen protocol — dedicated fryers, isolated prep stations, staff 
            training — is either verified directly or submitted by the restaurant 
            itself through our Kitchen Protocol Questionnaire. No algorithms 
            guessing whether a meal is safe.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Vision Quote                                             */
/* ------------------------------------------------------------------ */

function VisionSection() {
  return (
    <section className="bg-[#FAFAF9] dark:bg-slate-950 py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <blockquote className="border-l-4 border-emerald-500 pl-6 md:pl-8">
          <p className="text-xl font-medium italic leading-relaxed text-slate-700 dark:text-slate-200 md:text-2xl md:leading-relaxed">
            &ldquo;To eliminate the fear, anxiety, and social isolation of dining
            out with severe dietary restrictions. Eating safely is a human
            right, not a luxury.&rdquo;
          </p>
        </blockquote>
        <p className="mt-8 text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-xl">
          We envision a world where anyone can travel, explore, and share a table
          with their loved ones with 100% peace of mind, knowing their health is
          fiercely protected.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: 4 Pillars of Protection                                  */
/* ------------------------------------------------------------------ */

function PillarsSection() {
  const pillars = [
    {
      title: "Verified Kitchen Protocols",
      body: 'We skip vague "gluten-friendly" labels to track real kitchen safety, like dedicated fryers and isolated prep stations.',
      icon: IconShield,
    },
    {
      title: 'The "Group Harmony" Filter',
      body: "We protect the social lives of our users by highlighting venues that keep the restricted diner entirely safe while offering excellent standard menus for friends and family.",
      icon: IconGroup,
    },
    {
      title: "Boundary-Free Travel",
      body: "Whether you are driving across the state or flying across the globe, our Safe Journey Route Planner and Digital Translation Cards keep you protected on the move.",
      icon: IconGlobeRoute,
    },
    {
      title: "A Living Community Shield",
      body: "Our Real-Time Menu Change Alerts empower the community to instantly crowd-source and flag sudden ingredient or kitchen protocol changes, protecting the next diner in line.",
      icon: IconBell,
    },
  ];

  return (
    <section className="bg-white dark:bg-slate-950 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-emerald-600 uppercase">
            How We Protect You
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-4xl">
            The 4 Pillars of Protection
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Every feature we build is grounded in one of these core principles.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="group rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                <pillar.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                {pillar.title}
              </h3>
              <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Our Promise / Sign-off                                    */
/* ------------------------------------------------------------------ */

function PromiseSection() {
  return (
    <section className="bg-[#FAFAF9] dark:bg-slate-950 py-24 md:py-32">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <span className="text-sm font-semibold tracking-wide text-emerald-600 uppercase">
          Our Promise
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-4xl">
          Our Promise to You
        </h2>

        <div className="mt-10 space-y-6">
          <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 md:text-xl">
            SafePlate is independently driven, deeply personal, and entirely
            focused on human well-being. We do not compromise on safety because
            we build this tool for the people we love most.
          </p>

          <div className="mt-10 border-t border-slate-200 dark:border-slate-700 pt-10">
            <p className="text-xl font-semibold text-slate-700 dark:text-slate-200 md:text-2xl">
              Thank you for trusting us with your plate.
            </p>
            <p className="mt-3 text-lg font-medium text-emerald-600 md:text-xl">
              Welcome to the family.
            </p>
            <p className="mt-8 text-base text-slate-500 dark:text-slate-400">
              — The SafePlate Team
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Assembly                                                     */
/* ------------------------------------------------------------------ */

function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100 antialiased">
      <NavBar />
      <main>
        <HeroSection />
        <OurStorySection />
        <VisionSection />
        <PillarsSection />
        <PromiseSection />
      </main>
      <Footer />
    </div>
  );
}
