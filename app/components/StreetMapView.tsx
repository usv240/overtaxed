"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StreetMap } from "@/lib/viz-catalog";

function ratioColor(ratio: number | null): string {
  if (ratio == null) return "#94a3b8";
  if (ratio >= 1.15) return "#dc2626";
  if (ratio >= 1.05) return "#f97316";
  if (ratio >= 0.97) return "#22c55e";
  return "#3b82f6";
}

/** Real interactive map: each home a dot coloured by assessment ratio; subject highlighted. */
export default function StreetMapView({ spec }: { spec: StreetMap }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !ref.current) return;

      map = new maplibregl.Map({
        container: ref.current,
        style: {
          version: 8,
          sources: {
            carto: {
              type: "raster",
              tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap © CARTO",
            },
          },
          layers: [{ id: "carto", type: "raster", source: "carto" }],
        },
        center: [spec.center.lng, spec.center.lat],
        zoom: spec.zoom ?? 15,
        attributionControl: false,
      });

      const points = [spec.subject, ...spec.neighbours];
      map.on("load", () => {
        if (!map) return;
        const bounds = new maplibregl.LngLatBounds();
        for (const p of points) {
          const size = p.isSubject ? 20 : 13;
          const el = document.createElement("div");
          el.style.cssText =
            `width:${size}px;height:${size}px;border-radius:9999px;cursor:pointer;` +
            `background:${ratioColor(p.ratio)};border:2px solid ${p.isSubject ? "#111" : "#fff"};` +
            `box-shadow:0 1px 3px rgba(0,0,0,.4)`;
          new maplibregl.Marker({ element: el })
            .setLngLat([p.lng, p.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
                `<div style="font:12px system-ui"><b>${p.address}</b><br/>ratio ${
                  p.ratio != null ? p.ratio.toFixed(2) : "n/a"
                }${p.isSubject ? " · your home" : ""}</div>`,
              ),
            )
            .addTo(map!);
          bounds.extend([p.lng, p.lat]);
        }
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 48, maxZoom: 17, duration: 0 });
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [spec]);

  return <div ref={ref} className="h-72 w-full overflow-hidden rounded-xl" />;
}
