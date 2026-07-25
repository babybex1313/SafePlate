import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import { getStLouisRestaurants } from "./restaurants-stl";
import { getSarasotaRestaurants } from "./restaurants-srq";
import { getChicagoRestaurants } from "./restaurants-chicago";
import { getDallasRestaurants } from "./restaurants-dallas";
import { getDenverRestaurants } from "./restaurants-denver";
import { getNashvilleRestaurants } from "./restaurants-nashville";
import { getPortlandRestaurants } from "./restaurants-portland";
import { getAtlantaRestaurants } from "./restaurants-atlanta";

// ── Table creation (idempotent) ──────────────────────────────────────────────

export async function createRestaurantsTable(sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>) {
  await sqlClient`create table if not exists restaurants (
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
  // Add columns that may be missing from tables created before these migrations
  await sqlClient`alter table restaurants add column if not exists featured_until timestamptz`;
  await sqlClient`alter table restaurants add column if not exists contact_email text`;
}

// ── Table: restaurant_reviews ──────────────────────────────────────────────────

export async function createRestaurantReviewsTable(
  sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>,
) {
  await sqlClient`create table if not exists restaurant_reviews (
    id serial primary key,
    restaurant_id integer not null references restaurants(id) on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    review_text text,
    reviewer_name text not null,
    reviewer_email text,
    created_at timestamptz default now()
  )`;
}

// ── Table: email_tracking ────────────────────────────────────────────────────

export async function createEmailTrackingTable(
  sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>,
) {
  await sqlClient`create table if not exists email_tracking (
    id serial primary key,
    restaurant_id integer not null references restaurants(id),
    sent_at timestamptz default now(),
    opened_at timestamptz,
    clicked_at timestamptz,
    recipient_email text not null
  )`;
  await sqlClient`alter table email_tracking add column if not exists replied boolean default false`;
  await sqlClient`alter table email_tracking add column if not exists replied_at timestamptz`;
}

/** Insert a tracking event. Returns the tracking event id. */
export async function insertEmailTracking(
  sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>,
  restaurantId: number,
  recipientEmail: string,
): Promise<number> {
  const result = await sqlClient`
    insert into email_tracking (restaurant_id, recipient_email)
    values (${restaurantId}, ${recipientEmail})
    returning id
  `;
  return result[0].id as number;
}

// ── Admin: get email tracking data ───────────────────────────────────────────

export interface EmailTrackingRow {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_city: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  recipient_email: string;
  replied: boolean;
  replied_at: string | null;
}

export const getEmailTracking = createServerFn({ method: "GET" }).handler(
  async () => {
    await createEmailTrackingTable(sql());
    const rows = await sql()`
      select
        et.id,
        et.restaurant_id,
        r.name as restaurant_name,
        r.city as restaurant_city,
        et.sent_at,
        et.opened_at,
        et.clicked_at,
        et.recipient_email,
        et.replied,
        et.replied_at
      from email_tracking et
      join restaurants r on r.id = et.restaurant_id
      order by et.sent_at desc
      limit 500
    `;
    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      sent_at: String(row.sent_at),
      opened_at: row.opened_at ? String(row.opened_at) : null,
      clicked_at: row.clicked_at ? String(row.clicked_at) : null,
      replied_at: row.replied_at ? String(row.replied_at) : null,
    })) as EmailTrackingRow[];
  },
);

// ── Admin: mark email as replied ──────────────────────────────────────────

export const markEmailReplied = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { trackingId: number } }) => {
    await createEmailTrackingTable(sql());
    await sql()`
      update email_tracking
      set replied = true, replied_at = now()
      where id = ${data.trackingId}
    `;
    return { success: true };
  },
);

// ── Admin: get reply stats ────────────────────────────────────────────────

export const getReplyStats = createServerFn({ method: "GET" }).handler(
  async () => {
    await createEmailTrackingTable(sql());
    const [totalRow, repliedRow] = await Promise.all([
      sql()`select count(*)::int as cnt from email_tracking`,
      sql()`select count(*)::int as cnt from email_tracking where replied = true`,
    ]);
    const total = (totalRow[0] as { cnt: number }).cnt;
    const replied = (repliedRow[0] as { cnt: number }).cnt;
    const awaiting = total - replied;
    return { total, replied, awaiting };
  },
);

// ── Admin password verification ──────────────────────────────────────────────

export const verifyAdminPassword = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { password: string } }) => {
    const correct = process.env.ADMIN_PASSWORD;
    if (!correct) return { success: false, error: "Admin password not configured" };
    if (data.password === correct) return { success: true };
    return { success: false, error: "Incorrect password" };
  },
);

// ── Search server function ───────────────────────────────────────────────────

export const searchRestaurants = createServerFn({ method: "GET" }).handler(
  async ({
    data,
  }: {
    data: {
      query?: string;
      tier?: number;
      freeFrom?: string[];
      city?: string;
      matchMode?: "ANY" | "ALL";
    };
  }) => {
    const { query, tier, freeFrom: rawFreeFrom, city, matchMode } = data ?? {};

    await createRestaurantsTable(sql());
    // Normalize allergen names: "lactose" → "Dairy", "celiac" → "Gluten"
    const freeFrom = rawFreeFrom?.map((a) => {
      const lower = a.toLowerCase();
      if (lower === "lactose" || lower === "lactose intolerance") return "Dairy";
      if (lower === "celiac" || lower === "gluten intolerance") return "Gluten";
      return a;
    });

    // Build dynamic query
    const conditions: string[] = [];
    const params: unknown[] = [];

    // City filter — only when explicitly specified
    if (city?.trim()) {
      conditions.push(`city ilike $${params.length + 1}`);
      params.push(city.trim());
    }

    // Text search on name, cuisine_type, description
    if (query?.trim()) {
      const q = `%${query.trim()}%`;
      conditions.push(
        `(name ilike $${params.length + 1} or cuisine_type ilike $${params.length + 2} or description ilike $${params.length + 3})`,
      );
      params.push(q, q, q);
    }

    // Safety tier filter
    if (tier && [1, 2, 3].includes(tier)) {
      conditions.push(`safety_tier = $${params.length + 1}`);
      params.push(tier);
    }

    // Free-from filter
    // "ALL" (default): restaurant must be free from ALL specified allergens (uses @>)
    // "ANY": restaurant must be free from AT LEAST ONE specified allergen (uses &&)
    if (freeFrom && freeFrom.length > 0) {
      const op = matchMode === "ANY" ? "&&" : "@>";
      conditions.push(`free_from ${op} ${params.length + 1}::text[]`);
      params.push(freeFrom);
    }

    const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
    const queryStr = `select * from restaurants ${where} order by featured_until desc nulls last, safety_tier asc, name asc`;

    const rows = await sql().query(queryStr, params);

    // Coerce timestamp to string for serialization
    return rows.map((r: Record<string, unknown>) => ({
      ...r,
      created_at: String(r.created_at),
      featured_until: r.featured_until ? String(r.featured_until) : null,
    }));
  },
);

// ── Seed server function (idempotent — skips cities that already have data) ──

function stateForCity(city: string): string {
  const map: Record<string, string> = {
    "Austin": "TX", "St. Louis": "MO", "Sarasota": "FL",
    "Chicago": "IL", "Dallas": "TX", "Denver": "CO",
    "Nashville": "TN", "Portland": "OR", "Atlanta": "GA",
  };
  return map[city] ?? "TX";
}

async function seedCityIfEmpty(
  sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>,
  city: string,
  restaurants: RestaurantSeed[],
) {
  const existing = await sqlClient`select count(*)::int as cnt from restaurants where city = ${city}`;
  if (existing[0].cnt > 0) {
    return { seeded: false, city, message: `${city} already has ${existing[0].cnt} rows — skipping.` };
  }

  const state = stateForCity(city);

  for (const r of restaurants) {
    await sqlClient`insert into restaurants (
      name, address, city, state, cuisine_type, safety_tier,
      has_dedicated_fryer, has_isolated_prep, allergen_trained_staff,
      free_from, allergens_handled, description, website, phone, image_url, verified
    ) values (
      ${r.name}, ${r.address}, ${city}, ${state}, ${r.cuisine_type}, ${r.safety_tier},
      ${r.has_dedicated_fryer}, ${r.has_isolated_prep}, ${r.allergen_trained_staff},
      ${r.free_from}, ${r.allergens_handled}, ${r.description}, ${r.website}, ${r.phone}, ${r.image_url}, ${r.verified}
    )`;
  }

  return { seeded: true, city, count: restaurants.length };
}

export const seedRestaurants = createServerFn({ method: "POST" }).handler(
  async () => {
    await createRestaurantsTable(sql());

    const client = sql();
    const results: unknown[] = [];

    results.push(await seedCityIfEmpty(client, "Austin", getAustinRestaurants()));
    results.push(await seedCityIfEmpty(client, "St. Louis", getStLouisRestaurants()));
    results.push(await seedCityIfEmpty(client, "Sarasota", getSarasotaRestaurants()));
    results.push(await seedCityIfEmpty(client, "Chicago", getChicagoRestaurants()));
    results.push(await seedCityIfEmpty(client, "Dallas", getDallasRestaurants()));
    results.push(await seedCityIfEmpty(client, "Denver", getDenverRestaurants()));
    results.push(await seedCityIfEmpty(client, "Nashville", getNashvilleRestaurants()));
    results.push(await seedCityIfEmpty(client, "Portland", getPortlandRestaurants()));
    results.push(await seedCityIfEmpty(client, "Atlanta", getAtlantaRestaurants()));

    const total = (await client`select count(*)::int as cnt from restaurants`)[0].cnt;

    return { results, total };
  },
);

// ── Admin: list all restaurants ─────────────────────────────────────────────

export const adminListRestaurants = createServerFn({ method: "GET" }).handler(
  async ({
    data,
  }: {
    data?: { search?: string };
  }) => {
    await createRestaurantsTable(sql());

    const { search } = data ?? {};
    const client = sql();

    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      const rows = await client`
        select id, name, city, safety_tier, verified, website, created_at, contact_email, cuisine_type
        from restaurants
        where name ilike ${q} or city ilike ${q}
        order by city asc, name asc
      `;
      return rows.map((r: Record<string, unknown>) => ({
        ...r,
        created_at: String(r.created_at),
      }));
    }

    const rows = await client`
      select id, name, city, safety_tier, verified, website, created_at, contact_email, cuisine_type
      from restaurants
      order by city asc, name asc
    `;
    return rows.map((r: Record<string, unknown>) => ({
      ...r,
      created_at: String(r.created_at),
    }));
  },
);

// ── Admin: get single restaurant (full details) ─────────────────────────────

export const adminGetRestaurant = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { id: number } }) => {
    await createRestaurantsTable(sql());
    const rows = await sql()`
      select * from restaurants where id = ${data.id} limit 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0] as Record<string, unknown>;
    return { ...r, created_at: String(r.created_at) };
  },
);

// ── Admin: update restaurant ────────────────────────────────────────────────

export interface UpdateRestaurantData {
  id: number;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  cuisine_type?: string | null;
  safety_tier?: number;
  has_dedicated_fryer?: boolean;
  has_isolated_prep?: boolean;
  allergen_trained_staff?: boolean;
  free_from?: string[];
  allergens_handled?: string[];
  description?: string | null;
  website?: string | null;
  phone?: string | null;
  verified?: boolean;
  contact_email?: string | null;
}

export const updateRestaurant = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: UpdateRestaurantData }) => {
    const { id, ...fields } = data;
    if (!id) return { success: false, error: "Restaurant ID is required." };

    await createRestaurantsTable(sql());

    // Build the update using a fixed set of known columns
    // This avoids dynamic SQL construction issues with neon
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = Array.isArray(value) ? value : value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, error: "No fields to update." };
    }

    try {
      // Use tagged template with known parameters
      // For each possible field, include it conditionally
      const setParts: string[] = [];
      const values: unknown[] = [];

      if (updates.name !== undefined)          { setParts.push("name = $" + (values.length + 1)); values.push(updates.name); }
      if (updates.address !== undefined)       { setParts.push("address = $" + (values.length + 1)); values.push(updates.address); }
      if (updates.city !== undefined)          { setParts.push("city = $" + (values.length + 1)); values.push(updates.city); }
      if (updates.state !== undefined)         { setParts.push("state = $" + (values.length + 1)); values.push(updates.state); }
      if (updates.cuisine_type !== undefined)  { setParts.push("cuisine_type = $" + (values.length + 1)); values.push(updates.cuisine_type); }
      if (updates.safety_tier !== undefined)   { setParts.push("safety_tier = $" + (values.length + 1)); values.push(updates.safety_tier); }
      if (updates.has_dedicated_fryer !== undefined)     { setParts.push("has_dedicated_fryer = $" + (values.length + 1)); values.push(updates.has_dedicated_fryer); }
      if (updates.has_isolated_prep !== undefined)       { setParts.push("has_isolated_prep = $" + (values.length + 1)); values.push(updates.has_isolated_prep); }
      if (updates.allergen_trained_staff !== undefined)  { setParts.push("allergen_trained_staff = $" + (values.length + 1)); values.push(updates.allergen_trained_staff); }
      if (updates.free_from !== undefined)     { setParts.push("free_from = $" + (values.length + 1)); values.push(updates.free_from); }
      if (updates.allergens_handled !== undefined) { setParts.push("allergens_handled = $" + (values.length + 1)); values.push(updates.allergens_handled); }
      if (updates.description !== undefined)   { setParts.push("description = $" + (values.length + 1)); values.push(updates.description); }
      if (updates.website !== undefined)       { setParts.push("website = $" + (values.length + 1)); values.push(updates.website); }
      if (updates.phone !== undefined)         { setParts.push("phone = $" + (values.length + 1)); values.push(updates.phone); }
      if (updates.image_url !== undefined)     { setParts.push("image_url = $" + (values.length + 1)); values.push(updates.image_url); }
      if (updates.verified !== undefined)      { setParts.push("verified = $" + (values.length + 1)); values.push(updates.verified); }
      if (updates.contact_email !== undefined)  { setParts.push("contact_email = $" + (values.length + 1)); values.push(updates.contact_email); }

      values.push(id);
      const queryText = "update restaurants set " + setParts.join(", ") + " where id = $" + values.length;
      await sql().query(queryText, values);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
);

// ── Community restaurant (from email replies) ───────────────────────────────

export const addCommunityRestaurant = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { city: string; name: string };
  }) => {
    const { city, name } = data;
    const trimmedCity = city.trim();
    const trimmedName = name.trim();

    if (!trimmedCity || !trimmedName) {
      return { inserted: false, error: "City and name are required." };
    }

    await createRestaurantsTable(sql());

    // Check for duplicates (same name + city)
    const existing = await sql()`
      select id from restaurants
      where name = ${trimmedName}
      and city = ${trimmedCity}
      limit 1
    `;

    if (existing.length > 0) {
      return { inserted: false, id: existing[0].id, error: `"${trimmedName}" already exists in ${trimmedCity}.` };
    }

    const result = await sql()`
      insert into restaurants (
        name, address, city, state, cuisine_type, safety_tier,
        has_dedicated_fryer, has_isolated_prep, allergen_trained_staff,
        free_from, allergens_handled, verified
      ) values (
        ${trimmedName},
        ${"TBD"},
        ${trimmedCity},
        ${"TBD"},
        ${"Recommended by community"},
        ${3},
        ${false},
        ${false},
        ${false},
        ${"{}" as unknown as string[]},
        ${"{}" as unknown as string[]},
        ${false}
      ) returning id
    `;

    // Fire-and-forget: notify admin about the new community suggestion
    import("~/email").then(
      ({ sendCommunitySuggestionNotification }) =>
        sendCommunitySuggestionNotification({
          restaurantName: trimmedName,
          city: trimmedCity,
        }),
      () => {},
    );

    return { inserted: true, id: result[0].id };
  },
);

// ── Admin: mark restaurant as verified ─────────────────────────────────────

export const markVerified = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { id: number } }) => {
    await createRestaurantsTable(sql());
    await sql()`update restaurants set verified = true where id = ${data.id}`;
    return { success: true };
  },
);

// ── Claim payment: associate a Stripe payment with a restaurant ───────────

export const claimPayment = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: {
      restaurantName: string;
      email: string;
      product: string; // "featured" | "verified" | "premium"
    };
  }) => {
    const { restaurantName, email, product } = data;
    if (!restaurantName?.trim()) return { success: false, error: "Restaurant name is required." };
    if (!email?.trim()) return { success: false, error: "Email is required." };

    await createRestaurantsTable(sql());

    // Find the restaurant by name (case-insensitive)
    const rows = await sql()`
      select id, name, city from restaurants
      where name ilike ${restaurantName.trim()}
      limit 1
    `;

    if (rows.length === 0) {
      return { success: false, error: `No restaurant found matching "${restaurantName}".` };
    }

    const restaurant = rows[0] as { id: number; name: string; city: string };

    if (product === "featured") {
      // Set featured_until 30 days from now
      await sql()`update restaurants set featured_until = now() + interval '30 days' where id = ${restaurant.id}`;
    } else if (product === "verified") {
      await sql()`update restaurants set verified = true where id = ${restaurant.id}`;
    } else if (product === "premium") {
      // Premium is on user_profiles — handled in profile.ts
      return { success: false, error: "Premium profiles are claimed on the Profile page." };
    }

    // Fire-and-forget email notification
    import("~/email").then(
      ({ sendPaymentClaimNotification }: { sendPaymentClaimNotification: (opts: { restaurantName: string; email: string; product: string }) => Promise<void> }) =>
        sendPaymentClaimNotification({
          restaurantName: restaurant.name,
          email: email.trim(),
          product,
        }),
      () => {},
    );

    return { success: true, restaurantId: restaurant.id, restaurantName: restaurant.name };
  },
);

// ── Table: safety_alerts ──────────────────────────────────────────────────────

export async function createSafetyAlertsTable(
  sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>,
) {
  return sqlClient`create table if not exists safety_alerts (
    id serial primary key,
    restaurant_id integer not null references restaurants(id),
    alert_type text not null check (alert_type in ('ingredient_change', 'menu_change', 'protocol_change', 'other')),
    description text not null,
    submitter_email text,
    status text not null default 'active' check (status in ('active', 'resolved')),
    created_at timestamptz default now(),
    resolved_at timestamptz
  )`;
}

// ── Submit safety alert ─────────────────────────────────────────────────────

export const submitSafetyAlert = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: {
      restaurant_id: number;
      alert_type: string;
      description: string;
      submitter_email?: string;
    };
  }) => {
    const { restaurant_id, alert_type, description, submitter_email } = data;

    if (!restaurant_id) return { success: false, error: "Restaurant ID is required." };
    if (!description?.trim()) return { success: false, error: "Description is required." };
    if (!["ingredient_change", "menu_change", "protocol_change", "other"].includes(alert_type)) {
      return { success: false, error: "Invalid alert type." };
    }

    await createSafetyAlertsTable(sql());

    // Validate restaurant exists
    const restaurant = await sql()`
      select id, name from restaurants where id = ${restaurant_id} limit 1
    `;
    if (restaurant.length === 0) {
      return { success: false, error: "Restaurant not found." };
    }
    const restaurantName = restaurant[0].name as string;

    await sql()`
      insert into safety_alerts (restaurant_id, alert_type, description, submitter_email)
      values (${restaurant_id}, ${alert_type}, ${description.trim()}, ${submitter_email?.trim() ?? null})
    `;

    // Fire-and-forget email notifications
    import("~/email").then(
      ({ sendAlertNotification, sendPremiumAlertNotification }) => {
        sendAlertNotification({
          restaurantName,
          alertType: alert_type,
          description: description.trim(),
          submitterEmail: submitter_email?.trim(),
        });
        sendPremiumAlertNotification({
          restaurantId: restaurant_id,
          restaurantName,
          alertType: alert_type,
          description: description.trim(),
        });
      },
      () => {},
    );

    return { success: true };
  },
);

// ── Get active alerts (for search page + admin) ────────────────────────────

export const getActiveAlerts = createServerFn({ method: "GET" }).handler(
  async () => {
    await createSafetyAlertsTable(sql());
    const rows = await sql()`
      select
        sa.id,
        sa.restaurant_id,
        sa.alert_type,
        sa.description,
        sa.submitter_email,
        sa.status,
        sa.created_at,
        sa.resolved_at,
        r.name as restaurant_name,
        r.city as restaurant_city
      from safety_alerts sa
      join restaurants r on r.id = sa.restaurant_id
      order by sa.created_at desc
    `;
    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      created_at: String(row.created_at),
      resolved_at: row.resolved_at ? String(row.resolved_at) : null,
    }));
  },
);

// ── Get active alerts for a single restaurant ──────────────────────────────

export const getAlertsForRestaurant = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { restaurant_id: number } }) => {
    await createSafetyAlertsTable(sql());
    const rows = await sql()`
      select id, alert_type, description, status, created_at
      from safety_alerts
      where restaurant_id = ${data.restaurant_id}
      and status = 'active'
      order by created_at desc
    `;
    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      created_at: String(row.created_at),
    }));
  },
);

// ── Get alerts for saved restaurants (premium feature) ────────────────────

export const getAlertsForSavedRestaurants = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { userEmail: string } }) => {
    const email = data?.userEmail?.trim().toLowerCase();
    if (!email) return [];

    await createSafetyAlertsTable(sql());
    // Ensure saved_restaurants table exists (created in profile.ts but guard here)
    await sql()`create table if not exists saved_restaurants (
      id serial primary key,
      user_email text not null,
      restaurant_id integer not null references restaurants(id),
      created_at timestamptz default now(),
      unique(user_email, restaurant_id)
    )`;

    const rows = await sql()`
      select
        sa.id,
        sa.restaurant_id,
        sa.alert_type,
        sa.description,
        sa.status,
        sa.created_at,
        r.name as restaurant_name,
        r.city as restaurant_city
      from safety_alerts sa
      join restaurants r on r.id = sa.restaurant_id
      join saved_restaurants sr on sr.restaurant_id = sa.restaurant_id
      where sr.user_email = ${email}
        and sa.created_at > now() - interval '30 days'
      order by sa.created_at desc
    `;

    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      created_at: String(row.created_at),
    }));
  },
);

// ── Resolve an alert ───────────────────────────────────────────────────────

export const resolveAlert = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { alert_id: number } }) => {
    await createSafetyAlertsTable(sql());

    const existing = await sql()`
      select id, status from safety_alerts where id = ${data.alert_id} limit 1
    `;
    if (existing.length === 0) {
      return { success: false, error: "Alert not found." };
    }
    if (existing[0].status !== "active") {
      return { success: false, error: "Alert is already resolved." };
    }

    await sql()`
      update safety_alerts
      set status = 'resolved', resolved_at = now()
      where id = ${data.alert_id}
    `;

    return { success: true };
  },
);

// ── Table: restaurant_updates ─────────────────────────────────────────────────

export async function createRestaurantUpdatesTable(
  sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>,
) {
  await sqlClient`create table if not exists restaurant_updates (
    id serial primary key,
    restaurant_id integer not null references restaurants(id),
    submitter_email text not null,
    submitter_name text,
    changes jsonb not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    notes text,
    created_at timestamptz default now(),
    reviewed_at timestamptz
  )`;
  await sqlClient`alter table restaurant_updates add column if not exists update_type text`;
  await sqlClient`alter table restaurant_updates add column if not exists user_id integer`;
}

// ── Search restaurant by name (for claim flow) ───────────────────────────────

export const searchRestaurantByName = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { query: string } }) => {
    await createRestaurantsTable(sql());
    const q = `%${data.query.trim()}%`;
    const rows = await sql()`
      select id, name, city
      from restaurants
      where name ilike ${q}
      order by city asc, name asc
      limit 20
    `;
    return rows as { id: number; name: string; city: string }[];
  },
);

// ── Claim restaurant listing ─────────────────────────────────────────────────

export const claimRestaurant = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: {
      restaurantId: number;
      name: string;
      email: string;
      role: string;
    };
  }) => {
    const { restaurantId, name: submitterName, email, role } = data;

    if (!restaurantId) return { success: false, error: "Restaurant ID is required." };
    if (!email?.trim()) return { success: false, error: "Email is required." };

    await createRestaurantsTable(sql());
    await createRestaurantUpdatesTable(sql());

    // Validate restaurant exists (also fetch website for domain matching)
    const restaurant = await sql()`
      select id, name, website from restaurants where id = ${restaurantId} limit 1
    `;
    if (restaurant.length === 0) {
      return { success: false, error: "Restaurant not found." };
    }

    const restaurantName = restaurant[0].name as string;
    const restaurantWebsite = (restaurant[0].website as string) ?? "";

    const trimmedEmail = email.trim();
    const emailDomain = trimmedEmail.split("@")[1]?.toLowerCase() ?? "";
    let autoApproved = false;

    // Insert the claim as a restaurant_update
    const result = await sql()`
      insert into restaurant_updates (
        restaurant_id, submitter_email, submitter_name, changes, status, notes, update_type
      ) values (
        ${restaurantId},
        ${trimmedEmail},
        ${submitterName?.trim() ?? null},
        ${JSON.stringify({ role: role?.trim() ?? "Owner" })}::jsonb,
        'pending',
        ${null},
        'claim'
      ) returning id
    `;
    const updateId = result[0].id as number;

    // ── Domain-based auto-approval ──
    if (emailDomain && restaurantWebsite) {
      const restaurantDomain = extractDomain(restaurantWebsite);
      if (emailDomain === restaurantDomain) {
        // Auto-approve: set verified = true and mark claim as approved
        await sql()`update restaurants set verified = true where id = ${restaurantId}`;
        await sql()`
          update restaurant_updates
          set status = 'approved', reviewed_at = now()
          where id = ${updateId}
        `;
        autoApproved = true;
      }
    }

    return { success: true, autoApproved, restaurantId, restaurantName };
  },
);

// ── Submit restaurant update ──────────────────────────────────────────────────

export interface RestaurantUpdateChanges {
  safety_tier?: number;
  has_dedicated_fryer?: boolean;
  has_isolated_prep?: boolean;
  allergen_trained_staff?: boolean;
  free_from?: string[];
  allergens_handled?: string[];
  verified?: boolean;
}

export const submitRestaurantUpdate = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: {
      restaurant_id: number;
      submitter_email: string;
      submitter_name?: string;
      changes: RestaurantUpdateChanges;
      notes?: string;
    };
  }) => {
    const { restaurant_id, submitter_email, submitter_name, changes, notes } = data;

    if (!restaurant_id) return { success: false, error: "Restaurant ID is required." };
    if (!submitter_email?.trim())
      return { success: false, error: "Email is required." };
    if (!changes || Object.keys(changes).length === 0)
      return { success: false, error: "At least one change is required." };

    await createRestaurantsTable(sql());
    await createRestaurantUpdatesTable(sql());

    // Validate restaurant exists (also fetch website for domain matching)
    const restaurant = await sql()`
      select id, name, website from restaurants where id = ${restaurant_id} limit 1
    `;
    if (restaurant.length === 0) {
      return { success: false, error: "Restaurant not found." };
    }

    const restaurantName = restaurant[0].name as string;
    const restaurantWebsite = (restaurant[0].website as string) ?? "";

    const result = await sql()`
      insert into restaurant_updates (
        restaurant_id, submitter_email, submitter_name, changes, status, notes
      ) values (
        ${restaurant_id},
        ${submitter_email.trim()},
        ${submitter_name?.trim() ?? null},
        ${JSON.stringify(changes)}::jsonb,
        'pending',
        ${notes?.trim() ?? null}
      ) returning id
    `;
    const updateId = result[0].id as number;

    // ── Domain-based auto-approval ──
    let autoApproved = false;

    const emailDomain = submitter_email.trim().split("@")[1]?.toLowerCase() ?? "";

    if (emailDomain && restaurantWebsite) {
      // Extract domain from restaurant website (strip protocol, www, path)
      const restaurantDomain = extractDomain(restaurantWebsite);

      if (emailDomain === restaurantDomain) {
        // Auto-approve: apply changes to restaurants table
        const changesObj = changes as Record<string, unknown>;
        const setClauses: string[] = [];
        const params: unknown[] = [];

        for (const [key, value] of Object.entries(changesObj)) {
          if (value === undefined) continue;
          setClauses.push(`${key} = ${params.length + 1}`);
          if (Array.isArray(value)) {
            params.push(value);
          } else if (typeof value === "object") {
            params.push(JSON.stringify(value));
          } else {
            params.push(value);
          }
        }

        if (setClauses.length > 0) {
          params.push(restaurant_id);
          await sql().query(
            `update restaurants set ${setClauses.join(", ")} where id = ${params.length}`,
            params,
          );
        }

        // Mark update as approved
        await sql()`
          update restaurant_updates
          set status = 'approved', reviewed_at = now()
          where id = ${updateId}
        `;

        autoApproved = true;
      }
    }

    // Fire-and-forget email notification
    import("~/email").then(
      ({ sendUpdateNotification }) =>
        sendUpdateNotification({
          restaurantName,
          submitterEmail: submitter_email.trim(),
          submitterName: submitter_name?.trim(),
          changes,
          notes: notes?.trim(),
          autoApproved,
        }),
      () => {},
    );

    return { success: true, autoApproved };
  },
);

// ── Get submitter emails for a restaurant (for email pre-fill hints) ────────

export const getSubmitterEmails = createServerFn({ method: "GET" }).handler(
  async ({ data }: { data: { restaurantId: number } }) => {
    await createRestaurantUpdatesTable(sql());
    const rows = await sql()`
      select distinct submitter_email
      from restaurant_updates
      where restaurant_id = ${data.restaurantId}
      and status = 'pending'
    ` as { submitter_email: string }[];
    return rows.map((r) => r.submitter_email);
  },
);

// ── Send email to a restaurant (admin compose tool) ──────────────────────────

export const sendRestaurantEmail = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: {
      restaurantName: string;
      toEmail: string;
      subject: string;
      body: string;
      restaurantId?: number;
    };
  }) => {
    const { restaurantName, toEmail, subject, body, restaurantId } = data;

    if (!restaurantName?.trim())
      return { success: false, error: "Restaurant name is required." };
    if (!toEmail?.trim())
      return { success: false, error: "Recipient email is required." };
    if (!subject?.trim())
      return { success: false, error: "Subject is required." };
    if (!body?.trim())
      return { success: false, error: "Body is required." };

    try {
      const { sendAdminRestaurantEmail } = await import("~/email");
      await sendAdminRestaurantEmail({
        restaurantName: restaurantName.trim(),
        toEmail: toEmail.trim(),
        subject: subject.trim(),
        body: body.trim(),
        restaurantId,
      });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  },
);

// ── Get all restaurant submitter emails (for bulk mode filtering) ──────────

export const getAllRestaurantEmails = createServerFn({ method: "GET" }).handler(
  async () => {
    await createRestaurantUpdatesTable(sql());
    await createRestaurantsTable(sql());
    // Get the most recent submitter_email per restaurant
    const rows = await sql()`
      select distinct on (restaurant_id) restaurant_id, submitter_email
      from restaurant_updates
      order by restaurant_id, created_at desc
    ` as { restaurant_id: number; submitter_email: string }[];

    // Also fetch contact_emails from the restaurants table
    const contactRows = await sql()`
      select id, contact_email from restaurants where contact_email is not null
    ` as { id: number; contact_email: string }[];

    // Merge: prefer submitter_email, fall back to contact_email
    const emailMap = new Map<number, string>();
    for (const c of contactRows) {
      emailMap.set(c.id, c.contact_email);
    }
    for (const r of rows) {
      emailMap.set(r.restaurant_id, r.submitter_email);
    }

    return Array.from(emailMap.entries()).map(([restaurant_id, submitter_email]) => ({
      restaurant_id,
      submitter_email,
    }));
  },
);

// ── Send bulk emails to multiple restaurants ────────────────────────────────

export const sendBulkEmails = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: {
      restaurantIds: number[];
      subject: string;
      body: string;
    };
  }) => {
    if (!data.restaurantIds?.length)
      return { success: false, error: "No restaurants selected" };
    if (!data.subject?.trim())
      return { success: false, error: "Subject is required" };
    if (!data.body?.trim())
      return { success: false, error: "Body is required" };

    await createRestaurantUpdatesTable(sql());
    await createRestaurantsTable(sql());

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    // Fetch all emails and restaurant names in bulk
    const emailRows = await sql()`
      select distinct on (restaurant_id) restaurant_id, submitter_email
      from restaurant_updates
      where restaurant_id = any(${data.restaurantIds})
      order by restaurant_id, created_at desc
    ` as { restaurant_id: number; submitter_email: string }[];

    // Build email lookup map
    const emailMap = new Map<number, string>();
    for (const row of emailRows) {
      emailMap.set(row.restaurant_id, row.submitter_email);
    }

    // Also check contact_email as fallback
    const contactRows = await sql()`
      select id, contact_email from restaurants
      where id = any(${data.restaurantIds})
      and contact_email is not null
    ` as { id: number; contact_email: string }[];
    for (const row of contactRows) {
      if (!emailMap.has(row.id)) {
        emailMap.set(row.id, row.contact_email);
      }
    }

    // Fetch restaurant names for the selected IDs
    const nameRows = await sql()`
      select id, name from restaurants where id = any(${data.restaurantIds})
    ` as { id: number; name: string }[];
    const nameMap = new Map<number, string>();
    for (const row of nameRows) {
      nameMap.set(row.id, row.name);
    }

    const { sendAdminRestaurantEmail } = await import("~/email");
    const { createEmailDripsTable, insertEmailDrip } = await import("~/db/drips");

    // Ensure drips table exists
    await createEmailDripsTable(sql());

    // Fire all sends in parallel (fire-and-forget style)
    const sendPromises = data.restaurantIds.map(async (id) => {
      const email = emailMap.get(id);
      const name = nameMap.get(id) ?? `Restaurant #${id}`;

      if (!email) {
        skipped++;
        return;
      }

      try {
        await sendAdminRestaurantEmail({
          restaurantName: name,
          toEmail: email,
          subject: data.subject.trim(),
          body: data.body.trim(),
          restaurantId: id,
        });

        // Insert drip record for follow-up sequence
        try {
          await insertEmailDrip(sql(), id, email, "bulk_email");
        } catch (dripErr) {
          console.error(`[SafePlate] Failed to insert drip for restaurant ${id}:`, dripErr);
        }

        sent++;
      } catch {
        failed++;
      }
    });

    await Promise.all(sendPromises);

    return { success: true, sent, failed, skipped };
  },
);

/** Extract the bare domain from a URL string.
 *  "https://www.torchystacos.com/path" → "torchystacos.com"
 *  "torchystacos.com" → "torchystacos.com"
 */
function extractDomain(url: string): string {
  try {
    const withProtocol = url.includes("://") ? url : `https://${url}`;
    const hostname = new URL(withProtocol).hostname;
    return hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// ── List pending updates (admin) ─────────────────────────────────────────────

export const listPendingUpdates = createServerFn({ method: "GET" }).handler(
  async () => {
    await createRestaurantUpdatesTable(sql());
    const rows = await sql()`
      select
        ru.id,
        ru.restaurant_id,
        ru.submitter_email,
        ru.submitter_name,
        ru.changes,
        ru.status,
        ru.notes,
        ru.created_at,
        ru.reviewed_at,
        r.name as restaurant_name,
        r.city as restaurant_city
      from restaurant_updates ru
      join restaurants r on r.id = ru.restaurant_id
      where ru.status = 'pending'
      order by ru.created_at desc
    `;
    return rows.map((row: Record<string, unknown>) => ({
      ...row,
      created_at: String(row.created_at),
      reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    }));
  },
);

// ── Approve update (admin) ────────────────────────────────────────────────────

export const approveUpdate = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { update_id: number } }) => {
    await createRestaurantUpdatesTable(sql());

    const rows = await sql()`
      select id, restaurant_id, changes, status
      from restaurant_updates
      where id = ${data.update_id}
      limit 1
    `;
    if (rows.length === 0)
      return { success: false, error: "Update not found." };
    if (rows[0].status !== "pending")
      return { success: false, error: "Update is not pending." };

    const { restaurant_id, changes } = rows[0] as {
      restaurant_id: number;
      changes: Record<string, unknown>;
    };

    // Apply changes to the restaurants table
    const setClauses: string[] = [];
    const params: unknown[] = [];

    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) continue;
      setClauses.push(`${key} = ${params.length + 1}`);
      if (Array.isArray(value)) {
        params.push(value);
      } else if (typeof value === "object") {
        params.push(JSON.stringify(value));
      } else {
        params.push(value);
      }
    }

    if (setClauses.length > 0) {
      params.push(restaurant_id);
      await sql().query(
        `update restaurants set ${setClauses.join(", ")} where id = ${params.length}`,
        params,
      );
    }

    // Mark as approved
    await sql()`
      update restaurant_updates
      set status = 'approved', reviewed_at = now()
      where id = ${data.update_id}
    `;

    return { success: true };
  },
);

// ── Reject update (admin) ────────────────────────────────────────────────────

export const rejectUpdate = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { update_id: number; notes?: string };
  }) => {
    await createRestaurantUpdatesTable(sql());

    const rows = await sql()`
      select id, status from restaurant_updates where id = ${data.update_id} limit 1
    `;
    if (rows.length === 0)
      return { success: false, error: "Update not found." };
    if (rows[0].status !== "pending")
      return { success: false, error: "Update is not pending." };

    await sql()`
      update restaurant_updates
      set status = 'rejected', reviewed_at = now(), notes = coalesce(notes, '') || ' ' || ${(data.notes ?? "").trim()}
      where id = ${data.update_id}
    `;

    return { success: true };
  },
);

// ── Route Planner: find restaurants along a driving route ───────────────────

interface RouteCity {
  name: string;
  restaurants: Record<string, unknown>[];
}

export const findRestaurantsAlongRoute = createServerFn({ method: "GET" }).handler(
  async ({
    data,
  }: {
    data: { origin: string; destination: string };
  }) => {
    const { origin, destination } = data;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return { error: "Google Maps API key not configured." };
    }

    await createRestaurantsTable(sql());

    // 1. Geocode origin and destination to get cities
    const geocodeUrl = (address: string) =>
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const [originGeo, destGeo] = await Promise.all([
      fetch(geocodeUrl(origin)).then((r) => r.json()),
      fetch(geocodeUrl(destination)).then((r) => r.json()),
    ]);

    const extractCity = (geo: { results?: { address_components?: { types: string[]; long_name: string }[] }[] }) => {
      if (!geo.results?.length) return null;
      for (const comp of geo.results[0].address_components ?? []) {
        if (comp.types.includes("locality")) return comp.long_name;
      }
      return null;
    };

    const originCity = extractCity(originGeo);
    const destCity = extractCity(destGeo);

    // 2. Call Directions API for route summary
    const dirUrl =
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;
    const dirRes = await fetch(dirUrl).then((r) => r.json()) as {
      status: string; error_message?: string;
      routes?: { legs?: { distance?: { text: string }; duration?: { text: string }; steps?: { html_instructions?: string }[] }[] }[];
    };

    // Check for Directions API errors (key not authorized, billing disabled, etc.)
    if (dirRes.status !== "OK" && dirRes.status !== "ZERO_RESULTS") {
      const googleMsg = dirRes.error_message ?? dirRes.status;
      return { error: `Directions API error: ${googleMsg}. The API key may not have the Directions API enabled.` };
    }

    let distance = "";
    let duration = "";
    const citiesFound = new Set<string>();

    if (dirRes.routes?.length) {
      const leg = dirRes.routes[0].legs?.[0];
      if (leg) {
        distance = leg.distance?.text ?? "";
        duration = leg.duration?.text ?? "";

        // Extract city names from html_instructions
        const knownCities = ["Austin", "St. Louis", "Sarasota", "Chicago", "Dallas",
          "Denver", "Nashville", "Portland", "Houston",
          "San Antonio", "Waco", "Round Rock", "Georgetown", "Temple", "Killeen",
          "Springfield", "Rolla", "Columbia", "Memphis", "Little Rock",
          "Oklahoma City", "Tulsa", "New Orleans", "Baton Rouge"];
        const allInstructions = leg.steps?.map((s: { html_instructions?: string }) =>
          s.html_instructions ?? "").join(" ") ?? "";

        for (const city of knownCities) {
          if (allInstructions.includes(city)) {
            citiesFound.add(city);
          }
        }
      }
    }

    // Always include origin and destination cities
    if (originCity) citiesFound.add(originCity);
    if (destCity) citiesFound.add(destCity);

    // 3. Query restaurants for all found cities
    const citiesArr = [...citiesFound];
    if (citiesArr.length === 0) {
      return { distance, duration, cities: [] };
    }

    // Build parameterized query
    const placeholders = citiesArr.map((_, i) => `$${i + 1}`).join(", ");
    const queryStr = `select * from restaurants where city ilike any(array[${placeholders}]) order by city asc, safety_tier asc, name asc`;
    const rows = await sql().query(queryStr, citiesArr.map((c) => c.trim()));

    const all = rows.map((r: Record<string, unknown>) => ({
      ...r,
      created_at: String(r.created_at),
    }));

    // Group by city
    const cityMap = new Map<string, Record<string, unknown>[]>();
    for (const r of all) {
      const c = (r.city as string) || "Unknown";
      if (!cityMap.has(c)) cityMap.set(c, []);
      cityMap.get(c)!.push(r);
    }

    // Return in order: origin city first, then destination, then intermediates
    // Include ALL cities, even empty ones (so the UI can show "Suggest" / "Discover" links)
    const result: RouteCity[] = [];
    for (const c of citiesArr) {
      const restaurants = cityMap.get(c) ?? [];
      result.push({ name: c, restaurants });
      cityMap.delete(c);
    }
    // Any remaining cities
    for (const [c, restaurants] of cityMap) {
      result.push({ name: c, restaurants });
    }

    return { distance, duration, cities: result };
  },
);

// ── Google Places discovery ──────────────────────────────────────────────────

export const discoverRestaurants = createServerFn({ method: "GET" }).handler(
  async ({
    data,
  }: {
    data: {
      city: string;
      type?: string;
    };
  }) => {
    const { city, type } = data;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Google Maps API key not configured." };
    }

    const trimmedCity = city.trim();
    if (!trimmedCity) {
      return { success: false, error: "City name is required." };
    }

    await createRestaurantsTable(sql());

    // Fetch existing restaurant names in this city to filter out duplicates
    const existingRows = await sql()`
      select name from restaurants where city ilike ${trimmedCity}
    `;
    const existingNames = new Set(
      existingRows.map((r: Record<string, unknown>) =>
        (r.name as string).toLowerCase(),
      ),
    );

    // Call Google Places Text Search
    const query = type
      ? `${type} restaurants in ${trimmedCity}`
      : `restaurants in ${trimmedCity}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

    let suggestions: { name: string; address: string }[] = [];
    try {
      const res = await fetch(url);
      const json = (await res.json()) as {
        status: string;
        results?: { name: string; formatted_address: string }[];
      };

      if (json.status === "OK" && json.results) {
        suggestions = json.results
          .map((r) => ({
            name: r.name,
            address: r.formatted_address ?? "",
          }))
          .filter((r) => !existingNames.has(r.name.toLowerCase()))
          .slice(0, 20);
      }
    } catch (err) {
      console.error("Google Places error:", err);
      return { success: false, error: "Failed to fetch from Google Places." };
    }

    return { success: true, suggestions };
  },
);

// ── Idempotent insert for venue submissions ──────────────────────────────────

export interface VenueSubmissionData {
  restaurantName: string;
  streetAddress: string;
  city: string;
  state: string;
  dietaryNeeds: string[];
  assignedTier: number;
  dedicatedFacility: "yes" | "no" | "";
  dedicatedFryer: "yes" | "no" | "na" | "";
  colorCodedTools: "yes" | "no" | "";
  staffTraining: "yes" | "no" | "";
}

/**
 * Insert a venue submission into the main restaurants table.
 * Idempotent: skips if a restaurant with the same name + address already exists.
 * Called from the submitQuestionnaire server function.
 */
export async function insertRestaurantFromSubmission(
  sqlClient: ReturnType<typeof import("@neondatabase/serverless").neon>,
  data: VenueSubmissionData,
): Promise<{ inserted: boolean; message: string }> {
  // Ensure the table exists
  await sqlClient`create table if not exists restaurants (
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

  // Check for duplicates (same name + address)
  const existing = await sqlClient`
    select id from restaurants
    where name = ${data.restaurantName.trim()}
    and address = ${data.streetAddress.trim()}
    limit 1
  `;

  if (existing.length > 0) {
    return { inserted: false, message: `"${data.restaurantName}" already exists in restaurants — skipping.` };
  }

  // Map boolean fields from submission
  const isDedicated = data.dedicatedFacility === "yes";
  const hasDedicatedFryer = isDedicated ? true : data.dedicatedFryer === "yes";
  const hasIsolatedPrep = isDedicated ? true : data.colorCodedTools === "yes";
  const allergenTrainedStaff = isDedicated ? true : data.staffTraining === "yes";

  // Map dietary needs to canonical allergen names
  const mappedDietaryNeeds = data.dietaryNeeds.flatMap((need: string) => {
    if (need === "Gluten-Free / Celiac-Safe") return ["Gluten"];
    if (need === "Dairy-Free") return ["Dairy"];
    if (need === "Peanut / Tree Nut-Free") return ["Peanuts", "Tree Nuts"];
    if (need === "Shellfish-Free") return ["Shellfish"];
    return [need];
  });
  await sqlClient`insert into restaurants (
    name, address, city, state, cuisine_type, safety_tier,
    has_dedicated_fryer, has_isolated_prep, allergen_trained_staff,
    free_from, verified
  ) values (
    ${data.restaurantName.trim()},
    ${data.streetAddress.trim()},
    ${data.city.trim()},
    ${data.state.trim()},
    'Recommended by community',
    ${data.assignedTier},
    ${hasDedicatedFryer},
    ${hasIsolatedPrep},
    ${allergenTrainedStaff},
    ${mappedDietaryNeeds},
    false
  )`;

  return { inserted: true, message: `"${data.restaurantName}" inserted into restaurants at Tier ${data.assignedTier}.` };
}

// ── Quick update: set contact_email for a restaurant ──────────────────────────

export const quickUpdateRestaurantEmail = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { id: number; contact_email: string | null } }) => {
    await createRestaurantsTable(sql());
    await sql()`update restaurants set contact_email = ${data.contact_email} where id = ${data.id}`;
    return { success: true };
  },
);

// ── Bulk match: resolve restaurant names + emails to DB rows ──────────────────

export interface BulkMatchRow {
  name: string;
  email: string;
}

export interface BulkMatchResult {
  inputName: string;
  email: string;
  matched: boolean;
  matchType: "exact" | "partial" | "none";
  restaurantId: number | null;
  restaurantName: string | null;
  restaurantCity: string | null;
}

export const bulkMatchRestaurants = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { rows: BulkMatchRow[] } }) => {
    await createRestaurantsTable(sql());
    const results: BulkMatchResult[] = [];

    for (const row of data.rows) {
      const trimmedName = row.name.trim();
      if (!trimmedName) {
        results.push({
          inputName: row.name,
          email: row.email,
          matched: false,
          matchType: "none",
          restaurantId: null,
          restaurantName: null,
          restaurantCity: null,
        });
        continue;
      }

      // Try exact match first (case-insensitive)
      const exact = await sql()`
        select id, name, city from restaurants
        where name ilike ${trimmedName}
        limit 1
      `;

      if (exact.length > 0) {
        results.push({
          inputName: row.name,
          email: row.email,
          matched: true,
          matchType: "exact",
          restaurantId: exact[0].id as number,
          restaurantName: exact[0].name as string,
          restaurantCity: exact[0].city as string,
        });
        continue;
      }

      // Try partial match: name contains input or input contains name
      const partial = await sql()`
        select id, name, city from restaurants
        where name ilike ${"%" + trimmedName + "%"}
           or ${trimmedName} ilike '%' || name || '%'
        limit 1
      `;

      if (partial.length > 0) {
        results.push({
          inputName: row.name,
          email: row.email,
          matched: false,
          matchType: "partial",
          restaurantId: partial[0].id as number,
          restaurantName: partial[0].name as string,
          restaurantCity: partial[0].city as string,
        });
      } else {
        results.push({
          inputName: row.name,
          email: row.email,
          matched: false,
          matchType: "none",
          restaurantId: null,
          restaurantName: null,
          restaurantCity: null,
        });
      }
    }

    return results;
  },
);

// ── Bulk import: update contact_emails for matched restaurants ────────────────

export const bulkImportEmails = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { rows: { id: number; email: string }[] } }) => {
    await createRestaurantsTable(sql());
    let updated = 0;
    for (const row of data.rows) {
      if (!row.id || !row.email?.trim()) continue;
      await sql()`update restaurants set contact_email = ${row.email.trim()} where id = ${row.id}`;
      updated++;
    }
    return { success: true, updated };
  },
);

// ── Austin restaurant data ───────────────────────────────────────────────────

export interface RestaurantSeed {
  name: string;
  address: string;
  cuisine_type: string;
  safety_tier: 1 | 2 | 3;
  has_dedicated_fryer: boolean;
  has_isolated_prep: boolean;
  allergen_trained_staff: boolean;
  free_from: string[];
  allergens_handled: string[];
  description: string;
  website: string;
  phone: string;
  image_url: string;
  verified: boolean;
}

export function getAustinRestaurants(): RestaurantSeed[] {
  return [
    // ═══ TIER 1: 100% Dedicated Facilities (emerald) ═══
    {
      name: "Wilder Wood",
      address: "1300 E 7th St, Austin, TX 78702",
      cuisine_type: "Gluten-Free American",
      safety_tier: 1,
      has_dedicated_fryer: true,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "soy", "eggs"],
      description: "Austin's only 100% dedicated gluten-free restaurant and bar. Every dish from fried chicken to onion rings is completely celiac-safe with zero cross-contamination risk.",
      website: "https://wilderwoodrestaurant.com",
      phone: "(512) 524-2000",
      image_url: "",
      verified: true,
    },
    {
      name: "The Well",
      address: "440 W 2nd St, Austin, TX 78701",
      cuisine_type: "Gluten-Free Bakery & Cafe",
      safety_tier: 1,
      has_dedicated_fryer: true,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "soy", "nuts"],
      description: "Dedicated gluten-free bakery and cafe in downtown Austin. Pastries, breads, sandwiches, and full coffee program — all 100% gluten-free facility.",
      website: "https://thewellaustin.com",
      phone: "(512) 555-0180",
      image_url: "",
      verified: true,
    },
    {
      name: "Zucchini Kill Bakery",
      address: "701 E 53rd St, Austin, TX 78751",
      cuisine_type: "Vegan & Gluten-Free Bakery",
      safety_tier: 1,
      has_dedicated_fryer: false,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["dairy", "eggs", "gluten", "peanuts", "sesame", "tree nuts"],
      allergens_handled: ["gluten", "dairy", "eggs", "soy"],
      description: "Woman-owned, punk-rock inspired vegan and gluten-free bakery. Cupcakes, donuts, and custom cakes — completely free from animal products and gluten.",
      website: "https://zucchinikill.com",
      phone: "(512) 555-0181",
      image_url: "",
      verified: true,
    },
    {
      name: "Gati Ice Cream",
      address: "1512 Holly St, Austin, TX 78702",
      cuisine_type: "Gluten-Free & Vegan Ice Cream",
      safety_tier: 1,
      has_dedicated_fryer: false,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["dairy", "eggs", "gluten", "peanuts", "sesame", "soy", "tree nuts"],
      allergens_handled: ["gluten", "dairy", "eggs", "coconut"],
      description: "100% gluten-free, dairy-free, and egg-free ice cream shop using coconut milk base. All waffle cones are gluten-free. Celiac-safe facility.",
      website: "https://gatiicecream.com",
      phone: "(512) 555-0182",
      image_url: "",
      verified: true,
    },
    {
      name: "ATX Food Co.",
      address: "517 S Lamar Blvd, Austin, TX 78704",
      cuisine_type: "Gluten-Free Meal Prep",
      safety_tier: 1,
      has_dedicated_fryer: true,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "soy", "nuts"],
      description: "Dedicated gluten-free meal delivery and pickup service. Fully celiac-safe kitchen producing ready-to-eat meals, snacks, and baked goods.",
      website: "https://atxfoodco.com",
      phone: "(512) 555-0183",
      image_url: "",
      verified: true,
    },

    // ═══ TIER 2: Certified Allergen Protocols (amber) ═══
    {
      name: "Picnik",
      address: "1600 S 1st St, Austin, TX 78704",
      cuisine_type: "Gluten-Free American",
      safety_tier: 2,
      has_dedicated_fryer: true,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["gluten", "peanuts"],
      allergens_handled: ["gluten", "dairy", "soy", "peanuts", "tree nuts"],
      description: "Butter-coffee and healthy comfort food spot with extensive gluten-free and paleo options. Dedicated gluten-free fryers and rigorous allergy protocols.",
      website: "https://picnikaustin.com",
      phone: "(512) 555-0184",
      image_url: "",
      verified: true,
    },
    {
      name: "True Food Kitchen",
      address: "222 West Ave, Austin, TX 78701",
      cuisine_type: "Health-Conscious American",
      safety_tier: 2,
      has_dedicated_fryer: false,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["gluten", "peanuts"],
      allergens_handled: ["gluten", "dairy", "soy", "peanuts", "tree nuts", "shellfish"],
      description: "Seasonal, health-driven restaurant with detailed allergen matrix. Staff trained on all major allergens; kitchen can isolate prep for most dietary needs.",
      website: "https://truefoodkitchen.com",
      phone: "(512) 555-0185",
      image_url: "",
      verified: true,
    },
    {
      name: "Flower Child",
      address: "500 W 2nd St, Austin, TX 78701",
      cuisine_type: "Health-Conscious Bowls",
      safety_tier: 2,
      has_dedicated_fryer: false,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["gluten", "peanuts"],
      allergens_handled: ["gluten", "dairy", "soy", "peanuts", "tree nuts", "eggs"],
      description: "Fast-casual spot with extensive gluten-free, dairy-free, and vegan options clearly labeled. Separate prep areas for allergen-sensitive dishes.",
      website: "https://iamaflowerchild.com",
      phone: "(512) 555-0186",
      image_url: "",
      verified: true,
    },
    {
      name: "Honest Mary's",
      address: "4800 Burnet Rd, Austin, TX 78756",
      cuisine_type: "Healthy Bowls & Salads",
      safety_tier: 2,
      has_dedicated_fryer: false,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["gluten", "dairy", "tree nuts"],
      allergens_handled: ["gluten", "dairy", "soy", "peanuts", "tree nuts"],
      description: "Build-your-own grain bowls with transparent ingredient sourcing. All allergens clearly marked; kitchen follows strict cross-contact protocols.",
      website: "https://honestmarys.com",
      phone: "(512) 555-0187",
      image_url: "",
      verified: true,
    },
    {
      name: "Bouldin Creek Cafe",
      address: "1900 S 1st St, Austin, TX 78704",
      cuisine_type: "Vegetarian & Vegan",
      safety_tier: 2,
      has_dedicated_fryer: true,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["eggs", "tree nuts"],
      allergens_handled: ["gluten", "dairy", "soy", "nuts", "eggs"],
      description: "Iconic South Austin vegetarian cafe with extensive vegan and gluten-free options. Dedicated fryer for gluten-free items and knowledgeable staff.",
      website: "https://bouldincreekcafe.com",
      phone: "(512) 555-0188",
      image_url: "",
      verified: true,
    },
    {
      name: "Nancy's Sky Garden",
      address: "10900 Lakeline Mall Dr, Austin, TX 78717",
      cuisine_type: "Asian Fusion Bowls",
      safety_tier: 2,
      has_dedicated_fryer: false,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["gluten", "dairy", "tree nuts"],
      allergens_handled: ["gluten", "soy", "peanuts", "shellfish"],
      description: "Fresh Asian-inspired bowls with clear allergen labeling. Gluten-free soy sauce available; staff trained on celiac and allergy protocols.",
      website: "https://nancysskygarden.com",
      phone: "(512) 555-0189",
      image_url: "",
      verified: true,
    },
    {
      name: "Koriente",
      address: "621 E 7th St, Austin, TX 78701",
      cuisine_type: "Korean-Inspired Healthy",
      safety_tier: 2,
      has_dedicated_fryer: false,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["dairy", "eggs", "soy"],
      allergens_handled: ["gluten", "soy", "shellfish"],
      description: "Downtown lunch spot with gluten-free and vegan-friendly Korean-inspired bowls. Staff takes allergies seriously and can modify most dishes.",
      website: "https://koriente.com",
      phone: "(512) 555-0190",
      image_url: "",
      verified: true,
    },
    {
      name: "Casa de Luz",
      address: "1701 Toomey Rd, Austin, TX 78704",
      cuisine_type: "Macrobiotic Vegan",
      safety_tier: 2,
      has_dedicated_fryer: false,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["dairy", "soy"],
      allergens_handled: ["gluten", "soy", "nuts"],
      description: "Community dining experience serving organic, plant-based, macrobiotic meals. Set menu daily with all ingredients transparently listed. No dairy or eggs on premises.",
      website: "https://casadeluz.org",
      phone: "(512) 555-0191",
      image_url: "",
      verified: true,
    },
    {
      name: "Blue Sushi Sake Grill",
      address: "3131 Palm Way, Austin, TX 78758",
      cuisine_type: "Japanese Sushi",
      safety_tier: 2,
      has_dedicated_fryer: true,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["dairy", "eggs", "soy"],
      allergens_handled: ["gluten", "soy", "shellfish", "fish", "eggs"],
      description: "Sustainable sushi restaurant with a dedicated gluten-free menu and fryer. Separate prep station for allergen-sensitive rolls. Extensive vegan sushi options.",
      website: "https://bluesushisakegrill.com",
      phone: "(512) 555-0192",
      image_url: "",
      verified: true,
    },
    {
      name: "Modern Market Eatery",
      address: "3200 Palm Way, Austin, TX 78758",
      cuisine_type: "Health-Conscious Fast Casual",
      safety_tier: 2,
      has_dedicated_fryer: false,
      has_isolated_prep: true,
      allergen_trained_staff: true,
      free_from: ["dairy", "eggs", "fish"],
      allergens_handled: ["gluten", "dairy", "soy", "eggs", "nuts"],
      description: "Fast-casual eatery with detailed allergen and nutrition filter on their digital menu. Gluten-free pizza crust and bread available with separate prep.",
      website: "https://modernmarket.com",
      phone: "(512) 555-0193",
      image_url: "",
      verified: true,
    },

    // ═══ TIER 3: Dietary-Friendly (sky) ═══
    // ── Tex-Mex & Mexican ──
    {
      name: "Torchy's Tacos",
      address: "1311 S 1st St, Austin, TX 78704",
      cuisine_type: "Tex-Mex",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["dairy", "fish"],
      allergens_handled: ["gluten", "dairy"],
      description: "Damn good tacos with gluten-free corn tortillas available upon request. Several locations around Austin. Not a gluten-free kitchen but will accommodate requests.",
      website: "https://torchystacos.com",
      phone: "(512) 555-0194",
      image_url: "",
      verified: true,
    },
    {
      name: "Tacodeli",
      address: "1500 Spyglass Dr, Austin, TX 78746",
      cuisine_type: "Mexican",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten", "sesame"],
      allergens_handled: ["gluten", "dairy"],
      description: "Austin-born taqueria using locally-sourced ingredients. Many tacos are naturally gluten-free on corn tortillas. Inform staff of allergies.",
      website: "https://tacodeli.com",
      phone: "(512) 555-0195",
      image_url: "",
      verified: true,
    },
    {
      name: "Veracruz All Natural",
      address: "2505 Webberville Rd, Austin, TX 78702",
      cuisine_type: "Mexican",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten", "sesame"],
      allergens_handled: ["gluten", "dairy"],
      description: "Famous for migas tacos, this East Austin trailer serves fresh, handmade corn tortillas. Many items are naturally gluten-free. Busy kitchen — mention allergies.",
      website: "https://veracruzallnatural.com",
      phone: "(512) 555-0196",
      image_url: "",
      verified: true,
    },
    {
      name: "Suerte",
      address: "1800 E 6th St, Austin, TX 78702",
      cuisine_type: "Upscale Mexican",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["gluten", "sesame"],
      allergens_handled: ["gluten", "dairy", "nuts"],
      description: "Award-winning Mexican restaurant with house-made masa. Staff is well-trained on allergens and the kitchen can accommodate most dietary restrictions with notice.",
      website: "https://suerteatx.com",
      phone: "(512) 555-0197",
      image_url: "",
      verified: true,
    },
    {
      name: "La Condesa",
      address: "400 W 2nd St, Austin, TX 78701",
      cuisine_type: "Modern Mexican",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "nuts", "shellfish"],
      description: "Downtown modern Mexican with a dedicated gluten-free menu section. Knowledgeable staff and kitchen willing to modify dishes for allergies.",
      website: "https://lacondesa.com",
      phone: "(512) 555-0198",
      image_url: "",
      verified: true,
    },
    {
      name: "Matt's El Rancho",
      address: "2613 S Lamar Blvd, Austin, TX 78704",
      cuisine_type: "Tex-Mex",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy"],
      description: "Austin institution since 1952. Massive Tex-Mex plates with gluten-free corn tortillas available. Kitchen handles high volume — best for mild sensitivities.",
      website: "https://mattselrancho.com",
      phone: "(512) 555-0199",
      image_url: "",
      verified: true,
    },
    {
      name: "Fresa's",
      address: "1703 S 1st St, Austin, TX 78704",
      cuisine_type: "Mexican",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "soy"],
      description: "Wood-grilled Mexican chicken and tacos on South 1st. Corn tortillas are standard; gluten-free sides available. Inform staff of severe allergies.",
      website: "https://fresaschicken.com",
      phone: "(512) 555-0200",
      image_url: "",
      verified: true,
    },
    {
      name: "El Naranjo",
      address: "2717 S Lamar Blvd, Austin, TX 78704",
      cuisine_type: "Authentic Oaxacan",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "nuts"],
      description: "Award-winning Oaxacan cuisine with house-made moles and corn-based dishes. Chef Iliana de la Vega accommodates dietary needs; many dishes naturally gluten-free.",
      website: "https://elnaranjorestaurant.com",
      phone: "(512) 555-0201",
      image_url: "",
      verified: true,
    },

    // ── BBQ ──
    {
      name: "Franklin Barbecue",
      address: "900 E 11th St, Austin, TX 78702",
      cuisine_type: "Texas BBQ",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten"],
      description: "World-famous Texas BBQ. Most meats are naturally gluten-free (no sauce on the meat), but cross-contamination is possible in a high-volume kitchen. Arrive early.",
      website: "https://franklinbbq.com",
      phone: "(512) 555-0202",
      image_url: "",
      verified: true,
    },
    {
      name: "Terry Black's Barbecue",
      address: "1003 Barton Springs Rd, Austin, TX 78704",
      cuisine_type: "Texas BBQ",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy"],
      description: "Family-run BBQ joint near Zilker Park. Meats are smoked without gluten-containing ingredients. Sides vary — ask about flour-based thickeners.",
      website: "https://terryblacksbbq.com",
      phone: "(512) 555-0203",
      image_url: "",
      verified: true,
    },
    {
      name: "La Barbecue",
      address: "2401 E Cesar Chavez St, Austin, TX 78702",
      cuisine_type: "Texas BBQ",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["dairy"],
      allergens_handled: ["gluten"],
      description: "East Austin craft BBQ with legendary brisket. Most meats are gluten-free; ask for no bread. Sausages may contain fillers — check with staff.",
      website: "https://labarbecue.com",
      phone: "(512) 555-0204",
      image_url: "",
      verified: true,
    },
    {
      name: "Micklethwait Craft Meats",
      address: "1309 Rosewood Ave, Austin, TX 78702",
      cuisine_type: "Texas BBQ",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy"],
      description: "East Austin BBQ trailer with scratch-made sides. Meats are gluten-free; many sides too. Clear labeling on menu for common allergens.",
      website: "https://craftmeatsaustin.com",
      phone: "(512) 555-0205",
      image_url: "",
      verified: true,
    },
    {
      name: "Stiles Switch BBQ",
      address: "6610 N Lamar Blvd, Austin, TX 78752",
      cuisine_type: "Texas BBQ",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["dairy"],
      allergens_handled: ["gluten", "dairy"],
      description: "North Austin BBQ and brew with a laid-back vibe. Smoked meats are gluten-free; sides vary. Dedicated gluten-free menu available on request.",
      website: "https://stilesswitchbbq.com",
      phone: "(512) 555-0206",
      image_url: "",
      verified: true,
    },

    // ── Asian ──
    {
      name: "Ramen Tatsu-Ya",
      address: "1600 E 6th St, Austin, TX 78702",
      cuisine_type: "Japanese Ramen",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "soy", "eggs"],
      description: "Beloved Austin ramen shop. Gluten-free rice noodles available as substitute. Broth is soy-based — not suitable for soy allergies. Very busy kitchen.",
      website: "https://ramen-tatsuya.com",
      phone: "(512) 555-0207",
      image_url: "",
      verified: true,
    },
    {
      name: "Uchi",
      address: "801 S Lamar Blvd, Austin, TX 78704",
      cuisine_type: "Japanese Fine Dining",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "soy", "shellfish", "fish"],
      description: "James Beard award-winning Japanese restaurant. Staff is exceptionally trained and can navigate allergies. Gluten-free tamari available. Notify when reserving.",
      website: "https://uchiaustin.com",
      phone: "(512) 555-0208",
      image_url: "",
      verified: true,
    },
    {
      name: "Loro",
      address: "2115 S Lamar Blvd, Austin, TX 78704",
      cuisine_type: "Asian Smokehouse",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "soy", "dairy", "nuts"],
      description: "Franklin BBQ x Uchi collaboration — Asian smokehouse. Many gluten-free items on menu; detailed allergen guide available. Communal seating.",
      website: "https://loroaustin.com",
      phone: "(512) 555-0209",
      image_url: "",
      verified: true,
    },
    {
      name: "Elizabeth Street Cafe",
      address: "1501 S 1st St, Austin, TX 78704",
      cuisine_type: "Vietnamese-French",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["dairy"],
      allergens_handled: ["gluten", "soy", "shellfish", "eggs"],
      description: "Charming Vietnamese cafe and bakery. Rice noodles available for most dishes. Gluten-free menu items noted; bakery uses wheat flour throughout.",
      website: "https://elizabethstreetcafe.com",
      phone: "(512) 555-0210",
      image_url: "",
      verified: true,
    },
    {
      name: "Sway",
      address: "1417 S 1st St, Austin, TX 78704",
      cuisine_type: "Modern Thai",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "soy", "shellfish", "peanuts"],
      description: "Modern Thai with a detailed allergen menu. Many curries are naturally gluten-free. Gluten-free soy sauce available. Peanuts and shellfish widely used.",
      website: "https://swayaustin.com",
      phone: "(512) 555-0211",
      image_url: "",
      verified: true,
    },
    {
      name: "Titaya's Thai Cuisine",
      address: "5501 N Lamar Blvd, Austin, TX 78751",
      cuisine_type: "Thai",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["dairy"],
      allergens_handled: ["gluten", "soy", "shellfish", "peanuts"],
      description: "North Austin staple for authentic Thai. Many curry dishes are naturally gluten-free. Gluten-free soy sauce available on request. Always busy.",
      website: "https://titayasthaicuisine.com",
      phone: "(512) 555-0212",
      image_url: "",
      verified: true,
    },

    // ── Indian ──
    {
      name: "Clay Pit",
      address: "1601 Guadalupe St, Austin, TX 78701",
      cuisine_type: "Indian",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "nuts"],
      description: "Upscale Indian in a historic downtown building. Many dishes are naturally gluten-free (rice-based). Extensive dairy use in curries — vegan options limited.",
      website: "https://claypit.com",
      phone: "(512) 555-0213",
      image_url: "",
      verified: true,
    },
    {
      name: "Nasha",
      address: "1614 E 7th St, Austin, TX 78702",
      cuisine_type: "Indian-Tex Mex Fusion",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["eggs"],
      allergens_handled: ["gluten", "dairy"],
      description: "Unique Indian-Tex Mex fusion on East 7th. Gluten-free corn and rice options. Dairy used in many sauces — ask about modifications.",
      website: "https://nashaaustin.com",
      phone: "(512) 555-0214",
      image_url: "",
      verified: true,
    },

    // ── Pizza ──
    {
      name: "Home Slice Pizza",
      address: "1415 S Congress Ave, Austin, TX 78704",
      cuisine_type: "NY-Style Pizza",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy"],
      description: "Iconic South Congress NY-style pizza joint. Gluten-free crust available but baked in same oven as wheat pizzas. Not suitable for celiac diners.",
      website: "https://homeslicepizza.com",
      phone: "(512) 555-0215",
      image_url: "",
      verified: true,
    },
    {
      name: "Via 313",
      address: "1111 E 6th St, Austin, TX 78702",
      cuisine_type: "Detroit-Style Pizza",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy"],
      description: "Award-winning Detroit-style deep dish. Gluten-free crust available at all locations. Shared kitchen — cross-contamination risk for severe allergies.",
      website: "https://via313.com",
      phone: "(512) 555-0216",
      image_url: "",
      verified: true,
    },
    {
      name: "East Side Pies",
      address: "1401 Rosewood Ave, Austin, TX 78702",
      cuisine_type: "Pizza",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["fish", "shellfish"],
      allergens_handled: ["gluten", "dairy"],
      description: "East Austin neighborhood pizza with creative toppings. Gluten-free and dairy-free options available. Shared prep space — inform staff of allergies.",
      website: "https://eastsidepies.com",
      phone: "(512) 555-0217",
      image_url: "",
      verified: true,
    },

    // ── Burgers & American ──
    {
      name: "P. Terry's Burger Stand",
      address: "404 S Lamar Blvd, Austin, TX 78704",
      cuisine_type: "Burgers",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["fish", "shellfish"],
      allergens_handled: ["gluten", "dairy", "soy"],
      description: "Austin's local burger chain. Lettuce wraps available for gluten-free orders. Fries are cooked in shared fryers. Good for mild sensitivities.",
      website: "https://pterrys.com",
      phone: "(512) 555-0218",
      image_url: "",
      verified: true,
    },
    {
      name: "Hopdoddy Burger Bar",
      address: "1400 S Congress Ave, Austin, TX 78704",
      cuisine_type: "Burgers",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["fish", "shellfish"],
      allergens_handled: ["gluten", "dairy", "eggs"],
      description: "Gourmet burger bar on South Congress. Gluten-free buns available. Separate fryer for fries at some locations — ask before ordering.",
      website: "https://hopdoddy.com",
      phone: "(512) 555-0219",
      image_url: "",
      verified: true,
    },
    {
      name: "Counter Culture",
      address: "2337 E Cesar Chavez St, Austin, TX 78702",
      cuisine_type: "Vegan Comfort Food",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["shellfish"],
      allergens_handled: ["gluten", "soy", "nuts"],
      description: "East Austin vegan diner with gluten-free options. All plant-based; dairy and egg-free facility. Gluten-free items marked but shared kitchen.",
      website: "https://countercultureaustin.com",
      phone: "(512) 555-0220",
      image_url: "",
      verified: true,
    },
    {
      name: "Better Half Coffee & Cocktails",
      address: "406 Walsh St, Austin, TX 78703",
      cuisine_type: "American Cafe",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["dairy", "eggs", "shellfish", "soy"],
      allergens_handled: ["gluten", "dairy", "eggs"],
      description: "All-day cafe with gluten-free bread and vegan options. Staff is knowledgeable about menu ingredients. Great for casual dining with mixed dietary needs.",
      website: "https://betterhalfbar.com",
      phone: "(512) 555-0221",
      image_url: "",
      verified: true,
    },
    {
      name: "Paperboy",
      address: "1203 E 11th St, Austin, TX 78702",
      cuisine_type: "Brunch & American",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["dairy", "eggs"],
      allergens_handled: ["gluten", "dairy", "eggs", "nuts"],
      description: "Popular East Austin brunch spot with a rooftop patio. Gluten-free modifications available for most dishes. Kitchen is small — best for mild-to-moderate sensitivities.",
      website: "https://paperboyaustin.com",
      phone: "(512) 555-0222",
      image_url: "",
      verified: true,
    },
    {
      name: "June's All Day",
      address: "1722 S Congress Ave, Austin, TX 78704",
      cuisine_type: "American Bistro",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "eggs", "shellfish"],
      description: "Chic South Congress bistro from James Beard winner. Well-trained staff happy to accommodate dietary needs. Gluten-free and dairy-free modifications available.",
      website: "https://junesallday.com",
      phone: "(512) 555-0223",
      image_url: "",
      verified: true,
    },
    {
      name: "Odd Duck",
      address: "1201 S Lamar Blvd, Austin, TX 78704",
      cuisine_type: "Farm-to-Table American",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "nuts", "shellfish"],
      description: "Farm-to-table small plates with seasonal menus. Staff is well-versed in all ingredients and can guide allergy-safe choices. Menu changes frequently.",
      website: "https://oddduckaustin.com",
      phone: "(512) 555-0224",
      image_url: "",
      verified: true,
    },
    {
      name: "Emmer & Rye",
      address: "51 Rainey St, Austin, TX 78701",
      cuisine_type: "Farm-to-Table New American",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "nuts", "eggs"],
      description: "Award-winning seasonal small plates on Rainey Street. Heirloom grains are central to the concept — gluten-free diners should discuss options in advance.",
      website: "https://emmerandrye.com",
      phone: "(512) 555-0225",
      image_url: "",
      verified: true,
    },

    // ── More Austin Favorites ──
    {
      name: "Banger's Sausage House & Beer Garden",
      address: "81 Rainey St, Austin, TX 78701",
      cuisine_type: "German & Sausage",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy"],
      description: "Rainey Street beer garden with 100+ taps and house-made sausages. Gluten-free buns available. Sausage fillers vary — check individual ingredients.",
      website: "https://bangersaustin.com",
      phone: "(512) 555-0226",
      image_url: "",
      verified: true,
    },
    {
      name: "Moonshine Patio Bar & Grill",
      address: "303 Red River St, Austin, TX 78701",
      cuisine_type: "Southern Comfort",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "eggs"],
      description: "Southern comfort food in a historic downtown building. Gluten-free menu available on request. Cornmeal breaded items may be fried in shared oil.",
      website: "https://moonshinegrill.com",
      phone: "(512) 555-0227",
      image_url: "",
      verified: true,
    },
    {
      name: "Josephine House",
      address: "1601 Waterston Ave, Austin, TX 78703",
      cuisine_type: "American Fine Dining",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: true,
      free_from: ["shellfish"],
      allergens_handled: ["gluten", "dairy", "nuts", "eggs"],
      description: "Elegant Clarksville cottage serving refined American fare. Staff takes allergies seriously; best to note dietary needs when making reservations.",
      website: "https://josephineofaustin.com",
      phone: "(512) 555-0228",
      image_url: "",
      verified: true,
    },
    {
      name: "Bird Bird Biscuit",
      address: "2701 Manor Rd, Austin, TX 78722",
      cuisine_type: "Southern Biscuits",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "eggs"],
      description: "Cherrywood neighborhood biscuit shop. Gluten-free biscuits available but prepared in shared kitchen. Best for dairy and egg concerns rather than celiac.",
      website: "https://birdbirdbiscuit.com",
      phone: "(512) 555-0229",
      image_url: "",
      verified: true,
    },
    {
      name: "Phoebe's Diner",
      address: "533 W Oltorf St, Austin, TX 78704",
      cuisine_type: "Diner",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "eggs"],
      description: "Retro-style diner with updated classics. Gluten-free toast and modifications available. Busy open kitchen — cross-contamination risk for severe allergies.",
      website: "https://phoebesdiner.com",
      phone: "(512) 555-0230",
      image_url: "",
      verified: true,
    },
    {
      name: "Hank's",
      address: "5811 Berkman Dr, Austin, TX 78723",
      cuisine_type: "American Cafe",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy", "eggs"],
      description: "Windsor Park neighborhood cafe with gluten-free and vegan baked goods. The kitchen is small — celiac diners should discuss cross-contact risks.",
      website: "https://hanksaustin.com",
      phone: "(512) 555-0231",
      image_url: "",
      verified: true,
    },
    {
      name: "Nixta Taqueria",
      address: "2512 E 12th St, Austin, TX 78702",
      cuisine_type: "Mexican",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["gluten"],
      allergens_handled: ["gluten", "dairy"],
      description: "James Beard award-winning taqueria with heirloom corn tortillas. Most tacos are naturally gluten-free. Small kitchen — mention allergies when ordering.",
      website: "https://nixtataqueria.com",
      phone: "(512) 555-0232",
      image_url: "",
      verified: true,
    },
    {
      name: "Patrizi's",
      address: "2307 Manor Rd, Austin, TX 78722",
      cuisine_type: "Italian",
      safety_tier: 3,
      has_dedicated_fryer: false,
      has_isolated_prep: false,
      allergen_trained_staff: false,
      free_from: ["eggs"],
      allergens_handled: ["gluten", "dairy", "eggs"],
      description: "Food truck turned brick-and-mortar serving handmade pasta. Gluten-free pasta available but prepared in shared water. Dairy-free options on request.",
      website: "https://patrizis.com",
      phone: "(512) 555-0233",
      image_url: "",
      verified: true,
    },
  ];
}
