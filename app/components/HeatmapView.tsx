"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RegressivityMap } from "@/lib/viz-catalog";

/** THE TAX DIVIDE — an explorable heatmap of over-assessment. Each cell coloured
 * by its homes' assessment ratio (red = assessed above what they sell for). */
export default function HeatmapView({ spec }: { spec: RegressivityMap }) {
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
              tiles: ["https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap © CARTO",
            },
          },
          layers: [{ id: "carto", type: "raster", source: "carto" }],
        },
        center: [spec.center.lng, spec.center.lat],
        zoom: 9,
        attributionControl: false,
      });

      const fc = {
        type: "FeatureCollection" as const,
        features: spec.cells.map((c) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
          properties: { ratio: c.ratio, n: c.n },
        })),
      };

      map.on("load", () => {
        if (!map) return;
        map.addSource("cells", { type: "geojson", data: fc });
        map.addLayer({
          id: "cells",
          type: "circle",
          source: "cells",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3, 11, 8, 14, 16],
            "circle-color": [
              "interpolate", ["linear"], ["get", "ratio"],
              0.6, "#1e40af", 0.85, "#93c5fd", 1.0, "#fde68a", 1.15, "#f97316", 1.3, "#b91c1c",
            ],
            "circle-opacity": 0.72,
            "circle-stroke-width": 0,
          },
        });
        const b = new maplibregl.LngLatBounds();
        for (const c of spec.cells) b.extend([c.lng, c.lat]);
        if (!b.isEmpty()) map.fitBounds(b, { padding: 28, duration: 0 });

        map.on("click", "cells", (e) => {
          const f = e.features?.[0];
          if (!f || !map) return;
          const p = f.properties as { ratio: number; n: number };
          new maplibregl.Popup({ offset: 8, closeButton: false })
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font:12px system-ui">Assessment ratio <b>${Number(p.ratio).toFixed(2)}</b><br/>${p.n} sold homes here</div>`)
            .addTo(map);
        });
        map.on("mouseenter", "cells", () => { if (map) map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "cells", () => { if (map) map.getCanvas().style.cursor = ""; });
      });
    })();

    return () => { cancelled = true; map?.remove(); };
  }, [spec]);

  return <div ref={ref} className="h-96 w-full overflow-hidden rounded-xl" />;
}
