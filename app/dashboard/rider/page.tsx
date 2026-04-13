"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Navigation,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Wallet,
  Zap,
  LogOut,
  Bell,
  TrendingUp,
  Circle,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
  Radio,
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
  getDoc,
  updateDoc,
} from "firebase/firestore";

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
interface Rider {
  id: string;
  fullName: string;
  isOnline: boolean;
  balance: number;
  totalDeliveries: number;
  totalEarnings: number;
}

interface Order {
  id: string;
  riderId?: string | null;
  status: string;
  createdAt?: number;
  mealName?: string;
  vendorName?: string;
  price?: number;
  deliveryAddress?: {
    hostel?: string;
    room?: string;
  };
  pickedUpAt?: number;
  completedAt?: number;
  riderEarnings?: number;
  claimedAt?: number;
  riderName?: string;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --red:     #e60000;
    --dark:    #0f172a;
    --mid:     #1e293b;
    --muted:   #64748b;
    --border:  #e8edf5;
    --surface: #f6f8fc;
    --white:   #ffffff;
    --green:   #05cd99;
    --amber:   #f59e0b;
    --blue:    #3b82f6;
    --purple:  #8b5cf6;
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--dark);
    color: var(--white);
    min-height: 100vh;
  }

  @keyframes spin      { to { transform:rotate(360deg); } }
  @keyframes fadeUp    { from { opacity:0;transform:translateY(16px); } to { opacity:1;transform:translateY(0); } }
  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes ping      { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.4);opacity:0} }
  @keyframes slideIn   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }

  /* ── LAYOUT ── */
  .layout { display:flex; min-height:100vh; }

  /* ── SIDEBAR ── */
  .sidebar {
    width:240px; flex-shrink:0;
    background:#080f1e;
    display:flex; flex-direction:column;
    position:sticky; top:0; height:100vh;
    border-right:1px solid rgba(255,255,255,0.05);
  }
  .sidebar-logo { padding:28px 24px 22px; }
  .logo-mark { font-family:'Syne',sans-serif; font-size:26px; font-weight:900; letter-spacing:-1px; }
  .logo-mark span { color:var(--red); }
  .logo-sub { font-size:10px; font-weight:800; color:rgba(255,255,255,0.2); letter-spacing:2.5px; text-transform:uppercase; margin-top:2px; }

  .sidebar-nav { flex:1; padding:8px 12px; }
  .nav-label { font-size:9px; font-weight:800; color:rgba(255,255,255,0.2); letter-spacing:2px; text-transform:uppercase; padding:0 12px; margin:18px 0 6px; }
  .nav-btn {
    display:flex; align-items:center; gap:11px;
    padding:10px 12px; border-radius:10px;
    font-size:13px; font-weight:600;
    color:rgba(255,255,255,0.4);
    cursor:pointer; width:100%; border:none; background:none;
    transition:all 0.18s; margin-bottom:1px; text-align:left;
  }
  .nav-btn:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.75); }
  .nav-btn.active { background:rgba(230,0,0,0.18); color:#fff; }
  .nav-btn.active svg { color:var(--red); }

  .sidebar-bottom { padding:14px 12px; border-top:1px solid rgba(255,255,255,0.05); }
  .rider-pill {
    display:flex; align-items:center; gap:11px;
    padding:12px; border-radius:12px;
    background:rgba(255,255,255,0.04);
  }
  .rider-avatar {
    width:34px; height:34px; border-radius:9px;
    background:linear-gradient(135deg,var(--red),#ff6b35);
    display:flex; align-items:center; justify-content:center;
    font-family:'Syne',sans-serif; font-size:13px; font-weight:900; color:#fff;
    flex-shrink:0;
  }
  .rider-name { font-size:12px; font-weight:700; color:#fff; }
  .rider-role { font-size:10px; color:rgba(255,255,255,0.3); font-weight:600; }
  .logout-btn { margin-left:auto; background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.25); transition:color 0.2s; }
  .logout-btn:hover { color:var(--red); }

  /* ── MAIN ── */
  .main { flex:1; overflow-x:hidden; }

  /* ── TOPBAR ── */
  .topbar {
    background:#0a1221;
    border-bottom:1px solid rgba(255,255,255,0.06);
    height:64px; padding:0 32px;
    display:flex; align-items:center; justify-content:space-between;
    position:sticky; top:0; z-index:100;
  }
  .topbar-title { font-family:'Syne',sans-serif; font-size:18px; font-weight:900; }
  .topbar-right { display:flex; align-items:center; gap:12px; }

  /* Online toggle */
  .online-toggle {
    display:flex; align-items:center; gap:10px;
    background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:50px; padding:8px 16px;
    cursor:pointer; transition:all 0.25s;
  }
  .online-toggle.active {
    background:rgba(5,205,153,0.12);
    border-color:rgba(5,205,153,0.25);
  }
  .toggle-label { font-size:13px; font-weight:700; color:rgba(255,255,255,0.5); }
  .online-toggle.active .toggle-label { color:var(--green); }
  .toggle-dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.2); position:relative; }
  .online-toggle.active .toggle-dot { background:var(--green); animation:pulse-dot 2s infinite; }
  .toggle-dot::after {
    content:''; position:absolute; inset:-3px;
    border-radius:50%; border:1px solid transparent;
  }
  .online-toggle.active .toggle-dot::after {
    border-color:var(--green);
    animation:ping 1.5s infinite;
  }

  .bell-btn {
    width:38px; height:38px; border-radius:10px;
    background:rgba(255,255,255,0.05); border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:rgba(255,255,255,0.4); position:relative; transition:background 0.2s;
  }
  .bell-btn:hover { background:rgba(255,255,255,0.08); color:#fff; }
  .bell-dot { position:absolute; top:7px; right:7px; width:7px; height:7px; border-radius:50%; background:var(--red); border:1.5px solid #0a1221; }

  /* ── PAGE CONTENT ── */
  .content { padding:28px 32px; }

  /* ── STATS ROW ── */
  .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
  .stat-card {
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:18px; padding:20px 22px;
    transition:border-color 0.2s;
  }
  .stat-card:hover { border-color:rgba(255,255,255,0.12); }
  .stat-icon-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .stat-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
  .stat-change { font-size:11px; font-weight:800; color:var(--green); }
  .stat-value { font-family:'Syne',sans-serif; font-size:30px; font-weight:900; line-height:1; margin-bottom:4px; }
  .stat-label { font-size:12px; color:rgba(255,255,255,0.35); font-weight:600; }

  /* ── MAIN GRID ── */
  .main-grid { display:grid; grid-template-columns:1fr 360px; gap:20px; }

  /* ── AVAILABLE ORDERS (left) ── */
  .panel {
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:20px; overflow:hidden;
  }
  .panel-header {
    padding:18px 22px;
    border-bottom:1px solid rgba(255,255,255,0.06);
    display:flex; align-items:center; justify-content:space-between;
  }
  .panel-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:900; }
  .live-badge {
    display:flex; align-items:center; gap:6px;
    background:rgba(230,0,0,0.12); border-radius:50px;
    padding:4px 12px; font-size:11px; font-weight:800;
    color:var(--red); letter-spacing:1px;
  }
  .live-dot { width:5px; height:5px; border-radius:50%; background:var(--red); animation:pulse-dot 1.5s infinite; }

  /* Order card inside panel */
  .order-card {
    margin:14px; border-radius:14px;
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.07);
    padding:18px 20px;
    animation:slideIn 0.25s ease;
    transition:border-color 0.2s, background 0.2s;
  }
  .order-card:hover { border-color:rgba(230,0,0,0.25); background:rgba(230,0,0,0.04); }
  .order-card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .order-id { font-size:11px; font-weight:800; color:rgba(255,255,255,0.3); letter-spacing:1px; }
  .order-price { font-family:'Syne',sans-serif; font-size:20px; font-weight:900; color:var(--green); }
  .order-meal { font-size:16px; font-weight:800; margin-bottom:4px; }
  .order-vendor { font-size:13px; color:rgba(255,255,255,0.45); font-weight:600; margin-bottom:14px; }
  .order-meta-row {
    display:flex; gap:16px; margin-bottom:16px;
  }
  .meta-pill {
    display:flex; align-items:center; gap:5px;
    background:rgba(255,255,255,0.05); border-radius:8px;
    padding:5px 10px; font-size:11px; font-weight:700;
    color:rgba(255,255,255,0.5);
  }
  .accept-btn {
    width:100%; padding:12px;
    background:var(--red); color:#fff;
    border:none; border-radius:12px;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:800;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
    transition:opacity 0.2s, transform 0.15s;
  }
  .accept-btn:hover { opacity:0.88; transform:translateY(-1px); }
  .accept-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }

  /* Empty panel */
  .panel-empty { padding:48px 20px; text-align:center; color:rgba(255,255,255,0.25); }
  .panel-empty-icon { font-size:32px; margin-bottom:12px; }
  .panel-empty-h { font-weight:700; font-size:15px; margin-bottom:6px; color:rgba(255,255,255,0.4); }

  /* ── ACTIVE DELIVERY (right panel) ── */
  .delivery-panel { display:flex; flex-direction:column; gap:16px; }

  .active-delivery-card {
    background:var(--red);
    border-radius:20px; padding:24px;
    position:relative; overflow:hidden;
  }
  .active-delivery-card::before {
    content:''; position:absolute; top:-30px; right:-30px;
    width:160px; height:160px; border-radius:50%;
    background:rgba(255,255,255,0.07);
  }
  .adc-label { font-size:10px; font-weight:800; color:rgba(255,255,255,0.6); letter-spacing:2px; text-transform:uppercase; margin-bottom:10px; position:relative; z-index:1; }
  .adc-meal { font-family:'Syne',sans-serif; font-size:20px; font-weight:900; margin-bottom:4px; position:relative; z-index:1; }
  .adc-vendor { font-size:13px; color:rgba(255,255,255,0.7); font-weight:600; margin-bottom:20px; position:relative; z-index:1; }

  .adc-address {
    display:flex; align-items:flex-start; gap:10px;
    background:rgba(0,0,0,0.2); border-radius:12px; padding:14px 16px;
    margin-bottom:16px; position:relative; z-index:1;
  }
  .adc-address-label { font-size:10px; font-weight:800; color:rgba(255,255,255,0.55); letter-spacing:1px; text-transform:uppercase; margin-bottom:3px; }
  .adc-address-value { font-size:14px; font-weight:700; }

  .adc-status-row { display:flex; gap:8px; position:relative; z-index:1; }
  .adc-status-btn {
    flex:1; padding:11px 8px; border-radius:50px;
    font-size:12px; font-weight:800; cursor:pointer; border:none;
    display:flex; align-items:center; justify-content:center; gap:6px;
    transition:opacity 0.2s, transform 0.15s;
  }
  .adc-status-btn:hover { opacity:0.88; transform:translateY(-1px); }
  .adc-status-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
  .btn-picked { background:rgba(255,255,255,0.18); color:#fff; }
  .btn-done   { background:#fff; color:var(--red); }

  .no-delivery-card {
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:20px; padding:32px 24px;
    text-align:center;
  }
  .no-delivery-icon { font-size:36px; margin-bottom:12px; }
  .no-delivery-h { font-family:'Syne',sans-serif; font-size:16px; font-weight:900; margin-bottom:6px; }
  .no-delivery-sub { font-size:13px; color:rgba(255,255,255,0.35); font-weight:500; }

  /* ── EARNINGS CARD ── */
  .earnings-card {
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:20px; overflow:hidden;
  }
  .earnings-header { padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.06); }
  .earnings-title { font-family:'Syne',sans-serif; font-size:14px; font-weight:900; }

  .earnings-row {
    display:flex; align-items:center; gap:12px;
    padding:12px 20px;
    border-bottom:1px solid rgba(255,255,255,0.04);
    transition:background 0.15s;
  }
  .earnings-row:last-child { border-bottom:none; }
  .earnings-row:hover { background:rgba(255,255,255,0.03); }
  .earnings-dot { width:7px; height:7px; border-radius:50%; background:var(--green); flex-shrink:0; }
  .earnings-label { flex:1; font-size:13px; font-weight:600; color:rgba(255,255,255,0.7); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .earnings-time { font-size:11px; color:rgba(255,255,255,0.25); font-weight:600; }
  .earnings-amount { font-size:14px; font-weight:800; color:var(--green); }

  /* ── HISTORY (below main grid) ── */
  .history-card {
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:20px; overflow:hidden;
    margin-top:20px;
  }
  .history-header { padding:16px 22px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; }
  .history-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:900; }
  .history-count { font-size:12px; color:rgba(255,255,255,0.3); font-weight:600; }

  .history-row {
    display:flex; align-items:center; gap:16px;
    padding:14px 22px;
    border-bottom:1px solid rgba(255,255,255,0.04);
    transition:background 0.15s;
  }
  .history-row:last-child { border-bottom:none; }
  .history-row:hover { background:rgba(255,255,255,0.03); }
  .history-num { width:32px; height:32px; border-radius:9px; background:rgba(5,205,153,0.12); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:var(--green); flex-shrink:0; }
  .history-meal { font-size:14px; font-weight:700; }
  .history-meta { font-size:12px; color:rgba(255,255,255,0.3); font-weight:600; }
  .history-earn { font-family:'Syne',sans-serif; font-size:16px; font-weight:900; color:var(--green); margin-left:auto; }
  .history-badge { font-size:10px; font-weight:800; background:rgba(5,205,153,0.12); color:var(--green); padding:3px 9px; border-radius:6px; }

  /* ── RESPONSIVE ── */
  @media (max-width:1100px) {
    .stats-row { grid-template-columns:1fr 1fr; }
    .main-grid { grid-template-columns:1fr; }
  }
  @media (max-width:768px) {
    .sidebar { display:none; }
    .content { padding:20px; }
    .topbar { padding:0 20px; }
    .stats-row { grid-template-columns:1fr 1fr; }
  }
`;

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const RIDER_COMMISSION = 0.2; // rider earns 20% of order price

function formatTime(ts: number | undefined): string {
  if (!ts) return "";
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ─────────────────────────────────────────────
//  RIDER DASHBOARD
// ─────────────────────────────────────────────
export default function RiderDashboard() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [rider, setRider] = useState<Rider | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [available, setAvailable] = useState<Order[]>([]); // orders at out_for_delivery assigned to nobody
  const [myOrder, setMyOrder] = useState<Order | null>(null); // currently active delivery
  const [earnings, setEarnings] = useState<Order[]>([]); // completed by me
  const [authLoading, setAuthLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );

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

  // ── Rider profile ─────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "riders", uid), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Rider;
        setRider(data);
        setIsOnline(data.isOnline || false);
      } else {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [uid, router]);

  // ── Available orders to pick up ──────────────────
  // Replace the existing useEffect that queries available orders
  useEffect(() => {
    if (!uid || !isOnline) {
      setAvailable([]);
      return;
    }
    // Query all out_for_delivery orders — filter unclaimed client-side
    // This avoids the composite index requirement for riderId == null
    const q = query(
      collection(db, "orders"),
      where("status", "==", "out_for_delivery"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Order)
        .filter((o) => !o.riderId); // unclaimed = no riderId field OR riderId is null/undefined
      data.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setAvailable(data);
    });
    return () => unsub();
  }, [uid, isOnline]);

  // ── My active delivery ────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "orders"),
      where("riderId", "==", uid),
      where("status", "in", ["out_for_delivery", "picked_up"]),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
      setMyOrder(data.length > 0 ? data[0] : null);
    });
    return () => unsub();
  }, [uid]);

  // ── My completed deliveries ───────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "orders"),
      where("riderId", "==", uid),
      where("status", "==", "delivered"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
      data.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
      setEarnings(data);
    });
    return () => unsub();
  }, [uid]);

  // ── Toggle online ─────────────────────────
  const toggleOnline = useCallback(async () => {
    if (!uid) return;
    const next = !isOnline;
    setIsOnline(next);
    await updateDoc(doc(db, "riders", uid), { isOnline: next });
  }, [uid, isOnline]);

  // ── Accept / claim an order ───────────────
  const claimOrder = useCallback(
    async (order: Order) => {
      if (!uid || myOrder) return; // can only hold one at a time
      setActionLoading((p) => ({ ...p, [order.id]: true }));
      try {
        await runTransaction(db, async (t) => {
          const oSnap = await t.get(doc(db, "orders", order.id));
          if (!oSnap.exists() || oSnap.data().riderId !== null) {
            throw new Error("Order already taken");
          }
          t.update(doc(db, "orders", order.id), {
            riderId: uid,
            riderName: rider?.fullName || "Rider",
            status: "out_for_delivery",
            claimedAt: Date.now(),
          });
        });
      } catch (e) {
        console.error("Claim failed:", (e as Error).message);
      }
      setActionLoading((p) => ({ ...p, [order.id]: false }));
    },
    [uid, myOrder, rider],
  );

  // ── Mark picked up from vendor ────────────
  const markPickedUp = useCallback(async () => {
    if (!myOrder) return;
    setActionLoading((p) => ({ ...p, pickedUp: true }));
    try {
      await updateDoc(doc(db, "orders", myOrder.id), {
        status: "picked_up",
        pickedUpAt: Date.now(),
      });
    } catch (e) {
      console.error(e);
    }
    setActionLoading((p) => ({ ...p, pickedUp: false }));
  }, [myOrder]);

  // ── Mark delivered + credit rider earnings ─
  const markDelivered = useCallback(async () => {
    if (!myOrder || !uid) return;
    setActionLoading((p) => ({ ...p, delivered: true }));
    try {
      const commission = Math.round((myOrder.price || 0) * RIDER_COMMISSION);
      await runTransaction(db, async (t) => {
        const rSnap = await t.get(doc(db, "riders", uid));
        if (!rSnap.exists()) throw new Error("Rider doc missing");
        const {
          balance = 0,
          totalDeliveries = 0,
          totalEarnings = 0,
        } = rSnap.data();

        // Update order
        t.update(doc(db, "orders", myOrder.id), {
          status: "delivered",
          completedAt: Date.now(),
          riderEarnings: commission,
        });

        // Credit rider
        t.update(doc(db, "riders", uid), {
          balance: balance + commission,
          totalDeliveries: totalDeliveries + 1,
          totalEarnings: totalEarnings + commission,
        });
      });
    } catch (e) {
      console.error(e);
    }
    setActionLoading((p) => ({ ...p, delivered: false }));
  }, [myOrder, uid]);

  const handleLogout = async () => {
    // Go offline before logging out
    if (uid)
      await updateDoc(doc(db, "riders", uid), { isOnline: false }).catch(
        () => {},
      );
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    router.push("/");
  };

  // ── Derived ──────────────────────────────
  const todayEarnings = earnings
    .filter((e) => e.completedAt && Date.now() - e.completedAt < 86400000)
    .reduce((s, e) => s + (e.riderEarnings || 0), 0);

  const todayDeliveries = earnings.filter(
    (e) => e.completedAt && Date.now() - e.completedAt < 86400000,
  ).length;

  const initials = rider?.fullName
    ? rider.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const addressLabel = (order: Order) => {
    const addr = order?.deliveryAddress;
    if (!addr) return "No address provided";
    return `${addr.hostel || "Unknown hostel"}, Room ${addr.room || "?"}`;
  };

  // ── Loading ──────────────────────────────
  if (authLoading || !rider) {
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
            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Loading rider dashboard…
            </p>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="layout">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">
              ODG<span>.</span>
            </div>
            <div className="logo-sub">Rider Portal</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-label">Navigation</div>
            <button className="nav-btn active">
              <Navigation size={16} /> Dashboard
            </button>
            <button className="nav-btn">
              <Package size={16} /> My Deliveries
            </button>
            <button className="nav-btn">
              <TrendingUp size={16} /> Earnings
            </button>
            <div className="nav-label">Account</div>
            <button className="nav-btn">
              <Wallet size={16} /> Payouts
            </button>
            <button className="nav-btn">
              <Bell size={16} /> Notifications
            </button>
          </nav>
          <div className="sidebar-bottom">
            <div className="rider-pill">
              <div className="rider-avatar">{initials}</div>
              <div>
                <div className="rider-name">{rider.fullName}</div>
                <div className="rider-role">
                  Rider · {isOnline ? "🟢 Online" : "⚫ Offline"}
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main">
          <header className="topbar">
            <div className="topbar-title">Rider Dashboard</div>
            <div className="topbar-right">
              <div
                className={`online-toggle${isOnline ? " active" : ""}`}
                onClick={toggleOnline}
              >
                <div className="toggle-dot" />
                <span className="toggle-label">
                  {isOnline ? "Online" : "Go Online"}
                </span>
              </div>
              <button className="bell-btn">
                <Bell size={17} />
                {available.length > 0 && <span className="bell-dot" />}
              </button>
            </div>
          </header>

          <div className="content">
            {/* ── STATS ── */}
            <div className="stats-row">
              {/* Balance */}
              <div className="stat-card">
                <div className="stat-icon-row">
                  <div
                    className="stat-icon"
                    style={{ background: "rgba(230,0,0,0.15)" }}
                  >
                    <Wallet size={20} color="var(--red)" />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    Balance
                  </span>
                </div>
                <div className="stat-value">
                  ₦{(rider.balance || 0).toLocaleString()}
                </div>
                <div className="stat-label">Available to withdraw</div>
              </div>

              {/* Today's earnings */}
              <div className="stat-card">
                <div className="stat-icon-row">
                  <div
                    className="stat-icon"
                    style={{ background: "rgba(5,205,153,0.12)" }}
                  >
                    <TrendingUp size={20} color="var(--green)" />
                  </div>
                  <span className="stat-change">Today</span>
                </div>
                <div className="stat-value">
                  ₦{todayEarnings.toLocaleString()}
                </div>
                <div className="stat-label">Todays earnings</div>
              </div>

              {/* Today's deliveries */}
              <div className="stat-card">
                <div className="stat-icon-row">
                  <div
                    className="stat-icon"
                    style={{ background: "rgba(59,130,246,0.12)" }}
                  >
                    <Package size={20} color="var(--blue)" />
                  </div>
                </div>
                <div className="stat-value">{todayDeliveries}</div>
                <div className="stat-label">Deliveries today</div>
              </div>

              {/* All time */}
              <div className="stat-card">
                <div className="stat-icon-row">
                  <div
                    className="stat-icon"
                    style={{ background: "rgba(139,92,246,0.12)" }}
                  >
                    <Zap size={20} color="var(--purple)" />
                  </div>
                </div>
                <div className="stat-value">{rider.totalDeliveries || 0}</div>
                <div className="stat-label">Lifetime deliveries</div>
              </div>
            </div>

            {/* ── MAIN GRID ── */}
            <div className="main-grid">
              {/* LEFT — Available orders */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Available Pickups</div>
                  {isOnline ? (
                    <div className="live-badge">
                      <span className="live-dot" /> {available.length} READY
                    </div>
                  ) : (
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.25)",
                        fontWeight: 700,
                      }}
                    >
                      Go online to see orders
                    </span>
                  )}
                </div>

                {!isOnline ? (
                  <div className="panel-empty">
                    <div className="panel-empty-icon">💤</div>
                    <div className="panel-empty-h">You are offline</div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
                      Toggle online above to start receiving pickup requests.
                    </p>
                  </div>
                ) : myOrder ? (
                  <div className="panel-empty">
                    <div className="panel-empty-icon">🛵</div>
                    <div className="panel-empty-h">
                      Active delivery in progress
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
                      Complete your current delivery before accepting a new one.
                    </p>
                  </div>
                ) : available.length === 0 ? (
                  <div className="panel-empty">
                    <div className="panel-empty-icon">✅</div>
                    <div className="panel-empty-h">No pickups right now</div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
                      New orders dispatched by vendors will appear here
                      instantly.
                    </p>
                  </div>
                ) : (
                  available.map((order) => (
                    <div key={order.id} className="order-card">
                      <div className="order-card-top">
                        <span className="order-id">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="order-price">
                          +₦
                          {Math.round(
                            (order.price || 0) * RIDER_COMMISSION,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="order-meal">{order.mealName}</div>
                      <div className="order-vendor">
                        From: {order.vendorName}
                      </div>
                      <div className="order-meta-row">
                        <div className="meta-pill">
                          <MapPin size={11} /> {addressLabel(order)}
                        </div>
                        <div className="meta-pill">
                          <Clock size={11} /> {formatTime(order.createdAt)}
                        </div>
                      </div>
                      <button
                        className="accept-btn"
                        onClick={() => claimOrder(order)}
                        disabled={actionLoading[order.id] || !!myOrder}
                      >
                        {actionLoading[order.id] ? (
                          <>
                            <div
                              style={{
                                width: 15,
                                height: 15,
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTopColor: "#fff",
                                borderRadius: "50%",
                                animation: "spin 0.7s linear infinite",
                              }}
                            />{" "}
                            Claiming…
                          </>
                        ) : (
                          <>
                            <Navigation size={15} /> Accept Pickup
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* RIGHT — Active delivery + earnings */}
              <div className="delivery-panel">
                {/* Active delivery */}
                {myOrder ? (
                  <div className="active-delivery-card">
                    <div className="adc-label">Active Delivery</div>
                    <div className="adc-meal">{myOrder.mealName}</div>
                    <div className="adc-vendor">{myOrder.vendorName}</div>
                    <div className="adc-address">
                      <MapPin
                        size={16}
                        color="rgba(255,255,255,0.6)"
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <div>
                        <div className="adc-address-label">Deliver to</div>
                        <div className="adc-address-value">
                          {addressLabel(myOrder)}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        marginBottom: 16,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "rgba(255,255,255,0.55)",
                          fontWeight: 700,
                          marginBottom: 6,
                        }}
                      >
                        <span>Your cut</span>
                        <span style={{ color: "#fff", fontWeight: 900 }}>
                          +₦
                          {Math.round(
                            (myOrder.price || 0) * RIDER_COMMISSION,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 4,
                          background: "rgba(255,255,255,0.15)",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: "#fff",
                            borderRadius: 4,
                            width:
                              myOrder.status === "picked_up" ? "65%" : "25%",
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.45)",
                          marginTop: 5,
                          fontWeight: 600,
                        }}
                      >
                        {myOrder.status === "picked_up"
                          ? "Heading to customer…"
                          : "Awaiting pickup from vendor…"}
                      </div>
                    </div>
                    <div className="adc-status-row">
                      {myOrder.status !== "picked_up" && (
                        <button
                          className="adc-status-btn btn-picked"
                          onClick={markPickedUp}
                          disabled={actionLoading.pickedUp}
                        >
                          {actionLoading.pickedUp ? (
                            "…"
                          ) : (
                            <>
                              <CheckCircle2 size={14} /> Picked Up
                            </>
                          )}
                        </button>
                      )}
                      <button
                        className="adc-status-btn btn-done"
                        onClick={markDelivered}
                        disabled={actionLoading.delivered}
                      >
                        {actionLoading.delivered ? (
                          "…"
                        ) : (
                          <>
                            <Zap size={14} /> Delivered
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-delivery-card">
                    <div className="no-delivery-icon">🛵</div>
                    <div className="no-delivery-h">No active delivery</div>
                    <div className="no-delivery-sub">
                      {isOnline
                        ? "Accept a pickup from the left panel to start earning."
                        : "Go online to start receiving deliveries."}
                    </div>
                  </div>
                )}

                {/* Recent earnings */}
                <div className="earnings-card">
                  <div className="earnings-header">
                    <div className="earnings-title">Recent Earnings</div>
                  </div>
                  {earnings.slice(0, 5).length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.2)",
                        fontWeight: 600,
                      }}
                    >
                      No completed deliveries yet.
                    </div>
                  ) : (
                    earnings.slice(0, 5).map((e) => (
                      <div key={e.id} className="earnings-row">
                        <div className="earnings-dot" />
                        <div className="earnings-label">{e.mealName}</div>
                        <div className="earnings-time">
                          {formatTime(e.completedAt)}
                        </div>
                        <div className="earnings-amount">
                          +₦{(e.riderEarnings || 0).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── DELIVERY HISTORY ── */}
            {earnings.length > 0 && (
              <div className="history-card">
                <div className="history-header">
                  <div className="history-title">Delivery History</div>
                  <span className="history-count">{earnings.length} total</span>
                </div>
                {earnings.slice(0, 10).map((e, i) => (
                  <div key={e.id} className="history-row">
                    <div className="history-num">{i + 1}</div>
                    <div>
                      <div className="history-meal">{e.mealName}</div>
                      <div className="history-meta">
                        {e.vendorName} · {formatTime(e.completedAt)}
                      </div>
                    </div>
                    <div className="history-earn">
                      +₦{(e.riderEarnings || 0).toLocaleString()}
                    </div>
                    <span className="history-badge">Delivered</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
