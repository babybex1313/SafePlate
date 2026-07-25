/**
 * SafePlate MCP Server
 *
 * Exposes verified restaurant data from the SafePlate database to other cto.new
 * AI agents via the Model Context Protocol (MCP) over stdio transport.
 *
 * Usage: bun run src/mcp/server.ts
 */

import { neon } from "@neondatabase/serverless";

// ── Types ────────────────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface ToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS: ToolDef[] = [
  {
    name: "search_restaurants",
    description:
      "Search SafePlate's verified restaurant database for allergen-safe dining. Filter by city, safety tier (1=highest), or specific allergens handled. Returns restaurants with their safety protocols.",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "Filter by city name (e.g., 'Austin', 'Chicago')",
        },
        tier: {
          type: "number",
          description: "Filter by safety tier: 1 (best), 2, or 3",
          enum: [1, 2, 3],
        },
        allergen: {
          type: "string",
          description: "Filter by allergen handled (e.g., 'Gluten', 'Dairy', 'Peanuts')",
        },
        limit: {
          type: "number",
          description: "Maximum results to return (default: 20, max: 100)",
          default: 20,
        },
      },
    },
  },
  {
    name: "get_restaurant",
    description:
      "Get full details for a specific restaurant by its SafePlate ID, including all safety protocol fields.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The restaurant's unique ID in the SafePlate database",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_cities",
    description:
      "List all cities in the SafePlate database with restaurant counts, sorted by count descending.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_tier_stats",
    description:
      "Get safety tier distribution counts (tier 1, 2, 3, and total) for a city or across all cities.",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "Optional city name to filter stats; omit for all-city stats",
        },
      },
    },
  },
];

// ── DB Helpers ────────────────────────────────────────────────────────────────

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(url);
}

interface RestaurantRow {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  cuisine_type: string | null;
  safety_tier: number;
  has_dedicated_fryer: boolean;
  has_isolated_prep: boolean;
  allergen_trained_staff: boolean;
  free_from: string[] | null;
  allergens_handled: string[] | null;
  description: string | null;
  website: string | null;
  phone: string | null;
  image_url: string | null;
  verified: boolean;
  featured_until: string | null;
  created_at: string;
}

function serializeRestaurant(r: RestaurantRow) {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    city: r.city,
    state: r.state,
    cuisine_type: r.cuisine_type,
    safety_tier: r.safety_tier,
    has_dedicated_fryer: r.has_dedicated_fryer,
    has_isolated_prep: r.has_isolated_prep,
    allergen_trained_staff: r.allergen_trained_staff,
    free_from: r.free_from ?? [],
    allergens_handled: r.allergens_handled ?? [],
    description: r.description,
    website: r.website,
    phone: r.phone,
    image_url: r.image_url,
    verified: r.verified,
    featured_until: r.featured_until,
    created_at: r.created_at ? String(r.created_at) : null,
  };
}

// ── Tool Handlers ─────────────────────────────────────────────────────────────

async function searchRestaurants(params: Record<string, unknown>) {
  const db = getSql();
  const city = params.city as string | undefined;
  const tier = params.tier as number | undefined;
  const allergen = params.allergen as string | undefined;
  const limit = Math.min((params.limit as number) || 20, 100);

  // Build dynamic parameterized query using db.query() which supports $1, $2, ...
  const clauses: string[] = [];
  const vals: unknown[] = [];
  let idx = 0;

  if (city) {
    idx++;
    clauses.push("city ILIKE $" + idx);
    vals.push("%" + city + "%");
  }
  if (tier && [1, 2, 3].includes(tier)) {
    idx++;
    clauses.push("safety_tier = $" + idx);
    vals.push(tier);
  }
  if (allergen) {
    idx++;
    clauses.push("LOWER($" + idx + ") = ANY(SELECT LOWER(unnest(allergens_handled)))");
    vals.push(allergen);
  }

  idx++;
  const where = clauses.length > 0 ? "WHERE " + clauses.join(" AND ") : "";
  const query = "SELECT * FROM restaurants " + where + " ORDER BY safety_tier ASC, name ASC LIMIT $" + idx;
  vals.push(limit);

  const rows = await db.query(query, vals) as RestaurantRow[];
  return rows.map(serializeRestaurant);
}

async function getRestaurant(params: Record<string, unknown>) {
  const db = getSql();
  const id = params.id as number;
  if (!id || typeof id !== "number") {
    throw new Error("id must be a number");
  }

  const rows = await db`SELECT * FROM restaurants WHERE id = ${id}` as RestaurantRow[];
  if (rows.length === 0) {
    return null;
  }
  return serializeRestaurant(rows[0]);
}

async function listCities() {
  const db = getSql();
  const rows = await db`
    SELECT city, count(*)::int as count
    FROM restaurants
    GROUP BY city
    ORDER BY count DESC
  ` as { city: string; count: number }[];
  return rows;
}

async function getTierStats(params: Record<string, unknown>) {
  const db = getSql();
  const city = params.city as string | undefined;

  let rows;
  if (city) {
    rows = await db`
      SELECT
        count(*) filter (WHERE safety_tier = 1)::int as tier1,
        count(*) filter (WHERE safety_tier = 2)::int as tier2,
        count(*) filter (WHERE safety_tier = 3)::int as tier3,
        count(*)::int as total
      FROM restaurants
      WHERE city ILIKE ${`%${city}%`}
    `;
  } else {
    rows = await db`
      SELECT
        count(*) filter (WHERE safety_tier = 1)::int as tier1,
        count(*) filter (WHERE safety_tier = 2)::int as tier2,
        count(*) filter (WHERE safety_tier = 3)::int as tier3,
        count(*)::int as total
      FROM restaurants
    `;
  }

  const row = rows[0] as { tier1: number; tier2: number; tier3: number; total: number } | undefined;
  return row ?? { tier1: 0, tier2: 0, tier3: 0, total: 0 };
}

// ── JSON-RPC Dispatcher ──────────────────────────────────────────────────────

async function handleRequest(req: JsonRpcRequest): Promise<JsonRpcResponse> {
  const { id, method, params } = req;

  try {
    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: {
              name: "safeplate-mcp",
              version: "1.0.0",
            },
          },
        };

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id,
          result: { tools: TOOLS },
        };

      case "tools/call": {
        const toolName = params?.name as string;
        const toolArgs = (params?.arguments ?? {}) as Record<string, unknown>;

        let result: unknown;
        switch (toolName) {
          case "search_restaurants":
            result = await searchRestaurants(toolArgs);
            break;
          case "get_restaurant":
            result = await getRestaurant(toolArgs);
            break;
          case "list_cities":
            result = await listCities();
            break;
          case "get_tier_stats":
            result = await getTierStats(toolArgs);
            break;
          default:
            return {
              jsonrpc: "2.0",
              id,
              error: { code: -32601, message: `Unknown tool: ${toolName}` },
            };
        }

        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      }

      default:
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: `Internal error: ${message}` },
    };
  }
}

// ── Stdio Transport ──────────────────────────────────────────────────────────

async function main() {
  // Use a line-based reader for stdin
  const decoder = new TextDecoder();
  let buffer = "";

  // Read stdin in chunks
  const reader = (Bun.stdin as unknown as { stream(): ReadableStream<Uint8Array> }).stream().getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const request: JsonRpcRequest = JSON.parse(trimmed);
        const response = await handleRequest(request);

        // Write response to stdout
        process.stdout.write(JSON.stringify(response) + "\n");
      } catch {
        // If we can't parse the line, send a parse error
        const errResponse: JsonRpcResponse = {
          jsonrpc: "2.0",
          id: 0,
          error: { code: -32700, message: "Parse error" },
        };
        process.stdout.write(JSON.stringify(errResponse) + "\n");
      }
    }
  }
}

main().catch((err) => {
  const errResponse: JsonRpcResponse = {
    jsonrpc: "2.0",
    id: 0,
    error: { code: -32603, message: `Fatal error: ${err instanceof Error ? err.message : String(err)}` },
  };
  process.stdout.write(JSON.stringify(errResponse) + "\n");
  process.exit(1);
});
