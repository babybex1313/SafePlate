import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Table creation (idempotent) ──────────────────────────────────────────────

async function createUserProfilesTable() {
  await sql()`create table if not exists user_profiles (
    id serial primary key,
    email text not null unique,
    allergens jsonb not null default '{}'::jsonb,
    premium_until timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  )`;
}

async function createSavedRestaurantsTable() {
  await sql()`create table if not exists saved_restaurants (
    id serial primary key,
    user_email text not null,
    restaurant_id integer not null references restaurants(id),
    created_at timestamptz default now(),
    unique(user_email, restaurant_id)
  )`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AllergenProfile {
  Gluten: number;    // 1=Preference, 2=Severe Allergy, 3=Celiac/Anaphylactic
  Dairy: number;
  Peanuts: number;
  "Tree Nuts": number;
  Shellfish: number;
  Soy: number;
  Eggs: number;
}

// ── Server functions ─────────────────────────────────────────────────────────

export const getProfile = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { email: string } }) => {
    const email = data?.email?.trim().toLowerCase();
    if (!email) return null;

    await createUserProfilesTable();

    const rows = await sql()`select * from user_profiles where email = ${email}`;
    if (rows.length === 0) return null;

    const r = rows[0] as Record<string, unknown>;
    return {
      id: r.id as number,
      email: r.email as string,
      allergens: r.allergens as AllergenProfile,
      premium_until: r.premium_until ? String(r.premium_until) : null,
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
    };
  },
);

export const saveProfile = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { email: string; allergens: AllergenProfile };
  }) => {
    const email = data?.email?.trim().toLowerCase();
    if (!email) return { success: false, error: "Email is required." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    await createUserProfilesTable();

    const allergensJson = JSON.stringify(data.allergens ?? {});

    await sql()`insert into user_profiles (email, allergens, updated_at)
      values (${email}, ${allergensJson}::jsonb, now())
      on conflict (email) do update set
        allergens = excluded.allergens,
        updated_at = now()`;

    return { success: true };
  },
);

// ── Premium profile ──────────────────────────────────────────────────────────

export const claimPremium = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string } }) => {
    const email = data?.email?.trim().toLowerCase();
    if (!email) return { success: false, error: "Email is required." };

    await createUserProfilesTable();

    // Set premium_until 30 days from now
    await sql()`insert into user_profiles (email, allergens, premium_until, updated_at)
      values (${email}, '{}'::jsonb, now() + interval '30 days', now())
      on conflict (email) do update set
        premium_until = now() + interval '30 days',
        updated_at = now()`;

    return { success: true };
  },
);

// ── Saved restaurants (premium feature) ──────────────────────────────────────

export const saveRestaurant = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { userEmail: string; restaurantId: number };
  }) => {
    const { userEmail, restaurantId } = data;
    if (!userEmail?.trim()) return { success: false, error: "Email is required." };
    if (!restaurantId) return { success: false, error: "Restaurant ID is required." };

    await createSavedRestaurantsTable();

    await sql()`insert into saved_restaurants (user_email, restaurant_id)
      values (${userEmail.trim().toLowerCase()}, ${restaurantId})
      on conflict (user_email, restaurant_id) do nothing`;

    return { success: true };
  },
);

export const unsaveRestaurant = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { userEmail: string; restaurantId: number };
  }) => {
    const { userEmail, restaurantId } = data;
    if (!userEmail?.trim()) return { success: false, error: "Email is required." };
    if (!restaurantId) return { success: false, error: "Restaurant ID is required." };

    await createSavedRestaurantsTable();

    await sql()`delete from saved_restaurants
      where user_email = ${userEmail.trim().toLowerCase()}
      and restaurant_id = ${restaurantId}`;

    return { success: true };
  },
);

export const getSavedRestaurants = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { userEmail: string } }) => {
    const email = data?.userEmail?.trim().toLowerCase();
    if (!email) return [];

    await createSavedRestaurantsTable();

    const rows = await sql()`
      select r.*, sr.created_at as saved_at
      from saved_restaurants sr
      join restaurants r on r.id = sr.restaurant_id
      where sr.user_email = ${email}
      order by sr.created_at desc
    `;

    return rows.map((r: Record<string, unknown>) => ({
      ...r,
      created_at: String(r.created_at),
      featured_until: r.featured_until ? String(r.featured_until) : null,
      saved_at: String(r.saved_at),
    }));
  },
);

export const isRestaurantSaved = createServerFn({ method: "GET" }).handler(
  async ({
    data,
  }: {
    data: { userEmail: string; restaurantIds: number[] };
  }) => {
    const email = data?.userEmail?.trim().toLowerCase();
    if (!email || !data.restaurantIds?.length) return [] as number[];

    await createSavedRestaurantsTable();

    const rows = await sql()`
      select restaurant_id from saved_restaurants
      where user_email = ${email}
      and restaurant_id = any(${data.restaurantIds}::int[])
    `;

    return rows.map((r: Record<string, unknown>) => r.restaurant_id as number);
  },
);

// ── Premium status check ────────────────────────────────────────────────────

export async function isPremium(email: string): Promise<boolean> {
  const rows = await sql()`select premium_until from user_profiles where email = ${email} and premium_until > now()`;
  return rows.length > 0;
}

// ── Saved routes (premium feature) ──────────────────────────────────────────

async function createSavedRoutesTable() {
  await sql()`create table if not exists saved_routes (
    id serial primary key,
    user_email text not null,
    origin text not null,
    destination text not null,
    created_at timestamptz default now()
  )`;
}

export const saveRoute = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { userEmail: string; origin: string; destination: string };
  }) => {
    const { userEmail, origin, destination } = data;
    if (!userEmail?.trim()) return { success: false, error: "Email is required." };
    if (!origin?.trim() || !destination?.trim()) return { success: false, error: "Origin and destination are required." };

    await createSavedRoutesTable();

    await sql()`insert into saved_routes (user_email, origin, destination)
      values (${userEmail.trim().toLowerCase()}, ${origin.trim()}, ${destination.trim()})`;

    return { success: true };
  },
);

export const getSavedRoutes = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { userEmail: string } }) => {
    const email = data?.userEmail?.trim().toLowerCase();
    if (!email) return [];

    await createSavedRoutesTable();

    const rows = await sql()`
      select id, origin, destination, created_at
      from saved_routes
      where user_email = ${email}
      order by created_at desc
    `;

    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as number,
      origin: r.origin as string,
      destination: r.destination as string,
      created_at: String(r.created_at),
    }));
  },
);

export const deleteSavedRoute = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { userEmail: string; routeId: number } }) => {
    const { userEmail, routeId } = data;
    if (!userEmail?.trim() || !routeId) return { success: false, error: "Email and route ID are required." };

    await createSavedRoutesTable();

    await sql()`delete from saved_routes
      where user_email = ${userEmail.trim().toLowerCase()}
      and id = ${routeId}`;

    return { success: true };
  },
);
