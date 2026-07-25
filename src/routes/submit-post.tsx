import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { submitBlogPost } from "~/db/blog";

export const Route = createFileRoute("/submit-post")({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Submit a Blog Post — SafePlate" },
      { name: "description", content: "Share your allergy-safe dining story with the SafePlate community." },
    ],
  }),
  component: SubmitPostPage,
});

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
          <a href="/" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
            Home
          </a>
          <a href="/search" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
            Search
          </a>
          <a href="/blog/safest-celiac-restaurants-2026" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">
            Blog
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
    <footer className="border-t border-slate-100 bg-[#FAFAF9] py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-base">
            🍽️
          </span>
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
            SafePlate
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          <a href="/about" className="hover:text-sky-600 transition-colors">About</a>
          <a href="/blog/safest-celiac-restaurants-2026" className="hover:text-sky-600 transition-colors">Blog</a>
          <a href="/submit-post" className="hover:text-sky-600 transition-colors">Submit a Post</a>
          <a href="/faq" className="hover:text-sky-600 transition-colors">FAQ</a>
          <a href="/pricing" className="hover:text-sky-600 transition-colors">Pricing</a>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} SafePlate.
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                    */
/* ------------------------------------------------------------------ */

function SubmitPostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim() || !authorName.trim() || !authorEmail.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitBlogPost({
        data: {
          title: title.trim(),
          content: content.trim(),
          author_name: authorName.trim(),
          author_email: authorEmail.trim(),
        },
      });

      if (result.success) {
        setSubmitted(true);
        setTitle("");
        setContent("");
        setAuthorName("");
        setAuthorEmail("");
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
        <NavBar />
        <main className="flex flex-1 items-center justify-center">
          <div className="mx-auto max-w-lg px-6 py-32 text-center">
            <span className="text-5xl">🎉</span>
            <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
              Thanks! Your post has been submitted for review.
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              We'll review your submission and publish it if it meets our guidelines. You'll be notified at the email you provided.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/submit-post"
                className="rounded-xl border border-sky-200 bg-sky-50 px-6 py-2.5 text-sm font-semibold text-sky-600 shadow-sm transition-all hover:bg-sky-100 active:scale-95"
                onClick={(e) => {
                  e.preventDefault();
                  setSubmitted(false);
                }}
              >
                Submit Another
              </a>
              <a
                href="/blog/safest-celiac-restaurants-2026"
                className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95"
              >
                Read Our Blog
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main className="flex flex-1 items-start justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <div className="mb-10 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-2xl dark:bg-sky-900/50">
              ✍️
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Submit a Blog Post
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Share your allergy-safe dining experience, tips, or story with the SafePlate community.
              All submissions are reviewed before publication.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                ❌ {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How I Found the Best Gluten-Free Pizza in Austin"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  maxLength={200}
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your blog post here. Share your story, tips, or recommendations..."
                  rows={12}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 resize-y dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  required
                />
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  Pro tip: Mention specific restaurants, cities, and dishes to help fellow diners.
                </p>
              </div>

              {/* Author Name */}
              <div>
                <label
                  htmlFor="authorName"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Your Name
                </label>
                <input
                  id="authorName"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  maxLength={100}
                  required
                />
              </div>

              {/* Author Email */}
              <div>
                <label
                  htmlFor="authorEmail"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Your Email
                </label>
                <input
                  id="authorEmail"
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  maxLength={200}
                  required
                />
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  We'll only use this to notify you when your post is reviewed.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                    />
                  </svg>
                )}
                {submitting ? "Submitting…" : "Submit for Review"}
              </button>
              <a
                href="/blog/safest-celiac-restaurants-2026"
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
