"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Wallet,
  PackageCheck,
  ListOrdered,
  ArrowUpRight,
  LogOut,
  CheckCircle2,
  TrendingUp,
  Bell,
  Zap,
  Plus,
  Clock,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChefHat,
  Timer,
  MapPin,
  Phone,
  Navigation,
  Radio,
  Eye,
  ChevronRight,
  User,
} from "lucide-react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  runTransaction,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface Vendor {
  id: string;
  storeName: string;
  ownerName?: string;
  status?: "open" | "closed";
  balance?: number;
  totalOrders?: number;
  totalRevenue?: number;
  rating?: number;
  [key: string]: unknown;
}

interface VendorOrder {
  id: string;
  vendorId: string;
  userId?: string;
  mealName: string;
  price: number;
  status:
    | "pending"
    | "accepted"
    | "out_for_delivery"
    | "picked_up"
    | "delivered";
  createdAt: number;
  completedAt?: number;
  claimedAt?: number;
  pickedUpAt?: number;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  deliveryAddress?: { hostel?: string; room?: string; landmark?: string };
  [key: string]: unknown;
}

interface VendorMeal {
  id: string;
  name: string;
  price: number;
  category: string;
  estimatedTime?: string;
  description?: string;
  vendorId: string;
  vendorName: string;
  available?: boolean;
  createdAt: number;
  [key: string]: unknown;
}

interface RiderLocation {
  lat: number;
  lng: number;
  orderId: string;
  updatedAt: number;
}

interface CustomerInfo {
  fullName?: string;
  phone?: string;
}

type MealForm = {
  name: string;
  price: string;
  category: string;
  estimatedTime: string;
  description: string;
};

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const MEAL_CATEGORIES = [
  "Main",
  "Snack",
  "Drinks",
  "Dessert",
  "Protein",
  "Sides",
];

const STATUS_META = {
  pending: {
    label: "Pending",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    emoji: "⏳",
  },
  accepted: {
    label: "Accepted",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    emoji: "✅",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "#e60000",
    bg: "rgba(230,0,0,0.1)",
    emoji: "🛵",
  },
  picked_up: {
    label: "Picked Up",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    emoji: "🏃",
  },
  delivered: {
    label: "Delivered",
    color: "#05cd99",
    bg: "rgba(5,205,153,0.1)",
    emoji: "🎉",
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
  return "🍽️";
}

function formatTime(ts?: number) {
  if (!ts) return "";
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ─────────────────────────────────────────────
//  LEAFLET MAP (same as user dashboard)
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
      const destIcon = L.divIcon({
        html: `<div style="width:30px;height:30px;background:#e60000;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(230,0,0,0.5)"><span style="transform:rotate(45deg);display:block;text-align:center;font-size:12px;line-height:24px">📍</span></div>`,
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });
      const dest = L.marker(CAMPUS, { icon: destIcon }).addTo(map) as {
        bindPopup: (h: string) => unknown;
      };
      dest.bindPopup(
        `<b>Delivery to</b><br>${deliveryAddress?.hostel || ""} Rm ${deliveryAddress?.room || "?"}`,
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
      html: `<div style="width:38px;height:38px;background:#e60000;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 14px rgba(230,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:18px">🛵</div>`,
      className: "",
      iconSize: [38, 38],
      iconAnchor: [19, 19],
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
        minHeight: 220,
        background: "#1a2035",
        borderRadius: 14,
      }}
    />
  );
}

// ─────────────────────────────────────────────
//  ORDER TRACKING MODAL (Vendor view)
// ─────────────────────────────────────────────
function OrderTrackModal({
  order,
  customer,
  onClose,
}: {
  order: VendorOrder;
  customer: CustomerInfo | null;
  onClose: () => void;
}) {
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(
    null,
  );
  const [locationAge, setLocationAge] = useState(0);

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

  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const hasRider = !!order.riderId;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#0f172a",
          borderRadius: 24,
          width: "100%",
          maxWidth: 820,
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
            padding: "18px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: meta.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {meta.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 16,
                fontWeight: 900,
                color: "#fff",
              }}
            >
              {order.mealName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                fontWeight: 600,
              }}
            >
              #{order.id.slice(-6).toUpperCase()} ·{" "}
              {formatTime(order.createdAt)}
            </div>
          </div>
          <div
            style={{
              padding: "5px 13px",
              borderRadius: 50,
              background: meta.bg,
              color: meta.color,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {meta.label}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "none",
              borderRadius: 10,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Map */}
          <div style={{ flex: 1, padding: 18, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Radio size={12} color="#e60000" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Rider Tracking
                </span>
              </div>
              {riderLocation && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: locationAge < 15 ? "#05cd99" : "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
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
                height: 260,
                borderRadius: 14,
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
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 36 }}>🎉</div>
                  <div
                    style={{ color: "#05cd99", fontWeight: 700, fontSize: 14 }}
                  >
                    Order Delivered!
                  </div>
                </div>
              ) : !hasRider ? (
                <div
                  style={{
                    height: "100%",
                    background: "#111827",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 32 }}>🔍</div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    No rider assigned yet
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
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 32 }}>📡</div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Locating rider…
                  </div>
                </div>
              ) : (
                <LiveMap
                  riderLocation={riderLocation}
                  deliveryAddress={order.deliveryAddress}
                  visible={true}
                />
              )}
            </div>

            {/* Order info chips */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  icon: <MapPin size={11} />,
                  text: order.deliveryAddress
                    ? `${order.deliveryAddress.hostel}, Rm ${order.deliveryAddress.room}`
                    : "No address",
                },
                {
                  icon: <Wallet size={11} />,
                  text: `₦${(order.price || 0).toLocaleString()}`,
                },
                {
                  icon: <Clock size={11} />,
                  text: formatTime(order.createdAt),
                },
              ].map((chip, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  {chip.icon}
                  {chip.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right col */}
          <div
            style={{
              width: 260,
              flexShrink: 0,
              padding: "18px 18px 18px 0",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Customer card */}
            {customer && (
              <div
                style={{
                  background: "rgba(59,130,246,0.08)",
                  borderRadius: 16,
                  padding: 16,
                  border: "1px solid rgba(59,130,246,0.15)",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Customer
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: "rgba(59,130,246,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={16} color="#3b82f6" />
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}
                    >
                      {customer.fullName || "Customer"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "'DM Mono',monospace",
                      }}
                    >
                      {customer.phone || "No phone"}
                    </div>
                  </div>
                </div>
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      background: "#3b82f6",
                      color: "#fff",
                      borderRadius: 10,
                      padding: "8px",
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Phone size={12} /> Call Customer
                  </a>
                )}
              </div>
            )}

            {/* Rider card */}
            {hasRider && (
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
                    fontSize: 9,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Rider
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: "linear-gradient(135deg,#e60000,#ff4d4d)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 12,
                      fontWeight: 900,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {(order.riderName || "R")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}
                    >
                      {order.riderName || "Rider"}
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
                  <div style={{ display: "flex", gap: 7 }}>
                    <a
                      href={`tel:${order.riderPhone}`}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        background: "#e60000",
                        color: "#fff",
                        borderRadius: 10,
                        padding: "8px",
                        fontSize: 12,
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                    >
                      <Phone size={12} /> Call
                    </a>
                    <a
                      href={`sms:${order.riderPhone}`}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        background: "rgba(255,255,255,0.1)",
                        color: "#fff",
                        borderRadius: 10,
                        padding: "8px",
                        fontSize: 12,
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                    >
                      <Radio size={12} /> SMS
                    </a>
                  </div>
                )}
                {/* Live location indicator */}
                {riderLocation && order.status !== "delivered" && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 10px",
                      background: "rgba(5,205,153,0.08)",
                      borderRadius: 9,
                      border: "1px solid rgba(5,205,153,0.15)",
                    }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#05cd99",
                        animation: "pulse-dot 1.5s infinite",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#05cd99",
                      }}
                    >
                      Broadcasting live · {locationAge}s ago
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Order timeline */}
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
                  fontSize: 9,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Timeline
              </div>
              {[
                { label: "Order Placed", ts: order.createdAt, done: true },
                {
                  label: "Accepted",
                  ts: order.claimedAt,
                  done: [
                    "accepted",
                    "out_for_delivery",
                    "picked_up",
                    "delivered",
                  ].includes(order.status),
                },
                {
                  label: "Rider Assigned",
                  ts: order.claimedAt,
                  done: ["out_for_delivery", "picked_up", "delivered"].includes(
                    order.status,
                  ),
                },
                {
                  label: "Picked Up",
                  ts: order.pickedUpAt,
                  done: ["picked_up", "delivered"].includes(order.status),
                },
                {
                  label: "Delivered",
                  ts: order.completedAt,
                  done: order.status === "delivered",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      flexShrink: 0,
                      marginTop: 1,
                      background: step.done
                        ? "rgba(5,205,153,0.2)"
                        : "rgba(255,255,255,0.06)",
                      border: step.done ? "1.5px solid #05cd99" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {step.done && <CheckCircle2 size={9} color="#05cd99" />}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: step.done
                          ? "rgba(255,255,255,0.75)"
                          : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {step.label}
                    </div>
                    {step.ts && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.3)",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {formatTime(step.ts)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --red:#e60000; --dark:#0f172a; --mid:#1e293b; --muted:#64748b;
    --border:#e8edf5; --surface:#f6f8fc; --white:#ffffff;
    --green:#05cd99; --amber:#f59e0b; --blue:#3b82f6;
    --font-mono:'DM Mono',monospace;
  }
  body { font-family:'DM Sans',sans-serif; background:var(--surface); color:var(--dark); min-height:100vh; -webkit-font-smoothing:antialiased; }

  @keyframes spin       { to{transform:rotate(360deg);} }
  @keyframes fadeUp     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-dot  { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes slideIn    { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes modalIn    { from{opacity:0;transform:scale(0.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ping       { 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.2);opacity:0} }

  .layout { display:flex; min-height:100vh; }

  /* ── SIDEBAR ── */
  .sidebar {
    width:260px; background:var(--dark); display:flex; flex-direction:column;
    position:sticky; top:0; height:100vh; flex-shrink:0;
    border-right:1px solid rgba(255,255,255,0.04);
  }
  .sidebar-logo { padding:26px 26px 22px; border-bottom:1px solid rgba(255,255,255,0.06); }
  .logo-text { font-family:'Syne',sans-serif; font-size:26px; font-weight:900; color:#fff; letter-spacing:-1px; }
  .logo-text span { color:var(--red); }
  .logo-sub { font-size:10px; font-weight:700; color:rgba(255,255,255,0.25); letter-spacing:2.5px; text-transform:uppercase; margin-top:2px; }
  .sidebar-nav { flex:1; padding:18px 14px; overflow-y:auto; }
  .nav-label { font-size:9px; font-weight:800; color:rgba(255,255,255,0.2); letter-spacing:2.5px; text-transform:uppercase; padding:0 10px; margin-bottom:6px; margin-top:20px; }
  .nav-item {
    display:flex; align-items:center; gap:11px; padding:10px 12px; border-radius:11px;
    font-size:13px; font-weight:600; color:rgba(255,255,255,0.4);
    cursor:pointer; margin-bottom:2px; transition:all 0.18s;
    border:none; background:none; width:100%; text-align:left; font-family:'DM Sans',sans-serif;
  }
  .nav-item:hover { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.8); }
  .nav-item.active { background:rgba(230,0,0,0.15); color:#fff; }
  .nav-item.active svg { color:var(--red); }
  .nav-dot { width:5px; height:5px; border-radius:50%; background:var(--red); margin-left:auto; animation:pulse-dot 2s infinite; }
  .sidebar-profile { padding:14px; border-top:1px solid rgba(255,255,255,0.06); }
  .profile-pill { display:flex; align-items:center; gap:11px; background:rgba(255,255,255,0.04); border-radius:13px; padding:12px 13px; border:1px solid rgba(255,255,255,0.05); }
  .profile-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,var(--red),#ff4d4d); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:14px; font-weight:900; color:#fff; flex-shrink:0; }
  .profile-name { font-size:12px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px; }
  .profile-role { font-size:10px; color:rgba(255,255,255,0.3); font-weight:600; }
  .logout-btn { margin-left:auto; background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.25); padding:4px; transition:color 0.2s; flex-shrink:0; }
  .logout-btn:hover { color:var(--red); }

  /* ── MAIN ── */
  .main { flex:1; overflow-x:hidden; }
  .topbar {
    background:var(--white); border-bottom:1px solid var(--border);
    padding:0 36px; height:66px; display:flex; align-items:center; justify-content:space-between;
    position:sticky; top:0; z-index:100; box-shadow:0 1px 0 rgba(0,0,0,0.04);
  }
  .topbar-title { font-family:'Syne',sans-serif; font-size:20px; font-weight:900; letter-spacing:-0.3px; }
  .topbar-right { display:flex; align-items:center; gap:10px; }
  .topbar-badge { position:relative; background:var(--surface); border:1px solid var(--border); cursor:pointer; width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:11px; color:var(--muted); transition:all 0.2s; }
  .topbar-badge:hover { background:var(--border); }
  .badge-dot { position:absolute; top:7px; right:7px; width:8px; height:8px; border-radius:50%; background:var(--red); border:2px solid var(--white); }
  .status-pill { display:flex; align-items:center; gap:7px; background:rgba(5,205,153,0.08); border:1px solid rgba(5,205,153,0.2); border-radius:50px; padding:7px 15px; font-size:12px; font-weight:800; color:var(--green); }
  .status-dot { width:6px; height:6px; border-radius:50%; background:var(--green); animation:pulse-dot 2s infinite; }

  .page-content { padding:30px 36px 60px; }
  .greeting-h { font-family:'Syne',sans-serif; font-size:27px; font-weight:900; letter-spacing:-0.5px; margin-bottom:4px; }
  .greeting-sub { color:var(--muted); font-size:14px; font-weight:500; margin-bottom:26px; }

  /* ── STATS ── */
  .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-bottom:26px; }
  .wallet-card {
    background:var(--dark); border-radius:20px; padding:26px; color:#fff;
    position:relative; overflow:hidden;
  }
  .wallet-card::before {
    content:''; position:absolute; top:-40px; right:-40px;
    width:200px; height:200px; border-radius:50%;
    background:radial-gradient(circle,rgba(230,0,0,0.2) 0%,transparent 70%);
  }
  .wallet-label { font-size:11px; font-weight:700; color:rgba(255,255,255,0.4); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:10px; }
  .wallet-amount { font-family:'Syne',sans-serif; font-size:36px; font-weight:900; letter-spacing:-1.5px; margin-bottom:18px; }
  .wallet-btn {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15);
    color:#fff; padding:8px 16px; border-radius:50px; font-size:12px; font-weight:700;
    cursor:pointer; transition:background 0.2s; font-family:'DM Sans',sans-serif;
  }
  .wallet-btn:hover { background:rgba(255,255,255,0.18); }
  .stat-card { background:var(--white); border-radius:20px; padding:22px 24px; border:1px solid var(--border); }
  .stat-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .stat-icon { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; }
  .stat-change { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:var(--green); }
  .stat-value { font-family:'Syne',sans-serif; font-size:34px; font-weight:900; letter-spacing:-1px; }
  .stat-label { font-size:12px; font-weight:600; color:var(--muted); margin-top:4px; }

  /* ── TABS ── */
  .tabs { display:flex; gap:4px; background:var(--surface); border-radius:13px; padding:4px; margin-bottom:22px; width:fit-content; }
  .tab { padding:9px 20px; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer; border:none; background:none; color:var(--muted); transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .tab.active { background:var(--white); color:var(--dark); box-shadow:0 1px 4px rgba(0,0,0,0.08); }

  /* ── PIPELINE ── */
  .panel-card { background:var(--white); border-radius:20px; border:1px solid var(--border); overflow:hidden; }
  .panel-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
  .panel-title { font-family:'Syne',sans-serif; font-size:17px; font-weight:900; }
  .live-badge { display:flex; align-items:center; gap:6px; background:rgba(230,0,0,0.07); border-radius:50px; padding:5px 13px; font-size:11px; font-weight:800; color:var(--red); letter-spacing:0.8px; }
  .live-dot { width:5px; height:5px; border-radius:50%; background:var(--red); animation:pulse-dot 1.5s infinite; }

  .pipeline-empty { padding:56px 20px; text-align:center; color:var(--muted); }
  .empty-icon { width:60px; height:60px; background:var(--surface); border-radius:18px; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }

  /* ── ORDER ROW ── */
  .order-row {
    display:flex; align-items:center; gap:14px; padding:16px 24px;
    border-bottom:1px solid var(--border); transition:background 0.15s;
    animation:slideIn 0.22s ease;
  }
  .order-row:last-child { border-bottom:none; }
  .order-row:hover { background:var(--surface); }
  .order-avatar { width:46px; height:46px; border-radius:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:20px; }
  .order-info { flex:1; min-width:0; }
  .order-meal { font-size:14px; font-weight:800; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .order-meta { font-size:11px; font-weight:600; color:var(--muted); }
  .order-addr { font-size:11px; color:rgba(100,116,139,0.8); font-weight:600; display:flex; align-items:center; gap:3px; margin-top:2px; }

  .status-badge { padding:4px 11px; border-radius:7px; font-size:10px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase; white-space:nowrap; }
  .order-actions { display:flex; gap:7px; flex-shrink:0; }

  .action-btn {
    padding:8px 16px; border-radius:50px; font-size:12px; font-weight:800;
    cursor:pointer; border:none; transition:opacity 0.2s,transform 0.15s;
    white-space:nowrap; font-family:'DM Sans',sans-serif;
  }
  .action-btn:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
  .action-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .btn-accept   { background:var(--red);   color:#fff; }
  .btn-dispatch { background:var(--dark);  color:#fff; }
  .btn-deliver  { background:var(--green); color:#fff; }
  .btn-view     { background:var(--surface); color:var(--muted); border:1.5px solid var(--border); }
  .btn-view:hover { border-color:rgba(230,0,0,0.3); color:var(--dark); }

  /* Rider live badge on order row */
  .rider-live-mini {
    display:inline-flex; align-items:center; gap:4px;
    background:rgba(5,205,153,0.08); border:1px solid rgba(5,205,153,0.2);
    border-radius:6px; padding:2px 7px;
    font-size:9px; font-weight:800; color:var(--green); letter-spacing:0.5px;
    margin-left:6px;
  }
  .live-dot-green { width:4px; height:4px; border-radius:50%; background:var(--green); animation:pulse-dot 1.5s infinite; }

  /* ── MENU ── */
  .menu-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
  .add-meal-btn {
    display:flex; align-items:center; gap:7px; background:var(--red); color:#fff;
    border:none; padding:10px 20px; border-radius:50px; font-size:13px; font-weight:800;
    cursor:pointer; transition:opacity 0.2s; font-family:'DM Sans',sans-serif;
  }
  .add-meal-btn:hover { opacity:0.88; }
  .meal-row { display:flex; align-items:center; gap:14px; padding:14px 24px; border-bottom:1px solid var(--border); transition:background 0.15s; }
  .meal-row:last-child { border-bottom:none; }
  .meal-row:hover { background:var(--surface); }
  .meal-emoji { width:44px; height:44px; border-radius:12px; background:var(--surface); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
  .meal-info { flex:1; }
  .meal-name-row { font-size:14px; font-weight:800; margin-bottom:3px; }
  .meal-meta-row { display:flex; gap:10px; font-size:11px; color:var(--muted); font-weight:600; }
  .meal-price-tag { font-family:'Syne',sans-serif; font-size:16px; font-weight:900; }
  .avail-toggle {
    display:flex; align-items:center; gap:7px; background:none; border:none;
    cursor:pointer; font-size:12px; font-weight:700; transition:all 0.2s;
    padding:7px 13px; border-radius:50px; font-family:'DM Sans',sans-serif;
  }
  .avail-toggle.on  { color:var(--green); background:rgba(5,205,153,0.08); }
  .avail-toggle.off { color:var(--muted); background:var(--surface); }
  .delete-btn { width:34px; height:34px; border-radius:10px; background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); transition:all 0.2s; }
  .delete-btn:hover { background:rgba(230,0,0,0.08); color:var(--red); }

  /* ── MODAL ── */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
  .modal { background:var(--white); border-radius:22px; padding:30px; width:100%; max-width:480px; animation:modalIn 0.22s ease; }
  .modal-title { font-family:'Syne',sans-serif; font-size:21px; font-weight:900; margin-bottom:22px; display:flex; align-items:center; justify-content:space-between; }
  .modal-close { background:none; border:none; cursor:pointer; color:var(--muted); padding:4px; border-radius:8px; transition:color 0.2s; }
  .modal-close:hover { color:var(--dark); }
  .form-group { margin-bottom:16px; }
  .form-label { font-size:12px; font-weight:700; color:var(--muted); margin-bottom:7px; display:block; text-transform:uppercase; letter-spacing:0.5px; }
  .form-input { width:100%; padding:11px 14px; background:var(--surface); border:1.5px solid var(--border); border-radius:11px; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--dark); outline:none; transition:border-color 0.2s; }
  .form-input:focus { border-color:rgba(230,0,0,0.4); background:#fff; }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .form-submit { width:100%; padding:13px; background:var(--red); color:#fff; border:none; border-radius:13px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:800; cursor:pointer; margin-top:6px; transition:opacity 0.2s; }
  .form-submit:hover { opacity:0.88; }
  .form-submit:disabled { opacity:0.45; cursor:not-allowed; }

  /* ── TWO-COL ── */
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-top:18px; }
  .recent-card { background:var(--white); border-radius:20px; border:1px solid var(--border); overflow:hidden; }
  .recent-header { padding:18px 22px 14px; border-bottom:1px solid var(--border); }
  .recent-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:900; }
  .recent-item { display:flex; align-items:center; gap:12px; padding:12px 22px; border-bottom:1px solid var(--border); transition:background 0.15s; }
  .recent-item:last-child { border-bottom:none; }
  .recent-item:hover { background:var(--surface); }
  .recent-label { flex:1; font-size:12px; font-weight:600; }
  .recent-price { font-size:13px; font-weight:800; }
  .recent-time { font-size:10px; color:var(--muted); font-weight:600; }
  .recent-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }

  @media (max-width:1100px) { .stats-row{grid-template-columns:1fr 1fr} .two-col{grid-template-columns:1fr} }
  @media (max-width:768px) { .sidebar{display:none} .page-content{padding:20px} .topbar{padding:0 20px} .stats-row{grid-template-columns:1fr} }
`;

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function VendorDashboard() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [meals, setMeals] = useState<VendorMeal[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "menu">("orders");
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [mealForm, setMealForm] = useState<MealForm>({
    name: "",
    price: "",
    category: "Main",
    estimatedTime: "15 mins",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<VendorOrder | null>(null);
  const [customerMap, setCustomerMap] = useState<Record<string, CustomerInfo>>(
    {},
  );
  // Track which riders have live location
  const [liveRiders, setLiveRiders] = useState<Set<string>>(new Set());

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

  // ── Vendor profile ────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "vendors", uid), (snap) => {
      if (snap.exists()) setVendor({ ...(snap.data() as Vendor), id: snap.id });
      else router.replace("/login");
    });
    return () => unsub();
  }, [uid, router]);

  // ── Orders ────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "orders"), where("vendorId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<VendorOrder, "id">),
      })) as VendorOrder[];
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(data);
      // Update tracking modal order if open
      setTrackingOrder((prev) =>
        prev ? data.find((o) => o.id === prev.id) || prev : null,
      );
    });
    return () => unsub();
  }, [uid]);

  // ── Meals ─────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "meals"), where("vendorId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<VendorMeal, "id">),
      })) as VendorMeal[];
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setMeals(data);
    });
    return () => unsub();
  }, [uid]);

  // ── Fetch customer info ───────────────────
  const fetchCustomer = useCallback(
    async (userId: string) => {
      if (!userId || customerMap[userId]) return;
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists())
          setCustomerMap((prev) => ({
            ...prev,
            [userId]: snap.data() as CustomerInfo,
          }));
      } catch {}
    },
    [customerMap],
  );

  useEffect(() => {
    orders.forEach((o) => {
      if (o.userId) fetchCustomer(o.userId);
    });
  }, [orders, fetchCustomer]);

  // ── Watch live rider locations for active orders ──
  useEffect(() => {
    const riderIds = [
      ...new Set(
        orders
          .filter((o) => o.riderId && o.status !== "delivered")
          .map((o) => o.riderId!),
      ),
    ];
    if (riderIds.length === 0) return;
    const unsubs = riderIds.map((riderId) =>
      onSnapshot(doc(db, "riderLocations", riderId), (snap) => {
        setLiveRiders((prev) => {
          const next = new Set(prev);
          if (snap.exists()) next.add(riderId);
          else next.delete(riderId);
          return next;
        });
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [orders]);

  // ── Update status ─────────────────────────
  const updateStatus = useCallback(
    async (orderId: string, status: VendorOrder["status"]) => {
      setActionLoading((p) => ({ ...p, [orderId]: true }));
      try {
        await runTransaction(db, async (t) => {
          t.update(doc(db, "orders", orderId), {
            status,
            updatedAt: Date.now(),
          });
        });
      } catch (e) {
        console.error(e);
      }
      setActionLoading((p) => ({ ...p, [orderId]: false }));
    },
    [],
  );

  // ── Mark delivered ────────────────────────
  const markDelivered = useCallback(
    async (order: VendorOrder) => {
      if (!uid) return;
      setActionLoading((p) => ({ ...p, [order.id]: true }));
      try {
        await runTransaction(db, async (t) => {
          const vSnap = await t.get(doc(db, "vendors", uid));
          if (!vSnap.exists()) throw new Error("Vendor missing");
          const {
            balance = 0,
            totalOrders = 0,
            totalRevenue = 0,
          } = vSnap.data() as Vendor;
          t.update(doc(db, "orders", order.id), {
            status: "delivered",
            completedAt: Date.now(),
          });
          t.update(doc(db, "vendors", uid), {
            balance: balance + order.price,
            totalOrders: totalOrders + 1,
            totalRevenue: totalRevenue + order.price,
          });
        });
      } catch (e) {
        console.error(e);
      }
      setActionLoading((p) => ({ ...p, [order.id]: false }));
    },
    [uid],
  );

  // ── Add meal ──────────────────────────────
  const addMeal = useCallback(async () => {
    if (!mealForm.name.trim() || !mealForm.price || !vendor) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "meals"), {
        name: mealForm.name.trim(),
        price: parseInt(mealForm.price, 10),
        category: mealForm.category,
        estimatedTime: mealForm.estimatedTime || "15 mins",
        description: mealForm.description.trim(),
        vendorId: uid,
        vendorName: vendor.storeName,
        available: true,
        createdAt: Date.now(),
      });
      setMealForm({
        name: "",
        price: "",
        category: "Main",
        estimatedTime: "15 mins",
        description: "",
      });
      setShowAddMeal(false);
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  }, [mealForm, uid, vendor]);

  const toggleMeal = useCallback(async (meal: VendorMeal) => {
    try {
      await updateDoc(doc(db, "meals", meal.id), {
        available: !meal.available,
      });
    } catch {}
  }, []);

  const deleteMeal = useCallback(async (mealId: string) => {
    if (!confirm("Delete this meal?")) return;
    try {
      await deleteDoc(doc(db, "meals", mealId));
    } catch {}
  }, []);

  const handleLogout = async () => {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    router.push("/");
  };

  // ── Derived ───────────────────────────────
  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const completedOrders = orders.filter((o) => o.status === "delivered");
  const todayRevenue = completedOrders
    .filter((o) => o.completedAt && Date.now() - o.completedAt < 86400000)
    .reduce((s, o) => s + (o.price || 0), 0);
  const initials = vendor?.storeName
    ? vendor.storeName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  if (authLoading || !vendor)
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--surface)",
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
              Loading your dashboard…
            </p>
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="layout">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-text">
              ODG<span>.</span>
            </div>
            <div className="logo-sub">Business Portal</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-label">Overview</div>
            <button
              className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <Store size={16} /> Dashboard{" "}
              {activeOrders.length > 0 && <span className="nav-dot" />}
            </button>
            <button
              className={`nav-item ${activeTab === "menu" ? "active" : ""}`}
              onClick={() => setActiveTab("menu")}
            >
              <ChefHat size={16} /> Menu Management
            </button>
            <button className="nav-item">
              <TrendingUp size={16} /> Analytics
            </button>
            <div className="nav-label">Account</div>
            <button className="nav-item">
              <Wallet size={16} /> Payouts
            </button>
            <button className="nav-item">
              <Bell size={16} /> Notifications
            </button>
          </nav>
          <div className="sidebar-profile">
            <div className="profile-pill">
              <div className="profile-avatar">{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div className="profile-name">{vendor.storeName}</div>
                <div className="profile-role">Vendor</div>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Log out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          <header className="topbar">
            <div className="topbar-title">
              {activeTab === "menu" ? "Menu Management" : "Dashboard"}
            </div>
            <div className="topbar-right">
              <div className="status-pill">
                <span className="status-dot" />
                {vendor.status === "open" ? "Store Open" : "Store Closed"}
              </div>
              <button className="topbar-badge">
                <Bell size={17} />
                {activeOrders.length > 0 && <span className="badge-dot" />}
              </button>
            </div>
          </header>

          <div className="page-content">
            <h1 className="greeting-h">
              Welcome back, {vendor.ownerName || vendor.storeName} 👋
            </h1>
            <p className="greeting-sub">
              {activeOrders.length > 0
                ? `${activeOrders.length} order${activeOrders.length > 1 ? "s" : ""} need attention — ${liveRiders.size} rider${liveRiders.size !== 1 ? "s" : ""} broadcasting live`
                : "All caught up! All orders complete."}
            </p>

            {/* STATS */}
            <div className="stats-row">
              <div className="wallet-card">
                <div className="wallet-label">Available Balance</div>
                <div className="wallet-amount">
                  ₦{(vendor.balance || 0).toLocaleString()}
                </div>
                <button className="wallet-btn">
                  <ArrowUpRight size={13} /> Withdraw Funds
                </button>
              </div>
              <div className="stat-card">
                <div className="stat-card-top">
                  <div
                    className="stat-icon"
                    style={{ background: "rgba(230,0,0,0.08)" }}
                  >
                    <ListOrdered size={22} color="var(--red)" />
                  </div>
                  {activeOrders.length > 0 && (
                    <span className="stat-change">
                      <Zap size={11} /> Live
                    </span>
                  )}
                </div>
                <div className="stat-value">{activeOrders.length}</div>
                <div className="stat-label">Active Orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-top">
                  <div
                    className="stat-icon"
                    style={{ background: "rgba(5,205,153,0.08)" }}
                  >
                    <PackageCheck size={22} color="var(--green)" />
                  </div>
                  <span className="stat-change">
                    <TrendingUp size={11} /> ₦{todayRevenue.toLocaleString()}{" "}
                    today
                  </span>
                </div>
                <div className="stat-value">{vendor.totalOrders || 0}</div>
                <div className="stat-label">Total Completed</div>
              </div>
            </div>

            {/* TABS */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Orders{" "}
                {activeOrders.length > 0 ? `(${activeOrders.length})` : ""}
              </button>
              <button
                className={`tab ${activeTab === "menu" ? "active" : ""}`}
                onClick={() => setActiveTab("menu")}
              >
                Menu ({meals.length})
              </button>
            </div>

            {/* ── ORDERS TAB ── */}
            {activeTab === "orders" && (
              <>
                <div className="panel-card">
                  <div className="panel-header">
                    <div className="panel-title">Active Pipeline</div>
                    <div className="live-badge">
                      <span className="live-dot" /> {activeOrders.length} LIVE
                      {liveRiders.size > 0 && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 9,
                            background: "rgba(5,205,153,0.2)",
                            color: "#05cd99",
                            padding: "1px 6px",
                            borderRadius: 20,
                            fontWeight: 900,
                          }}
                        >
                          {liveRiders.size} 🛵 TRACKING
                        </span>
                      )}
                    </div>
                  </div>
                  {activeOrders.length === 0 ? (
                    <div className="pipeline-empty">
                      <div className="empty-icon">
                        <CheckCircle2 size={26} color="var(--green)" />
                      </div>
                      <p style={{ fontWeight: 700, marginBottom: 6 }}>
                        All caught up!
                      </p>
                      <p style={{ fontSize: 13 }}>
                        New orders appear here in real-time.
                      </p>
                    </div>
                  ) : (
                    activeOrders.map((order) => {
                      const meta =
                        STATUS_META[order.status] || STATUS_META.pending;
                      const loading = actionLoading[order.id];
                      const customer = order.userId
                        ? customerMap[order.userId]
                        : null;
                      const isLive = order.riderId
                        ? liveRiders.has(order.riderId)
                        : false;
                      return (
                        <div key={order.id} className="order-row">
                          <div
                            className="order-avatar"
                            style={{ background: meta.bg, fontSize: 20 }}
                          >
                            {meta.emoji}
                          </div>
                          <div className="order-info">
                            <div className="order-meal">
                              {order.mealName}
                              {isLive && (
                                <span className="rider-live-mini">
                                  <span className="live-dot-green" /> RIDER LIVE
                                </span>
                              )}
                            </div>
                            <div className="order-meta">
                              #{order.id.slice(-6).toUpperCase()} · ₦
                              {(order.price || 0).toLocaleString()} ·{" "}
                              {formatTime(order.createdAt)}
                              {customer?.fullName && (
                                <span style={{ marginLeft: 6 }}>
                                  · {customer.fullName}
                                </span>
                              )}
                            </div>
                            {order.deliveryAddress?.hostel && (
                              <div className="order-addr">
                                <MapPin size={10} />{" "}
                                {order.deliveryAddress.hostel}, Rm{" "}
                                {order.deliveryAddress.room}
                              </div>
                            )}
                          </div>
                          <span
                            className="status-badge"
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          <div className="order-actions">
                            {/* View/track button always shown */}
                            <button
                              className="action-btn btn-view"
                              onClick={() => setTrackingOrder(order)}
                            >
                              <Eye
                                size={13}
                                style={{
                                  display: "inline",
                                  verticalAlign: "middle",
                                  marginRight: 4,
                                }}
                              />
                              {order.riderId ? "Track" : "View"}
                            </button>
                            {order.status === "pending" && (
                              <button
                                className="action-btn btn-accept"
                                onClick={() =>
                                  updateStatus(order.id, "accepted")
                                }
                                disabled={loading}
                              >
                                {loading ? "…" : "Accept"}
                              </button>
                            )}
                            {order.status === "accepted" && (
                              <button
                                className="action-btn btn-dispatch"
                                onClick={() =>
                                  updateStatus(order.id, "out_for_delivery")
                                }
                                disabled={loading}
                              >
                                {loading ? "…" : "Dispatch"}
                              </button>
                            )}
                            {order.status === "out_for_delivery" &&
                              !order.riderId && (
                                <button
                                  className="action-btn btn-deliver"
                                  onClick={() => markDelivered(order)}
                                  disabled={loading}
                                >
                                  {loading ? "…" : "Mark Delivered"}
                                </button>
                              )}
                          </div>
                          {/* Customer quick contact */}
                          {customer?.phone && (
                            <a
                              href={`tel:${customer.phone}`}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                background: "rgba(59,130,246,0.1)",
                                border: "1px solid rgba(59,130,246,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#3b82f6",
                                flexShrink: 0,
                                textDecoration: "none",
                                transition: "opacity 0.2s",
                              }}
                              title={`Call ${customer.fullName}`}
                            >
                              <Phone size={14} />
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="two-col">
                  {/* Recent deliveries */}
                  <div className="recent-card">
                    <div className="recent-header">
                      <div className="recent-title">Recent Deliveries</div>
                    </div>
                    {completedOrders.slice(0, 6).length === 0 ? (
                      <div
                        style={{
                          padding: "24px 22px",
                          color: "var(--muted)",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        No completed orders yet.
                      </div>
                    ) : (
                      completedOrders.slice(0, 6).map((o) => (
                        <div key={o.id} className="recent-item">
                          <div
                            className="recent-dot"
                            style={{ background: "var(--green)" }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              className="recent-label"
                              style={{
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {o.mealName}
                            </div>
                            <div className="recent-time">
                              {formatTime(o.completedAt)}
                            </div>
                          </div>
                          <div className="recent-price">
                            +₦{(o.price || 0).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Store summary */}
                  <div className="recent-card">
                    <div className="recent-header">
                      <div className="recent-title">Store Summary</div>
                    </div>
                    {[
                      { label: "Store Name", value: vendor.storeName },
                      { label: "Owner", value: vendor.ownerName || "—" },
                      {
                        label: "Status",
                        value: vendor.status === "open" ? "● Open" : "○ Closed",
                      },
                      {
                        label: "Rating",
                        value: vendor.rating
                          ? `${vendor.rating} ★`
                          : "No ratings yet",
                      },
                      {
                        label: "Total Revenue",
                        value: `₦${(vendor.totalRevenue || 0).toLocaleString()}`,
                      },
                      { label: "All Orders", value: vendor.totalOrders || 0 },
                    ].map((row, i) => (
                      <div key={i} className="recent-item">
                        <div
                          className="recent-label"
                          style={{ color: "var(--muted)" }}
                        >
                          {row.label}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── MENU TAB ── */}
            {activeTab === "menu" && (
              <div className="panel-card">
                <div className="menu-header">
                  <div className="panel-title">
                    Your Menu ({meals.length} items)
                  </div>
                  <button
                    className="add-meal-btn"
                    onClick={() => setShowAddMeal(true)}
                  >
                    <Plus size={15} /> Add Meal
                  </button>
                </div>
                {meals.length === 0 ? (
                  <div className="pipeline-empty">
                    <div className="empty-icon">
                      <ChefHat size={26} color="var(--muted)" />
                    </div>
                    <p style={{ fontWeight: 700, marginBottom: 6 }}>
                      No meals yet
                    </p>
                    <p style={{ fontSize: 13 }}>
                      Add your first meal to start receiving orders.
                    </p>
                  </div>
                ) : (
                  meals.map((meal) => (
                    <div key={meal.id} className="meal-row">
                      <div className="meal-emoji">
                        {getMealEmoji(meal.name)}
                      </div>
                      <div className="meal-info">
                        <div className="meal-name-row">{meal.name}</div>
                        <div className="meal-meta-row">
                          <span>{meal.category}</span>
                          <span>·</span>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Timer size={10} />
                            {meal.estimatedTime}
                          </span>
                          {meal.description && (
                            <>
                              <span>·</span>
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: 180,
                                }}
                              >
                                {meal.description}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="meal-price-tag">
                        ₦{(meal.price || 0).toLocaleString()}
                      </div>
                      <button
                        className={`avail-toggle ${meal.available ? "on" : "off"}`}
                        onClick={() => toggleMeal(meal)}
                      >
                        {meal.available ? (
                          <ToggleRight size={17} />
                        ) : (
                          <ToggleLeft size={17} />
                        )}
                        {meal.available ? "Available" : "Hidden"}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteMeal(meal.id)}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ORDER TRACKING MODAL ── */}
      {trackingOrder && (
        <OrderTrackModal
          order={trackingOrder}
          customer={
            trackingOrder.userId
              ? customerMap[trackingOrder.userId] || null
              : null
          }
          onClose={() => setTrackingOrder(null)}
        />
      )}

      {/* ── ADD MEAL MODAL ── */}
      {showAddMeal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowAddMeal(false)}
        >
          <div className="modal">
            <div className="modal-title">
              Add New Meal
              <button
                className="modal-close"
                onClick={() => setShowAddMeal(false)}
              >
                <X size={19} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Meal Name *</label>
              <input
                className="form-input"
                placeholder="e.g. Jollof Rice & Chicken"
                value={mealForm.name}
                onChange={(e) =>
                  setMealForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price (₦) *</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="1500"
                  value={mealForm.price}
                  onChange={(e) =>
                    setMealForm((p) => ({ ...p, price: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Est. Time</label>
                <input
                  className="form-input"
                  placeholder="15 mins"
                  value={mealForm.estimatedTime}
                  onChange={(e) =>
                    setMealForm((p) => ({
                      ...p,
                      estimatedTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={mealForm.category}
                onChange={(e) =>
                  setMealForm((p) => ({ ...p, category: e.target.value }))
                }
              >
                {MEAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input
                className="form-input"
                placeholder="Short description…"
                value={mealForm.description}
                onChange={(e) =>
                  setMealForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <button
              className="form-submit"
              onClick={addMeal}
              disabled={submitting || !mealForm.name.trim() || !mealForm.price}
            >
              {submitting ? "Adding…" : "Add to Menu"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
