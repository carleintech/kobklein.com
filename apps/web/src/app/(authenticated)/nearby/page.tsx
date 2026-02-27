"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet } from "@/lib/kobklein-api";
import {
  MapPin, List, Map, Search, Store, Users, RefreshCw,
  Phone, Navigation, AlertTriangle, ChevronRight,
} from "lucide-react";

// ─── Leaflet: no SSR ──────────────────────────────────────────────────────────

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type NearbyItem = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceM: number;
  phone?: string;
  kId?: string;
  category?: string;
  type: "merchant" | "distributor";
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ background: "rgba(212,175,55,0.12)", border: "2px dashed rgba(212,175,55,0.25)" }}
      >
        <MapPin className="h-8 w-8" style={{ color: "var(--dash-accent, #D4AF37)" }} />
      </div>
      <div>
        <p className="text-base font-bold" style={{ color: "var(--dash-text-primary, #E6DBF7)" }}>
          {searching ? "No results found" : "No results within 5 km"}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--dash-text-muted, #A596C9)" }}>
          {searching
            ? "Try a different search term"
            : "Move to an area with more merchants and agents"}
        </p>
      </div>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ item, onClick }: { item: NearbyItem; onClick: () => void }) {
  const isMerchant = item.type === "merchant";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.99 }}
      className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
      style={{
        background: "var(--dash-shell-bg, #1C0A35)",
        border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.20))",
      }}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: isMerchant ? "rgba(212,175,55,0.18)" : "rgba(165,150,201,0.18)",
          border: `1px solid ${isMerchant ? "rgba(212,175,55,0.30)" : "rgba(165,150,201,0.30)"}`,
        }}
      >
        {isMerchant
          ? <Store className="h-5 w-5" style={{ color: "#D4AF37" }} />
          : <Users className="h-5 w-5" style={{ color: "#A596C9" }} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold truncate" style={{ color: "var(--dash-text-primary, #E6DBF7)" }}>{item.name}</p>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
            style={{
              background: isMerchant ? "rgba(212,175,55,0.18)" : "rgba(165,150,201,0.18)",
              color: isMerchant ? "#D4AF37" : "#A596C9",
            }}
          >
            {isMerchant ? "Merchant" : "Agent"}
          </span>
        </div>
        {item.kId && (
          <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--dash-text-muted, #A596C9)" }}>K-{item.kId}</p>
        )}
        {item.category && (
          <p className="text-[10px] mt-0.5 capitalize" style={{ color: "var(--dash-text-muted, #A596C9)" }}>{item.category}</p>
        )}
      </div>

      {/* Distance + phone */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div
          className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)", color: "var(--dash-text-primary, #E6DBF7)" }}
        >
          <Navigation className="h-2.5 w-2.5" />
          {fmtDistance(item.distanceM)}
        </div>
        {item.phone && (
          <a
            href={`tel:${item.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px]"
            style={{ color: "var(--dash-text-muted, #A596C9)" }}
          >
            <Phone className="h-2.5 w-2.5" />
            {item.phone}
          </a>
        )}
      </div>
    </motion.button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NearbyPage() {
  const [merchants, setMerchants]   = useState<NearbyItem[]>([]);
  const [agents, setAgents]         = useState<NearbyItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [viewMode, setViewMode]     = useState<"list" | "map">("list");
  const [search, setSearch]         = useState("");
  const [userLat, setUserLat]       = useState<number | null>(null);
  const [userLng, setUserLng]       = useState<number | null>(null);
  const [geoError, setGeoError]     = useState(false);
  const [selectedItem, setSelected] = useState<NearbyItem | null>(null);
  const fetchedRef = useRef(false);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, aRes] = await Promise.allSettled([
        kkGet<NearbyItem[]>(`v1/nearby/merchants?lat=${lat}&lng=${lng}&radius=5000`),
        kkGet<NearbyItem[]>(`v1/nearby/distributors?lat=${lat}&lng=${lng}&radius=5000`),
      ]);
      if (mRes.status === "fulfilled") {
        setMerchants((mRes.value ?? []).map((i) => ({ ...i, type: "merchant" as const })));
      }
      if (aRes.status === "fulfilled") {
        setAgents((aRes.value ?? []).map((i) => ({ ...i, type: "distributor" as const })));
      }
    } catch {
      setError("Could not load nearby results.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (!("geolocation" in navigator)) {
      setGeoError(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLat(coords.latitude);
        setUserLng(coords.longitude);
        fetchNearby(coords.latitude, coords.longitude);
      },
      () => setGeoError(true),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300_000 },
    );
  }, [fetchNearby]);

  // Merge + filter results
  const allItems: NearbyItem[] = [...merchants, ...agents];
  const filtered = search.trim()
    ? allItems.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.kId && i.kId.toLowerCase().includes(search.toLowerCase())) ||
        (i.category && i.category.toLowerCase().includes(search.toLowerCase()))
      )
    : allItems;

  const sortedFiltered = [...filtered].sort((a, b) => a.distanceM - b.distanceM);

  const handleRefresh = () => {
    if (userLat && userLng) fetchNearby(userLat, userLng);
  };

  return (
    <div className="min-h-screen pb-28" style={{ color: "var(--dash-text-primary, #E6DBF7)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1"
              style={{ color: "var(--dash-accent, #D4AF37)" }}
            >
              <MapPin className="h-3 w-3" /> Near Me
            </div>
            <h1 className="text-2xl font-black [font-family:var(--font-playfair)] text-[#F2F2F2]">
              Nearby Network
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--dash-accent, #D4AF37)" }}>
              Merchants & agents within 5 km
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || (!userLat && !geoError)}
            aria-label="Refresh"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--dash-shell-bg, #1C0A35)",
              border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.20))",
            }}
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              style={{ color: "var(--dash-accent, #D4AF37)" }}
            />
          </button>
        </motion.div>

        {/* Geo error */}
        {geoError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            <AlertTriangle className="h-4 w-4 text-[#C9A84C] shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-[#E1C97A]">Location access denied</p>
              <p className="text-[#C9A84C]/70 mt-0.5">
                Enable location permissions in your browser to find nearby merchants and agents.
              </p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300 flex-1">{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-red-400 text-xs font-bold">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        {!geoError && (
          <div className="flex gap-2">
            {/* Search */}
            <div
              className="flex-1 flex items-center gap-2 px-3 rounded-xl"
              style={{
                background: "var(--dash-shell-bg, #1C0A35)",
                border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.20))",
              }}
            >
              <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--dash-text-muted, #A596C9)" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or K-ID…"
                className="flex-1 bg-transparent py-2.5 text-sm outline-none"
                style={{ color: "var(--dash-text-primary, #E6DBF7)" }}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}
                  className="text-xs font-bold" style={{ color: "var(--dash-text-muted, #A596C9)" }}>
                  ✕
                </button>
              )}
            </div>

            {/* View toggle */}
            <div
              className="flex rounded-xl overflow-hidden text-xs font-bold"
              style={{ border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.20))" }}
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-1.5 px-3 py-2 transition-colors"
                style={{
                  background: viewMode === "list" ? "#D4AF37" : "var(--dash-shell-bg, #1C0A35)",
                  color: viewMode === "list" ? "#080B14" : "var(--dash-text-muted, #A596C9)",
                }}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className="flex items-center gap-1.5 px-3 py-2 transition-colors"
                style={{
                  background: viewMode === "map" ? "#D4AF37" : "var(--dash-shell-bg, #1C0A35)",
                  color: viewMode === "map" ? "#080B14" : "var(--dash-text-muted, #A596C9)",
                }}
              >
                <Map className="h-3.5 w-3.5" /> Map
              </button>
            </div>
          </div>
        )}

        {/* Stats row */}
        {!loading && !geoError && allItems.length > 0 && (
          <div className="flex gap-3 text-xs">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)", color: "#D4AF37" }}
            >
              <Store className="h-3 w-3" />
              {merchants.length} merchant{merchants.length !== 1 ? "s" : ""}
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(165,150,201,0.12)", border: "1px solid rgba(165,150,201,0.25)", color: "#A596C9" }}
            >
              <Users className="h-3 w-3" />
              {agents.length} agent{agents.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl animate-pulse"
                style={{ background: "var(--dash-shell-bg, #1C0A35)" }}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {!loading && viewMode === "list" && !geoError && (
          sortedFiltered.length === 0
            ? <EmptyState searching={!!search.trim()} />
            : (
              <div className="space-y-2">
                {sortedFiltered.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <ResultCard
                      item={item}
                      onClick={() => {
                        setSelected(item);
                        setViewMode("map");
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )
        )}

        {/* Map view */}
        {!loading && viewMode === "map" && !geoError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl overflow-hidden"
            style={{
              border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.20))",
              height: 420,
            }}
          >
            {userLat && userLng ? (
              <LeafletMap
                userLat={userLat}
                userLng={userLng}
                items={sortedFiltered}
                selectedItem={selectedItem}
                onSelect={setSelected}
              />
            ) : (
              <div
                className="h-full flex items-center justify-center text-sm"
                style={{ background: "var(--dash-shell-bg, #1C0A35)", color: "var(--dash-text-muted, #A596C9)" }}
              >
                Waiting for location…
              </div>
            )}
          </motion.div>
        )}

        {/* Selected item detail (map mode) */}
        <AnimatePresence>
          {viewMode === "map" && selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="rounded-2xl p-4 space-y-2"
              style={{
                background: "var(--dash-shell-bg, #1C0A35)",
                border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.20))",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: selectedItem.type === "merchant"
                      ? "rgba(212,175,55,0.18)"
                      : "rgba(165,150,201,0.18)",
                  }}
                >
                  {selectedItem.type === "merchant"
                    ? <Store className="h-4.5 w-4.5" style={{ color: "#D4AF37" }} />
                    : <Users className="h-4.5 w-4.5" style={{ color: "#A596C9" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: "#F2F2F2" }}>{selectedItem.name}</p>
                  <p className="text-xs" style={{ color: "var(--dash-text-muted, #A596C9)" }}>
                    {fmtDistance(selectedItem.distanceM)} away
                    {selectedItem.category ? ` · ${selectedItem.category}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs font-bold shrink-0"
                  style={{ color: "var(--dash-text-muted, #A596C9)" }}
                >
                  ✕
                </button>
              </div>
              {selectedItem.phone && (
                <a
                  href={`tel:${selectedItem.phone}`}
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "var(--dash-accent, #D4AF37)" }}
                >
                  <Phone className="h-3.5 w-3.5" />
                  {selectedItem.phone}
                </a>
              )}
              {selectedItem.kId && (
                <p className="text-xs font-mono" style={{ color: "var(--dash-text-muted, #A596C9)" }}>
                  K-ID: {selectedItem.kId}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
