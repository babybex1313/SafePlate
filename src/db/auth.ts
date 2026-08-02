import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

// ── Config ────────────────────────────────────────────────────────────────────

const AUTH_SECRET = process.env.AUTH_SECRET || "safeplate-dev-secret-change-in-production";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// ── Table creation ────────────────────────────────────────────────────────────

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

// ── Simple JWT helpers (no external library) ──────────────────────────────────

function base64urlEncode(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
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

export async function createToken(payload: Record<string, unknown>): Promise<string> {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const signature = await hmacSign(`${header}.${body}`, AUTH_SECRET);
  return `${header}.${body}.${signature}`;
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = await hmacSign(`${header}.${body}`, AUTH_SECRET);
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(base64urlDecode(body)) as Record<string, unknown>;
    if (payload.exp && typeof payload.exp === "number") {
      if (Date.now() / 1000 > payload.exp) return null;
    }
    if (payload.iat && typeof payload.iat === "number") {
      if (Date.now() / 1000 - payload.iat > SESSION_MAX_AGE) return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ── Shared user type ──────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  premium_until: string | null;
  selected_allergens: string[] | null;
}

// ── Server functions ──────────────────────────────────────────────────────────

export const signup = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { name: string; email: string; password: string; allergens?: string[]; role?: string } }) => {
    const { name, email, password, allergens, role } = data ?? {};
    const normalizedEmail = email?.trim().toLowerCase();
    const userRole = role === "restaurant_owner" || role === "admin" ? role : "diner";

    if (!name?.trim()) return { success: false, error: "Please enter your name." };
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    await createUsersTable();

    const existing = await sql()`select id from users where email = ${normalizedEmail}`;
    if (existing.length > 0) {
      return { success: false, error: "An account with this email already exists. Please log in instead." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql()`insert into users (email, name, password_hash, role, selected_allergens)
      values (${normalizedEmail}, ${name.trim()}, ${passwordHash}, ${userRole}, ${allergens?.length ? allergens : null})
      returning id, email, name, role, premium_until, selected_allergens, created_at`;

    const user = result[0] as Record<string, unknown>;
    const token = await createToken({
      userId: user.id as number,
      email: user.email as string,
      role: (user.role as string) || "diner",
    });

    return {
      success: true,
      token,
      user: {
        id: user.id as number,
        email: user.email as string,
        name: user.name as string,
        role: (user.role as string) || "diner",
        premium_until: null as string | null,
        selected_allergens: user.selected_allergens as string[] | null,
      } satisfies AuthUser,
    };
  },
);

export const login = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string; password: string } }) => {
    const { email, password } = data ?? {};
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) return { success: false, error: "Please enter your email address." };
    if (!password) return { success: false, error: "Please enter your password." };

    await createUsersTable();

    const rows = await sql()`select id, email, name, password_hash, role, premium_until, selected_allergens, created_at
      from users where email = ${normalizedEmail}`;

    if (rows.length === 0) {
      return { success: false, error: "Invalid email or password." };
    }

    const user = rows[0] as Record<string, unknown>;
    const passwordHash = user.password_hash as string;

    // Try Bun.password first (for legacy hashes), fall back to bcryptjs
    let valid = false;
    try {
      if (typeof Bun !== "undefined" && (Bun as any).password) {
        valid = await (Bun as any).password.verify(password, passwordHash);
      }
    } catch {}
    if (!valid) {
      try {
        valid = await bcrypt.compare(password, passwordHash);
      } catch {}
    }

    if (!valid) {
      return { success: false, error: "Invalid email or password." };
    }

    const token = await createToken({
      userId: user.id as number,
      email: user.email as string,
      role: (user.role as string) || "diner",
    });

    return {
      success: true,
      token,
      user: {
        id: user.id as number,
        email: user.email as string,
        name: user.name as string,
        role: (user.role as string) || "diner",
        premium_until: user.premium_until ? String(user.premium_until) : null,
        selected_allergens: user.selected_allergens as string[] | null,
      } satisfies AuthUser,
    };
  },
);

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data?: { token?: string } }): Promise<AuthUser | null> => {
    const token = data?.token;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    await createUsersTable();

    const userId = payload.userId as number;
    const rows = await sql()`select id, email, name, role, premium_until, selected_allergens, created_at
      from users where id = ${userId}`;

    if (rows.length === 0) return null;

    const user = rows[0] as Record<string, unknown>;
    return {
      id: user.id as number,
      email: user.email as string,
      name: user.name as string,
      role: (user.role as string) || "diner",
      premium_until: user.premium_until ? String(user.premium_until) : null,
      selected_allergens: user.selected_allergens as string[] | null,
    };
  },
);

export const upgradeToPremium = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { userId: number } }) => {
    const { userId } = data ?? {};
    if (!userId) return { success: false, error: "User ID is required." };

    await createUsersTable();

    await sql()`update users set premium_until = now() + interval '30 days'
      where id = ${userId}`;

    // Also update user_profiles so premium status is visible to search/route-planner pages
    // (those pages read from user_profiles, not users)
    await sql()`create table if not exists user_profiles (
      id serial primary key,
      email text not null unique,
      allergens jsonb not null default '{}'::jsonb,
      premium_until timestamptz,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    )`;

    const userRows = await sql()`select email from users where id = ${userId}`;
    if (userRows.length > 0) {
      const email = (userRows[0] as { email: string }).email;
      await sql()`insert into user_profiles (email, allergens, premium_until, updated_at)
        values (${email}, '{}'::jsonb, now() + interval '30 days', now())
        on conflict (email) do update set
          premium_until = now() + interval '30 days',
          updated_at = now()`;
    }

    return { success: true };
  },
);

// ── Get claimed restaurant for a restaurant owner ──────────────────────────────

export const getClaimedRestaurantForOwner = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { email: string } }) => {
    const { email } = data ?? {};
    if (!email) return null;

    // Ensure the updates table exists
    await sql()`create table if not exists restaurant_updates (
      id serial primary key,
      restaurant_id integer not null,
      submitter_email text not null,
      submitter_name text,
      changes jsonb not null,
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
      notes text,
      created_at timestamptz default now(),
      reviewed_at timestamptz,
      update_type text,
      user_id integer
    )`;

    const rows = await sql()`
      select ru.restaurant_id, r.name as restaurant_name
      from restaurant_updates ru
      join restaurants r on r.id = ru.restaurant_id
      where ru.submitter_email = ${email.trim().toLowerCase()}
        and ru.update_type = 'claim'
        and ru.status = 'approved'
      order by ru.created_at desc
      limit 1
    `;

    if (rows.length === 0) return null;
    return {
      restaurantId: rows[0].restaurant_id as number,
      restaurantName: rows[0].restaurant_name as string,
    };
  },
);

export const updateAllergens = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { userId: number; allergens: string[] } }) => {
    const { userId, allergens } = data ?? {};
    if (!userId) return { success: false, error: "User ID is required." };

    await createUsersTable();

    await sql()`update users set selected_allergens = ${allergens ?? null}
      where id = ${userId}`;

    return { success: true };
  },
);

export const updateUserName = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { userId: number; name: string } }) => {
    const { userId, name } = data ?? {};
    if (!userId || !name?.trim()) return { success: false, error: "Name is required." };

    await createUsersTable();
    await sql()`update users set name = ${name.trim()} where id = ${userId}`;

    return { success: true, name: name.trim() };
  },
);

// ── Password Reset ────────────────────────────────────────────────────────────

async function createPasswordResetTokensTable() {
  await sql()`create table if not exists password_reset_tokens (
    id serial primary key,
    user_id integer not null references users(id),
    token text not null unique,
    expires_at timestamptz not null,
    used boolean not null default false,
    created_at timestamptz default now()
  )`;
}

export const requestPasswordReset = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { email: string } }) => {
    const { email } = data ?? {};
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) return { success: false, error: "Please enter your email address." };

    await createUsersTable();
    await createPasswordResetTokensTable();

    const rows = await sql()`select id from users where email = ${normalizedEmail}`;

    // Don't leak user existence — return success either way
    if (rows.length === 0) {
      // Small delay to mitigate timing attacks
      await new Promise((r) => setTimeout(r, 200));
      return { success: true };
    }

    const user = rows[0] as { id: number };
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    await sql()`insert into password_reset_tokens (user_id, token, expires_at)
      values (${user.id}, ${token}, ${expiresAt})`;

    const SITE_URL = process.env.SITE_URL || "https://safeplate.company";
    const resetLink = `${SITE_URL}/reset-password?token=${token}`;

    // Fire-and-forget email — don't block the response
    import("../email").then(
      ({ sendPasswordResetEmail }) =>
        sendPasswordResetEmail({ email: normalizedEmail, resetLink }),
      () => {},
    );

    return { success: true };
  },
);

export const validateResetToken = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { token: string } }) => {
    const { token } = data ?? {};
    if (!token) return { valid: false, error: "Reset token is required." };

    await createPasswordResetTokensTable();

    const rows = await sql()`select id, expires_at, used
      from password_reset_tokens where token = ${token}`;

    if (rows.length === 0) {
      return { valid: false, error: "Invalid reset link." };
    }

    const resetToken = rows[0] as { id: number; expires_at: string; used: boolean };

    if (resetToken.used) {
      return { valid: false, error: "This reset link has already been used." };
    }

    if (new Date(resetToken.expires_at).getTime() < Date.now()) {
      return { valid: false, error: "This reset link has expired. Please request a new one." };
    }

    return { valid: true };
  },
);

export const resetPassword = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { token: string; newPassword: string } }) => {
    const { token, newPassword } = data ?? {};
    if (!token) return { success: false, error: "Reset token is required." };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    await createUsersTable();
    await createPasswordResetTokensTable();

    const rows = await sql()`select id, user_id, expires_at, used
      from password_reset_tokens where token = ${token}`;

    if (rows.length === 0) {
      return { success: false, error: "Invalid or expired reset link." };
    }

    const resetToken = rows[0] as {
      id: number;
      user_id: number;
      expires_at: string;
      used: boolean;
    };

    if (resetToken.used) {
      return { success: false, error: "This reset link has already been used." };
    }

    if (new Date(resetToken.expires_at).getTime() < Date.now()) {
      return { success: false, error: "This reset link has expired. Please request a new one." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await sql()`update users set password_hash = ${passwordHash} where id = ${resetToken.user_id}`;
    await sql()`update password_reset_tokens set used = true where id = ${resetToken.id}`;

    return { success: true };
  },
);
