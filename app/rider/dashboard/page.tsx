"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Navigation, MapPin, Clock, CheckCircle2, Package,
  Wallet, Zap, LogOut, Bell, TrendingUp, Phone, User,
  Radio, Copy,
} from "lucide-react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, onSnapshot, query, where, doc,
  runTransaction, updateDoc, setDoc, deleteDoc, getDoc,
} from "firebase/firestore";

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface Rider {
  id: string; fullName: string; phone?: string;
  isOnline: boolean; balance: number;
  totalDeliveries: number; totalEarnings: number;
}
interface CustomerInfo { fullName?: string; phone?: string; email?: string; }
interface Order {
  id: string; riderId?: string | null; riderName?: string; riderPhone?: string;
  status: string; createdAt?: number; mealName?: string; vendorName?: string;
  price?: number; deliveryAddress?: { hostel?: string; room?: string; landmark?: string };
  pickedUpAt?: number; completedAt?: number; riderEarnings?: number;
  claimedAt?: number; userId?: string; [key: string]: unknown;
}

// ─────────────────────────────────────────────
//  CONSTANTS — single source of truth for whole system
// ─────────────────────────────────────────────
const RIDER_COMMISSION    = 0.2;       // 20% of order price
const LOCATION_INTERVAL   = 6_000;    // push GPS every 6 s

// Canonical status order (shared mental model across all 4 dashboards)
// pending → accepted → out_for_delivery → picked_up → delivered
const STATUS_STEPS = [
  { key: "pending",          label: "Order Placed",   emoji: "📋" },
  { key: "accepted",         label: "Being Prepared", emoji: "👨‍🍳" },
  { key: "out_for_delivery", label: "Rider Assigned", emoji: "🛵" },
  { key: "picked_up",        label: "Food Picked Up", emoji: "📦" },
  { key: "delivered",        label: "Delivered",      emoji: "✅" },
];
const STATUS_ORDER = STATUS_STEPS.map(s => s.key);

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function fmtTime(ts?: number): string {
  if (!ts) return "";
  const m = Math.floor((Date.now() - ts) / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}
function addrLabel(o: Order | null): string {
  if (!o?.deliveryAddress) return "No address";
  const { hostel, room } = o.deliveryAddress;
  return `${hostel || "?"}, Room ${room || "?"}`;
}
function statusIdx(s: string) { return Math.max(0, STATUS_ORDER.indexOf(s)); }

// ─────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --red:#e60000;--dark:#080e1c;--card:#111827;
    --border:rgba(255,255,255,0.07);--surface:rgba(255,255,255,0.04);
    --green:#05cd99;--amber:#f59e0b;--blue:#3b82f6;--purple:#8b5cf6;
    --mono:'DM Mono',monospace;
  }
  html,body{height:100%}
  body{font-family:'DM Sans',sans-serif;background:var(--dark);color:#fff;min-height:100vh;-webkit-font-smoothing:antialiased}
  @keyframes spin    {to{transform:rotate(360deg)}}
  @keyframes fadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes pdot    {0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes ping    {0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}
  @keyframes slideIn {from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
  @keyframes glow    {0%,100%{box-shadow:0 0 12px rgba(5,205,153,.3)}50%{box-shadow:0 0 26px rgba(5,205,153,.6)}}

  .layout{display:flex;min-height:100vh}
  .sidebar{width:248px;flex-shrink:0;background:#05091a;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;border-right:1px solid rgba(255,255,255,.05);z-index:50}
  .sidebar-logo{padding:28px 24px 20px}
  .logo-mark{font-family:'Syne',sans-serif;font-size:28px;font-weight:900;letter-spacing:-1.5px}
  .logo-mark span{color:var(--red)}
  .logo-sub{font-size:9px;font-weight:800;color:rgba(255,255,255,.18);letter-spacing:3px;text-transform:uppercase;margin-top:3px}
  .sidebar-nav{flex:1;padding:4px 12px;overflow-y:auto}
  .nav-label{font-size:9px;font-weight:800;color:rgba(255,255,255,.18);letter-spacing:2.5px;text-transform:uppercase;padding:0 12px;margin:20px 0 6px}
  .nav-btn{display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:11px;font-size:13px;font-weight:600;color:rgba(255,255,255,.38);cursor:pointer;width:100%;border:none;background:none;transition:all .18s;margin-bottom:2px;text-align:left;font-family:'DM Sans',sans-serif}
  .nav-btn:hover{background:rgba(255,255,255,.05);color:rgba(255,255,255,.72)}
  .nav-btn.active{background:rgba(230,0,0,.16);color:#fff}
  .nav-btn.active svg{color:var(--red)}
  .nav-badge{margin-left:auto;background:var(--red);color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:20px;min-width:20px;text-align:center}
  .sidebar-bottom{padding:14px 12px 20px;border-top:1px solid rgba(255,255,255,.05)}
  .rider-pill{display:flex;align-items:center;gap:11px;padding:12px 13px;border-radius:13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06)}
  .rider-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--red),#ff4d4d);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:900;color:#fff;flex-shrink:0}
  .rider-name{font-size:12px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px}
  .rider-role{font-size:10px;color:rgba(255,255,255,.3);font-weight:600}
  .logout-btn{margin-left:auto;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.22);transition:color .2s;flex-shrink:0}
  .logout-btn:hover{color:var(--red)}
  .main{flex:1;overflow-x:hidden;background:var(--dark)}
  .topbar{background:rgba(6,10,22,.96);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.06);height:66px;padding:0 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
  .topbar-title{font-family:'Syne',sans-serif;font-size:19px;font-weight:900}
  .topbar-sub{font-size:12px;color:rgba(255,255,255,.3);font-weight:500}
  .topbar-right{display:flex;align-items:center;gap:10px}
  .online-toggle{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:50px;padding:8px 18px;cursor:pointer;transition:all .25s;user-select:none}
  .online-toggle.active{background:rgba(5,205,153,.1);border-color:rgba(5,205,153,.25);animation:glow 3s infinite}
  .toggle-label{font-size:13px;font-weight:700;color:rgba(255,255,255,.45)}
  .online-toggle.active .toggle-label{color:var(--green)}
  .toggle-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2);position:relative}
  .online-toggle.active .toggle-dot{background:var(--green);animation:pdot 2s infinite}
  .toggle-dot::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1px solid transparent}
  .online-toggle.active .toggle-dot::after{border-color:var(--green);animation:ping 1.8s infinite}
  .icon-btn{width:40px;height:40px;border-radius:11px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);position:relative;transition:all .2s}
  .icon-btn:hover{background:rgba(255,255,255,.09);color:#fff}
  .bell-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--red);border:1.5px solid var(--dark)}
  .content{padding:28px 32px 48px}
  .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
  .stat-card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:20px 22px;transition:border-color .2s,transform .2s;animation:fadeUp .4s ease both}
  .stat-card:hover{border-color:rgba(255,255,255,.12);transform:translateY(-2px)}
  .stat-icon-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
  .stat-icon{width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center}
  .stat-value{font-family:'Syne',sans-serif;font-size:28px;font-weight:900;line-height:1;margin-bottom:4px;letter-spacing:-1px}
  .stat-label{font-size:11px;color:rgba(255,255,255,.32);font-weight:600;text-transform:uppercase;letter-spacing:.5px}
  .main-grid{display:grid;grid-template-columns:1fr 390px;gap:18px}
  .panel{background:var(--card);border:1px solid var(--border);border-radius:20px;overflow:hidden}
  .panel-header{padding:18px 22px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between}
  .panel-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:900}
  .live-badge{display:flex;align-items:center;gap:6px;background:rgba(230,0,0,.12);border-radius:50px;padding:4px 13px;font-size:11px;font-weight:800;color:var(--red);letter-spacing:.8px}
  .live-dot{width:5px;height:5px;border-radius:50%;background:var(--red);animation:pdot 1.5s infinite}
  .order-card{margin:12px;border-radius:15px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);padding:18px 20px;animation:slideIn .22s ease;transition:border-color .2s,background .2s}
  .order-card:hover{border-color:rgba(230,0,0,.28);background:rgba(230,0,0,.03)}
  .order-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .order-id{font-size:10px;font-weight:800;color:rgba(255,255,255,.28);letter-spacing:1.2px;font-family:var(--mono)}
  .order-earn{font-family:'Syne',sans-serif;font-size:22px;font-weight:900;color:var(--green)}
  .order-meal{font-size:17px;font-weight:800;margin-bottom:3px}
  .order-vendor{font-size:13px;color:rgba(255,255,255,.42);font-weight:600;margin-bottom:14px}
  .chips{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px}
  .chip{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border-radius:9px;padding:7px 10px;font-size:11px;font-weight:700;color:rgba(255,255,255,.5)}
  .customer-box{background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);border-radius:11px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px}
  .customer-icon{width:32px;height:32px;border-radius:9px;background:rgba(59,130,246,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--blue)}
  .customer-name{font-size:13px;font-weight:700}
  .customer-phone{font-size:12px;color:rgba(255,255,255,.45);font-family:var(--mono)}
  .call-link{margin-left:auto;background:var(--blue);color:#fff;border:none;border-radius:9px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;text-decoration:none;white-space:nowrap;font-family:'DM Sans',sans-serif}
  .call-link:hover{opacity:.85}
  .accept-btn{width:100%;padding:13px;background:var(--red);color:#fff;border:none;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .2s,transform .15s}
  .accept-btn:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}
  .accept-btn:disabled{opacity:.4;cursor:not-allowed}
  .empty-state{padding:52px 24px;text-align:center}
  .empty-icon{font-size:36px;margin-bottom:12px;line-height:1}
  .empty-title{font-weight:700;font-size:15px;margin-bottom:6px;color:rgba(255,255,255,.5)}
  .empty-sub{font-size:13px;color:rgba(255,255,255,.2);line-height:1.6}
  .right-col{display:flex;flex-direction:column;gap:16px}
  .active-card{background:linear-gradient(145deg,#b80009,var(--red));border-radius:22px;padding:24px;position:relative;overflow:hidden}
  .active-card::before{content:'';position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.06)}
  .active-card::after{content:'';position:absolute;bottom:-60px;left:-20px;width:140px;height:140px;border-radius:50%;background:rgba(0,0,0,.08)}
  .adc-tag{font-size:9px;font-weight:800;color:rgba(255,255,255,.55);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:8px;position:relative;z-index:1;display:flex;align-items:center;gap:6px}
  .adc-meal{font-family:'Syne',sans-serif;font-size:22px;font-weight:900;margin-bottom:3px;position:relative;z-index:1}
  .adc-vendor{font-size:13px;color:rgba(255,255,255,.65);font-weight:600;margin-bottom:14px;position:relative;z-index:1}
  .adc-block{background:rgba(0,0,0,.22);border-radius:13px;padding:13px 15px;margin-bottom:12px;position:relative;z-index:1}
  .adc-block-label{font-size:9px;font-weight:800;color:rgba(255,255,255,.5);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px}
  .adc-block-value{font-size:14px;font-weight:700}
  .adc-customer-row{display:flex;align-items:center;gap:10px}
  .adc-avatar{width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .adc-progress{margin-bottom:16px;position:relative;z-index:1}
  .adc-progress-top{display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:7px}
  .adc-bar{height:5px;background:rgba(255,255,255,.18);border-radius:5px;overflow:hidden}
  .adc-bar-fill{height:100%;background:#fff;border-radius:5px;transition:width .7s cubic-bezier(.4,0,.2,1)}
  .adc-status-text{font-size:11px;color:rgba(255,255,255,.5);margin-top:5px;font-weight:600}
  .adc-timeline{position:relative;z-index:1;margin-bottom:14px}
  .tl-row{display:flex;align-items:center;gap:9px;padding:5px 0}
  .tl-dot{width:16px;height:16px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900}
  .tl-dot.done{background:rgba(255,255,255,.28);color:#fff}
  .tl-dot.now{background:#fff;color:var(--red);box-shadow:0 0 0 3px rgba(255,255,255,.3)}
  .tl-dot.future{background:rgba(255,255,255,.1);color:transparent}
  .tl-label{font-size:11px;font-weight:700}
  .tl-label.done{color:rgba(255,255,255,.65)}
  .tl-label.now{color:#fff}
  .tl-label.future{color:rgba(255,255,255,.28)}
  .tl-now-badge{font-size:9px;background:rgba(255,255,255,.25);color:#fff;padding:1px 7px;border-radius:20px;font-weight:900;margin-left:6px}
  .tl-line{width:1.5px;height:10px;margin-left:7px;background:rgba(255,255,255,.2)}
  .tl-line.done{background:rgba(255,255,255,.4)}
  .adc-actions{display:flex;gap:8px;position:relative;z-index:1}
  .adc-btn{flex:1;padding:12px 8px;border-radius:50px;font-size:12px;font-weight:800;cursor:pointer;border:none;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .2s,transform .15s;font-family:'DM Sans',sans-serif}
  .adc-btn:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}
  .adc-btn:disabled{opacity:.4;cursor:not-allowed}
  .btn-pickup{background:rgba(255,255,255,.18);color:#fff}
  .btn-deliver{background:#fff;color:var(--red)}
  .loc-bar{background:rgba(5,205,153,.1);border:1px solid rgba(5,205,153,.2);border-radius:11px;padding:10px 14px;display:flex;align-items:center;gap:8px;position:relative;z-index:1;margin-top:10px}
  .loc-pulse{width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0;animation:pdot 1.5s infinite;position:relative}
  .loc-pulse::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1px solid var(--green);animation:ping 1.5s infinite}
  .loc-text{font-size:11px;font-weight:700;color:var(--green)}
  .loc-coords{font-size:10px;color:rgba(5,205,153,.6);font-family:var(--mono)}
  .no-delivery{background:var(--card);border:1px solid var(--border);border-radius:22px;padding:32px 24px;text-align:center}
  .ep-panel{background:var(--card);border:1px solid var(--border);border-radius:18px;overflow:hidden}
  .ep-header{padding:15px 20px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between}
  .ep-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:900}
  .ep-row{display:flex;align-items:center;gap:11px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
  .ep-row:last-child{border-bottom:none}
  .ep-row:hover{background:rgba(255,255,255,.03)}
  .ep-dot{width:6px;height:6px;border-radius:50%;background:var(--green);flex-shrink:0}
  .ep-name{flex:1;font-size:13px;font-weight:600;color:rgba(255,255,255,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ep-time{font-size:10px;color:rgba(255,255,255,.22);font-weight:600}
  .ep-amount{font-size:14px;font-weight:800;color:var(--green);font-family:var(--mono)}
  .history-panel{background:var(--card);border:1px solid var(--border);border-radius:20px;overflow:hidden;margin-top:18px}
  .hp-header{padding:16px 22px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between}
  .hp-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:900}
  .hp-count{font-size:12px;color:rgba(255,255,255,.28);font-weight:700;font-family:var(--mono)}
  .hp-row{display:flex;align-items:center;gap:14px;padding:14px 22px;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s;animation:fadeUp .3s ease both}
  .hp-row:last-child{border-bottom:none}
  .hp-row:hover{background:rgba(255,255,255,.03)}
  .hp-num{width:32px;height:32px;border-radius:9px;background:rgba(5,205,153,.1);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--green);flex-shrink:0}
  .hp-meal{font-size:14px;font-weight:700}
  .hp-meta{font-size:11px;color:rgba(255,255,255,.28);font-weight:600}
  .hp-earn{font-family:'Syne',sans-serif;font-size:17px;font-weight:900;color:var(--green);margin-left:auto}
  .hp-badge{font-size:9px;font-weight:800;background:rgba(5,205,153,.1);color:var(--green);padding:3px 9px;border-radius:6px;letter-spacing:.5px;text-transform:uppercase}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;padding:10px 22px;border-radius:50px;font-size:13px;font-weight:700;z-index:9999;animation:fadeUp .25s ease;pointer-events:none;white-space:nowrap;box-shadow:0 4px 20px rgba(5,205,153,.4)}
  @media(max-width:1100px){.stats-row{grid-template-columns:1fr 1fr}.main-grid{grid-template-columns:1fr}}
  @media(max-width:768px){.sidebar{display:none}.content{padding:16px}.topbar{padding:0 16px}.stats-row{grid-template-columns:1fr 1fr;gap:10px}}
`;

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────
export default function RiderDashboard() {
  const router = useRouter();

  const [uid,           setUid          ] = useState<string | null>(null);
  const [rider,         setRider        ] = useState<Rider | null>(null);
  const [isOnline,      setIsOnline     ] = useState(false);
  const [available,     setAvailable    ] = useState<Order[]>([]);
  const [myOrder,       setMyOrder      ] = useState<Order | null>(null);
  const [earnings,      setEarnings     ] = useState<Order[]>([]);
  const [customerMap,   setCustomerMap  ] = useState<Record<string, CustomerInfo>>({});
  const [authLoading,   setAuthLoading  ] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [myLocation,    setMyLocation   ] = useState<{ lat: number; lng: number } | null>(null);
  const [toast,         setToast        ] = useState<string | null>(null);

  const watchRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2_500);
  }, []);

  // ── Auth ──────────────────────────────────
  useEffect(() => onAuthStateChanged(auth, u => {
    if (!u) { router.replace("/login"); return; }
    setUid(u.uid); setAuthLoading(false);
  }), [router]);

  // ── Rider profile ─────────────────────────
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, "riders", uid), snap => {
      if (!snap.exists()) { router.replace("/login"); return; }
      const d = { id: snap.id, ...snap.data() } as Rider;
      setRider(d); setIsOnline(d.isOnline ?? false);
    });
  }, [uid, router]);

  // ── Available (dispatched, unclaimed) orders ──
  useEffect(() => {
    if (!uid || !isOnline) { setAvailable([]); return; }
    const q = query(collection(db, "orders"), where("status", "==", "out_for_delivery"));
    return onSnapshot(q, snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as Order)
        .filter(o => !o.riderId);  // truly unclaimed
      data.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      setAvailable(data);
    });
  }, [uid, isOnline]);

  // ── My active delivery ────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "orders"),
      where("riderId", "==", uid),
      where("status", "in", ["out_for_delivery", "picked_up"]),
    );
    return onSnapshot(q, snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
      setMyOrder(rows[0] ?? null);
    });
  }, [uid]);

  // ── My completed deliveries ───────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "orders"), where("riderId", "==", uid), where("status", "==", "delivered"));
    return onSnapshot(q, snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order)
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
      setEarnings(rows);
    });
  }, [uid]);

  // ── Customer info ─────────────────────────
  const fetchCustomer = useCallback(async (userId: string) => {
    if (!userId || customerMap[userId]) return;
    try {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) setCustomerMap(p => ({ ...p, [userId]: snap.data() as CustomerInfo }));
    } catch {}
  }, [customerMap]);

  useEffect(() => {
    const ids = [...available.map(o => o.userId), myOrder?.userId].filter(Boolean) as string[];
    ids.forEach(fetchCustomer);
  }, [available, myOrder?.id]);

  // ── GPS broadcasting ──────────────────────
  const writeGPS = useCallback((lat: number, lng: number, orderId: string, riderId: string) => {
    setMyLocation({ lat, lng });
    setDoc(doc(db, "riderLocations", riderId), {
      lat, lng,
      orderId,      // KEY: must match exactly so user/vendor listeners can verify
      riderId,
      updatedAt: Date.now(),
    }).catch(() => {});
  }, []);

  const startGPS = useCallback((orderId: string, riderId: string) => {
    if (!("geolocation" in navigator)) return;
    const opts: PositionOptions = { enableHighAccuracy: true, maximumAge: 4_000, timeout: 10_000 };
    const onPos = (p: GeolocationPosition) => writeGPS(p.coords.latitude, p.coords.longitude, orderId, riderId);
    watchRef.current = navigator.geolocation.watchPosition(onPos, () => {}, opts);
    timerRef.current = setInterval(() => navigator.geolocation.getCurrentPosition(onPos, () => {}, opts), LOCATION_INTERVAL);
  }, [writeGPS]);

  const stopGPS = useCallback(async (riderId: string) => {
    if (watchRef.current !== null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    if (timerRef.current)          { clearInterval(timerRef.current);  timerRef.current  = null; }
    setMyLocation(null);
    try { await deleteDoc(doc(db, "riderLocations", riderId)); } catch {}
  }, []);

  useEffect(() => {
    if (!uid) return;
    if (myOrder) startGPS(myOrder.id, uid);
    else         stopGPS(uid);
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (timerRef.current)          clearInterval(timerRef.current);
    };
  }, [myOrder?.id, uid]);

  // ── Toggle online ─────────────────────────
  const toggleOnline = useCallback(async () => {
    if (!uid) return;
    const next = !isOnline;
    setIsOnline(next);
    await updateDoc(doc(db, "riders", uid), { isOnline: next });
    if (!next) await stopGPS(uid);
  }, [uid, isOnline, stopGPS]);

  // ── Claim order ───────────────────────────
  const claimOrder = useCallback(async (order: Order) => {
    if (!uid || myOrder) return;
    setActionLoading(p => ({ ...p, [order.id]: true }));
    try {
      await runTransaction(db, async t => {
        const snap = await t.get(doc(db, "orders", order.id));
        if (!snap.exists() || snap.data().riderId) throw new Error("Already taken");
        t.update(doc(db, "orders", order.id), {
          riderId:    uid,
          riderName:  rider?.fullName ?? "Rider",
          riderPhone: rider?.phone    ?? "",
          // status stays "out_for_delivery" — vendor already set it
          claimedAt:  Date.now(),
        });
      });
      showToast("Order claimed! Head to vendor 🛵");
    } catch (e) {
      const msg = (e as Error).message;
      showToast(msg === "Already taken" ? "Someone grabbed it first!" : "Claim failed. Try again.");
    }
    setActionLoading(p => ({ ...p, [order.id]: false }));
  }, [uid, myOrder, rider, showToast]);

  // ── Mark picked up ────────────────────────
  const markPickedUp = useCallback(async () => {
    if (!myOrder) return;
    setActionLoading(p => ({ ...p, pickedUp: true }));
    try {
      await updateDoc(doc(db, "orders", myOrder.id), { status: "picked_up", pickedUpAt: Date.now() });
      showToast("Marked as picked up 📦");
    } catch {}
    setActionLoading(p => ({ ...p, pickedUp: false }));
  }, [myOrder, showToast]);

  // ── Mark delivered (atomic credit) ────────
  // IMPORTANT: Only the RIDER credits themselves here.
  // Vendor's balance is credited separately in the vendor dashboard via its own transaction.
  // Never double-credit: vendor credits vendor balance, rider credits rider balance.
  const markDelivered = useCallback(async () => {
    if (!myOrder || !uid) return;
    setActionLoading(p => ({ ...p, delivered: true }));
    try {
      const commission = Math.round((myOrder.price ?? 0) * RIDER_COMMISSION);
      await runTransaction(db, async t => {
        const rSnap = await t.get(doc(db, "riders", uid));
        if (!rSnap.exists()) throw new Error("Rider doc missing");
        const { balance = 0, totalDeliveries = 0, totalEarnings = 0 } = rSnap.data();
        t.update(doc(db, "orders", myOrder.id), {
          status: "delivered", completedAt: Date.now(), riderEarnings: commission,
        });
        t.update(doc(db, "riders", uid), {
          balance:         balance + commission,
          totalDeliveries: totalDeliveries + 1,
          totalEarnings:   totalEarnings + commission,
        });
      });
      await stopGPS(uid);
      showToast(`+₦${Math.round((myOrder.price ?? 0) * RIDER_COMMISSION).toLocaleString()} credited! 🎉`);
    } catch (e) { console.error(e); }
    setActionLoading(p => ({ ...p, delivered: false }));
  }, [myOrder, uid, stopGPS, showToast]);

  // ── Logout ────────────────────────────────
  const handleLogout = async () => {
    if (uid) {
      await updateDoc(doc(db, "riders", uid), { isOnline: false }).catch(() => {});
      await stopGPS(uid);
    }
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    router.push("/");
  };

  // ── Derived ───────────────────────────────
  const todayEarnings   = earnings.filter(e => e.completedAt && Date.now() - e.completedAt < 86_400_000).reduce((s, e) => s + (e.riderEarnings ?? 0), 0);
  const todayDeliveries = earnings.filter(e => e.completedAt && Date.now() - e.completedAt < 86_400_000).length;
  const initials        = rider?.fullName ? rider.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  const progressWidth   = myOrder?.status === "picked_up" ? "72%" : myOrder?.status === "out_for_delivery" ? "32%" : "0%";
  const curIdx          = statusIdx(myOrder?.status ?? "");

  if (authLoading || !rider) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:48,height:48,border:"3px solid #e60000",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 16px" }} />
          <p style={{ color:"rgba(255,255,255,.3)",fontWeight:600,fontSize:14 }}>Loading dashboard…</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="layout">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">ODG<span>.</span></div>
            <div className="logo-sub">Rider Portal</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-label">Navigation</div>
            <button className="nav-btn active">
              <Navigation size={15} /> Dashboard
              {available.length > 0 && <span className="nav-badge">{available.length}</span>}
            </button>
            <button className="nav-btn"><Package size={15} /> My Deliveries</button>
            <button className="nav-btn"><TrendingUp size={15} /> Earnings</button>
            <div className="nav-label">Account</div>
            <button className="nav-btn"><Wallet size={15} /> Payouts</button>
            <button className="nav-btn"><Bell size={15} /> Notifications</button>
          </nav>
          <div className="sidebar-bottom">
            <div className="rider-pill">
              <div className="rider-avatar">{initials}</div>
              <div style={{ minWidth:0 }}>
                <div className="rider-name">{rider.fullName}</div>
                <div className="rider-role">Rider · {isOnline ? "🟢 Online" : "⚫ Offline"}</div>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Log out"><LogOut size={14} /></button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          <header className="topbar">
            <div>
              <div className="topbar-title">Rider Dashboard</div>
              <div className="topbar-sub">
                {isOnline ? `${available.length} order${available.length !== 1 ? "s" : ""} available` : "You are offline"}
              </div>
            </div>
            <div className="topbar-right">
              <div className={`online-toggle${isOnline ? " active" : ""}`} onClick={toggleOnline}>
                <div className="toggle-dot" />
                <span className="toggle-label">{isOnline ? "Online" : "Go Online"}</span>
              </div>
              <button className="icon-btn">
                <Bell size={17} />
                {available.length > 0 && <span className="bell-dot" />}
              </button>
            </div>
          </header>

          <div className="content">
            {/* ── STATS ── */}
            <div className="stats-row">
              {[
                { icon:<Wallet size={20} color="#e60000"/>, bg:"rgba(230,0,0,.14)", value:`₦${(rider.balance??0).toLocaleString()}`, label:"Available balance", d:"0ms" },
                { icon:<TrendingUp size={20} color="#05cd99"/>, bg:"rgba(5,205,153,.12)", value:`₦${todayEarnings.toLocaleString()}`, label:"Earnings today", d:"80ms" },
                { icon:<Package size={20} color="#3b82f6"/>, bg:"rgba(59,130,246,.12)", value:String(todayDeliveries), label:"Deliveries today", d:"160ms" },
                { icon:<Zap size={20} color="#8b5cf6"/>, bg:"rgba(139,92,246,.12)", value:String(rider.totalDeliveries??0), label:"Lifetime total", d:"240ms" },
              ].map((s, i) => (
                <div key={i} className="stat-card" style={{ animationDelay:s.d }}>
                  <div className="stat-icon-row">
                    <div className="stat-icon" style={{ background:s.bg }}>{s.icon}</div>
                  </div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── MAIN GRID ── */}
            <div className="main-grid">

              {/* LEFT — available orders */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Available Pickups</div>
                  {isOnline
                    ? <div className="live-badge"><span className="live-dot" />{available.length} LIVE</div>
                    : <span style={{ fontSize:12,color:"rgba(255,255,255,.25)",fontWeight:700 }}>Offline</span>}
                </div>

                {!isOnline ? (
                  <div className="empty-state">
                    <div className="empty-icon">💤</div>
                    <div className="empty-title">You are offline</div>
                    <p className="empty-sub">Toggle Online above to see delivery requests.</p>
                  </div>
                ) : myOrder ? (
                  <div className="empty-state">
                    <div className="empty-icon">🛵</div>
                    <div className="empty-title">Delivery in progress</div>
                    <p className="empty-sub">Complete your current delivery first.</p>
                  </div>
                ) : available.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <div className="empty-title">No pickups right now</div>
                    <p className="empty-sub">Vendor-dispatched orders appear here instantly.</p>
                  </div>
                ) : available.map(order => {
                  const customer = order.userId ? customerMap[order.userId] : null;
                  const loading  = actionLoading[order.id];
                  return (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <span className="order-id">#{order.id.slice(-6).toUpperCase()}</span>
                        <span className="order-earn">+₦{Math.round((order.price??0)*RIDER_COMMISSION).toLocaleString()}</span>
                      </div>
                      <div className="order-meal">{order.mealName}</div>
                      <div className="order-vendor">From: {order.vendorName}</div>
                      <div className="chips">
                        <div className="chip"><MapPin size={11}/>{order.deliveryAddress?.hostel ?? "?"}, Rm {order.deliveryAddress?.room ?? "?"}</div>
                        <div className="chip"><Clock size={11}/>{fmtTime(order.createdAt)}</div>
                        <div className="chip"><Wallet size={11}/>₦{(order.price??0).toLocaleString()} total</div>
                        <div className="chip"><Package size={11}/>Fee: ₦{Math.round((order.price??0)*RIDER_COMMISSION).toLocaleString()}</div>
                      </div>
                      {customer && (
                        <div className="customer-box">
                          <div className="customer-icon"><User size={15} /></div>
                          <div>
                            <div className="customer-name">{customer.fullName || "Customer"}</div>
                            <div className="customer-phone">{customer.phone || "No phone saved"}</div>
                          </div>
                          {customer.phone && (
                            <a href={`tel:${customer.phone}`} className="call-link"><Phone size={12}/> Call</a>
                          )}
                        </div>
                      )}
                      <button className="accept-btn" onClick={() => claimOrder(order)} disabled={loading || !!myOrder}>
                        {loading
                          ? <><div style={{ width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite" }}/> Claiming…</>
                          : <><Navigation size={14}/> Accept Pickup</>}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* RIGHT — active delivery + earnings */}
              <div className="right-col">
                {myOrder ? (
                  <div className="active-card">
                    <div className="adc-tag"><Radio size={10} style={{ animation:"pdot 1.5s infinite" }}/> ACTIVE DELIVERY</div>
                    <div className="adc-meal">{myOrder.mealName}</div>
                    <div className="adc-vendor">{myOrder.vendorName}</div>

                    {/* Destination */}
                    <div className="adc-block">
                      <div className="adc-block-label">Deliver to</div>
                      <div className="adc-block-value" style={{ display:"flex",alignItems:"center",gap:7 }}>
                        <MapPin size={13} color="rgba(255,255,255,.6)"/>{addrLabel(myOrder)}
                      </div>
                    </div>

                    {/* Customer contact */}
                    {myOrder.userId && customerMap[myOrder.userId] && (() => {
                      const c = customerMap[myOrder.userId!];
                      return (
                        <div className="adc-block">
                          <div className="adc-block-label">Customer</div>
                          <div className="adc-customer-row">
                            <div className="adc-avatar"><User size={14}/></div>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontSize:13,fontWeight:700 }}>{c.fullName || "Customer"}</div>
                              <div style={{ fontSize:12,color:"rgba(255,255,255,.55)",fontFamily:"var(--mono)" }}>{c.phone || "No phone"}</div>
                            </div>
                            {c.phone && (
                              <>
                                <a href={`tel:${c.phone}`} style={{ marginLeft:"auto",background:"rgba(255,255,255,.18)",color:"#fff",border:"none",borderRadius:9,padding:"6px 11px",fontSize:12,fontWeight:800,display:"flex",alignItems:"center",gap:5,textDecoration:"none",cursor:"pointer" }}>
                                  <Phone size={12}/> Call
                                </a>
                                <button onClick={() => { navigator.clipboard.writeText(c.phone!).catch(()=>{}); showToast("📋 Number copied!"); }} style={{ background:"rgba(255,255,255,.1)",border:"none",borderRadius:9,padding:"6px 9px",cursor:"pointer",color:"#fff",marginLeft:4 }}>
                                  <Copy size={12}/>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Mini status timeline */}
                    <div className="adc-timeline">
                      {STATUS_STEPS.slice(2).map((step, i) => {
                        const sIdx   = i + 2;
                        const isDone = curIdx > sIdx;
                        const isNow  = curIdx === sIdx;
                        const cls    = isDone ? "done" : isNow ? "now" : "future";
                        return (
                          <React.Fragment key={step.key}>
                            <div className="tl-row">
                              <div className={`tl-dot ${cls}`}>{isDone ? "✓" : isNow ? "●" : ""}</div>
                              <span className={`tl-label ${cls}`}>{step.emoji} {step.label}</span>
                              {isNow && <span className="tl-now-badge">NOW</span>}
                            </div>
                            {i < STATUS_STEPS.slice(2).length - 1 && <div className={`tl-line ${isDone ? "done" : ""}`}/>}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Progress bar */}
                    <div className="adc-progress">
                      <div className="adc-progress-top">
                        <span style={{ color:"rgba(255,255,255,.55)" }}>Your cut</span>
                        <span>+₦{Math.round((myOrder.price??0)*RIDER_COMMISSION).toLocaleString()}</span>
                      </div>
                      <div className="adc-bar"><div className="adc-bar-fill" style={{ width:progressWidth }}/></div>
                      <div className="adc-status-text">
                        {myOrder.status === "picked_up" ? "🛵 En route to customer…" : "📦 Head to vendor to pick up…"}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="adc-actions">
                      {myOrder.status !== "picked_up" && (
                        <button className="adc-btn btn-pickup" onClick={markPickedUp} disabled={actionLoading.pickedUp}>
                          {actionLoading.pickedUp ? "…" : <><CheckCircle2 size={14}/> Picked Up</>}
                        </button>
                      )}
                      <button className="adc-btn btn-deliver" onClick={markDelivered} disabled={actionLoading.delivered}>
                        {actionLoading.delivered ? "…" : <><Zap size={14}/> Mark Delivered</>}
                      </button>
                    </div>

                    {/* GPS indicator */}
                    {myLocation && (
                      <div className="loc-bar">
                        <div className="loc-pulse"/>
                        <div>
                          <div className="loc-text">Broadcasting live to customer & vendor</div>
                          <div className="loc-coords">{myLocation.lat.toFixed(5)}, {myLocation.lng.toFixed(5)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-delivery">
                    <div style={{ fontSize:36,marginBottom:12 }}>🛵</div>
                    <div style={{ fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:900,marginBottom:6 }}>No active delivery</div>
                    <div style={{ fontSize:13,color:"rgba(255,255,255,.3)",fontWeight:500 }}>
                      {isOnline ? "Accept a pickup to start earning." : "Go online to receive deliveries."}
                    </div>
                  </div>
                )}

                {/* Recent earnings */}
                <div className="ep-panel">
                  <div className="ep-header">
                    <div className="ep-title">Recent Earnings</div>
                    <span style={{ fontSize:11,color:"rgba(255,255,255,.25)",fontWeight:700 }}>₦{(rider.totalEarnings??0).toLocaleString()} total</span>
                  </div>
                  {earnings.slice(0, 5).length === 0
                    ? <div style={{ padding:"20px",fontSize:13,color:"rgba(255,255,255,.2)",fontWeight:600 }}>No completed deliveries yet.</div>
                    : earnings.slice(0, 5).map(e => (
                      <div key={e.id} className="ep-row">
                        <div className="ep-dot"/>
                        <div className="ep-name">{e.mealName}</div>
                        <div className="ep-time">{fmtTime(e.completedAt)}</div>
                        <div className="ep-amount">+₦{(e.riderEarnings??0).toLocaleString()}</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* ── HISTORY ── */}
            {earnings.length > 0 && (
              <div className="history-panel">
                <div className="hp-header">
                  <div className="hp-title">Delivery History</div>
                  <span className="hp-count">{earnings.length} total</span>
                </div>
                {earnings.slice(0, 15).map((e, i) => (
                  <div key={e.id} className="hp-row" style={{ animationDelay:`${i*25}ms` }}>
                    <div className="hp-num">{i + 1}</div>
                    <div style={{ minWidth:0 }}>
                      <div className="hp-meal">{e.mealName}</div>
                      <div className="hp-meta">{e.vendorName} · {fmtTime(e.completedAt)}</div>
                    </div>
                    <div className="hp-earn">+₦{(e.riderEarnings??0).toLocaleString()}</div>
                    <span className="hp-badge">Delivered</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}