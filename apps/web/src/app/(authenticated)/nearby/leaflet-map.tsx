"use client";

/**
 * Leaflet Map — lazy-loaded (ssr: false) to avoid "window is not defined"
 * Uses OpenStreetMap tiles (no API key required).
 */
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type NearbyItem = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceM: number;
  phone?: string;
  kId?: string;
  type: "merchant" | "distributor";
};

type Props = {
  userLat: number;
  userLng: number;
  items: NearbyItem[];
  selectedItem: NearbyItem | null;
  onSelect: (item: NearbyItem) => void;
};

export default function LeafletMap({ userLat, userLng, items, selectedItem, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");

    // Fix default icon paths (webpack issue with leaflet)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(containerRef.current, {
      center: [userLat, userLng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // User marker (blue dot)
    const userIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#0D9E8A;border:3px solid white;box-shadow:0 0 0 3px rgba(13,158,138,0.3)"></div>`,
      iconAnchor: [7, 7],
    });
    userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon })
      .addTo(map)
      .bindPopup("<strong>You are here</strong>");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync items to markers
  useEffect(() => {
    if (!mapRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    items.forEach((item) => {
      const color = item.type === "merchant" ? "#C6A756" : "#0D9E8A";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>`,
        iconAnchor: [6, 6],
      });

      const marker = L.marker([item.lat, item.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(
          `<div style="font-family:sans-serif;min-width:120px">
            <strong style="font-size:13px">${item.name}</strong><br/>
            <span style="font-size:11px;color:#555">${item.type === "merchant" ? "Merchant" : "Agent"}</span><br/>
            ${item.phone ? `<a href="tel:${item.phone}" style="font-size:11px;color:#0077cc">${item.phone}</a><br/>` : ""}
            <span style="font-size:11px;color:#888">${item.distanceM < 1000 ? Math.round(item.distanceM) + " m" : (item.distanceM / 1000).toFixed(1) + " km"} away</span>
          </div>`
        )
        .on("click", () => onSelect(item));

      markersRef.current.push(marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Pan to selected item
  useEffect(() => {
    if (!mapRef.current || !selectedItem) return;
    mapRef.current.setView([selectedItem.lat, selectedItem.lng], 16, { animate: true });

    // Open popup for selected marker
    const idx = items.findIndex((i) => i.id === selectedItem.id);
    if (idx >= 0 && markersRef.current[idx]) {
      markersRef.current[idx].openPopup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "#1a1f2e" }}
    />
  );
}
