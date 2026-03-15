"use client";

// components/commons/CommonsMap.tsx
//
// Leaflet map for Crossroads Commons. Dynamically imported (ssr: false).
// Default center: continental North America.

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from "react-leaflet";
import L from "leaflet";
import NextLink from "next/link";
import type { PublicCommonsItem } from "@mixtape/api/clients/public/publicApi";

function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

interface CommonsMapProps {
  items?: PublicCommonsItem[];
}

export default function CommonsMap({ items = [] }: CommonsMapProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const mappable = items.filter(
    (item) => item.latitude != null && item.longitude != null
  );

  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      zoomControl={false}
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />

      {mappable.map((item) => (
        <Marker
          key={item.id}
          position={[item.latitude!, item.longitude!]}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong>{item.title}</strong>
              {item.location_name && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                  {item.location_name}
                </div>
              )}
              {item.summary && (
                <div style={{ fontSize: 13, marginTop: 6 }}>{item.summary}</div>
              )}
              <div style={{ marginTop: 8 }}>
                <a
                  href={`/commons/${item.slug}`}
                  style={{ fontSize: 13, color: "#3182ce" }}
                >
                  View entry →
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
