import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Table creation (idempotent) ──────────────────────────────────────────────

async function createReviewsTable() {
  await sql()`create table if not exists reviews (
    id serial primary key,
    restaurant_id integer not null references restaurants(id) on delete cascade,
    user_email text not null,
    safety_rating integer not null check (safety_rating between 1 and 5),
    protocol_gloves boolean default false,
    protocol_dedicated_fryer boolean default false,
    protocol_allergen_menu boolean default false,
    protocol_manager_verified boolean default false,
    review_text text,
    wellness_safe boolean default false,
    created_at timestamptz default now()
  )`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReviewData {
  restaurant_id: number;
  user_email: string;
  safety_rating: number;
  protocol_gloves: boolean;
  protocol_dedicated_fryer: boolean;
  protocol_allergen_menu: boolean;
  protocol_manager_verified: boolean;
  review_text: string;
  wellness_safe: boolean;
}

export interface ReviewRow {
  id: number;
  restaurant_id: number;
  user_email: string;
  safety_rating: number;
  protocol_gloves: boolean;
  protocol_dedicated_fryer: boolean;
  protocol_allergen_menu: boolean;
  protocol_manager_verified: boolean;
  review_text: string | null;
  wellness_safe: boolean;
  created_at: string;
  // Joined from user_profiles
  user_allergens?: Record<string, number> | null;
}

// ── Server functions ─────────────────────────────────────────────────────────

export const submitReview = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: ReviewData }) => {
    const d = data;
    if (!d?.user_email?.trim()) {
      return { success: false, error: "Email is required to submit a review." };
    }
    if (!d?.restaurant_id || d.restaurant_id < 1) {
      return { success: false, error: "Invalid restaurant." };
    }
    if (!d?.safety_rating || d.safety_rating < 1 || d.safety_rating > 5) {
      return { success: false, error: "Please provide a safety rating (1-5)." };
    }

    await createReviewsTable();

    const email = d.user_email.trim().toLowerCase();

    await sql()`insert into reviews (
      restaurant_id, user_email, safety_rating,
      protocol_gloves, protocol_dedicated_fryer, protocol_allergen_menu,
      protocol_manager_verified, review_text, wellness_safe
    ) values (
      ${d.restaurant_id}, ${email}, ${d.safety_rating},
      ${d.protocol_gloves}, ${d.protocol_dedicated_fryer}, ${d.protocol_allergen_menu},
      ${d.protocol_manager_verified}, ${d.review_text?.trim() || null}, ${d.wellness_safe}
    )`;

    return { success: true };
  },
);

export const getReviewsForRestaurant = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { restaurant_id: number } }) => {
    if (!data?.restaurant_id || data.restaurant_id < 1) return [];

    await createReviewsTable();

    const rows = await sql().query(
      `select r.*, up.allergens as user_allergens
       from reviews r
       left join user_profiles up on lower(up.email) = lower(r.user_email)
       where r.restaurant_id = $1
       order by r.created_at desc
       limit 20`,
      [data.restaurant_id],
    );

    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as number,
      restaurant_id: r.restaurant_id as number,
      user_email: r.user_email as string,
      safety_rating: r.safety_rating as number,
      protocol_gloves: r.protocol_gloves as boolean,
      protocol_dedicated_fryer: r.protocol_dedicated_fryer as boolean,
      protocol_allergen_menu: r.protocol_allergen_menu as boolean,
      protocol_manager_verified: r.protocol_manager_verified as boolean,
      review_text: r.review_text as string | null,
      wellness_safe: r.wellness_safe as boolean,
      created_at: String(r.created_at),
      user_allergens: r.user_allergens as Record<string, number> | null,
    }));
  },
);

// Get all reviews across restaurants (for search page loading)
export const getAllReviews = createServerFn({ method: "GET" }).handler(
  async () => {
    await createReviewsTable();

    const rows = await sql().query(
      `select r.*, up.allergens as user_allergens
       from reviews r
       left join user_profiles up on lower(up.email) = lower(r.user_email)
       order by r.created_at desc
       limit 200`,
    );

    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as number,
      restaurant_id: r.restaurant_id as number,
      user_email: r.user_email as string,
      safety_rating: r.safety_rating as number,
      protocol_gloves: r.protocol_gloves as boolean,
      protocol_dedicated_fryer: r.protocol_dedicated_fryer as boolean,
      protocol_allergen_menu: r.protocol_allergen_menu as boolean,
      protocol_manager_verified: r.protocol_manager_verified as boolean,
      review_text: r.review_text as string | null,
      wellness_safe: r.wellness_safe as boolean,
      created_at: String(r.created_at),
      user_allergens: r.user_allergens as Record<string, number> | null,
    }));
  },
);

// ── Diner Reviews (restaurant_reviews table) ───────────────────────────────────

export interface DinerReviewData {
  restaurant_id: number;
  rating: number;
  review_text: string;
  reviewer_name: string;
  reviewer_email?: string;
}

export interface DinerReviewRow {
  id: number;
  restaurant_id: number;
  rating: number;
  review_text: string | null;
  reviewer_name: string;
  reviewer_email: string | null;
  created_at: string;
  is_verified: boolean;
}

/** Submit a diner review with star rating */
export const submitDinerReview = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: DinerReviewData }) => {
    const d = data;
    if (!d?.reviewer_name?.trim()) {
      return { success: false, error: "Name is required." };
    }
    if (!d?.restaurant_id || d.restaurant_id < 1) {
      return { success: false, error: "Invalid restaurant." };
    }
    if (!d?.rating || d.rating < 1 || d.rating > 5) {
      return { success: false, error: "Please provide a rating (1-5)." };
    }

    await sql()`create table if not exists restaurant_reviews (
      id serial primary key,
      restaurant_id integer not null references restaurants(id) on delete cascade,
      rating integer not null check (rating >= 1 and rating <= 5),
      review_text text,
      reviewer_name text not null,
      reviewer_email text,
      created_at timestamptz default now()
    )`;

    await sql()`insert into restaurant_reviews (
      restaurant_id, rating, review_text, reviewer_name, reviewer_email
    ) values (
      ${d.restaurant_id}, ${d.rating}, ${d.review_text?.trim() || null},
      ${d.reviewer_name.trim()}, ${d.reviewer_email?.trim().toLowerCase() || null}
    )`;

    return { success: true };
  },
);

/** Get diner reviews for a restaurant, with average rating */
export const getDinerReviews = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { restaurant_id: number } }) => {
    if (!data?.restaurant_id || data.restaurant_id < 1) return { reviews: [], average: 0, count: 0 };

    await sql()`create table if not exists restaurant_reviews (
      id serial primary key,
      restaurant_id integer not null references restaurants(id) on delete cascade,
      rating integer not null check (rating >= 1 and rating <= 5),
      review_text text,
      reviewer_name text not null,
      reviewer_email text,
      created_at timestamptz default now()
    )`;
    await sql()`create table if not exists subscribers (
      id serial primary key,
      name text not null,
      email text not null unique,
      created_at timestamptz default now()
    )`;

    const rows = await sql()`
      select rr.*, (s.email is not null) as is_verified
      from restaurant_reviews rr
      left join subscribers s on lower(s.email) = lower(rr.reviewer_email)
      where rr.restaurant_id = ${data.restaurant_id}
      order by rr.created_at desc
      limit 20
    `;

    const reviews = rows.map((r: Record<string, unknown>) => ({
      id: r.id as number,
      restaurant_id: r.restaurant_id as number,
      rating: r.rating as number,
      review_text: r.review_text as string | null,
      reviewer_name: r.reviewer_name as string,
      reviewer_email: r.reviewer_email as string | null,
      created_at: String(r.created_at),
      is_verified: Boolean(r.is_verified),
    }));

    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      return { reviews, average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
    }
    return { reviews: [] as DinerReviewRow[], average: 0, count: 0 };
  },
);

/** Get all diner reviews (for search page), with averages per restaurant */
export const getAllDinerReviews = createServerFn({ method: "GET" }).handler(
  async () => {
    await sql()`create table if not exists restaurant_reviews (
      id serial primary key,
      restaurant_id integer not null references restaurants(id) on delete cascade,
      rating integer not null check (rating >= 1 and rating <= 5),
      review_text text,
      reviewer_name text not null,
      reviewer_email text,
      created_at timestamptz default now()
    )`;
    await sql()`create table if not exists subscribers (
      id serial primary key,
      name text not null,
      email text not null unique,
      created_at timestamptz default now()
    )`;

    const rows = await sql()`
      select rr.*, (s.email is not null) as is_verified
      from restaurant_reviews rr
      left join subscribers s on lower(s.email) = lower(rr.reviewer_email)
      order by rr.created_at desc
      limit 500
    `;

    const reviews = rows.map((r: Record<string, unknown>) => ({
      id: r.id as number,
      restaurant_id: r.restaurant_id as number,
      rating: r.rating as number,
      review_text: r.review_text as string | null,
      reviewer_name: r.reviewer_name as string,
      reviewer_email: r.reviewer_email as string | null,
      created_at: String(r.created_at),
      is_verified: Boolean(r.is_verified),
    }));

    const avgMap = new Map<number, { sum: number; count: number }>();
    for (const r of reviews) {
      const entry = avgMap.get(r.restaurant_id) || { sum: 0, count: 0 };
      entry.sum += r.rating;
      entry.count += 1;
      avgMap.set(r.restaurant_id, entry);
    }

    const averages: Record<number, { average: number; count: number }> = {};
    for (const [id, { sum, count }] of avgMap) {
      averages[id] = { average: Math.round((sum / count) * 10) / 10, count };
    }

    return { reviews, averages };
  },
);

/** Check if a reviewer email matches a subscriber (for verified diner badge) */
export const checkVerifiedDiner = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { email: string } }) => {
    const email = data?.email?.trim().toLowerCase();
    if (!email) return { verified: false };

    await sql()`create table if not exists subscribers (
      id serial primary key,
      name text not null,
      email text not null unique,
      created_at timestamptz default now()
    )`;

    const rows = await sql()`select 1 from subscribers where lower(email) = ${email} limit 1`;
    return { verified: rows.length > 0 };
  },
);
