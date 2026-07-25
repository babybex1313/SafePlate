import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal")({
  component: LegalPage,
  head: () => ({
    title: "SafePlate — Safety Disclaimer",
    meta: [
      {
        name: "description",
        content:
          "SafePlate safety disclaimer, medical disclaimer, limitation of liability, and terms of acceptance for dining with food allergies and dietary restrictions.",
      },
    ],
  }),
});

/* ------------------------------------------------------------------ */
/*  Footer                                                            */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-[#FAFAF9] py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-base">
            🍽️
          </span>
          <span className="text-base font-semibold text-slate-800">SafePlate</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/claim"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600"
          >
            Claim Your Listing
          </a>
          <a
            href="/blog/safest-celiac-restaurants-2026"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600"
          >
            Blog
          </a>
          <a
            href="/legal"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-sky-600"
          >
            Safety Disclaimer
          </a>
        </div>
        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} SafePlate. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Warning Callout                                           */
/* ------------------------------------------------------------------ */

function WarningCallout({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
      <span className="mt-0.5 flex-shrink-0 text-xl" aria-hidden="true">
        {icon}
      </span>
      <p className="text-sm leading-relaxed text-amber-800">{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page assembly                                                     */
/* ------------------------------------------------------------------ */

function LegalPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased">
      {/* Nav */}
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
              href="/profile"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600"
            >
              Profile
            </a>
            <a
              href="/travel-cards"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600"
            >
              Travel Cards
            </a>
            <a
              href="/about"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600"
            >
              About
            </a>
            <a
              href="/faq"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600"
            >
              FAQ
            </a>
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

      {/* Main */}
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#FAFAF9] py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <span className="text-2xl">🛡️</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 md:text-5xl">
              Safety Disclaimer
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-400">
              Last Updated: July 23, 2026
            </p>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Your safety is our priority. Please read this disclaimer
              carefully — it explains the limits of the information we provide
              and your responsibilities as a user.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6 space-y-12">
            {/* Section 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">
                  🚨
                </span>
                <h2 className="text-xl font-bold text-slate-800">
                  1. Medical &amp; Health Disclaimer
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 uppercase tracking-wide font-semibold mb-4">
                The Core Shield
              </p>
              <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                <p>
                  SafePlate is a community-driven information directory designed
                  to help users identify potential dining options based on
                  reported restaurant kitchen protocols. SafePlate does not
                  provide medical advice, diagnosis, or treatment.
                </p>
                <p>
                  The information provided on this platform — including safety
                  tiers, kitchen equipment status, ingredient listings, and
                  cross-contamination indicators — is for general informational
                  purposes only. Having a food allergy, autoimmune condition
                  (such as Celiac disease), or severe dietary restriction
                  carries inherent medical risks. Users must not rely solely on
                  the data provided by SafePlate to determine the ultimate
                  safety of a meal. Always consult with a qualified medical
                  professional regarding dietary health decisions.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">
                  🍽️
                </span>
                <h2 className="text-xl font-bold text-slate-800">
                  2. Limitation of Liability &amp; Restaurant Verification
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                <p>
                  While SafePlate makes every reasonable effort to verify
                  kitchen practices via our Kitchen Protocol Questionnaire and
                  community reports, we do not guarantee, warrant, or certify
                  that any restaurant listed on this platform is 100% safe or
                  free from cross-contamination.
                </p>
                <p>
                  Restaurant environments are dynamic. Management changes, staff
                  turnover, ingredient substitutions, shared cooking spaces, and
                  human error can alter a restaurant's safety status at any
                  moment without our knowledge.
                </p>

                <WarningCallout icon="⚠️">
                  <strong>User Responsibility:</strong> You acknowledge and
                  agree that it is your sole responsibility to verbally verify
                  your specific allergy or medical restrictions with the
                  restaurant's manager or chef before ordering or consuming any
                  food.
                </WarningCallout>

                <WarningCallout icon="⚖️">
                  <strong>No Liability:</strong> SafePlate, its founders, its
                  developers, and its affiliates shall not be held liable for
                  any adverse health effects, allergic reactions, bodily injury,
                  medical expenses, or damages resulting directly or indirectly
                  from the use of this website or reliance on its data.
                </WarningCallout>
              </div>
            </div>

            {/* Section 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg">
                  🚨
                </span>
                <h2 className="text-xl font-bold text-slate-800">
                  3. User-Generated Content &amp; Live Alerts
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                <p>
                  Our Real-Time Safety Alerts and community reviews rely on
                  crowd-sourced information from general users. SafePlate does
                  not immediately verify every user-submitted alert before it
                  appears on the platform as a warning flag. We do not guarantee
                  the accuracy, completeness, or truthfulness of user-generated
                  content. If you discover an error or an outdated listing, you
                  agree to utilize our reporting tools to notify administration
                  immediately.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                  📝
                </span>
                <h2 className="text-xl font-bold text-slate-800">
                  4. Acceptance of Terms
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                <p>
                  By accessing, signing up for the waitlist, or using the
                  SafePlate platform, you explicitly acknowledge that you have
                  read, understood, and agreed to be legally bound by this
                  Safety Disclaimer and our Terms of Service. If you do not
                  agree to these terms, you must immediately cease using this
                  website.
                </p>
              </div>
            </div>

            {/* Bottom note */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
              <p className="text-sm leading-relaxed text-emerald-800">
                <strong>Questions about this disclaimer?</strong>{" "}
                Reach out to us at{" "}
                <a
                  href="mailto:safety@safeplate.app"
                  className="font-semibold underline underline-offset-2 transition-colors hover:text-emerald-900"
                >
                  safety@safeplate.app
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
