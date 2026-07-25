import { sql } from "~/db";
import { verifyToken } from "~/db/auth";

/**
 * GET /api/business/leads
 * Admin-only REST API endpoint. Returns business leads as JSON.
 *
 * Query params:
 *   ?city=   - filter by city (case-insensitive partial match)
 *   ?tier=   - filter by safety tier (1, 2, or 3)
 *   ?limit=  - max results (default 50, max 200)
 *
 * Auth: Bearer token in Authorization header (admin role required).
 * Returns JSON: { leads: [...], count: N }
 */

export async function GET({ request }: { request: Request }) {
  try {
    // Auth check
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Provide a valid Bearer token." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden. Admin access required." }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const city = url.searchParams.get("city")?.trim() || null;
    const tierParam = url.searchParams.get("tier");
    const tier = tierParam ? parseInt(tierParam, 10) : null;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 200) : 50;

    // Ensure table exists
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

    // Build query
    let query = sql()`select restaurant_name, owner_email, city, safety_score, tier, completed_at from business_leads where 1=1`;

    if (city) {
      query = sql()`${query} and city ilike ${"%" + city + "%"}`;
    }
    if (tier && [1, 2, 3].includes(tier)) {
      query = sql()`${query} and tier = ${tier}`;
    }

    query = sql()`${query} order by completed_at desc limit ${limit}`;

    const rows = await query;

    const leads = rows.map((r: Record<string, unknown>) => ({
      restaurant_name: r.restaurant_name as string,
      owner_email: r.owner_email as string,
      city: r.city as string | null,
      safety_score: r.safety_score as number,
      tier: r.tier as number,
      completed_at: r.completed_at ? String(r.completed_at) : null,
    }));

    return new Response(JSON.stringify({ leads, count: leads.length }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("API /api/business/leads error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
