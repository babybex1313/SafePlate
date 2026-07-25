import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import bcrypt from "bcryptjs";

const AUTH_SECRET = process.env.AUTH_SECRET || "safeplate-dev-secret-change-in-production";

// ── Table: kitchen_audits ─────────────────────────────────────────────────────

async function createKitchenAuditsTable() {
  await sql()`create table if not exists kitchen_audits (
    id serial primary key,
    user_id integer not null,
    answers jsonb not null default '{}'::jsonb,
    safety_score integer not null default 0,
    tier integer not null default 3,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  )`;
  // Migration: add columns if missing
  await sql()`alter table kitchen_audits add column if not exists updated_at timestamptz default now()`;
}

// ── Table: business_leads ──────────────────────────────────────────────────────

async function createBusinessLeadsTable() {
  await sql()`create table if not exists business_leads (
    id serial primary key,
    user_id integer not null,
    restaurant_name text not null,
    restaurant_id integer,
    owner_email text not null,
    city text,
    safety_score integer not null default 0,
    tier integer not null default 3,
    completed_at timestamptz default now(),
    contacted boolean default false
  )`;
  await sql()`alter table business_leads add column if not exists restaurant_id integer`;
  await sql()`alter table business_leads add column if not exists contacted boolean default false`;
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

function base64urlEncode(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64urlEncode(String.fromCharCode(...new Uint8Array(sig)));
}

async function createToken(payload: Record<string, unknown>): Promise<string> {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const signature = await hmacSign(`${header}.${body}`, AUTH_SECRET);
  return `${header}.${body}.${signature}`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuditAnswers {
  // Step 1: Gluten & Celiac Safety
  dedicated_gf_fryer: boolean;
  gf_separate_surfaces: boolean;
  gf_separate_utensils: boolean;
  gf_separate_water: boolean;
  // Step 2: Prep & Storage
  labeled_sealed_containers: boolean;
  color_coded_boards: boolean;
  flagged_on_tickets: boolean;
  // Step 3: Staff Training
  certified_allergy_training: boolean;
  foh_allergen_trained: boolean;
  manager_allergen_orders: boolean;
}

export interface AuditResult {
  id: number;
  user_id: number;
  answers: AuditAnswers;
  safety_score: number;
  tier: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── Score Calculation ─────────────────────────────────────────────────────────

function calculateTier(answers: AuditAnswers): { score: number; tier: number } {
  const yesCount = [
    answers.dedicated_gf_fryer,
    answers.gf_separate_surfaces,
    answers.gf_separate_utensils,
    answers.gf_separate_water,
    answers.labeled_sealed_containers,
    answers.color_coded_boards,
    answers.flagged_on_tickets,
    answers.certified_allergy_training,
    answers.foh_allergen_trained,
    answers.manager_allergen_orders,
  ].filter(Boolean).length;

  let tier: number;
  if (yesCount >= 8) {
    tier = 1; // Green / Excellent
  } else if (yesCount >= 5) {
    tier = 2; // Amber / Good
  } else {
    tier = 3; // Blue / Basic
  }

  return { score: yesCount, tier };
}

// ── Helper: ensure users table exists ─────────────────────────────────────────

async function createUsersTable() {
  await sql()`create table if not exists users (
    id serial primary key,
    email text not null unique,
    name text not null,
    password_hash text not null,
    role text default 'diner',
    premium_until timestamptz,
    selected_allergens text[],
    created_at timestamptz default now()
  )`;
}

// ── Helper: ensure restaurants table exists ───────────────────────────────────

async function createRestaurantsTable() {
  await sql()`create table if not exists restaurants (
    id serial primary key,
    name text not null,
    address text not null default '',
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
}

// ── registerBusiness ──────────────────────────────────────────────────────────

/**
 * Registers a restaurant owner account AND creates an unverified restaurant entry.
 * One-step onboarding for the /business/register page.
 */
export const registerBusiness = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: {
      restaurantName: string;
      ownerName: string;
      email: string;
      password: string;
      phone?: string;
      city: string;
    };
  }) => {
    const { restaurantName, ownerName, email, password, phone, city } = data ?? {};

    // Validate
    const normalizedEmail = email?.trim().toLowerCase();
    if (!restaurantName?.trim()) return { success: false, error: "Please enter your restaurant name." };
    if (!ownerName?.trim()) return { success: false, error: "Please enter your name." };
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }
    if (!city?.trim()) return { success: false, error: "Please enter your city." };

    const trimmedRestaurant = restaurantName.trim();
    const trimmedOwner = ownerName.trim();
    const trimmedCity = city.trim();
    const trimmedPhone = phone?.trim() ?? null;

    // Create tables
    await createUsersTable();
    await createRestaurantsTable();
    await createBusinessLeadsTable();

    // Check for existing email
    const existing = await sql()`select id from users where email = ${normalizedEmail}`;
    if (existing.length > 0) {
      return { success: false, error: "An account with this email already exists. Please log in instead." };
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await sql()`insert into users (email, name, password_hash, role)
      values (${normalizedEmail}, ${trimmedOwner}, ${passwordHash}, 'restaurant_owner')
      returning id, email, name, role, premium_until, selected_allergens, created_at`;

    const user = userResult[0] as Record<string, unknown>;
    const userId = user.id as number;

    // Create unverified restaurant entry
    const restaurantResult = await sql()`
      insert into restaurants (name, address, city, state, phone, safety_tier, verified)
      values (${trimmedRestaurant}, '', ${trimmedCity}, 'TX', ${trimmedPhone}, 3, false)
      returning id
    `;
    const restaurantId = restaurantResult[0].id as number;

    // Create business lead
    await sql()`
      insert into business_leads (user_id, restaurant_name, restaurant_id, owner_email, city, safety_score, tier)
      values (${userId}, ${trimmedRestaurant}, ${restaurantId}, ${normalizedEmail}, ${trimmedCity}, 0, 3)
    `;

    // Generate JWT
    const token = await createToken({
      userId,
      email: normalizedEmail,
      role: "restaurant_owner",
    });

    return {
      success: true,
      token,
      restaurantId,
      user: {
        id: userId,
        email: normalizedEmail,
        name: trimmedOwner,
        role: "restaurant_owner",
        premium_until: null as string | null,
        selected_allergens: null as string[] | null,
      },
    };
  },
);

// ── Server Functions ──────────────────────────────────────────────────────────

/**
 * Submit a kitchen audit. Saves answers, calculates score and tier,
 * updates claimed restaurant's safety tier, and creates a business lead.
 */
export const submitAudit = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: {
      userId: number;
      userEmail: string;
      answers: AuditAnswers;
      restaurantName?: string;
      restaurantId?: number;
      city?: string;
    };
  }) => {
    const { userId, userEmail, answers, restaurantName, restaurantId, city } = data;

    if (!userId) return { success: false, error: "User ID is required." };
    if (!answers) return { success: false, error: "Audit answers are required." };

    await createKitchenAuditsTable();
    await createBusinessLeadsTable();

    const { score, tier } = calculateTier(answers);

    // Upsert: if user already has an audit, update it; otherwise insert
    const existing = await sql()`select id from kitchen_audits where user_id = ${userId} order by created_at desc limit 1`;

    let auditId: number;
    if (existing.length > 0) {
      await sql()`
        update kitchen_audits
        set answers = ${JSON.stringify(answers)}::jsonb,
            safety_score = ${score},
            tier = ${tier},
            status = 'pending',
            updated_at = now()
        where id = ${existing[0].id}
      `;
      auditId = existing[0].id as number;
    } else {
      const result = await sql()`
        insert into kitchen_audits (user_id, answers, safety_score, tier, status)
        values (${userId}, ${JSON.stringify(answers)}::jsonb, ${score}, ${tier}, 'pending')
        returning id
      `;
      auditId = result[0].id as number;
    }

    // If the user has a claimed restaurant, update its safety_tier
    if (restaurantId) {
      try {
        await createRestaurantsTable();

        await sql()`
          update restaurants
          set safety_tier = ${tier},
              has_dedicated_fryer = ${answers.dedicated_gf_fryer},
              has_isolated_prep = ${answers.gf_separate_surfaces},
              allergen_trained_staff = ${answers.certified_allergy_training}
          where id = ${restaurantId}
        `;
      } catch {
        // Restaurant update is best-effort; don't fail the audit
      }
    }

    // Create/update business lead
    try {
      const existingLead = await sql()`select id from business_leads where user_id = ${userId} limit 1`;
      if (existingLead.length > 0) {
        await sql()`
          update business_leads
          set safety_score = ${score},
              tier = ${tier},
              completed_at = now(),
              restaurant_name = coalesce(${restaurantName ?? null}, restaurant_name),
              restaurant_id = coalesce(${restaurantId ?? null}, restaurant_id),
              city = coalesce(${city ?? null}, city),
              owner_email = ${userEmail}
          where user_id = ${userId}
        `;
      } else {
        await sql()`
          insert into business_leads (user_id, restaurant_name, restaurant_id, owner_email, city, safety_score, tier)
          values (${userId}, ${restaurantName ?? "Unknown"}, ${restaurantId ?? null}, ${userEmail}, ${city ?? null}, ${score}, ${tier})
        `;
      }
    } catch {
      // Lead tracking is best-effort
    }

    const tierLabel = tier === 1 ? "Tier 1 (Medical-Grade)" : tier === 2 ? "Tier 2 (Strong Protocols)" : "Tier 3 (Basic Listing)";

    return {
      success: true,
      auditId,
      score,
      tier,
      tierLabel,
    };
  },
);

/**
 * Get the latest audit for a user.
 */
export const getAudit = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { userId: number } }) => {
    const { userId } = data;
    if (!userId) return null;

    await createKitchenAuditsTable();

    const rows = await sql()`
      select * from kitchen_audits
      where user_id = ${userId}
      order by created_at desc
      limit 1
    `;

    if (rows.length === 0) return null;

    const r = rows[0] as Record<string, unknown>;
    return {
      id: r.id as number,
      user_id: r.user_id as number,
      answers: r.answers as AuditAnswers,
      safety_score: r.safety_score as number,
      tier: r.tier as number,
      status: r.status as string,
      created_at: String(r.created_at),
      updated_at: String(r.updated_at ?? r.created_at),
    } satisfies AuditResult;
  },
);

/**
 * Get business lead data for a user.
 */
export const getBusinessLead = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { userId: number } }) => {
    const { userId } = data;
    if (!userId) return null;

    await createBusinessLeadsTable();

    const rows = await sql()`
      select * from business_leads
      where user_id = ${userId}
      order by completed_at desc
      limit 1
    `;

    if (rows.length === 0) return null;

    const r = rows[0] as Record<string, unknown>;
    return {
      id: r.id as number,
      user_id: r.user_id as number,
      restaurant_name: r.restaurant_name as string,
      restaurant_id: r.restaurant_id as number | null,
      owner_email: r.owner_email as string,
      city: r.city as string | null,
      safety_score: r.safety_score as number,
      tier: r.tier as number,
      completed_at: String(r.completed_at),
      contacted: r.contacted as boolean,
    };
  },
);
