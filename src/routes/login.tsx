import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from "react";
import { getSessionToken, setSessionCookie, setCachedUser, clearSession, clearCachedUser } from "~/session";
import { ThemeToggle } from "~/components/ThemeToggle";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Log In — SafePlate" }],
  }),
  component: LoginPage,
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
/*  Session token validation                                          */
/* ------------------------------------------------------------------ */

// JWT format: header.body.signature (all base64url-encoded).
// The body contains { userId, email, role, iat, exp }.
function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// Returns true only when the token is structurally valid and not expired.
// exp (seconds, *1000 -> ms) takes precedence; tokens without exp fall back
// to the same 7-day iat age check the server's verifyToken uses.
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
    const nowSec = Date.now() / 1000;
    if (typeof payload.exp === "number" && nowSec > payload.exp) return false;
    if (typeof payload.iat === "number" && nowSec - payload.iat > 60 * 60 * 24 * 7) return false;
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Login Form                                                        */
/* ------------------------------------------------------------------ */

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showForgotEmailHelp, setShowForgotEmailHelp] = useState(false);

  // Only redirect if there is a valid, non-expired session token.
  // Cached user data is unreliable (can be stale) — never redirect based on it.
  useEffect(() => {
    const token = getSessionToken();
    if (token && isTokenValid(token)) {
      window.location.href = "/profile";
      return;
    }
    // Token is missing, stale, or expired — clear it and stay on the login form
    // so the user can actually log in again.
    if (token) {
      console.info("[SafePlate login] stale or expired session token found — clearing it");
    }
    clearSession();
    clearCachedUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    // Always prevent the browser's native form navigation, including if this
    // handler runs before hydration has fully settled.
    e.preventDefault();
    console.info("[SafePlate login] submitting", { email: email.trim() });
    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      setStatus("error");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      console.info("[SafePlate login] API response", { status: response.status, ok: response.ok });
      const result = await response.json();
      if (result.success && result.token) {
        setSessionCookie(result.token, rememberMe);
        if (result.user) setCachedUser(result.user);

        // Persist email for premium feature detection across pages
        localStorage.setItem("safeplate_email", email.trim());

        const user = result.user;

        // Use hard redirect instead of router navigate for reliability
        if (user?.role === "admin") {
          window.location.href = "/admin/restaurants";
        } else if (user?.role === "restaurant_owner") {
          window.location.href = "/dashboard";
        } else {
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get("redirect");
          window.location.href = redirect || "/profile";
        }
      } else {
        setErrorMsg(result.error ?? "Invalid email or password.");
        setStatus("error");
      }
    } catch (error) {
      console.error("[SafePlate login] request failed", error);
      const message = error instanceof Error ? error.message : String(error);
      setErrorMsg(`Login request failed: ${message}`);
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

            <h1 className="text-center text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
              Welcome back
            </h1>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-8">
              Log in to your SafePlate account
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (status === "error") setStatus("idle"); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
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

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer dark:border-slate-600"
                  />
                  <label htmlFor="login-remember" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    Keep me logged in
                  </label>
                </div>
                <a href="/forgot-password" className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
                  Forgot password?
                </a>
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
                    Logging in…
                  </span>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{" "}
              <a href="/signup" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
                Sign up
              </a>
            </p>

            <p className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowForgotEmailHelp(!showForgotEmailHelp)}
                className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
              >
                Forgot your email?
              </button>
            </p>

            {showForgotEmailHelp && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                Check your inbox for previous emails from SafePlate (<span className="font-medium">hello@safeplate.company</span>). If you still can&rsquo;t find your account, contact us at{" "}
                <a href="mailto:hello@safeplate.company" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
                  hello@safeplate.company
                </a>.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
