/**
 * Seed script: populates the restaurants table with 50+ Austin restaurants.
 *
 * Usage: bun run db:seed
 *
 * Idempotent — only inserts if the table is empty.
 */

import { neon } from "@neondatabase/serverless";
import { createRestaurantsTable, getAustinRestaurants } from "./restaurants";
import { getStLouisRestaurants } from "./restaurants-stl";
import { getSarasotaRestaurants } from "./restaurants-srq";
import { getChicagoRestaurants } from "./restaurants-chicago";
import { getDallasRestaurants } from "./restaurants-dallas";
import { getDenverRestaurants } from "./restaurants-denver";
import { getNashvilleRestaurants } from "./restaurants-nashville";
import { getPortlandRestaurants } from "./restaurants-portland";

function stateForCity(city: string): string {
  const map: Record<string, string> = { "Austin": "TX", "St. Louis": "MO", "Sarasota": "FL", "Chicago": "IL", "Dallas": "TX", "Denver": "CO", "Nashville": "TN", "Portland": "OR" };
  return map[city] ?? "TX";
}

async function seedCity(
  sql: ReturnType<typeof neon>,
  city: string,
  restaurants: ReturnType<typeof getAustinRestaurants>,
) {
  const existing = await sql`select count(*)::int as cnt from restaurants where city = ${city}`;
  if (existing[0].cnt > 0) {
    console.log(`ℹ️  ${city} already has ${existing[0].cnt} rows — skipping.`);
    return 0;
  }
  const state = stateForCity(city);
  let inserted = 0;
  for (const r of restaurants) {
    await sql`insert into restaurants (
      name, address, city, state, cuisine_type, safety_tier,
      has_dedicated_fryer, has_isolated_prep, allergen_trained_staff,
      free_from, allergens_handled, description, website, phone, image_url, verified
    ) values (
      ${r.name}, ${r.address}, ${city}, ${state}, ${r.cuisine_type}, ${r.safety_tier},
      ${r.has_dedicated_fryer}, ${r.has_isolated_prep}, ${r.allergen_trained_staff},
      ${r.free_from}, ${r.allergens_handled}, ${r.description}, ${r.website}, ${r.phone}, ${r.image_url}, ${r.verified}
    )`;
    inserted++;
  }
  console.log(`✅ Seeded ${inserted} restaurants in ${city}.`);
  return inserted;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set — connect a database before running seeds.");
    process.exit(1);
  }
  const sql = neon(url);
  console.log("🌱 Seeding SafePlate restaurant database...\n");
  try {
    await createRestaurantsTable(sql);
    let total = 0;
    total += await seedCity(sql, "Austin", getAustinRestaurants());
    total += await seedCity(sql, "St. Louis", getStLouisRestaurants());
    total += await seedCity(sql, "Sarasota", getSarasotaRestaurants());
    total += await seedCity(sql, "Chicago", getChicagoRestaurants());
    total += await seedCity(sql, "Dallas", getDallasRestaurants());
    total += await seedCity(sql, "Denver", getDenverRestaurants());
    total += await seedCity(sql, "Nashville", getNashvilleRestaurants());
    total += await seedCity(sql, "Portland", getPortlandRestaurants());
    if (total > 0) {
      console.log(`\n🎉 Successfully seeded ${total} restaurants across all cities.`);
    } else {
      console.log(`\nℹ️  All cities already have data — nothing to seed.`);
    }
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

main();
