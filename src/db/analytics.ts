import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  totalRestaurants: number;
  totalSubscribers: number;
  totalEmailsSent: number;
  totalReviews: number;
  activeDrips: number;
}

export interface CityRow {
  city: string;
  total: number;
  tier1: number;
  tier2: number;
  tier3: number;
}

export interface SignupRow {
  name: string;
  email: string;
  created_at: string;
  selected_allergens: string[] | null;
}

export interface EmailRow {
  id: number;
  restaurant_name: string;
  restaurant_city: string;
  recipient_email: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
}

export interface RecentReviewRow {
  id: number;
  restaurant_name: string;
  rating: number;
  reviewer_name: string;
  created_at: string;
}

// ── Server Functions ─────────────────────────────────────────────────────────

export const getAnalyticsOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<AnalyticsOverview> => {
    try {
      // Ensure tables exist
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
      await sql()`create table if not exists subscribers (
        id serial primary key,
        name text not null,
        email text not null unique,
        created_at timestamptz default now()
      )`;
      await sql()`alter table subscribers add column if not exists selected_allergens text[]`;
      await sql()`create table if not exists email_tracking (
        id serial primary key,
        restaurant_id integer not null references restaurants(id),
        sent_at timestamptz default now(),
        opened_at timestamptz,
        clicked_at timestamptz,
        recipient_email text not null
      )`;
      await sql()`create table if not exists restaurant_reviews (
        id serial primary key,
        restaurant_id integer not null references restaurants(id) on delete cascade,
        rating integer not null check (rating >= 1 and rating <= 5),
        review_text text,
        reviewer_name text not null,
        reviewer_email text,
        created_at timestamptz default now()
      )`;
      await sql()`create table if not exists email_drips (
        id serial primary key,
        restaurant_id integer not null references restaurants(id),
        recipient_email text not null,
        template_used text not null,
        drip_stage integer default 1,
        sent_at timestamptz default now(),
        next_drip_at timestamptz
      )`;

      const [[cr], [cs], [ce], [crv], [cd]] = await Promise.all([
        sql()`select count(*)::int as cnt from restaurants`,
        sql()`select count(*)::int as cnt from subscribers`,
        sql()`select count(*)::int as cnt from email_tracking`,
        sql()`select count(*)::int as cnt from restaurant_reviews`,
        sql()`select count(*)::int as cnt from email_drips where drip_stage < 3`,
      ]);

      return {
        totalRestaurants: (cr as { cnt: number }).cnt,
        totalSubscribers: (cs as { cnt: number }).cnt,
        totalEmailsSent: (ce as { cnt: number }).cnt,
        totalReviews: (crv as { cnt: number }).cnt,
        activeDrips: (cd as { cnt: number }).cnt,
      };
    } catch {
      return {
        totalRestaurants: 0,
        totalSubscribers: 0,
        totalEmailsSent: 0,
        totalReviews: 0,
        activeDrips: 0,
      };
    }
  },
);

export const getTopCities = createServerFn({ method: "GET" }).handler(
  async (): Promise<CityRow[]> => {
    try {
      const rows = await sql()`
        select
          city,
          count(*)::int as total,
          count(case when safety_tier = 1 then 1 end)::int as tier1,
          count(case when safety_tier = 2 then 1 end)::int as tier2,
          count(case when safety_tier = 3 then 1 end)::int as tier3
        from restaurants
        group by city
        order by total desc
      `;
      return rows.map((r: Record<string, unknown>) => ({
        city: r.city as string,
        total: r.total as number,
        tier1: r.tier1 as number,
        tier2: r.tier2 as number,
        tier3: r.tier3 as number,
      }));
    } catch {
      return [];
    }
  },
);

export const getRecentSignups = createServerFn({ method: "GET" }).handler(
  async (): Promise<SignupRow[]> => {
    try {
      await sql()`create table if not exists subscribers (
        id serial primary key,
        name text not null,
        email text not null unique,
        created_at timestamptz default now()
      )`;
      await sql()`alter table subscribers add column if not exists selected_allergens text[]`;
      const rows = await sql()`
        select name, email, created_at, selected_allergens
        from subscribers
        order by created_at desc
        limit 10
      `;
      return rows.map((r: Record<string, unknown>) => ({
        name: r.name as string,
        email: r.email as string,
        created_at: String(r.created_at),
        selected_allergens: r.selected_allergens as string[] | null,
      }));
    } catch {
      return [];
    }
  },
);

export const getRecentEmails = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmailRow[]> => {
    try {
      await sql()`create table if not exists email_tracking (
        id serial primary key,
        restaurant_id integer not null references restaurants(id),
        sent_at timestamptz default now(),
        opened_at timestamptz,
        clicked_at timestamptz,
        recipient_email text not null
      )`;
      const rows = await sql()`
        select
          et.id,
          r.name as restaurant_name,
          r.city as restaurant_city,
          et.recipient_email,
          et.sent_at,
          et.opened_at,
          et.clicked_at
        from email_tracking et
        join restaurants r on r.id = et.restaurant_id
        order by et.sent_at desc
        limit 10
      `;
      return rows.map((r: Record<string, unknown>) => ({
        id: r.id as number,
        restaurant_name: r.restaurant_name as string,
        restaurant_city: r.restaurant_city as string,
        recipient_email: r.recipient_email as string,
        sent_at: String(r.sent_at),
        opened_at: r.opened_at ? String(r.opened_at) : null,
        clicked_at: r.clicked_at ? String(r.clicked_at) : null,
      }));
    } catch {
      return [];
    }
  },
);

export const getRecentReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<RecentReviewRow[]> => {
    try {
      await sql()`create table if not exists restaurant_reviews (
        id serial primary key,
        restaurant_id integer not null references restaurants(id) on delete cascade,
        rating integer not null check (rating >= 1 and rating <= 5),
        review_text text,
        reviewer_name text not null,
        reviewer_email text,
        created_at timestamptz default now()
      )`;
      const rows = await sql()`
        select
          rr.id,
          r.name as restaurant_name,
          rr.rating,
          rr.reviewer_name,
          rr.created_at
        from restaurant_reviews rr
        join restaurants r on r.id = rr.restaurant_id
        order by rr.created_at desc
        limit 10
      `;
      return rows.map((r: Record<string, unknown>) => ({
        id: r.id as number,
        restaurant_name: r.restaurant_name as string,
        rating: r.rating as number,
        reviewer_name: r.reviewer_name as string,
        created_at: String(r.created_at),
      }));
    } catch {
      return [];
    }
  },
);
