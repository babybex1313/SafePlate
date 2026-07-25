import { createServerFn } from "@tanstack/react-start";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

/**
 * Batch geocode addresses using the Google Geocoding API.
 * Called from the server to keep the API key secure.
 */
export const batchGeocode = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { addresses: string[] };
    if (!Array.isArray(d.addresses)) {
      throw new Error("addresses must be an array of strings");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const { addresses } = data;
    const results: Record<string, GeocodeResult | null> = {};

    // Deduplicate addresses
    const unique = [...new Set(addresses)];

    // Process in parallel batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < unique.length; i += batchSize) {
      const batch = unique.slice(i, i + batchSize);
      const batchPromises = batch.map(async (addr) => {
        if (!API_KEY) {
          results[addr] = null;
          return;
        }
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${API_KEY}`;
          const res = await fetch(url);
          const json = (await res.json()) as {
            status: string;
            results: Array<{
              geometry: { location: { lat: number; lng: number } };
              formatted_address: string;
            }>;
          };
          if (json.status === "OK" && json.results.length > 0) {
            results[addr] = {
              lat: json.results[0].geometry.location.lat,
              lng: json.results[0].geometry.location.lng,
              formattedAddress: json.results[0].formatted_address,
            };
          } else {
            results[addr] = null;
          }
        } catch {
          results[addr] = null;
        }
      });
      await Promise.all(batchPromises);
    }

    return results;
  });

/**
 * Geocode a single address. Returns coordinates or null.
 */
export const geocodeAddress = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { address: string };
    if (typeof d.address !== "string" || !d.address.trim()) {
      throw new Error("address must be a non-empty string");
    }
    return d;
  })
  .handler(async ({ data }) => {
    if (!API_KEY) return null;
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(data.address)}&key=${API_KEY}`;
      const res = await fetch(url);
      const json = (await res.json()) as {
        status: string;
        results: Array<{
          geometry: { location: { lat: number; lng: number } };
          formatted_address: string;
        }>;
      };
      if (json.status === "OK" && json.results.length > 0) {
        return {
          lat: json.results[0].geometry.location.lat,
          lng: json.results[0].geometry.location.lng,
          formattedAddress: json.results[0].formatted_address,
        };
      }
    } catch {
      // ignore
    }
    return null;
  });
