import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import React, { type ReactNode } from "react";

import appCss from "~/styles/app.css?url";
import { ThemeToggle } from "~/components/ThemeToggle";

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "SafePlate";
  } catch {
    return "SafePlate";
  }
});

export const Route = createRootRoute({
  loader: () => getBusinessName(),
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${loaderData} — Allergy-Safe Restaurant Finder | Gluten-Free, Dairy-Free & More` },
      {
        name: "description",
        content:
          "SafePlate helps people with food allergies and dietary restrictions find safe dishes, ingredients, and restaurants. Dine with confidence, anywhere.",
      },
      // Open Graph
      { property: "og:title", content: `${loaderData} — Allergy-Safe Restaurant Finder | Gluten-Free, Dairy-Free & More` },
      {
        property: "og:description",
        content:
          "SafePlate helps people with food allergies and dietary restrictions find safe dishes, ingredients, and restaurants. Dine with confidence, anywhere.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://safeplate.company" },
      { property: "og:image", content: "https://safeplate.company/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${loaderData} — Allergy-Safe Restaurant Finder | Gluten-Free, Dairy-Free & More` },
      {
        name: "twitter:description",
        content:
          "SafePlate helps people with food allergies and dietary restrictions find safe dishes, ingredients, and restaurants. Dine with confidence, anywhere.",
      },
      { name: "twitter:image", content: "https://safeplate.company/og-image.svg" },
      { name: "google-site-verification", content: "C13iP27c1rwbEJYjus9dmBvCIV7h0tdF7pBbZLTjEA0" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  // Fire-and-forget: trigger drip processing on every page load
  React.useEffect(() => {
    import("~/db/drips").then(
      ({ processDrips }) => {
        processDrips().catch(() => {});
      },
      () => {},
    );
  }, []);

  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const themeScript = `
    (function() {
      var theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    })();
  `;

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FBHDF5SZ1R"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-FBHDF5SZ1R');
        `}} />
      </head>
      <body className="bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
        {children}
        <div className="fixed bottom-5 right-5 z-[100]">
          <span className="inline-flex items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm dark:bg-slate-800/90 border border-slate-200 dark:border-slate-600">
            <ThemeToggle />
          </span>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
