"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Compass, Crosshair, ExternalLink, Navigation } from "lucide-react";
import { PRACTICE } from "@/data/practice";

const LAT = PRACTICE.address.coordinates.lat; // -1.32459
const LNG = PRACTICE.address.coordinates.lng; // 36.70260
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`;

export function LocationMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ setView: (coords: [number, number], zoom: number) => void; remove: () => void } | null>(null);
  const markerRef = useRef<{ openPopup: () => void } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const container = containerRef.current;
      if (!container) return;

      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !containerRef.current) return;

        // Clean any leftover Leaflet container state under React StrictMode
        if ((container as unknown as { _leaflet_id?: number })._leaflet_id) {
          delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
        }

        const map = L.map(container, {
          center: [LAT, LNG],
          zoom: 17,
          scrollWheelZoom: false,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        const pinIcon = L.divIcon({
          className: "ks-map-pin-wrapper",
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
              <div style="background:#121713;color:#ffffff;font-family:var(--font-display),system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em;padding:4px 10px;border-radius:9999px;white-space:nowrap;box-shadow:0 6px 18px rgba(18,23,19,0.28);border:1.5px solid #ffffff;margin-bottom:4px;">
                Karen Surgery
              </div>
              <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="filter:drop-shadow(0 4px 8px rgba(18,23,19,0.3));">
                <path d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.268 21.732 0 14 0Z" fill="#2F4A2C"/>
                <circle cx="14" cy="13.5" r="5.5" fill="#FFFFFF"/>
              </svg>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
          popupAnchor: [0, -68],
        });

        const popupHtml = `
          <div style="font-family:var(--font-body),system-ui,sans-serif;min-width:210px;line-height:1.45;color:#121713;">
            <strong style="font-size:14px;display:block;margin-bottom:2px;">Karen Surgery</strong>
            <span style="font-size:12px;color:#4a544c;display:block;">333 Ngong Road, Karen, Nairobi 00502</span>
            <span style="font-size:11px;color:#4a544c;display:block;margin-top:4px;">333 metres from Karen Roundabout (opposite Talisman)</span>
            <div style="margin-top:8px;display:flex;gap:10px;flex-wrap:wrap;font-size:12px;font-weight:600;">
              <a href="${DIRECTIONS_URL}" target="_blank" rel="noopener noreferrer" style="color:#2F4A2C;text-decoration:underline;">Get Directions</a>
              <a href="${PRACTICE.address.googleMapsDirectionsUrl}" target="_blank" rel="noopener noreferrer" style="color:#121713;text-decoration:underline;">Google Maps</a>
            </div>
          </div>
        `;

        const marker = L.marker([LAT, LNG], {
          icon: pinIcon,
          title: "Karen Surgery — 333 Ngong Road, Karen, Nairobi",
          alt: "Karen Surgery map marker at 333 Ngong Road, Karen, Nairobi",
        })
          .addTo(map)
          .bindPopup(popupHtml);

        marker.openPopup();

        // Enable scroll-wheel zoom only after the user clicks inside the map to avoid scroll-trapping
        map.on("click", () => {
          map.scrollWheelZoom.enable();
        });
        map.on("mouseout", () => {
          map.scrollWheelZoom.disable();
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setMapReady(true);
      } catch {
        if (!cancelled) setMapError(true);
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, []);

  const handleRecenter = () => {
    mapInstanceRef.current?.setView([LAT, LNG], 17);
    markerRef.current?.openPopup();
  };

  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] min-h-[24rem] sm:min-h-[27rem] flex-1 isolate">
        {mapError ? (
          <div className="flex h-full min-h-[24rem] flex-col items-center justify-center p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Interactive map tiles could not be loaded on this connection.
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] max-w-sm">
              Karen Surgery is located at 333 Ngong Road, Karen, Nairobi (GPS {LAT}, {LNG}).
            </p>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-pill-primary"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              <span>Get Directions in Google Maps</span>
            </a>
          </div>
        ) : (
          <>
            <div
              ref={containerRef}
              role="region"
              aria-label="Interactive OpenStreetMap showing Karen Surgery at 333 Ngong Road, Karen, Nairobi"
              className="h-full min-h-[24rem] sm:min-h-[27rem] w-full z-0"
            />
            {!mapReady ? (
              <div
                aria-live="polite"
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]/80 text-xs font-medium text-[var(--color-ink-muted)]"
              >
                Loading interactive map of 333 Ngong Road, Karen...
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleRecenter}
              title="Re-center map on Karen Surgery"
              className="absolute right-3 top-3 z-[400] inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] shadow-sm backdrop-blur-xs hover:border-[var(--color-ink)] hover:bg-white transition-colors cursor-pointer"
            >
              <Crosshair className="h-3.5 w-3.5 text-[var(--color-forest)]" aria-hidden="true" />
              <span>Center on Practice</span>
            </button>
          </>
        )}
      </div>

      {/* Action Bar Below Map */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-ink-muted)]">
          Verified building location: 333 Ngong Road, Karen ({LAT}, {LNG}). Click map to enable scroll zoom.
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--color-ink)] bg-[var(--color-ink)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-white no-underline hover:bg-[var(--color-forest-deep)] transition-colors"
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Get Directions</span>
          </a>
          <a
            href={PRACTICE.address.googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <Compass className="h-3.5 w-3.5 text-[var(--color-forest)]" aria-hidden="true" />
            <span>Open in Google Maps</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
