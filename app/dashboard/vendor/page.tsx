"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Wallet,
  PackageCheck,
  ListOrdered,
  Clock,
  ArrowUpRight,
  LogOut,
  CheckCircle2,
  TrendingUp,
  Bell,
  Zap,
  Plus,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChefHat,
  Tag,
  Timer,
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
  serverTimestamp,
} from "firebase/firestore";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red:#e60000; --dark:#0f172a; --mid:#1e293b; --muted:#64748b;
    --border:#e8edf5; --surface:#f6f8fc; --white:#ffffff;
    --green:#05cd99; --amber:#f59e0b; --blue:#3b82f6;
  }
  body { font-family:'DM Sans',sans-serif; background:var(--surface); color:var(--dark); min-height:100vh; }
  .layout { display:flex; min-height:100vh; }
  .sidebar { width:260px; background:var(--dark); display:flex; flex-direction:column; position:sticky; top:0; height:100vh; flex-shrink:0; }
  .sidebar-logo { padding:28px 28px 24px; border-bottom:1px solid rgba(255,255,255,0.07); }
  .logo-text { font-family:'Syne',sans-serif; font-size:26px; font-weight:900; color:#fff; letter-spacing:-1px; }
  .logo-text span { color:var(--red); }
  .logo-sub { font-size:11px; font-weight:700; color:rgba(255,255,255,0.3); letter-spacing:2px; text-transform:uppercase; margin-top:2px; }
  .sidebar-nav { flex:1; padding:20px 16px; overflow-y:auto; }
  .nav-section-label { font-size:10px; font-weight:800; color:rgba(255,255,255,0.25); letter-spacing:2px; text-transform:uppercase; padding:0 12px; margin-bottom:8px; margin-top:20px; }
  .nav-item { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:12px; font-size:14px; font-weight:600; color:rgba(255,255,255,0.5); cursor:pointer; margin-bottom:2px; transition:all 0.18s; border:none; background:none; width:100%; text-align:left; }
  .nav-item:hover { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.85); }
  .nav-item.active { background:rgba(230,0,0,0.15); color:#fff; }
  .nav-item.active svg { color:var(--red); }
  .nav-dot { width:6px; height:6px; border-radius:50%; background:var(--red); margin-left:auto; animation:pulse-dot 2s infinite; }
  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .sidebar-profile { padding:16px; border-top:1px solid rgba(255,255,255,0.07); }
  .profile-pill { display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.05); border-radius:14px; padding:12px 14px; }
  .profile-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,var(--red),#ff6b35); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:14px; font-weight:900; color:#fff; flex-shrink:0; }
  .profile-name { font-size:13px; font-weight:700; color:#fff; }
  .profile-role { font-size:11px; font-weight:600; color:rgba(255,255,255,0.35); }
  .logout-btn { margin-left:auto; background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.3); padding:4px; transition:color 0.2s; }
  .logout-btn:hover { color:var(--red); }
  .main { flex:1; overflow-x:hidden; }
  .topbar { background:var(--white); border-bottom:1px solid var(--border); padding:0 36px; height:68px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
  .topbar-title { font-family:'Syne',sans-serif; font-size:20px; font-weight:900; letter-spacing:-0.3px; }
  .topbar-right { display:flex; align-items:center; gap:12px; }
  .topbar-badge { position:relative; background:var(--surface); border:none; cursor:pointer; width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:10px; color:var(--muted); }
  .badge-dot { position:absolute; top:8px; right:8px; width:8px; height:8px; border-radius:50%; background:var(--red); border:2px solid var(--white); }
  .status-pill { display:flex; align-items:center; gap:7px; background:rgba(5,205,153,0.08); border:1px solid rgba(5,205,153,0.2); border-radius:50px; padding:6px 14px; font-size:13px; font-weight:700; color:var(--green); }
  .status-dot { width:7px; height:7px; border-radius:50%; background:var(--green); animation:pulse-dot 2s infinite; }
  .page-content { padding:32px 36px; }
  .page-greeting { margin-bottom:28px; }
  .greeting-h { font-family:'Syne',sans-serif; font-size:28px; font-weight:900; letter-spacing:-0.5px; margin-bottom:4px; }
  .greeting-sub { color:var(--muted); font-size:15px; font-weight:500; }
  .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:28px; }
  .wallet-card { background:var(--dark); border-radius:22px; padding:28px; color:#fff; position:relative; overflow:hidden; }
  .wallet-card::before { content:''; position:absolute; top:-40px; right:-40px; width:180px; height:180px; border-radius:50%; background:radial-gradient(circle,rgba(230,0,0,0.25) 0%,transparent 70%); }
  .wallet-label { font-size:12px; font-weight:700; color:rgba(255,255,255,0.45); letter-spacing:1px; text-transform:uppercase; margin-bottom:10px; }
  .wallet-amount { font-family:'Syne',sans-serif; font-size:38px; font-weight:900; letter-spacing:-1px; margin-bottom:20px; }
  .wallet-btn { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.15); color:#fff; padding:9px 18px; border-radius:50px; font-size:13px; font-weight:700; cursor:pointer; transition:background 0.2s; }
  .wallet-btn:hover { background:rgba(255,255,255,0.2); }
  .stat-card { background:var(--white); border-radius:22px; padding:24px 26px; border:1px solid var(--border); display:flex; flex-direction:column; justify-content:space-between; }
  .stat-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .stat-icon { width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; }
  .stat-change { display:flex; align-items:center; gap:4px; font-size:12px; font-weight:700; color:var(--green); }
  .stat-value { font-family:'Syne',sans-serif; font-size:34px; font-weight:900; letter-spacing:-1px; }
  .stat-label { font-size:13px; font-weight:600; color:var(--muted); margin-top:4px; }
  /* TABS */
  .tabs { display:flex; gap:4px; background:var(--surface); border-radius:14px; padding:4px; margin-bottom:24px; width:fit-content; }
  .tab { padding:9px 20px; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; border:none; background:none; color:var(--muted); transition:all 0.2s; }
  .tab.active { background:var(--white); color:var(--dark); box-shadow:0 1px 4px rgba(0,0,0,0.08); }
  /* PIPELINE */
  .pipeline-card { background:var(--white); border-radius:22px; border:1px solid var(--border); overflow:hidden; }
  .pipeline-header { padding:22px 26px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
  .pipeline-title { font-family:'Syne',sans-serif; font-size:18px; font-weight:900; }
  .live-badge { display:flex; align-items:center; gap:6px; background:rgba(230,0,0,0.08); border-radius:50px; padding:5px 14px; font-size:12px; font-weight:800; color:var(--red); letter-spacing:1px; }
  .live-dot { width:6px; height:6px; border-radius:50%; background:var(--red); animation:pulse-dot 1.5s infinite; }
  .pipeline-empty { padding:60px 20px; text-align:center; color:var(--muted); }
  .empty-icon { width:64px; height:64px; background:var(--surface); border-radius:20px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
  .order-row { display:flex; align-items:center; gap:16px; padding:18px 26px; border-bottom:1px solid var(--border); transition:background 0.15s; animation:slideIn 0.25s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  .order-row:last-child { border-bottom:none; }
  .order-row:hover { background:var(--surface); }
  .order-avatar { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:20px; }
  .order-info { flex:1; min-width:0; }
  .order-meal { font-size:15px; font-weight:800; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .order-meta { font-size:12px; font-weight:600; color:var(--muted); }
  .status-badge { padding:5px 12px; border-radius:8px; font-size:11px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase; white-space:nowrap; }
  .status-pending  { background:rgba(245,158,11,0.1); color:var(--amber); }
  .status-accepted { background:rgba(59,130,246,0.1); color:var(--blue); }
  .status-out      { background:rgba(230,0,0,0.1); color:var(--red); }
  .action-btn { padding:9px 20px; border-radius:50px; font-size:13px; font-weight:800; cursor:pointer; border:none; transition:opacity 0.2s,transform 0.15s; white-space:nowrap; }
  .action-btn:hover { opacity:0.88; transform:translateY(-1px); }
  .action-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .btn-accept   { background:var(--red);   color:#fff; }
  .btn-dispatch { background:var(--dark);  color:#fff; }
  .btn-deliver  { background:var(--green); color:#fff; }
  /* MENU MANAGEMENT */
  .menu-header { padding:22px 26px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
  .add-meal-btn { display:flex; align-items:center; gap:8px; background:var(--red); color:#fff; border:none; padding:10px 20px; border-radius:50px; font-size:14px; font-weight:800; cursor:pointer; transition:opacity 0.2s; }
  .add-meal-btn:hover { opacity:0.88; }
  .meal-row { display:flex; align-items:center; gap:16px; padding:16px 26px; border-bottom:1px solid var(--border); transition:background 0.15s; }
  .meal-row:last-child { border-bottom:none; }
  .meal-row:hover { background:var(--surface); }
  .meal-emoji { width:44px; height:44px; border-radius:12px; background:var(--surface); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
  .meal-info { flex:1; }
  .meal-name-row { font-size:15px; font-weight:800; margin-bottom:3px; }
  .meal-meta-row { display:flex; gap:10px; font-size:12px; color:var(--muted); font-weight:600; }
  .meal-price-tag { font-family:'Syne',sans-serif; font-size:16px; font-weight:900; }
  .avail-toggle { display:flex; align-items:center; gap:8px; background:none; border:none; cursor:pointer; font-size:13px; font-weight:700; transition:color 0.2s; padding:8px 14px; border-radius:50px; }
  .avail-toggle.on  { color:var(--green); background:rgba(5,205,153,0.08); }
  .avail-toggle.off { color:var(--muted); background:var(--surface); }
  .delete-btn { width:36px; height:36px; border-radius:10px; background:none; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); transition:all 0.2s; }
  .delete-btn:hover { background:rgba(230,0,0,0.08); color:var(--red); }
  /* MODAL */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
  .modal { background:var(--white); border-radius:24px; padding:32px; width:100%; max-width:480px; animation:modalIn 0.22s ease; }
  @keyframes modalIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  .modal-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:900; margin-bottom:24px; display:flex; align-items:center; justify-content:space-between; }
  .modal-close { background:none; border:none; cursor:pointer; color:var(--muted); padding:4px; border-radius:8px; transition:color 0.2s; }
  .modal-close:hover { color:var(--dark); }
  .form-group { margin-bottom:18px; }
  .form-label { font-size:13px; font-weight:700; color:var(--muted); margin-bottom:8px; display:block; }
  .form-input { width:100%; padding:12px 16px; background:var(--surface); border:1.5px solid var(--border); border-radius:12px; font-family:'DM Sans',sans-serif; font-size:15px; color:var(--dark); outline:none; transition:border-color 0.2s; }
  .form-input:focus { border-color:rgba(230,0,0,0.4); }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .form-submit { width:100%; padding:14px; background:var(--red); color:#fff; border:none; border-radius:14px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:800; cursor:pointer; margin-top:8px; transition:opacity 0.2s; }
  .form-submit:hover { opacity:0.88; }
  .form-submit:disabled { opacity:0.55; cursor:not-allowed; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px; }
  .recent-card { background:var(--white); border-radius:22px; border:1px solid var(--border); overflow:hidden; }
  .recent-header { padding:20px 24px 16px; border-bottom:1px solid var(--border); }
  .recent-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:900; }
  .recent-item { display:flex; align-items:center; gap:14px; padding:14px 24px; border-bottom:1px solid var(--border); transition:background 0.15s; }
  .recent-item:last-child { border-bottom:none; }
  .recent-item:hover { background:var(--surface); }
  .recent-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .recent-label { flex:1; font-size:13px; font-weight:600; }
  .recent-price { font-size:14px; font-weight:800; }
  .recent-time { font-size:11px; color:var(--muted); font-weight:600; }
  @media (max-width:1100px) { .stats-row{grid-template-columns:1fr 1fr} .two-col{grid-template-columns:1fr} }
  @media (max-width:768px) { .sidebar{display:none} .page-content{padding:20px} .topbar{padding:0 20px} .stats-row{grid-template-columns:1fr} }
`;

const STATUS_META = {
  pending: { label: "Pending", class: "status-pending", emoji: "⏳" },
  accepted: { label: "Accepted", class: "status-accepted", emoji: "✅" },
  out_for_delivery: {
    label: "Out for Delivery",
    class: "status-out",
    emoji: "🛵",
  },
};

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

function formatTime(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const MEAL_CATEGORIES = [
  "Main",
  "Snack",
  "Drinks",
  "Dessert",
  "Protein",
  "Sides",
];

export default function VendorDashboard() {
  const router = useRouter();
  const [uid, setUid] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [meals, setMeals] = useState([]);
  const [activeTab, setActiveTab] = useState("orders"); // "orders" | "menu"
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [mealForm, setMealForm] = useState({
    name: "",
    price: "",
    category: "Main",
    estimatedTime: "15 mins",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "vendors", uid), (snap) => {
      if (snap.exists()) setVendor({ id: snap.id, ...snap.data() });
      else router.replace("/login");
    });
    return () => unsub();
  }, [uid, router]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "orders"), where("vendorId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(data);
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "meals"), where("vendorId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setMeals(data);
    });
    return () => unsub();
  }, [uid]);

  const updateStatus = useCallback(async (orderId, status) => {
    setActionLoading((p) => ({ ...p, [orderId]: true }));
    try {
      await runTransaction(db, async (t) => {
        t.update(doc(db, "orders", orderId), { status, updatedAt: Date.now() });
      });
    } catch (e) {
      console.error(e);
    }
    setActionLoading((p) => ({ ...p, [orderId]: false }));
  }, []);

  const markDelivered = useCallback(
    async (order) => {
      setActionLoading((p) => ({ ...p, [order.id]: true }));
      try {
        await runTransaction(db, async (t) => {
          const vSnap = await t.get(doc(db, "vendors", uid));
          if (!vSnap.exists()) throw new Error("Vendor not found");
          const {
            balance = 0,
            totalOrders = 0,
            totalRevenue = 0,
          } = vSnap.data();
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

  const toggleMealAvailability = useCallback(async (meal) => {
    try {
      await updateDoc(doc(db, "meals", meal.id), {
        available: !meal.available,
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const deleteMeal = useCallback(async (mealId) => {
    if (!confirm("Delete this meal from your menu?")) return;
    try {
      await deleteDoc(doc(db, "meals", mealId));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleLogout = async () => {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    router.push("/");
  };

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
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-text">
              ODG<span>.</span>
            </div>
            <div className="logo-sub">Business Portal</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section-label">Overview</div>
            <button
              className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <Store size={17} /> Dashboard
              {activeOrders.length > 0 && <span className="nav-dot" />}
            </button>
            <button
              className={`nav-item ${activeTab === "menu" ? "active" : ""}`}
              onClick={() => setActiveTab("menu")}
            >
              <ChefHat size={17} /> Menu Management
            </button>
            <button className="nav-item">
              <TrendingUp size={17} /> Analytics
            </button>
            <div className="nav-section-label">Account</div>
            <button className="nav-item">
              <Wallet size={17} /> Payouts
            </button>
            <button className="nav-item">
              <Bell size={17} /> Notifications
            </button>
          </nav>
          <div className="sidebar-profile">
            <div className="profile-pill">
              <div className="profile-avatar">{initials}</div>
              <div>
                <div className="profile-name">{vendor.storeName}</div>
                <div className="profile-role">Vendor</div>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

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
                <Bell size={18} />
                {activeOrders.length > 0 && <span className="badge-dot" />}
              </button>
            </div>
          </header>

          <div className="page-content">
            <div className="page-greeting">
              <h1 className="greeting-h">
                Welcome back, {vendor.ownerName || vendor.storeName} 👋
              </h1>
              <p className="greeting-sub">
                {activeOrders.length > 0
                  ? `You have ${activeOrders.length} order${activeOrders.length > 1 ? "s" : ""} requiring attention.`
                  : "Everything is caught up. All orders complete."}
              </p>
            </div>

            {/* STATS */}
            <div className="stats-row">
              <div className="wallet-card">
                <div className="wallet-label">Available Balance</div>
                <div className="wallet-amount">
                  ₦{(vendor.balance || 0).toLocaleString()}
                </div>
                <button className="wallet-btn">
                  <ArrowUpRight size={14} /> Withdraw Funds
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
                      <Zap size={12} /> Live
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
                    <TrendingUp size={12} /> ₦{todayRevenue.toLocaleString()}{" "}
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

            {/* ORDERS TAB */}
            {activeTab === "orders" && (
              <>
                <div className="pipeline-card">
                  <div className="pipeline-header">
                    <div className="pipeline-title">Active Pipeline</div>
                    <div className="live-badge">
                      <span className="live-dot" />
                      {activeOrders.length} LIVE
                    </div>
                  </div>
                  {activeOrders.length === 0 ? (
                    <div className="pipeline-empty">
                      <div className="empty-icon">
                        <CheckCircle2 size={28} color="var(--green)" />
                      </div>
                      <p style={{ fontWeight: 700, marginBottom: 6 }}>
                        All caught up!
                      </p>
                      <p style={{ fontSize: 14 }}>
                        New orders will appear here in real-time.
                      </p>
                    </div>
                  ) : (
                    activeOrders.map((order) => {
                      const meta =
                        STATUS_META[order.status] || STATUS_META.pending;
                      const loading = actionLoading[order.id];
                      return (
                        <div key={order.id} className="order-row">
                          <div
                            className="order-avatar"
                            style={{ background: "var(--surface)" }}
                          >
                            {meta.emoji}
                          </div>
                          <div className="order-info">
                            <div className="order-meal">{order.mealName}</div>
                            <div className="order-meta">
                              #{order.id.slice(-6).toUpperCase()} · ₦
                              {(order.price || 0).toLocaleString()} ·{" "}
                              {formatTime(order.createdAt)}
                            </div>
                          </div>
                          <span className={`status-badge ${meta.class}`}>
                            {meta.label}
                          </span>
                          <div style={{ display: "flex", gap: 8 }}>
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
                            {order.status === "out_for_delivery" && (
                              <button
                                className="action-btn btn-deliver"
                                onClick={() => markDelivered(order)}
                                disabled={loading}
                              >
                                {loading ? "…" : "Mark Delivered"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="two-col">
                  <div className="recent-card">
                    <div className="recent-header">
                      <div className="recent-title">Recent Deliveries</div>
                    </div>
                    {completedOrders.slice(0, 6).length === 0 ? (
                      <div
                        style={{
                          padding: "30px 24px",
                          color: "var(--muted)",
                          fontSize: 14,
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
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* MENU TAB */}
            {activeTab === "menu" && (
              <div className="pipeline-card">
                <div className="menu-header">
                  <div className="pipeline-title">
                    Your Menu ({meals.length} items)
                  </div>
                  <button
                    className="add-meal-btn"
                    onClick={() => setShowAddMeal(true)}
                  >
                    <Plus size={16} /> Add Meal
                  </button>
                </div>
                {meals.length === 0 ? (
                  <div className="pipeline-empty">
                    <div className="empty-icon">
                      <ChefHat size={28} color="var(--muted)" />
                    </div>
                    <p style={{ fontWeight: 700, marginBottom: 6 }}>
                      No meals yet
                    </p>
                    <p style={{ fontSize: 14 }}>
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
                          <span>
                            <Timer
                              size={11}
                              style={{
                                display: "inline",
                                verticalAlign: "middle",
                              }}
                            />{" "}
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
                                  maxWidth: 200,
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
                        onClick={() => toggleMealAvailability(meal)}
                      >
                        {meal.available ? (
                          <ToggleRight size={18} />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                        {meal.available ? "Available" : "Hidden"}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteMeal(meal.id)}
                        title="Delete meal"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD MEAL MODAL */}
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
                <X size={20} />
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
                <label className="form-label">Est. Delivery Time</label>
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
                placeholder="Short description of the meal…"
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
