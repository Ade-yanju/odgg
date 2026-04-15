"use client";

/**
 * /track/[orderId]
 *
 * Unified tracking page that works in sync with:
 *  - Rider dashboard  (writes riderLocations/{riderId} with exact orderId)
 *  - Vendor dashboard (reads same order doc, shows Track button)
 *  - User dashboard   (opens this page or tracking modal)
 *
 * Status flow: pending → accepted → out_for_delivery → picked_up → delivered
 */

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Phone,
  Package,
  CheckCircle2,
  Clock,
  Navigation,
  ChevronLeft,
  Zap,
  Radio,
  AlertCircle,
} from "lucide-react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface Order {
  id: string;
  status: string;
  mealName?: string;
  vendorName?: string;
  price?: number;
  createdAt?: number;
  claimedAt?: number;
  pickedUpAt?: number;
  completedAt?: number;
  deliveryAddress?: { hostel?: string; room?: string; landmark?: string };
  userId?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderEarnings?: number;
}
interface RiderLocation {
  lat: number;
  lng: number;
  orderId: string;
  updatedAt: number;
}

// ─────────────────────────────────────────────
//  UNIFIED STATUS CONFIG (same as all dashboards)
// ─────────────────────────────────────────────
const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", Icon: Package },
  { key: "accepted", label: "Being Prepared", Icon: Zap },
  { key: "out_for_delivery", label: "Rider Assigned", Icon: Navigation },
  { key: "picked_up", label: "Food Picked Up", Icon: CheckCircle2 },
  { key: "delivered", label: "Delivered!", Icon: CheckCircle2 },
];
const STATUS_ORDER = STATUS_STEPS.map((s) => s.key);

function statusIdx(s: string) {
  return Math.max(0, STATUS_ORDER.indexOf(s));
}

function statusMeta(s: string) {
  switch (s) {
    case "delivered":
      return {
        bg: "rgba(5,205,153,.12)",
        color: "#05cd99",
        dot: "#05cd99",
        label: "Delivered",
      };
    case "picked_up":
      return {
        bg: "rgba(59,130,246,.12)",
        color: "#3b82f6",
        dot: "#3b82f6",
        label: "On the way",
      };
    case "out_for_delivery":
      return {
        bg: "rgba(230,0,0,.12)",
        color: "#e60000",
        dot: "#e60000",
        label: "Rider Assigned",
      };
    case "accepted":
      return {
        bg: "rgba(245,158,11,.12)",
        color: "#f59e0b",
        dot: "#f59e0b",
        label: "Preparing",
      };
    default:
      return {
        bg: "rgba(255,255,255,.07)",
        color: "rgba(255,255,255,.5)",
        dot: "#888",
        label: "Pending",
      };
  }
}
function fmtTs(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function initials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─────────────────────────────────────────────
//  LEAFLET MAP HOOK
// ─────────────────────────────────────────────
function useLeafletMap(
  mapRef: React.RefObject<HTMLDivElement | null>,
  riderLocation: RiderLocation | null,
  deliveryAddress: { hostel?: string; room?: string } | undefined,
  visible: boolean,
) {
  const state = useRef<{
    map: unknown;
    riderMarker: unknown;
    L: unknown;
    ready: boolean;
  } | null>(null);
  const CAMPUS: [number, number] = [7.3775, 3.947]; // OAU — replace for your campus

  // Init map once
  useEffect(() => {
    if (!visible || !mapRef.current || state.current?.ready) return;

    // Inject CSS once
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
      const L = (window as { L?: unknown }).L as {
        map: (el: HTMLElement, o: unknown) => unknown;
        tileLayer: (url: string, o: unknown) => { addTo: (m: unknown) => void };
        marker: (
          ll: [number, number],
          o?: unknown,
        ) => {
          addTo: (m: unknown) => { bindPopup: (h: string) => void };
          setLatLng: (ll: [number, number]) => void;
        };
        divIcon: (o: unknown) => unknown;
      };
      if (!mapRef.current) return;
      const map = L.map(mapRef.current, { center: CAMPUS, zoom: 15 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      // Destination pin
      const destIcon = L.divIcon({
        html: `<div style="width:30px;height:30px;background:#e60000;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(230,0,0,.5);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:12px;line-height:22px;display:block;text-align:center">📍</span></div>`,
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });
      L.marker(CAMPUS, { icon: destIcon })
        .addTo(map)
        .bindPopup(
          `<b>Delivery to</b><br>${deliveryAddress?.hostel || ""} Room ${deliveryAddress?.room || "?"}`,
        );
      state.current = { map, riderMarker: null, L, ready: true };
    };
    document.head.appendChild(script);
    return () => {
      (state.current?.map as { remove?: () => void })?.remove?.();
      state.current = null;
    };
  }, [visible]);

  // Move rider marker
  useEffect(() => {
    if (!state.current?.ready || !riderLocation) return;
    const { map, L } = state.current as {
      map: { setView: (ll: [number, number], z: number) => void };
      L: {
        marker: (
          ll: [number, number],
          o?: unknown,
        ) => {
          addTo: (m: unknown) => unknown;
          setLatLng: (ll: [number, number]) => void;
        };
        divIcon: (o: unknown) => unknown;
      };
      riderMarker: { setLatLng: (ll: [number, number]) => void } | null;
    };
    const icon = L.divIcon({
      html: `<div style="width:40px;height:40px;background:#e60000;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 16px rgba(230,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:20px">🛵</div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    const ll: [number, number] = [riderLocation.lat, riderLocation.lng];
    if (state.current.riderMarker) {
      (
        state.current.riderMarker as {
          setLatLng: (ll: [number, number]) => void;
        }
      ).setLatLng(ll);
    } else {
      const m = L.marker(ll, { icon }).addTo(map as unknown);
      state.current.riderMarker = m as unknown as {
        setLatLng: (ll: [number, number]) => void;
      };
    }
    map.setView(ll, 16);
  }, [riderLocation]);
}

// ─────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --red:#e60000;--green:#05cd99;--blue:#3b82f6;--amber:#f59e0b;
    --dark:#0a0f1e;--card:#141c2e;--border:rgba(255,255,255,.07);
    --muted:rgba(255,255,255,.35);--mono:'DM Mono',monospace;
  }
  html,body{height:100%}
  body{font-family:'DM Sans',sans-serif;background:var(--dark);color:#fff;min-height:100vh;-webkit-font-smoothing:antialiased}
  @keyframes spin  {to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @keyframes pdot  {0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes ping  {0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}
  @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}

  .page{min-height:100vh;display:flex;flex-direction:column}
  .topbar{background:rgba(8,13,28,.97);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);height:62px;padding:0 20px;display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:1000;flex-shrink:0}
  .back-btn{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.6);transition:all .2s;flex-shrink:0;background:none}
  .back-btn:hover{background:rgba(255,255,255,.1);color:#fff}
  .topbar-info{flex:1;min-width:0}
  .topbar-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .topbar-sub{font-size:12px;color:var(--muted);font-weight:500}
  .status-pill{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:50px;font-size:11px;font-weight:800;letter-spacing:.5px;flex-shrink:0}
  .status-dot{width:6px;height:6px;border-radius:50%}
  .body{display:grid;grid-template-columns:1fr 380px;flex:1;min-height:0}
  .map-wrap{position:relative;background:#1a2035;overflow:hidden;min-height:500px}
  #track-map{width:100%;height:100%}
  .map-overlay{position:absolute;bottom:20px;left:20px;right:20px;background:rgba(10,15,30,.92);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:16px 18px;z-index:900;animation:fadeUp .3s ease}
  .rider-row{display:flex;align-items:center;gap:10px}
  .rider-mover-icon{width:38px;height:38px;border-radius:10px;background:var(--red);display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:bounce 2s ease infinite;font-size:18px}
  .rider-mover-name{font-size:14px;font-weight:800}
  .rider-mover-sub{font-size:12px;color:var(--muted)}
  .live-pill{margin-left:auto;display:flex;align-items:center;gap:5px}
  .live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pdot 1.5s infinite;position:relative}
  .live-dot::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1px solid var(--green);animation:ping 1.5s infinite}
  .live-text{font-size:11px;color:var(--green);font-weight:700}
  .no-loc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#111827;gap:12px}
  .no-loc-icon{font-size:48px;opacity:.4}
  .no-loc-text{font-size:14px;color:var(--muted);font-weight:600}
  .sidebar{background:var(--card);border-left:1px solid var(--border);overflow-y:auto;padding-bottom:32px}
  .order-summary{padding:20px;border-bottom:1px solid var(--border)}
  .order-id-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
  .order-id-text{font-size:11px;font-weight:800;color:rgba(255,255,255,.28);letter-spacing:1.5px;font-family:var(--mono)}
  .order-meal{font-family:'Syne',sans-serif;font-size:20px;font-weight:900;margin-bottom:2px}
  .order-vendor{font-size:13px;color:var(--muted);font-weight:600;margin-bottom:14px}
  .info-chips{display:flex;flex-wrap:wrap;gap:8px}
  .i-chip{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.05);border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;color:rgba(255,255,255,.5)}
  .tl-section{padding:20px;border-bottom:1px solid var(--border)}
  .tl-heading{font-family:'Syne',sans-serif;font-size:13px;font-weight:900;margin-bottom:16px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1px}
  .tl-step{display:flex;gap:14px;position:relative}
  .tl-connector{position:absolute;left:13px;top:28px;bottom:-6px;width:1px;z-index:0}
  .tl-icon-wrap{flex-shrink:0;position:relative;z-index:1}
  .tl-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center}
  .tl-body{flex:1;padding-bottom:20px}
  .tl-label{font-size:13px;font-weight:700;margin-bottom:2px}
  .tl-time{font-size:11px;color:var(--muted);font-family:var(--mono)}
  .tl-now-badge{margin-left:8px;font-size:10px;background:var(--green);color:#fff;padding:1px 7px;border-radius:20px;font-weight:800;vertical-align:middle}
  .rider-section{padding:20px;border-bottom:1px solid var(--border)}
  .rider-card-inner{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;display:flex;align-items:center;gap:12px}
  .rider-av{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#e60000,#ff4d4d);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:16px;font-weight:900;flex-shrink:0}
  .rider-n{font-size:15px;font-weight:800;margin-bottom:2px}
  .rider-r{font-size:11px;color:var(--muted);font-weight:600}
  .rider-acts{margin-left:auto;display:flex;gap:8px}
  .act-btn{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:opacity .2s;text-decoration:none}
  .act-btn:hover{opacity:.8}
  .btn-call{background:var(--green);color:#fff}
  .btn-sms{background:var(--blue);color:#fff}
  .loc-fresh{margin-top:10px;display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(5,205,153,.08);border-radius:10px;border:1px solid rgba(5,205,153,.15)}
  .loc-fresh-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pdot 1.5s infinite;flex-shrink:0}
  .loc-fresh-text{font-size:12px;font-weight:700;color:var(--green)}
  .delivered-banner{margin:20px;border-radius:16px;padding:20px;background:rgba(5,205,153,.1);border:1px solid rgba(5,205,153,.25);text-align:center;animation:fadeUp .4s ease}
  .delivered-icon{font-size:36px;margin-bottom:10px}
  .delivered-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:900;color:var(--green);margin-bottom:4px}
  .delivered-sub{font-size:13px;color:rgba(255,255,255,.45)}
  .price-block{margin:20px;background:rgba(5,205,153,.06);border:1px solid rgba(5,205,153,.12);border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center}
  @media(max-width:900px){.body{grid-template-columns:1fr;grid-template-rows:55vh 1fr}.map-wrap{min-height:55vh}.sidebar{border-left:none;border-top:1px solid var(--border)}}
  .leaflet-pane{z-index:400!important}.leaflet-top,.leaflet-bottom{z-index:500!important}.leaflet-control{z-index:500!important}
`;

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────
export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(
    null,
  );
  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [locationAge, setLocationAge] = useState(0);

  const mapRef = useRef<HTMLDivElement>(null);
  useLeafletMap(
    mapRef,
    riderLocation,
    order?.deliveryAddress,
    !!order?.riderId && order?.status !== "delivered",
  );

  // ── Auth ──────────────────────────────────
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        if (!u) {
          router.replace("/login");
          return;
        }
        setUid(u.uid);
        setAuthLoading(false);
      }),
    [router],
  );

  // ── Listen to order ───────────────────────
  useEffect(() => {
    if (!orderId) return;
    return onSnapshot(doc(db, "orders", orderId), (snap) => {
      if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
    });
  }, [orderId]);

  // ── Listen to rider location ──────────────
  // Verifies orderId matches so stale location from a previous delivery
  // doesn't appear on this order's map.
  useEffect(() => {
    if (!order?.riderId) return;
    return onSnapshot(doc(db, "riderLocations", order.riderId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as RiderLocation;
        setRiderLocation(data.orderId === orderId ? data : null);
      } else {
        setRiderLocation(null);
      }
    });
  }, [order?.riderId, orderId]);

  // ── Location freshness ticker ─────────────
  useEffect(() => {
    if (!riderLocation) return;
    const iv = setInterval(
      () =>
        setLocationAge(
          Math.floor((Date.now() - riderLocation.updatedAt) / 1_000),
        ),
      1_000,
    );
    return () => clearInterval(iv);
  }, [riderLocation]);

  if (authLoading || !order)
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
                animation: "spin .8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p
              style={{
                color: "rgba(255,255,255,.3)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Loading your order…
            </p>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </>
    );

  // Access guard — only order owner (or allow vendor/rider if uid matches)
  const isOwner = uid === order.userId;
  const isRiderOfOrder = uid === order.riderId;
  if (uid && order.userId && !isOwner && !isRiderOfOrder)
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 24,
          }}
        >
          <div>
            <AlertCircle
              size={48}
              color="#e60000"
              style={{ marginBottom: 16 }}
            />
            <h2
              style={{
                fontFamily: "Syne,sans-serif",
                fontSize: 22,
                marginBottom: 8,
              }}
            >
              Access Denied
            </h2>
            <p style={{ color: "rgba(255,255,255,.4)" }}>
              You dont have permission to view this order.
            </p>
          </div>
        </div>
      </>
    );

  const meta = statusMeta(order.status);
  const curIdx = statusIdx(order.status);
  const hasRider = !!order.riderId;
  const isDelivered = order.status === "delivered";
  const isMoving =
    order.status === "picked_up" || order.status === "out_for_delivery";

  // Timestamp map for each step
  const timestamps: Record<string, number | undefined> = {
    pending: order.createdAt,
    accepted: order.createdAt, // vendor accepts
    out_for_delivery: order.claimedAt, // rider claims
    picked_up: order.pickedUpAt,
    delivered: order.completedAt,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="page">
        {/* ── TOPBAR ── */}
        <header className="topbar">
          <button className="back-btn" onClick={() => router.back()}>
            <ChevronLeft size={18} />
          </button>
          <div className="topbar-info">
            <div className="topbar-title">
              Order #{orderId.slice(-6).toUpperCase()}
            </div>
            <div className="topbar-sub">
              {order.mealName} · {order.vendorName}
            </div>
          </div>
          <div
            className="status-pill"
            style={{ background: meta.bg, color: meta.color }}
          >
            <span
              className="status-dot"
              style={{
                background: meta.dot,
                animation: isMoving ? "pdot 1.5s infinite" : "none",
              }}
            />
            {meta.label}
          </div>
        </header>

        <div className="body">
          {/* ── MAP ── */}
          <div className="map-wrap">
            {isDelivered ? (
              <div className="no-loc">
                <div className="no-loc-icon">✅</div>
                <div className="no-loc-text">
                  Your order has been delivered!
                </div>
              </div>
            ) : !hasRider ? (
              <div className="no-loc">
                <div className="no-loc-icon">🏍️</div>
                <div className="no-loc-text">
                  Waiting for a rider to be assigned…
                </div>
              </div>
            ) : !riderLocation ? (
              <div className="no-loc">
                <div className="no-loc-icon">📡</div>
                <div className="no-loc-text">
                  Locating rider… This may take a moment.
                </div>
              </div>
            ) : (
              <>
                <div ref={mapRef} id="track-map" />
                <div className="map-overlay">
                  <div className="rider-row">
                    <div className="rider-mover-icon">🛵</div>
                    <div>
                      <div className="rider-mover-name">
                        {order.riderName || "Your Rider"}
                      </div>
                      <div className="rider-mover-sub">
                        {order.status === "picked_up"
                          ? "On the way to you"
                          : "Heading to pickup"}
                      </div>
                    </div>
                    <div className="live-pill">
                      <div className="live-dot" />
                      <span className="live-text">
                        {locationAge < 15 ? "LIVE" : `${locationAge}s ago`}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="sidebar">
            {/* Delivered banner */}
            {isDelivered && (
              <div className="delivered-banner">
                <div className="delivered-icon">🎉</div>
                <div className="delivered-title">Delivered!</div>
                <div className="delivered-sub">
                  Arrived at {fmtTs(order.completedAt)}. Enjoy your meal!
                </div>
              </div>
            )}

            {/* Order summary */}
            <div className="order-summary">
              <div className="order-id-row">
                <span className="order-id-text">
                  #{orderId.slice(-6).toUpperCase()}
                </span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--green)",
                  }}
                >
                  ₦{(order.price ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="order-meal">{order.mealName}</div>
              <div className="order-vendor">{order.vendorName}</div>
              <div className="info-chips">
                <div className="i-chip">
                  <MapPin size={11} />
                  {order.deliveryAddress?.hostel}, Rm{" "}
                  {order.deliveryAddress?.room}
                </div>
                <div className="i-chip">
                  <Clock size={11} />
                  Placed {fmtTs(order.createdAt)}
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div className="tl-section">
              <div className="tl-heading">Order Progress</div>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= curIdx;
                const active = i === curIdx;
                const ts = timestamps[step.key];
                const { Icon } = step;
                return (
                  <div key={step.key} className="tl-step">
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className="tl-connector"
                        style={{
                          background:
                            done && i < curIdx
                              ? "var(--green)"
                              : "rgba(255,255,255,.08)",
                        }}
                      />
                    )}
                    <div className="tl-icon-wrap">
                      <div
                        className="tl-icon"
                        style={{
                          background: done
                            ? active
                              ? "rgba(5,205,153,.2)"
                              : "rgba(5,205,153,.12)"
                            : "rgba(255,255,255,.05)",
                          border: active ? "2px solid var(--green)" : "none",
                        }}
                      >
                        <Icon
                          size={13}
                          color={
                            done ? "var(--green)" : "rgba(255,255,255,.25)"
                          }
                        />
                      </div>
                    </div>
                    <div className="tl-body">
                      <div
                        className="tl-label"
                        style={{
                          color: done
                            ? active
                              ? "#fff"
                              : "rgba(255,255,255,.7)"
                            : "rgba(255,255,255,.28)",
                        }}
                      >
                        {step.label}
                        {active && <span className="tl-now-badge">NOW</span>}
                      </div>
                      {ts && <div className="tl-time">{fmtTs(ts)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rider card */}
            {hasRider && (
              <div className="rider-section">
                <div className="tl-heading">Your Rider</div>
                <div className="rider-card-inner">
                  <div className="rider-av">{initials(order.riderName)}</div>
                  <div>
                    <div className="rider-n">{order.riderName || "Rider"}</div>
                    <div className="rider-r">
                      {order.riderPhone ? (
                        <span
                          style={{ fontFamily: "var(--mono)", fontSize: 12 }}
                        >
                          {order.riderPhone}
                        </span>
                      ) : (
                        "Delivery Partner"
                      )}
                    </div>
                  </div>
                  {order.riderPhone && (
                    <div className="rider-acts">
                      <a
                        href={`tel:${order.riderPhone}`}
                        className="act-btn btn-call"
                        title="Call rider"
                      >
                        <Phone size={16} />
                      </a>
                      <a
                        href={`sms:${order.riderPhone}`}
                        className="act-btn btn-sms"
                        title="SMS rider"
                      >
                        <Radio size={16} />
                      </a>
                    </div>
                  )}
                </div>
                {riderLocation && !isDelivered && (
                  <div className="loc-fresh">
                    <div className="loc-fresh-dot" />
                    <span className="loc-fresh-text">
                      Live location — updated {locationAge}s ago
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Waiting for rider */}
            {!hasRider && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "rgba(255,255,255,.3)",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: "rgba(255,255,255,.5)",
                  }}
                >
                  Finding a rider
                </div>
                <div style={{ fontSize: 13 }}>
                  A rider will be assigned to your order shortly.
                </div>
              </div>
            )}

            {/* Price summary */}
            <div className="price-block">
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,.4)",
                }}
              >
                Total Paid
              </span>
              <span
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 20,
                  fontWeight: 900,
                  color: "var(--green)",
                }}
              >
                ₦{(order.price ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
