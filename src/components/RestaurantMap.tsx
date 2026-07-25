import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface MapRestaurant {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  safety_tier: number;
  lat?: number;
  lng?: number;
}

interface RestaurantMapProps {
  restaurants: MapRestaurant[];
  centerLat: number;
  centerLng: number;
  originLabel?: string;
  destinationLabel?: string;
  showRoute?: boolean;
}

/* ------------------------------------------------------------------ */
/*  City coordinates fallback map                                      */
/* ------------------------------------------------------------------ */

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Austin: { lat: 30.2672, lng: -97.7431 },
  Atlanta: { lat: 33.749, lng: -84.388 },
  Chicago: { lat: 41.8781, lng: -87.6298 },
  Dallas: { lat: 32.7767, lng: -96.797 },
  Denver: { lat: 39.7392, lng: -104.9903 },
  Nashville: { lat: 36.1627, lng: -86.7816 },
  Portland: { lat: 45.5152, lng: -122.6784 },
  "St. Louis": { lat: 38.627, lng: -90.1994 },
  Sarasota: { lat: 27.3364, lng: -82.5307 },
};

/* ------------------------------------------------------------------ */
/*  Marker color by tier                                              */
/* ------------------------------------------------------------------ */

const TIER_COLORS: Record<number, string> = {
  1: "#10B981", // emerald-500
  2: "#F59E0B", // amber-500
  3: "#0EA5E9", // sky-500
};

function getMarkerColor(tier: number): string {
  return TIER_COLORS[tier] ?? "#94A3B8";
}

function getTierLabel(tier: number): string {
  switch (tier) {
    case 1:
      return "Tier 1 · Dedicated";
    case 2:
      return "Tier 2 · Protocols";
    case 3:
      return "Tier 3 · Friendly";
    default:
      return "Unknown Tier";
  }
}

/* ------------------------------------------------------------------ */
/*  SVG marker generator                                              */
/* ------------------------------------------------------------------ */

function createMarkerSvg(color: string, label: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <defs>
        <filter id="shadow" x="-2" y="-2" width="40" height="50">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M18 0C8.06 0 0 7.74 0 17.29 0 29.82 16.23 46.16 16.92 46.91L18 48l1.08-1.09C19.77 46.16 36 29.82 36 17.29 36 7.74 27.94 0 18 0z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="18" cy="17" r="8" fill="white"/>
      <text x="18" y="21" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}" font-family="system-ui, -apple-system, sans-serif">${label}</text>
    </svg>`;
  return "data:image/svg+xml;base64," + btoa(svg);
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function RestaurantMap({
  restaurants,
  centerLat,
  centerLng,
  originLabel,
  destinationLabel,
  showRoute,
}: RestaurantMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [routeError, setRouteError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infowindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    // If no restaurants, nothing to show
    if (restaurants.length === 0) {
      setMapState("ready");
      return;
    }

    // Vite injects this at build time via define in vite.config.ts
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

    if (!apiKey) {
      console.error("[RestaurantMap] No API key configured");
      setMapState("error");
      setErrorMsg("Map API key not configured");
      return;
    }

    // The map container div is always in the DOM (loading/error states
    // are overlays), so mapRef.current should be attached by now.
    // Guard against edge cases (e.g. SSR mismatch during hydration).
    if (!mapRef.current) {
      console.error("[RestaurantMap] Map container div not found in DOM — this is unexpected");
      setMapState("error");
      setErrorMsg("Map container not available");
      return;
    }

    let cancelled = false;

    const initMap = async () => {
      try {
        console.log("[RestaurantMap] Initializing map with key:", apiKey.slice(0, 8) + "...");
        setOptions({ key: apiKey, v: "weekly" });

        console.log("[RestaurantMap] Loading maps library...");
        const { Map: GMap, InfoWindow } = await importLibrary("maps");
        console.log("[RestaurantMap] Maps library loaded, Map constructor:", typeof GMap);

        const { Geocoder } = await importLibrary("geocoding");
        console.log("[RestaurantMap] Geocoding library loaded");

        // Compute bounds from restaurants that have coordinates
        const bounds = new google.maps.LatLngBounds();

        console.log("[RestaurantMap] Creating map instance in container:", mapRef.current);
        const map = new GMap(mapRef.current!, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        console.log("[RestaurantMap] Map instance created successfully");
        mapInstanceRef.current = map;
        infowindowRef.current = new InfoWindow();

        const geocoder = new Geocoder();

        // Add markers for each restaurant
        for (const r of restaurants) {
          const markerColor = getMarkerColor(r.safety_tier);
          const tierLabel = r.safety_tier.toString();

          if (r.lat !== undefined && r.lng !== undefined) {
            // Use pre-geocoded coordinates
            const position = { lat: r.lat, lng: r.lng };
            const marker = new google.maps.Marker({
              position,
              map,
              title: r.name,
              icon: {
                url: createMarkerSvg(markerColor, tierLabel),
                scaledSize: new google.maps.Size(36, 48),
              },
            });

            marker.addListener("click", () => {
              infowindowRef.current?.setContent(
                `<div style="font-family:system-ui,sans-serif;max-width:200px">
                  <strong style="font-size:14px">${r.name}</strong>
                  <div style="font-size:12px;margin-top:4px;color:#64748B">${r.address}</div>
                  <div style="margin-top:6px">
                    <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:${markerColor}20;color:${markerColor};border:1px solid ${markerColor}40">
                      ${getTierLabel(r.safety_tier)}
                    </span>
                  </div>
                </div>`,
              );
              infowindowRef.current?.open(map, marker);
            });

            markersRef.current.push(marker);
            bounds.extend(position);
          } else {
            // Geocode the address
            const fullAddress = `${r.address}, ${r.city}, ${r.state}`;
            try {
              const result = await geocoder.geocode({ address: fullAddress });
              if (result.results.length > 0) {
                const position = result.results[0].geometry.location;
                const marker = new google.maps.Marker({
                  position,
                  map,
                  title: r.name,
                  icon: {
                    url: createMarkerSvg(markerColor, tierLabel),
                    scaledSize: new google.maps.Size(36, 48),
                  },
                });

                marker.addListener("click", () => {
                  infowindowRef.current?.setContent(
                    `<div style="font-family:system-ui,sans-serif;max-width:200px">
                      <strong style="font-size:14px">${r.name}</strong>
                      <div style="font-size:12px;margin-top:4px;color:#64748B">${r.address}</div>
                      <div style="margin-top:6px">
                        <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:${markerColor}20;color:${markerColor};border:1px solid ${markerColor}40">
                          ${getTierLabel(r.safety_tier)}
                        </span>
                      </div>
                    </div>`,
                  );
                  infowindowRef.current?.open(map, marker);
                });

                markersRef.current.push(marker);
                bounds.extend(position);
              }
            } catch (geocodeErr) {
              console.warn("[RestaurantMap] Geocoding failed for:", fullAddress, geocodeErr);
            }
          }
        }

        console.log("[RestaurantMap] Added", markersRef.current.length, "markers");

        // Draw route if requested
        if (showRoute && originLabel && destinationLabel) {
          try {
            const { DirectionsService } = await importLibrary("routes");

            const directionsService = new DirectionsService();
            const result = await directionsService.route({
              origin: originLabel,
              destination: destinationLabel,
              travelMode: google.maps.TravelMode.DRIVING,
            });

            if (result && result.routes.length > 0) {
              const directionsRenderer = new google.maps.DirectionsRenderer({
                map,
                directions: result,
                suppressMarkers: true, // We use our own markers
                polylineOptions: {
                  strokeColor: "#6366F1",
                  strokeWeight: 4,
                  strokeOpacity: 0.6,
                },
              });
              // Store reference so it's not garbage collected
              (map as unknown as Record<string, unknown>).__directionsRenderer =
                directionsRenderer;
              console.log("[RestaurantMap] Route drawn successfully");
            }
          } catch (routeErr) {
            const msg = routeErr instanceof Error ? routeErr.message : String(routeErr);
            console.warn("[RestaurantMap] Route drawing failed:", msg);
            if (!cancelled) {
              setRouteError(msg || "Failed to draw route. The Directions API may not be enabled for this API key.");
            }
          }
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          if (map.getZoom() > 15) map.setZoom(15);
        }

        if (!cancelled) {
          console.log("[RestaurantMap] Map initialization complete");
          setMapState("ready");
        }
      } catch (err) {
        console.error("[RestaurantMap] Initialization error:", err);
        if (!cancelled) {
          setMapState("error");
          setErrorMsg(
            err instanceof Error ? err.message : "Failed to load map",
          );
        }
      }
    };

    initMap();

    return () => {
      console.log("[RestaurantMap] Cleanup");
      cancelled = true;
      // Clean up markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (infowindowRef.current) {
        infowindowRef.current.close();
      }
    };
  }, [restaurants, centerLat, centerLng, originLabel, destinationLabel, showRoute]);

  // Compute Google Maps search URL
  const mapsSearchUrl = (() => {
    if (restaurants.length === 0) return "#";
    const first = restaurants[0];
    return `https://www.google.com/maps/search/${encodeURIComponent(`allergy safe restaurants ${first.city} ${first.state}`)}`;
  })();

  if (restaurants.length === 0) {
    return null;
  }

  return (
    <div className="mt-10">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-sky-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
          />
        </svg>
        Map View
      </h3>

      {/* Map container is ALWAYS in the DOM so the ref is attached.
          Loading and error states are rendered as absolute overlays. */}
      <div className="relative">
        <div
          ref={mapRef}
          className="h-[400px] w-full rounded-2xl border border-slate-200 shadow-sm md:h-[400px] max-sm:h-[300px]"
        />

        {/* Loading overlay */}
        {mapState === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Loading map…
              </p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {mapState === "error" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
            <div className="text-center px-4">
              <svg
                className="mx-auto mb-3 h-8 w-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Map unavailable
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {errorMsg || "Map could not be loaded right now."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Route drawing error — shown below the map when route line fails */}
      {routeError && mapState === "ready" && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <span className="font-semibold">Route line unavailable:</span>{" "}
          {routeError}
        </div>
      )}

      {/* View on Google Maps link — show when map is ready or errored */}
      {mapState !== "loading" && (
        <div className="mt-3 text-right">
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            View on Google Maps &rarr;
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper to get city coordinates                                    */
/* ------------------------------------------------------------------ */

export function getCityCoords(
  city: string,
): { lat: number; lng: number } | null {
  return CITY_COORDS[city] ?? null;
}
