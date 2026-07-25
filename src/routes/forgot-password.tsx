import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requestPasswordReset } from "~/db/auth";
import { ThemeToggle } from "~/components/ThemeToggle";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Forgot Password — SafePlate" }],
  }),
  component: ForgotPasswordPage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                  */
/* ------------------------------------------------------------------ */

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  NavBar                                                            */
/* ------------------------------------------------------------------ */

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80">
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
          <a href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">
            Home
          </a>
          <a href="/search" className="text-sm font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400">
            Search
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Forgot Password Form                                              */
/* ------------------------------------------------------------------ */

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const result = await requestPasswordReset({ data: { email: email.trim() } });
      if (result.success) {
        setStatus("sent");
      } else {
        setErrorMsg(result.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAF9] text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-2xl shadow-md">
                🍽️
              </span>
            </div>

            {status === "sent" ? (
              <>
                <h1 className="text-center text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
                  Check your email
                </h1>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
                  If an account exists for {email}, we&rsquo;ve sent a password reset link. It expires in 1 hour.
                </p>
                <p className="text-center text-sm text-slate-400 dark:text-slate-500">
                  <a href="/login" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
                    ← Back to log in
                  </a>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-center text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
                  Forgot your password?
                </h1>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
                  Enter your email and we&rsquo;ll send you a reset link.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-xl bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {status === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <IconSpinner className="h-4 w-4 animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  <a href="/login" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
                    ← Back to log in
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
