import { sql } from "~/db";
import { createToken } from "~/db/auth";
import bcrypt from "bcryptjs";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

/** POST /api/auth/login — production-safe login endpoint. */
export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = (body ?? {}) as {
      email?: string;
      password?: string;
    };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) return json({ success: false, error: "Please enter your email address." }, 400);
    if (!password) return json({ success: false, error: "Please enter your password." }, 400);

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

    const rows = await sql()`select id, email, name, password_hash, role, premium_until, selected_allergens
      from users where email = ${normalizedEmail}`;
    if (rows.length === 0) return json({ success: false, error: "Invalid email or password." }, 401);

    const user = rows[0] as Record<string, unknown>;
    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password_hash as string);
    } catch {
      valid = false;
    }
    if (!valid) return json({ success: false, error: "Invalid email or password." }, 401);

    const role = (user.role as string) || "diner";
    const token = await createToken({
      userId: user.id as number,
      email: user.email as string,
      role,
    });

    return json({
      success: true,
      token,
      user: {
        id: user.id as number,
        email: user.email as string,
        name: user.name as string,
        role,
        premium_until: user.premium_until ? String(user.premium_until) : null,
        selected_allergens: user.selected_allergens as string[] | null,
      },
    });
  } catch (error) {
    console.error("API /api/auth/login error:", error);
    return json({ success: false, error: "Unable to log in right now. Please try again." }, 500);
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
