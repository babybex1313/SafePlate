import { useState, type FormEvent } from "react";
import { signupSubscriber } from "~/db";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side validation (first pass)
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await signupSubscriber({ data: { name, email } });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-8 w-8 text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800">You&apos;re on the list!</h3>
        <p className="mt-2 text-slate-600">
          Thanks, {name.trim()}. We&apos;ll let you know as soon as SafePlate launches.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      noValidate
    >
      <div className="mb-5">
        <label
          htmlFor="signup-name"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="signup-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
      </div>
      <div className="mb-6">
        <label
          htmlFor="signup-email"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
      </div>
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-xl bg-sky-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving…" : "Notify Me"}
      </button>
      <p className="mt-4 text-center text-xs text-slate-400">
        We&apos;ll never share your information. Unsubscribe anytime.
      </p>
    </form>
  );
}
