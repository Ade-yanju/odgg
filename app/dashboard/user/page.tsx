"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  Search,
  LogOut,
  Bell,
  X,
  Star,
  RotateCcw,
  Phone,
  Navigation,
  Radio,
  ChevronRight,
  Package,
  Zap,
  ExternalLink,
} from "lucide-react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface UserProfile {
  id: string;
  fullName?: string;
  phone?: string;
  deliveryAddress?: { hostel?: string; room?: string; landmark?: string };
  [key: string]: unknown;
}

interface Order {
  id: string;
  userId: string;
  vendorId: string;
  vendorName: string;
  mealName: string;
  mealId: string;
  price: number;
  status:
    | "pending"
    | "accepted"
    | "out_for_delivery"
    | "picked_up"
    | "delivered";
  deliveryAddress: Record<string, unknown>;
  createdAt: number;
  completedAt?: number;
  claimedAt?: number;
  pickedUpAt?: number;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  [key: string]: unknown;
}

interface Meal {
  id: string;
  name: string;
  vendorId: string;
  vendorName: string;
  price: number;
  available?: boolean;
  category?: string;
  estimatedTime?: string;
  rating?: number;
  description?: string;
  [key: string]: unknown;
}

interface RiderLocation {
  lat: number;
  lng: number;
  orderId: string;
  updatedAt: number;
}

interface ProfileForm {
  fullName?: string;
  phone?: string;
  hostel?: string;
  room?: string;
  landmark?: string;
}

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const HOSTELS = [
  "Hall 1",
  "Hall 2",
  "Hall 3",
  "Hall 4",
  "Hall 5",
  "Moremi Hall",
  "Awolowo Hall",
  "Independence Hall",
  "Satellite Town",
  "Off Campus",
];

const ALL_CATEGORY = "All";

const STATUS_CONFIG = {
  pending: {
    label: "Order Received",
    emoji: "⏳",
    color: "#64748b",
    bg: "rgba(100,116,139,0.1)",
    step: 0,
  },
  accepted: {
    label: "Being Prepared",
    emoji: "👨‍🍳",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    step: 1,
  },
  out_for_delivery: {
    label: "Rider Assigned",
    emoji: "🛵",
    color: "#e60000",
    bg: "rgba(230,0,0,0.1)",
    step: 2,
  },
  picked_up: {
    label: "Almost There!",
    emoji: "🏃",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    step: 3,
  },
  delivered: {
    label: "Delivered!",
    emoji: "✅",
    color: "#05cd99",
    bg: "rgba(5,205,153,0.1)",
    step: 4,
  },
} as const;

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function getMealEmoji(name = "") {
  const n = name.toLowerCase();
  if (n.includes("burger")) return "🍔";
  if (n.includes("shawarma")) return "🌯";
  if (n.includes("jollof") || n.includes("rice")) return "🍚";
  if (n.includes("chicken")) return "🍗";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("suya")) return "🍢";
  if (n.includes("pasta") || n.includes("noodle")) return "🍝";
  if (n.includes("salad") || n.includes("bowl")) return "🥗";
  if (n.includes("smoothie") || n.includes("drink")) return "🥤";
  return "🍽️";
}

function formatTime(ts: number | undefined) {
  if (!ts) return "";
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─────────────────────────────────────────────
//  LEAFLET MAP COMPONENT
// ─────────────────────────────────────────────
function LiveMap({
  riderLocation,
  deliveryAddress,
  visible,
}: {
  riderLocation: RiderLocation | null;
  deliveryAddress?: { hostel?: string; room?: string };
  visible: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{
    map: {
      remove: () => void;
      setView: (l: [number, number], z: number) => void;
    };
    riderMarker: { setLatLng: (l: [number, number]) => void } | null;
    L: unknown;
    initialised: boolean;
  } | null>(null);

  const CAMPUS: [number, number] = [7.3775, 3.947];

  useEffect(() => {
    if (!visible || !mapRef.current || leafletRef.current?.initialised) return;

    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as unknown as { L: unknown }).L as {
        map: (
          el: HTMLDivElement,
          opts: unknown,
        ) => {
          remove: () => void;
          setView: (l: [number, number], z: number) => void;
        };
        tileLayer: (
          url: string,
          opts: unknown,
        ) => { addTo: (m: unknown) => void };
        marker: (
          latlng: [number, number],
          opts?: unknown,
        ) => {
          addTo: (m: unknown) => unknown;
          setLatLng: (l: [number, number]) => void;
          bindPopup: (h: string) => unknown;
        };
        divIcon: (opts: unknown) => unknown;
      };
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: CAMPUS,
        zoom: 15,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Destination pin
      const destIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#e60000;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 3px 10px rgba(230,0,0,0.5);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:13px">📍</span></div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      const dest = L.marker(CAMPUS, { icon: destIcon }).addTo(map) as {
        bindPopup: (h: string) => unknown;
      };
      dest.bindPopup(
        `<b>Your delivery</b><br>${deliveryAddress?.hostel || ""} Rm ${deliveryAddress?.room || "?"}`,
      );

      leafletRef.current = { map, riderMarker: null, L, initialised: true };
    };
    document.head.appendChild(script);

    return () => {
      if (leafletRef.current?.map) {
        leafletRef.current.map.remove();
        leafletRef.current = null;
      }
    };
  }, [visible]);

  useEffect(() => {
    if (!leafletRef.current || !riderLocation) return;
    const { map, L } = leafletRef.current as {
      map: { setView: (l: [number, number], z: number) => void };
      L: {
        marker: (
          l: [number, number],
          opts?: unknown,
        ) => {
          addTo: (m: unknown) => void;
          setLatLng: (l: [number, number]) => void;
        };
        divIcon: (opts: unknown) => unknown;
      };
      riderMarker: { setLatLng: (l: [number, number]) => void } | null;
    };

    const riderIcon = L.divIcon({
      html: `<div style="width:40px;height:40px;background:#e60000;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 16px rgba(230,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;animation:bounce 2s infinite">🛵</div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const latlng: [number, number] = [riderLocation.lat, riderLocation.lng];
    if (leafletRef.current.riderMarker) {
      leafletRef.current.riderMarker.setLatLng(latlng);
    } else {
      const m = L.marker(latlng, { icon: riderIcon });
      m.addTo(map as unknown);
      leafletRef.current.riderMarker = m as {
        setLatLng: (l: [number, number]) => void;
      };
    }
    map.setView(latlng, 16);
  }, [riderLocation]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 260,
        background: "#1a2035",
        borderRadius: 16,
      }}
    />
  );
}

// ─────────────────────────────────────────────
//  TRACKING MODAL
// ─────────────────────────────────────────────
function TrackingModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(
    null,
  );
  const [locationAge, setLocationAge] = useState(0);

  // Subscribe to rider location
  useEffect(() => {
    if (!order.riderId) return;
    const unsub = onSnapshot(
      doc(db, "riderLocations", order.riderId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as RiderLocation;
          if (data.orderId === order.id) setRiderLocation(data);
        } else {
          setRiderLocation(null);
        }
      },
    );
    return () => unsub();
  }, [order.riderId, order.id]);

  useEffect(() => {
    if (!riderLocation) return;
    const iv = setInterval(
      () =>
        setLocationAge(
          Math.floor((Date.now() - riderLocation.updatedAt) / 1000),
        ),
      1000,
    );
    return () => clearInterval(iv);
  }, [riderLocation]);

  const statusSteps = [
    { key: "pending", label: "Order Placed" },
    { key: "accepted", label: "Being Prepared" },
    { key: "out_for_delivery", label: "Rider Assigned" },
    { key: "picked_up", label: "Picked Up" },
    { key: "delivered", label: "Delivered!" },
  ];
  const statusOrder = [
    "pending",
    "accepted",
    "out_for_delivery",
    "picked_up",
    "delivered",
  ];
  const currentIdx = statusOrder.indexOf(order.status);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const deliveryAddr = order.deliveryAddress as {
    hostel?: string;
    room?: string;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#0f172a",
          borderRadius: 24,
          width: "100%",
          maxWidth: 840,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(255,255,255,0.08)",
          animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: cfg.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {cfg.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 17,
                fontWeight: 900,
                color: "#fff",
              }}
            >
              {order.mealName}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.4)",
                fontWeight: 600,
              }}
            >
              {order.vendorName} · #{order.id.slice(-6).toUpperCase()}
            </div>
          </div>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 50,
              background: cfg.bg,
              color: cfg.color,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {cfg.label}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: 10,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              flexShrink: 0,
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Map */}
          <div style={{ flex: 1, padding: 20, minWidth: 0 }}>
            <div
              style={{
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Radio size={13} color="#e60000" />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Live Tracking
              </span>
              {riderLocation && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    fontWeight: 700,
                    color: locationAge < 15 ? "#05cd99" : "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: locationAge < 15 ? "#05cd99" : "#f59e0b",
                      display: "inline-block",
                    }}
                  />
                  {locationAge < 15 ? "LIVE" : `${locationAge}s ago`}
                </span>
              )}
            </div>
            <div
              style={{
                height: 280,
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {order.status === "delivered" ? (
                <div
                  style={{
                    height: "100%",
                    background: "#111827",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 40 }}>✅</div>
                  <div
                    style={{ color: "#05cd99", fontWeight: 700, fontSize: 15 }}
                  >
                    Order Delivered!
                  </div>
                </div>
              ) : !order.riderId ? (
                <div
                  style={{
                    height: "100%",
                    background: "#111827",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 36 }}>🔍</div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Waiting for rider assignment…
                  </div>
                </div>
              ) : !riderLocation ? (
                <div
                  style={{
                    height: "100%",
                    background: "#111827",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{ fontSize: 36, animation: "bounce 2s infinite" }}
                  >
                    📡
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Locating your rider…
                  </div>
                </div>
              ) : (
                <LiveMap
                  riderLocation={riderLocation}
                  deliveryAddress={deliveryAddr}
                  visible={true}
                />
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              padding: "20px 20px 20px 0",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Timeline */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                Order Progress
              </div>
              {statusSteps.map((step, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <div
                    key={step.key}
                    style={{ display: "flex", gap: 12, position: "relative" }}
                  >
                    {i < statusSteps.length - 1 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 10,
                          top: 24,
                          bottom: -6,
                          width: 1.5,
                          background:
                            done && i < currentIdx
                              ? "#05cd99"
                              : "rgba(255,255,255,0.08)",
                          zIndex: 0,
                        }}
                      />
                    )}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: done
                          ? active
                            ? "rgba(5,205,153,0.2)"
                            : "rgba(5,205,153,0.12)"
                          : "rgba(255,255,255,0.06)",
                        border: active ? "2px solid #05cd99" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1,
                        position: "relative",
                      }}
                    >
                      {done ? (
                        <CheckCircle2
                          size={12}
                          color={active ? "#05cd99" : "rgba(5,205,153,0.6)"}
                        />
                      ) : (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.2)",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ paddingBottom: 16, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: done
                            ? active
                              ? "#fff"
                              : "rgba(255,255,255,0.6)"
                            : "rgba(255,255,255,0.2)",
                        }}
                      >
                        {step.label}
                        {active && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 9,
                              background: "#05cd99",
                              color: "#fff",
                              padding: "1px 6px",
                              borderRadius: 20,
                              fontWeight: 900,
                            }}
                          >
                            NOW
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rider info */}
            {order.riderId && (
              <div
                style={{
                  background: "rgba(230,0,0,0.08)",
                  borderRadius: 16,
                  padding: 16,
                  border: "1px solid rgba(230,0,0,0.15)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Your Rider
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      flexShrink: 0,
                      background: "linear-gradient(135deg,#e60000,#ff4d4d)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 12,
                      fontWeight: 900,
                      color: "#fff",
                    }}
                  >
                    {(order.riderName || "R")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}
                    >
                      {order.riderName || "Your Rider"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "'DM Mono',monospace",
                      }}
                    >
                      {order.riderPhone || "—"}
                    </div>
                  </div>
                </div>
                {order.riderPhone && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <a
                      href={`tel:${order.riderPhone}`}
                      style={{
                        flex: 1,
                        background: "#05cd99",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "9px",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        textDecoration: "none",
                      }}
                    >
                      <Phone size={13} /> Call
                    </a>
                    <a
                      href={`sms:${order.riderPhone}`}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "9px",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        textDecoration: "none",
                      }}
                    >
                      <Radio size={13} /> SMS
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Delivery address */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: 16,
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Delivering To
              </div>
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
              >
                <MapPin
                  size={14}
                  color="#e60000"
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {deliveryAddr?.hostel || "Unknown"}, Room{" "}
                  {deliveryAddr?.room || "?"}
                </div>
              </div>
            </div>

            {/* Price */}
            <div
              style={{
                background: "rgba(5,205,153,0.06)",
                borderRadius: 16,
                padding: 16,
                border: "1px solid rgba(5,205,153,0.12)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Total Paid
              </span>
              <span
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#05cd99",
                }}
              >
                ₦{(order.price || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red:#e60000; --dark:#0f172a; --muted:#64748b;
    --border:#eaedf5; --surface:#f6f8fc; --white:#ffffff;
    --green:#05cd99; --amber:#f59e0b; --blue:#3b82f6;
    --font-mono:'DM Mono',monospace;
  }
  body { font-family:'DM Sans',sans-serif; background:var(--surface); color:var(--dark); min-height:100vh; -webkit-font-smoothing:antialiased; }

  @keyframes spin       { to { transform:rotate(360deg); } }
  @keyframes fadeUp     { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-dot  { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes shimmer    { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes modalIn    { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes slideIn    { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes bounce     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes ping       { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.2);opacity:0} }

  .app { min-height:100vh; display:flex; flex-direction:column; }

  /* ── NAV ── */
  .topnav {
    background:var(--white); border-bottom:1px solid var(--border);
    padding:0 5%; height:66px; display:flex; align-items:center; justify-content:space-between;
    position:sticky; top:0; z-index:200;
    box-shadow:0 1px 0 rgba(0,0,0,0.05);
  }
  .nav-logo { font-family:'Syne',sans-serif; font-size:26px; font-weight:900; color:var(--dark); letter-spacing:-1px; }
  .nav-logo span { color:var(--red); }
  .nav-right { display:flex; align-items:center; gap:10px; }
  .nav-location {
    display:flex; align-items:center; gap:6px;
    background:var(--surface); border-radius:50px; padding:8px 14px;
    font-size:13px; font-weight:700; color:var(--dark); cursor:pointer; border:none;
    transition:background 0.2s;
  }
  .nav-location:hover { background:var(--border); }
  .nav-icon-btn {
    width:38px; height:38px; border-radius:10px;
    background:var(--surface); border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:var(--muted); position:relative; transition:all 0.2s;
  }
  .nav-icon-btn:hover { background:var(--border); color:var(--dark); }
  .nav-badge-dot { position:absolute; top:6px; right:6px; width:8px; height:8px; border-radius:50%; background:var(--red); border:2px solid var(--white); }
  .logout-link { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:var(--muted); cursor:pointer; border:none; background:none; transition:color 0.2s; }
  .logout-link:hover { color:var(--red); }
  .profile-pill {
    display:flex; align-items:center; gap:8px; background:var(--surface);
    border-radius:50px; padding:6px 14px 6px 8px; cursor:pointer; border:none;
    transition:background 0.2s;
  }
  .profile-pill:hover { background:var(--border); }
  .profile-avatar {
    width:28px; height:28px; border-radius:8px;
    background:linear-gradient(135deg,var(--red),#ff4d4d);
    display:flex; align-items:center; justify-content:center;
    font-family:'Syne',sans-serif; font-size:11px; font-weight:900; color:#fff; flex-shrink:0;
  }
  .profile-name-sm { font-size:13px; font-weight:700; color:var(--dark); }

  main { flex:1; max-width:1120px; margin:0 auto; width:100%; padding:32px 5% 80px; }

  /* ── GREETING ── */
  .greeting-h { font-family:'Syne',sans-serif; font-size:30px; font-weight:900; letter-spacing:-0.5px; margin-bottom:4px; }
  .greeting-sub { color:var(--muted); font-size:15px; font-weight:500; margin-bottom:28px; }

  /* ── ACTIVE ORDER CARDS ── */
  .active-orders-section { margin-bottom:32px; }
  .section-title { font-family:'Syne',sans-serif; font-size:18px; font-weight:900; margin-bottom:16px; }

  .tracker-card {
    border-radius:20px; padding:0; margin-bottom:12px;
    animation:fadeUp 0.3s ease; overflow:hidden;
    cursor:pointer; transition:transform 0.2s, box-shadow 0.2s;
    border:1px solid transparent;
  }
  .tracker-card:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(0,0,0,0.15); }

  .tracker-inner {
    display:flex; align-items:center; gap:0;
    position:relative; overflow:hidden;
  }
  .tracker-accent { width:6px; align-self:stretch; flex-shrink:0; }
  .tracker-body { flex:1; padding:20px 22px; display:flex; align-items:center; gap:16px; min-width:0; }
  .tracker-icon { width:50px; height:50px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
  .tracker-info { flex:1; min-width:0; }
  .tracker-status-label { font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:3px; }
  .tracker-meal-name { font-size:16px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .tracker-vendor { font-size:13px; font-weight:600; }
  .tracker-right { padding:20px 22px 20px 0; text-align:right; flex-shrink:0; }
  .tracker-price { font-family:'Syne',sans-serif; font-size:20px; font-weight:900; margin-bottom:4px; }
  .tracker-cta {
    display:flex; align-items:center; gap:5px; justify-content:flex-end;
    font-size:12px; font-weight:800; padding:6px 14px; border-radius:50px; border:none;
    cursor:pointer; transition:opacity 0.2s;
  }
  .tracker-cta:hover { opacity:0.8; }

  /* Rider assigned indicator on tracker card */
  .rider-live-pill {
    display:flex; align-items:center; gap:5px;
    background:rgba(5,205,153,0.1); border:1px solid rgba(5,205,153,0.2);
    border-radius:50px; padding:4px 10px;
    font-size:10px; font-weight:800; color:#05cd99;
    margin-top:6px; width:fit-content;
  }
  .rider-live-dot {
    width:5px; height:5px; border-radius:50%; background:#05cd99;
    animation:pulse-dot 1.5s infinite; position:relative;
  }
  .rider-live-dot::after {
    content:''; position:absolute; inset:-2px;
    border-radius:50%; border:1px solid #05cd99;
    animation:ping 1.5s infinite;
  }

  /* Progress strip */
  .tracker-progress { height:3px; }
  .tracker-progress-fill { height:100%; transition:width 0.8s ease; }

  /* ── SEARCH ── */
  .search-wrap { position:relative; margin-bottom:24px; }
  .search-icon { position:absolute; left:18px; top:50%; transform:translateY(-50%); color:var(--muted); }
  .search-input {
    width:100%; padding:15px 18px 15px 50px;
    background:var(--white); border:1.5px solid var(--border);
    border-radius:16px; font-family:'DM Sans',sans-serif;
    font-size:15px; font-weight:500; color:var(--dark); outline:none;
    transition:border-color 0.2s, box-shadow 0.2s;
  }
  .search-input:focus { border-color:rgba(230,0,0,0.3); box-shadow:0 0 0 4px rgba(230,0,0,0.06); }
  .search-input::placeholder { color:#b0b8c8; }

  /* ── CATEGORIES ── */
  .cats { display:flex; gap:8px; margin-bottom:24px; overflow-x:auto; padding-bottom:4px; scrollbar-width:none; }
  .cats::-webkit-scrollbar { display:none; }
  .cat-pill {
    padding:8px 18px; border-radius:50px; font-size:13px; font-weight:700;
    cursor:pointer; border:1.5px solid var(--border); background:var(--white);
    color:var(--muted); white-space:nowrap; transition:all 0.18s;
    font-family:'DM Sans',sans-serif;
  }
  .cat-pill:hover { border-color:rgba(230,0,0,0.3); color:var(--dark); }
  .cat-pill.active { background:var(--dark); color:#fff; border-color:var(--dark); }

  /* ── MEAL GRID ── */
  .meal-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:18px; }
  .meal-card {
    background:var(--white); border-radius:20px; border:1.5px solid var(--border);
    overflow:hidden; transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s;
    animation:fadeUp 0.35s ease; display:flex; flex-direction:column;
  }
  .meal-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.08); border-color:rgba(230,0,0,0.2); }
  .meal-thumb { height:108px; display:flex; align-items:center; justify-content:center; font-size:52px; background:var(--surface); }
  .meal-body { padding:16px 18px 18px; flex:1; display:flex; flex-direction:column; }
  .meal-vendor { font-size:10px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:var(--red); margin-bottom:5px; }
  .meal-name { font-family:'Syne',sans-serif; font-size:16px; font-weight:900; margin-bottom:6px; line-height:1.2; }
  .meal-meta { display:flex; align-items:center; gap:10px; font-size:11px; color:var(--muted); font-weight:600; margin-bottom:14px; flex-wrap:wrap; }
  .meal-footer { display:flex; align-items:center; justify-content:space-between; margin-top:auto; gap:8px; }
  .meal-price { font-family:'Syne',sans-serif; font-size:20px; font-weight:900; }
  .add-btn {
    display:flex; align-items:center; gap:6px; background:var(--red); color:#fff;
    border:none; padding:10px 18px; border-radius:50px;
    font-size:13px; font-weight:800; cursor:pointer; transition:opacity 0.2s,transform 0.15s;
    font-family:'DM Sans',sans-serif; white-space:nowrap;
  }
  .add-btn:hover:not(:disabled) { opacity:0.88; transform:scale(1.03); }
  .add-btn:disabled { opacity:0.45; cursor:not-allowed; }

  /* ── HISTORY ── */
  .history-card { background:var(--white); border-radius:20px; border:1px solid var(--border); overflow:hidden; margin-top:24px; }
  .history-header { padding:18px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .history-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:900; }
  .history-row {
    display:flex; align-items:center; gap:14px; padding:14px 24px;
    border-bottom:1px solid var(--border); transition:background 0.15s;
    cursor:pointer;
  }
  .history-row:last-child { border-bottom:none; }
  .history-row:hover { background:var(--surface); }
  .history-emoji { font-size:22px; width:40px; text-align:center; flex-shrink:0; }
  .history-name { font-size:14px; font-weight:700; }
  .history-meta { font-size:12px; color:var(--muted); font-weight:600; }
  .history-price { font-size:14px; font-weight:800; margin-left:auto; }
  .history-badge { font-size:10px; font-weight:800; padding:3px 10px; border-radius:6px; text-transform:uppercase; letter-spacing:0.5px; }
  .badge-delivered { background:rgba(5,205,153,0.1); color:var(--green); }

  /* ── SKELETON ── */
  .skeleton {
    background:linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%);
    background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:10px;
  }

  /* ── TOAST ── */
  .toast {
    position:fixed; bottom:32px; left:50%; transform:translateX(-50%);
    background:var(--dark); color:#fff; padding:13px 22px; border-radius:50px;
    font-size:13px; font-weight:700; display:flex; align-items:center; gap:10px;
    z-index:9998; animation:fadeUp 0.3s ease; white-space:nowrap;
    box-shadow:0 8px 32px rgba(0,0,0,0.25);
  }

  /* ── MODAL ── */
  .profile-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
  .profile-modal { background:var(--white); border-radius:24px; padding:32px; width:100%; max-width:500px; animation:modalIn 0.22s ease; max-height:90vh; overflow-y:auto; }
  .modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:26px; }
  .modal-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:900; }
  .modal-close { background:none; border:none; cursor:pointer; color:var(--muted); padding:6px; border-radius:8px; }
  .modal-close:hover { color:var(--dark); }
  .section-label-sm { font-size:10px; font-weight:800; color:var(--muted); letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; margin-top:22px; }
  .section-label-sm:first-of-type { margin-top:0; }
  .form-group { margin-bottom:14px; }
  .form-label { font-size:13px; font-weight:700; color:var(--dark); margin-bottom:7px; display:block; }
  .form-input {
    width:100%; padding:12px 15px; background:var(--surface); border:1.5px solid var(--border);
    border-radius:12px; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--dark); outline:none;
    transition:border-color 0.2s;
  }
  .form-input:focus { border-color:rgba(230,0,0,0.4); background:#fff; }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .form-save-btn {
    width:100%; padding:14px; background:var(--red); color:#fff; border:none;
    border-radius:14px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:800;
    cursor:pointer; margin-top:8px; transition:opacity 0.2s;
  }
  .form-save-btn:hover { opacity:0.88; }
  .form-save-btn:disabled { opacity:0.45; cursor:not-allowed; }

  /* ── EMPTY ── */
  .empty-state { text-align:center; padding:52px 20px; color:var(--muted); }
  .empty-icon { width:68px; height:68px; border-radius:20px; background:var(--surface); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:30px; }
  .empty-h { font-family:'Syne',sans-serif; font-size:20px; font-weight:900; color:var(--dark); margin-bottom:8px; }

  @media (max-width:768px) {
    main { padding:20px 5% 60px; }
    .meal-grid { grid-template-columns:1fr; }
    .greeting-h { font-size:24px; }
    .cats { padding-bottom:8px; }
  }
`;

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function UserDashboard() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setCategory] = useState<string>(ALL_CATEGORY);
  const [ordering, setOrdering] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mealsLoading, setMealsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // ── Auth ──────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  // ── User profile ──────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as UserProfile;
        setUserProfile(data);
        setProfileForm((p) =>
          Object.keys(p).length === 0
            ? {
                fullName: data.fullName || "",
                phone: data.phone || "",
                hostel: data.deliveryAddress?.hostel || "",
                room: data.deliveryAddress?.room || "",
                landmark: data.deliveryAddress?.landmark || "",
              }
            : p,
        );
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [uid, router]);

  // ── Orders ────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "orders"), where("userId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(data);
      // Auto-refresh tracking modal if it's open
      setTrackingOrder((prev) =>
        prev ? data.find((o) => o.id === prev.id) || prev : null,
      );
    });
    return () => unsub();
  }, [uid]);

  // ── Meals ─────────────────────────────────
  useEffect(() => {
    setMealsLoading(true);
    const q = query(collection(db, "meals"), where("available", "==", true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Meal, "id">),
        })) as Meal[];
        setMeals(data);
        setMealsLoading(false);
      },
      () => setMealsLoading(false),
    );
    return () => unsub();
  }, []);

  // ── Place order ───────────────────────────
  const placeOrder = useCallback(
    async (meal: Meal) => {
      if (!uid || !userProfile) return;
      if (!userProfile.deliveryAddress?.hostel) {
        showToast("⚠️ Set your delivery address first!");
        setShowProfile(true);
        return;
      }
      setOrdering((p) => ({ ...p, [meal.id]: true }));
      try {
        await addDoc(collection(db, "orders"), {
          userId: uid,
          vendorId: meal.vendorId,
          vendorName: meal.vendorName,
          mealName: meal.name,
          mealId: meal.id,
          price: meal.price,
          status: "pending",
          deliveryAddress: userProfile.deliveryAddress || {},
          createdAt: Date.now(),
        });
        showToast(`${meal.name} ordered! 🎉`);
      } catch (err) {
        console.error(err);
        showToast("Order failed. Please try again.");
      }
      setOrdering((p) => ({ ...p, [meal.id]: false }));
    },
    [uid, userProfile],
  );

  // ── Save profile ──────────────────────────
  const saveProfile = useCallback(async () => {
    if (!uid) return;
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        fullName: (profileForm.fullName || "").trim(),
        phone: (profileForm.phone || "").trim(),
        deliveryAddress: {
          hostel: profileForm.hostel,
          room: (profileForm.room || "").trim(),
          landmark: (profileForm.landmark || "").trim(),
        },
        updatedAt: Date.now(),
      });
      setShowProfile(false);
      setProfileForm({});
      showToast("Profile updated ✓");
    } catch {
      showToast("Failed to save. Try again.");
    }
    setSavingProfile(false);
  }, [uid, profileForm]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = async () => {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    router.push("/");
  };

  // ── Derived ───────────────────────────────
  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  const categories = [
    ALL_CATEGORY,
    ...Array.from(
      new Set(meals.map((m) => m.category).filter(Boolean) as string[]),
    ),
  ];
  const filteredMeals = meals.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.vendorName?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q);
    const matchCat =
      activeCategory === ALL_CATEGORY || m.category === activeCategory;
    return matchSearch && matchCat;
  });

  const hostelLabel = userProfile?.deliveryAddress?.hostel
    ? `${userProfile.deliveryAddress.hostel}${userProfile.deliveryAddress.room ? `, Rm ${userProfile.deliveryAddress.room}` : ""}`
    : "Set address";
  const displayName = userProfile?.fullName?.split(" ")[0] || "there";
  const initials = userProfile?.fullName
    ? userProfile.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const openProfile = () => {
    setProfileForm({
      fullName: userProfile?.fullName || "",
      phone: userProfile?.phone || "",
      hostel: userProfile?.deliveryAddress?.hostel || "",
      room: userProfile?.deliveryAddress?.room || "",
      landmark: userProfile?.deliveryAddress?.landmark || "",
    });
    setShowProfile(true);
  };

  // Color config per status
  const getTrackerStyle = (status: Order["status"]) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return cfg;
  };

  const getProgressWidth = (status: Order["status"]) => {
    const map: Record<string, string> = {
      pending: "15%",
      accepted: "40%",
      out_for_delivery: "65%",
      picked_up: "85%",
      delivered: "100%",
    };
    return map[status] || "15%";
  };

  if (authLoading || !userProfile)
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: "3px solid #e60000",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: "var(--muted)", fontWeight: 600 }}>
              Loading your experience…
            </p>
          </div>
        </div>
      </>
    );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="app">
        {/* ── NAV ── */}
        <nav className="topnav">
          <div className="nav-logo">
            ODG<span>.</span>
          </div>
          <div className="nav-right">
            <button className="nav-location" onClick={openProfile}>
              <MapPin size={14} color="var(--red)" />
              {hostelLabel}
            </button>
            <button className="nav-icon-btn">
              <Bell size={18} />
              {activeOrders.length > 0 && <span className="nav-badge-dot" />}
            </button>
            <button className="profile-pill" onClick={openProfile}>
              <div className="profile-avatar">{initials}</div>
              <span className="profile-name-sm">{displayName}</span>
            </button>
            <button className="logout-link" onClick={handleLogout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </nav>

        <main>
          <h1 className="greeting-h">Hey {displayName} 👋</h1>
          <p className="greeting-sub">
            {activeOrders.length > 0
              ? `${activeOrders.length} active order${activeOrders.length > 1 ? "s" : ""} — tap to track live`
              : "What are you eating today?"}
          </p>

          {/* ── ACTIVE ORDERS (clickable → tracking modal) ── */}
          {activeOrders.length > 0 && (
            <section className="active-orders-section">
              <div className="section-title">Active Orders</div>
              {activeOrders.map((order) => {
                const cfg = getTrackerStyle(order.status);
                const hasRider = !!order.riderId;
                return (
                  <div
                    key={order.id}
                    className="tracker-card"
                    onClick={() => setTrackingOrder(order)}
                    style={{
                      background: "#fff",
                      borderColor: `${cfg.color}22`,
                    }}
                  >
                    {/* Progress strip at top */}
                    <div
                      className="tracker-progress"
                      style={{ background: `${cfg.color}18` }}
                    >
                      <div
                        className="tracker-progress-fill"
                        style={{
                          width: getProgressWidth(order.status),
                          background: cfg.color,
                        }}
                      />
                    </div>
                    <div className="tracker-inner">
                      <div
                        className="tracker-accent"
                        style={{ background: cfg.color }}
                      />
                      <div className="tracker-body">
                        <div
                          className="tracker-icon"
                          style={{ background: cfg.bg, fontSize: 24 }}
                        >
                          {cfg.emoji}
                        </div>
                        <div className="tracker-info">
                          <div
                            className="tracker-status-label"
                            style={{ color: cfg.color }}
                          >
                            {cfg.label}
                          </div>
                          <div className="tracker-meal-name">
                            {order.mealName}
                          </div>
                          <div
                            className="tracker-vendor"
                            style={{ color: "var(--muted)" }}
                          >
                            {order.vendorName}
                          </div>
                          {hasRider && (
                            <div className="rider-live-pill">
                              <div className="rider-live-dot" />
                              {order.riderName} is on the way
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="tracker-right">
                        <div
                          className="tracker-price"
                          style={{ color: cfg.color }}
                        >
                          ₦{(order.price || 0).toLocaleString()}
                        </div>
                        <button
                          className="tracker-cta"
                          style={{
                            background: cfg.bg,
                            color: cfg.color,
                            fontSize: 11,
                            padding: "5px 12px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackingOrder(order);
                          }}
                        >
                          {hasRider ? (
                            <>
                              <Navigation size={11} /> Track Live
                            </>
                          ) : (
                            <>
                              <Package size={11} /> View Order
                            </>
                          )}
                          <ChevronRight size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* ── SEARCH ── */}
          <div className="search-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search meals, vendors, or categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ── CATEGORIES ── */}
          {!search && categories.length > 1 && (
            <div className="cats">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`cat-pill ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* ── MEAL GRID ── */}
          <div className="section-title" style={{ marginBottom: 16 }}>
            {search
              ? `Results for "${search}"`
              : activeCategory !== ALL_CATEGORY
                ? activeCategory
                : "Trending Near You"}
          </div>
          {mealsLoading ? (
            <div className="meal-grid">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1.5px solid var(--border)",
                  }}
                >
                  <div className="skeleton" style={{ height: 108 }} />
                  <div style={{ padding: "16px 18px" }}>
                    <div
                      className="skeleton"
                      style={{ height: 10, width: "40%", marginBottom: 10 }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 18, marginBottom: 8 }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 10, width: "60%", marginBottom: 18 }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        className="skeleton"
                        style={{ height: 22, width: 70 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 36, width: 90, borderRadius: 50 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMeals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <div className="empty-h">
                {search ? "No results found" : "No meals available"}
              </div>
              <p style={{ fontSize: 14 }}>
                {search
                  ? "Try a different search"
                  : "Vendors haven't added meals yet. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="meal-grid">
              {filteredMeals.map((meal) => (
                <div key={meal.id} className="meal-card">
                  <div className="meal-thumb">{getMealEmoji(meal.name)}</div>
                  <div className="meal-body">
                    <div className="meal-vendor">{meal.vendorName}</div>
                    <div className="meal-name">{meal.name}</div>
                    <div className="meal-meta">
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock size={11} /> {meal.estimatedTime || "15 mins"}
                      </span>
                      {typeof meal.rating === "number" && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Star
                            size={11}
                            color="var(--amber)"
                            fill="var(--amber)"
                          />{" "}
                          {meal.rating}
                        </span>
                      )}
                      {meal.category && (
                        <span
                          style={{
                            background: "var(--surface)",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {meal.category}
                        </span>
                      )}
                    </div>
                    {meal.description && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          marginBottom: 10,
                          lineHeight: 1.5,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {meal.description}
                      </p>
                    )}
                    <div className="meal-footer">
                      <div className="meal-price">
                        ₦{(meal.price || 0).toLocaleString()}
                      </div>
                      <button
                        className="add-btn"
                        onClick={() => placeOrder(meal)}
                        disabled={ordering[meal.id]}
                      >
                        {ordering[meal.id] ? (
                          <>
                            <div
                              style={{
                                width: 13,
                                height: 13,
                                border: "2px solid rgba(255,255,255,0.4)",
                                borderTopColor: "#fff",
                                borderRadius: "50%",
                                animation: "spin 0.7s linear infinite",
                              }}
                            />{" "}
                            Ordering…
                          </>
                        ) : (
                          <>
                            <Plus size={15} /> Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ORDER HISTORY ── */}
          {deliveredOrders.length > 0 && (
            <div className="history-card">
              <div className="history-header">
                <div className="history-title">Order History</div>
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    fontWeight: 600,
                  }}
                >
                  {deliveredOrders.length} orders
                </span>
              </div>
              {deliveredOrders.slice(0, 10).map((o) => {
                const meal = meals.find((m) => m.id === o.mealId);
                return (
                  <div
                    key={o.id}
                    className="history-row"
                    onClick={() => setTrackingOrder(o)}
                  >
                    <div className="history-emoji">
                      {getMealEmoji(o.mealName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="history-name">{o.mealName}</div>
                      <div className="history-meta">
                        {o.vendorName} ·{" "}
                        {formatTime(o.completedAt || o.createdAt)}
                      </div>
                    </div>
                    <div className="history-price">
                      ₦{(o.price || 0).toLocaleString()}
                    </div>
                    <span className="history-badge badge-delivered">
                      Delivered
                    </span>
                    {meal && (
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: "none",
                          border: "1.5px solid var(--border)",
                          color: "var(--muted)",
                          padding: "6px 12px",
                          borderRadius: 50,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.18s",
                          fontFamily: "'DM Sans',sans-serif",
                          whiteSpace: "nowrap",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          placeOrder(meal);
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--red)";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--red)";
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--border)";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--muted)";
                        }}
                      >
                        <RotateCcw size={12} /> Reorder
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ── TOAST ── */}
        {toast && (
          <div className="toast">
            <CheckCircle2 size={15} color="var(--green)" /> {toast}
          </div>
        )}
      </div>

      {/* ── TRACKING MODAL ── */}
      {trackingOrder && (
        <TrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}

      {/* ── PROFILE MODAL ── */}
      {showProfile && (
        <div
          className="profile-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowProfile(false)}
        >
          <div className="profile-modal">
            <div className="modal-header">
              <div className="modal-title">Edit Profile</div>
              <button
                className="modal-close"
                onClick={() => setShowProfile(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="section-label-sm">Personal Info</div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="Your full name"
                value={profileForm.fullName || ""}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, fullName: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                placeholder="e.g. 08012345678"
                type="tel"
                value={profileForm.phone || ""}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
            <div className="section-label-sm">Delivery Address</div>
            <div className="form-group">
              <label className="form-label">Hostel / Location</label>
              <select
                className="form-input"
                value={profileForm.hostel || ""}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, hostel: e.target.value }))
                }
              >
                <option value="">Select your hostel…</option>
                {HOSTELS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input
                  className="form-input"
                  placeholder="e.g. A204"
                  value={profileForm.room || ""}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, room: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Landmark</label>
                <input
                  className="form-input"
                  placeholder="Near the gate…"
                  value={profileForm.landmark || ""}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, landmark: e.target.value }))
                  }
                />
              </div>
            </div>
            {profileForm.hostel && (
              <div
                style={{
                  background: "rgba(5,205,153,0.06)",
                  border: "1px solid rgba(5,205,153,0.2)",
                  borderRadius: 12,
                  padding: "11px 14px",
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--dark)",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <MapPin size={13} color="var(--green)" />
                {profileForm.hostel}
                {profileForm.room ? `, Room ${profileForm.room}` : ""}
                {profileForm.landmark ? ` — ${profileForm.landmark}` : ""}
              </div>
            )}
            <button
              className="form-save-btn"
              onClick={saveProfile}
              disabled={
                savingProfile ||
                !profileForm.fullName?.trim() ||
                !profileForm.hostel
              }
            >
              {savingProfile ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
