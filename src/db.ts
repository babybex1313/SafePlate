import { createServerFn } from "@tanstack/react-start";
import { neon } from "@neondatabase/serverless";

/**
 * Server-only handle to the team's database (Neon serverless Postgres over HTTP).
 * The connection string comes from `DATABASE_URL`, which the owner connects via
 * the database card and which is injected into the sandbox and passed to the live
 * host on publish. Resolved lazily (per call, not at module load) so the site
 * still builds and serves before a database is connected — the error only
 * surfaces if a query actually runs without `DATABASE_URL`.
 *
 * Use it only inside a `createServerFn()` handler or an `src/routes/api/*` route
 * (never client code):
 *
 *   const getPosts = createServerFn().handler(async () => {
 *     const rows = await sql()`select id, title, created_at from posts`;
 *     // Coerce non-primitive columns (timestamps are JS Dates) to strings before
 *     // returning to the client, or React will refuse to render them:
 *     return rows.map((r) => ({ ...r, created_at: String(r.created_at) }));
 *   });
 */
export const sql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — connect a database (via the database card) before running queries.",
    );
  }
  return neon(url);
};

/**
 * Server function: subscribes a user to the SafePlate waitlist.
 * Client-side validation should run first; this is the final guard and DB insert.
 */
export const signupSubscriber = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: unknown }) => {
    const { name, email, selected_allergens } = (data ?? {}) as {
      name?: string;
      email?: string;
      selected_allergens?: string[];
    };

    // Validate
    if (!name?.trim()) {
      return { success: false, error: "Please enter your name." };
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Ensure the table exists
    await sql()`create table if not exists subscribers (
      id serial primary key,
      name text not null,
      email text not null unique,
      created_at timestamptz default now()
    )`;

    // Add selected_allergens column if it doesn't exist
    await sql()`alter table subscribers add column if not exists selected_allergens text[]`;

    // Insert — unique violation means they're already subscribed
    try {
      await sql()`insert into subscribers (name, email, selected_allergens) values (${trimmedName}, ${normalizedEmail}, ${selected_allergens ?? null})`;

      // Fire-and-forget welcome email — dynamic import so failures never break signups
      import("./email").then(
        ({ sendWelcomeEmail }) => sendWelcomeEmail({ name: trimmedName, email: normalizedEmail }),
        () => {},
      );

      return { success: true };
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === "23505") {
        return { success: false, error: "You're already on the list!" };
      }
      throw err;
    }
  },
);

/**
 * Server function: returns the total subscriber count.
 */
export const getSubscriberCount = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await sql()`create table if not exists subscribers (
      id serial primary key,
      name text not null,
      email text not null unique,
      created_at timestamptz default now()
    )`;
    const rows = await sql()`select count(*)::int as cnt from subscribers`;
    return { count: rows[0].cnt };
  } catch {
    return { count: 0 };
  }
});

/**
 * Server function: returns total restaurant count and distinct city count.
 */
export const getRestaurantAndCityCounts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await sql()`create table if not exists restaurants (
      id serial primary key,
      name text not null,
      address text not null,
      city text not null default 'Austin',
      state text not null default 'TX',
      cuisine_type text,
      safety_tier integer not null check (safety_tier in (1, 2, 3)),
      has_dedicated_fryer boolean default false,
      has_isolated_prep boolean default false,
      allergen_trained_staff boolean default false,
      free_from text[],
      allergens_handled text[],
      description text,
      website text,
      phone text,
      image_url text,
      verified boolean default false,
      featured_until timestamptz,
      created_at timestamptz default now()
    )`;
    const [restaurantRows, cityRows] = await Promise.all([
      sql()`select count(*)::int as cnt from restaurants`,
      sql()`select count(distinct city)::int as cnt from restaurants`,
    ]);
    return {
      restaurantCount: restaurantRows[0].cnt,
      cityCount: cityRows[0].cnt,
    };
  } catch {
    return { restaurantCount: 0, cityCount: 0 };
  }
});
