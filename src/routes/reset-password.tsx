import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { validateResetToken, resetPassword } from "~/db/auth";
import { ThemeToggle } from "~/components/ThemeToggle";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset Password — SafePlate" }],
  }),
  component: ResetPasswordPage,
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
/*  Reset Password Page                                               */
/* ------------------------------------------------------------------ */

function useToken(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") ?? "";
}

function ResetPasswordPage() {
  const token = useToken();
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setTokenError("No reset token provided. Please use the link from your email.");
      setValidating(false);
      return;
    }

    validateResetToken({ data: { token } })
      .then((result) => {
        if (result.valid) {
          setTokenValid(true);
        } else {
          setTokenError(result.error ?? "Invalid or expired reset link.");
        }
      })
      .catch(() => {
        setTokenError("Something went wrong. Please try again.");
      })
      .finally(() => {
        setValidating(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setStatus("error");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords don't match.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const result = await resetPassword({ data: { token, newPassword } });
      if (result.success) {
        setStatus("done");
      } else {
        setErrorMsg(result.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
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

            {validating ? (
              <>
                <h1 className="text-center text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
                  Verifying your link…
                </h1>
                <div className="flex justify-center py-8">
                  <IconSpinner className="h-8 w-8 animate-spin text-sky-500" />
                </div>
              </>
            ) : !tokenValid ? (
              <>
                <h1 className="text-center text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
                  Invalid link
                </h1>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
                  {tokenError}
                </p>
                <a
                  href="/forgot-password"
                  className="block w-full rounded-xl bg-sky-500 px-6 py-3.5 text-center text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-600"
                >
                  Request a new link
                </a>
                <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  <a href="/login" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
                    ← Back to log in
                  </a>
                </p>
              </>
            ) : status === "done" ? (
              <>
                <h1 className="text-center text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
                  Password reset!
                </h1>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
                  Your password has been updated successfully.
                </p>
                <a
                  href="/login"
                  className="block w-full rounded-xl bg-sky-500 px-6 py-3.5 text-center text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-600"
                >
                  Log in with your new password
                </a>
              </>
            ) : (
              <>
                <h1 className="text-center text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
                  Set a new password
                </h1>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
                  Choose a new password for your account.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="reset-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id="reset-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); if (status === "error") setStatus("idle"); }}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent border-none p-1 cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reset-confirm" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Confirm password
                    </label>
                    <input
                      id="reset-confirm"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (status === "error") setStatus("idle"); }}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {status === "error" && errorMsg && (
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
                        Resetting…
                      </span>
                    ) : (
                      "Reset Password"
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
