"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "firebase/firestore";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red:#e60000; --dark:#0f172a; --mid:#1e293b; --muted:#64748b;
    --border:#eaedf5; --surface:#f6f8fc; --white:#ffffff;
    --green:#05cd99; --amber:#f59e0b; --blue:#3b82f6; --purple:#8b5cf6;
  }
  body { font-family:'DM Sans',sans-serif; background:var(--surface); color:var(--dark); min-height:100vh; }
  @keyframes spin       { to { transform:rotate(360deg); } }
  @keyframes fadeUp     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse-dot  { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes progressBar{ from{width:10%} }
  @keyframes shimmer    { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  .app { min-height:100vh; display:flex; flex-direction:column; }

  /* ── NAV ── */
  .topnav { background:var(--white); border-bottom:1px solid var(--border); padding:0 5%; height:66px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:200; }
  .nav-logo { font-family:'Syne',sans-serif; font-size:26px; font-weight:900; color:var(--dark); letter-spacing:-1px; }
  .nav-logo span { color:var(--red); }
  .nav-right { display:flex; align-items:center; gap:10px; }
  .nav-location { display:flex; align-items:center; gap:6px; background:var(--surface); border-radius:50px; padding:8px 14px; font-size:13px; font-weight:700; color:var(--dark); cursor:pointer; border:none; transition:background 0.2s; }
  .nav-location:hover { background:var(--border); }
  .nav-icon-btn { width:38px; height:38px; border-radius:10px; background:var(--surface); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); position:relative; transition:background 0.2s; }
  .nav-icon-btn:hover { background:var(--border); }
  .nav-badge-dot { position:absolute; top:6px; right:6px; width:8px; height:8px; border-radius:50%; background:var(--red); border:2px solid var(--white); }
  .logout-link { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:var(--muted); cursor:pointer; border:none; background:none; transition:color 0.2s; }
  .logout-link:hover { color:var(--red); }

  main { flex:1; max-width:1100px; margin:0 auto; width:100%; padding:32px 5% 80px; }

  /* ── GREETING ── */
  .greeting-block { margin-bottom:32px; }
  .greeting-h { font-family:'Syne',sans-serif; font-size:30px; font-weight:900; letter-spacing:-0.5px; margin-bottom:4px; }
  .greeting-sub { color:var(--muted); font-size:15px; font-weight:500; }

  /* ── TRACKER ── */
  .tracker-section { margin-bottom:36px; }
  .section-label { font-family:'Syne',sans-serif; font-size:18px; font-weight:900; margin-bottom:16px; }
  .tracker-card { border-radius:22px; padding:24px 28px; display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; animation:fadeUp 0.3s ease; position:relative; overflow:hidden; }
  .tracker-pending  { background:var(--dark);   color:#fff; }
  .tracker-accepted { background:var(--blue);   color:#fff; }
  .tracker-out      { background:var(--red);    color:#fff; }
  .tracker-picked   { background:var(--purple); color:#fff; }
  .tracker-card::before { content:''; position:absolute; top:-30px; right:-30px; width:140px; height:140px; border-radius:50%; background:rgba(255,255,255,0.05); }
  .tracker-left { display:flex; align-items:center; gap:18px; position:relative; z-index:1; }
  .tracker-icon { width:52px; height:52px; border-radius:16px; background:rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
  .tracker-status { font-size:11px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; opacity:0.65; margin-bottom:4px; }
  .tracker-meal { font-size:17px; font-weight:800; margin-bottom:2px; }
  .tracker-vendor { font-size:13px; opacity:0.7; font-weight:600; }
  .tracker-right { position:relative; z-index:1; text-align:right; }
  .tracker-price { font-family:'Syne',sans-serif; font-size:22px; font-weight:900; margin-bottom:4px; }
  .tracker-eta { font-size:12px; opacity:0.65; font-weight:600; }
  .progress-bar-wrap { margin-top:16px; height:4px; background:rgba(255,255,255,0.2); border-radius:4px; overflow:hidden; }
  .progress-bar-fill { height:100%; background:#fff; border-radius:4px; animation:progressBar 0.8s ease; }
  .progress-65 { width:65%; }
  .progress-85 { width:85%; }

  /* ── SEARCH ── */
  .search-wrap { position:relative; margin-bottom:28px; }
  .search-icon { position:absolute; left:18px; top:50%; transform:translateY(-50%); color:var(--muted); }
  .search-input { width:100%; padding:15px 18px 15px 50px; background:var(--white); border:1.5px solid var(--border); border-radius:16px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:500; color:var(--dark); outline:none; transition:border-color 0.2s; }
  .search-input:focus { border-color:rgba(230,0,0,0.3); }
  .search-input::placeholder { color:#b0b8c8; }

  /* ── CATEGORIES ── */
  .cats { display:flex; gap:8px; margin-bottom:24px; overflow-x:auto; padding-bottom:4px; }
  .cat-pill { padding:8px 16px; border-radius:50px; font-size:13px; font-weight:700; cursor:pointer; border:1.5px solid var(--border); background:var(--white); color:var(--muted); white-space:nowrap; transition:all 0.18s; }
  .cat-pill:hover { border-color:rgba(230,0,0,0.3); color:var(--dark); }
  .cat-pill.active { background:var(--dark); color:#fff; border-color:var(--dark); }

  /* ── MEAL GRID ── */
  .meals-section { margin-bottom:40px; }
  .meal-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:18px; }
  .meal-card { background:var(--white); border-radius:22px; border:1.5px solid var(--border); overflow:hidden; transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s; animation:fadeUp 0.3s ease; display:flex; flex-direction:column; }
  .meal-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.07); border-color:rgba(230,0,0,0.2); }
  .meal-thumb { height:110px; width:100%; display:flex; align-items:center; justify-content:center; font-size:52px; background:var(--surface); }
  .meal-body { padding:18px 20px 20px; flex:1; display:flex; flex-direction:column; }
  .meal-vendor { font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:var(--red); margin-bottom:6px; }
  .meal-name { font-family:'Syne',sans-serif; font-size:17px; font-weight:900; margin-bottom:6px; line-height:1.2; }
  .meal-meta { display:flex; align-items:center; gap:12px; font-size:12px; color:var(--muted); font-weight:600; margin-bottom:16px; flex-wrap:wrap; }
  .meal-meta-item { display:flex; align-items:center; gap:4px; }
  .meal-footer { display:flex; align-items:center; justify-content:space-between; margin-top:auto; gap:8px; }
  .meal-price { font-family:'Syne',sans-serif; font-size:20px; font-weight:900; }
  .add-btn { display:flex; align-items:center; gap:6px; background:var(--red); color:#fff; border:none; padding:10px 20px; border-radius:50px; font-size:13px; font-weight:800; cursor:pointer; transition:opacity 0.2s,transform 0.15s; white-space:nowrap; }
  .add-btn:hover { opacity:0.88; transform:scale(1.03); }
  .add-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .reorder-btn { display:flex; align-items:center; gap:5px; background:none; border:1.5px solid var(--border); color:var(--muted); padding:8px 14px; border-radius:50px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.18s; white-space:nowrap; }
  .reorder-btn:hover { border-color:var(--red); color:var(--red); }

  /* ── EMPTY STATE ── */
  .empty-state { text-align:center; padding:60px 20px; color:var(--muted); }
  .empty-icon { width:72px; height:72px; border-radius:22px; background:var(--surface); display:flex; align-items:center; justify-content:center; margin:0 auto 18px; font-size:32px; }
  .empty-h { font-family:'Syne',sans-serif; font-size:20px; font-weight:900; color:var(--dark); margin-bottom:8px; }
  .empty-sub { font-size:14px; font-weight:500; }

  /* ── HISTORY ── */
  .history-card { background:var(--white); border-radius:22px; border:1px solid var(--border); overflow:hidden; margin-top:20px; }
  .history-header { padding:18px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .history-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:900; }
  .history-row { display:flex; align-items:center; gap:14px; padding:14px 24px; border-bottom:1px solid var(--border); transition:background 0.15s; }
  .history-row:last-child { border-bottom:none; }
  .history-row:hover { background:var(--surface); }
  .history-emoji { font-size:22px; width:40px; text-align:center; flex-shrink:0; }
  .history-name { font-size:14px; font-weight:700; }
  .history-meta { font-size:12px; color:var(--muted); font-weight:600; }
  .history-price { font-size:14px; font-weight:800; margin-left:auto; }
  .history-badge { font-size:11px; font-weight:800; padding:3px 10px; border-radius:6px; white-space:nowrap; }
  .badge-delivered { background:rgba(5,205,153,0.1); color:var(--green); }

  /* ── SKELETON ── */
  .skeleton { background:linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:12px; }

  /* ── TOAST ── */
  .toast { position:fixed; bottom:32px; left:50%; transform:translateX(-50%); background:var(--dark); color:#fff; padding:14px 24px; border-radius:50px; font-size:14px; font-weight:700; display:flex; align-items:center; gap:10px; z-index:9999; animation:fadeUp 0.3s ease; white-space:nowrap; box-shadow:0 8px 32px rgba(0,0,0,0.2); }

  /* ── PROFILE MODAL ── */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
  .modal { background:var(--white); border-radius:28px; padding:36px; width:100%; max-width:500px; animation:fadeUp 0.22s ease; max-height:90vh; overflow-y:auto; }
  .modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; }
  .modal-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:900; }
  .modal-close { background:none; border:none; cursor:pointer; color:var(--muted); padding:6px; border-radius:8px; transition:color 0.2s; display:flex; align-items:center; }
  .modal-close:hover { color:var(--dark); }
  .modal-section-label { font-size:11px; font-weight:800; color:var(--muted); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:14px; margin-top:24px; }
  .modal-section-label:first-of-type { margin-top:0; }
  .form-group { margin-bottom:16px; }
  .form-label { font-size:13px; font-weight:700; color:var(--dark); margin-bottom:7px; display:block; }
  .form-input { width:100%; padding:13px 16px; background:var(--surface); border:1.5px solid var(--border); border-radius:12px; font-family:'DM Sans',sans-serif; font-size:15px; color:var(--dark); outline:none; transition:border-color 0.2s; }
  .form-input:focus { border-color:rgba(230,0,0,0.4); background:#fff; }
  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .form-save-btn { width:100%; padding:14px; background:var(--red); color:#fff; border:none; border-radius:14px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:800; cursor:pointer; margin-top:8px; transition:opacity 0.2s; }
  .form-save-btn:hover { opacity:0.88; }
  .form-save-btn:disabled { opacity:0.5; cursor:not-allowed; }

  /* Profile summary pill in nav */
  .profile-pill { display:flex; align-items:center; gap:8px; background:var(--surface); border-radius:50px; padding:6px 14px 6px 8px; cursor:pointer; border:none; transition:background 0.2s; }
  .profile-pill:hover { background:var(--border); }
  .profile-avatar { width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,var(--red),#ff6b35); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:11px; font-weight:900; color:#fff; flex-shrink:0; }
  .profile-name-sm { font-size:13px; font-weight:700; color:var(--dark); }

  @media (max-width:768px) {
    main { padding:24px 5% 60px; }
    .meal-grid { grid-template-columns:1fr; }
    .greeting-h { font-size:24px; }
    .cats { padding-bottom:8px; }
  }
`;

function getMealEmoji(name = "") {
  const n = name.toLowerCase();
  if (n.includes("burger")) return "🍔";
  if (n.includes("shawarma")) return "🌯";
  if (n.includes("jollof") || n.includes("rice")) return "🍚";
  if (n.includes("chicken")) return "🍗";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("suya")) return "🍢";
  if (n.includes("parfait") || n.includes("smoothie") || n.includes("acai"))
    return "🥤";
  if (n.includes("salad") || n.includes("bowl")) return "🥗";
  if (n.includes("sausage") || n.includes("roll")) return "🥐";
  if (n.includes("pasta") || n.includes("noodle")) return "🍝";
  return "🍽️";
}

function formatTime(ts: number | undefined) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_CONFIG = {
  pending: {
    label: "Order Received",
    emoji: "⏳",
    class: "tracker-pending",
    etaText: "Waiting for vendor to accept…",
    progress: null,
  },
  accepted: {
    label: "Being Prepared",
    emoji: "👨‍🍳",
    class: "tracker-accepted",
    etaText: "Your meal is being cooked…",
    progress: null,
  },
  out_for_delivery: {
    label: "On the Way!",
    emoji: "🛵",
    class: "tracker-out",
    etaText: "Rider is heading to you now",
    progress: "progress-65",
  },
  picked_up: {
    label: "Almost There!",
    emoji: "🏃",
    class: "tracker-picked",
    etaText: "Rider has picked up your order",
    progress: "progress-85",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status as StatusKey] || STATUS_CONFIG.pending;

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

interface UserProfile {
  id: string;
  fullName?: string;
  phone?: string;
  deliveryAddress?: {
    hostel?: string;
    room?: string;
    landmark?: string;
  };
  [key: string]: unknown;
}

type OrderStatus =
  | "pending"
  | "accepted"
  | "out_for_delivery"
  | "picked_up"
  | "delivered";

interface Order {
  id: string;
  userId: string;
  vendorId: string;
  vendorName: string;
  mealName: string;
  mealId: string;
  price: number;
  status: OrderStatus;
  deliveryAddress: Record<string, unknown>;
  createdAt: number;
  completedAt?: number;
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

interface ProfileForm {
  fullName?: string;
  phone?: string;
  hostel?: string;
  room?: string;
  landmark?: string;
}

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

  // ── Auth ───────────────────────────────────────────────────────────────
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

  // ── User profile (real-time) ───────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as UserProfile;
        setUserProfile(data);
        // Sync form whenever profile changes (but don't overwrite mid-edit)
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

  // ── Orders (real-time) ─────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "orders"), where("userId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(data);
    });
    return () => unsub();
  }, [uid]);

  // ── Meals (real-time) ──────────────────────────────────────────────────
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
      (err) => {
        console.error("Meals error:", err);
        setMealsLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // ── Place order ────────────────────────────────────────────────────────
  const placeOrder = useCallback(
    async (meal: { id: string; [key: string]: unknown }) => {
      if (!uid || !userProfile) return;

      // Warn if no address set
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
        console.error("Order failed:", err);
        showToast("Order failed. Please try again.");
      }
      setOrdering((p) => ({ ...p, [meal.id]: false }));
    },
    [uid, userProfile],
  );

  // ── Save profile ───────────────────────────────────────────────────────
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
      // Reset so it re-syncs from Firestore
      setProfileForm({});
      showToast("Profile updated ✓");
    } catch (err) {
      console.error("Profile save failed:", err);
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

  // ── Derived data ───────────────────────────────────────────────────────
  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  // Build unique category list from live meals
  const categories = [
    ALL_CATEGORY,
    ...Array.from(
      new Set(meals.map((m) => m.category).filter(Boolean) as string[]),
    ),
  ];

  const filteredMeals = meals.filter((m) => {
    const matchSearch =
      search.trim() === "" ||
      (typeof m.name === "string" &&
        m.name.toLowerCase().includes(search.toLowerCase())) ||
      (typeof m.vendorName === "string" &&
        m.vendorName.toLowerCase().includes(search.toLowerCase())) ||
      (typeof m.category === "string" &&
        m.category.toLowerCase().includes(search.toLowerCase()));
    const matchCat =
      activeCategory === ALL_CATEGORY || m.category === activeCategory;
    return matchSearch && matchCat;
  });

  const hostelLabel = userProfile?.deliveryAddress?.hostel
    ? `${userProfile.deliveryAddress.hostel}${userProfile.deliveryAddress.room ? `, Room ${userProfile.deliveryAddress.room}` : ""}`
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
            {/* Address pill */}
            <button className="nav-location" onClick={openProfile}>
              <MapPin size={14} color="var(--red)" />
              {hostelLabel}
            </button>
            {/* Notifications */}
            <button className="nav-icon-btn">
              <Bell size={18} />
              {activeOrders.length > 0 && <span className="nav-badge-dot" />}
            </button>
            {/* Profile */}
            <button className="profile-pill" onClick={openProfile}>
              <div className="profile-avatar">{initials}</div>
              <span className="profile-name-sm">{displayName}</span>
            </button>
            {/* Logout */}
            <button className="logout-link" onClick={handleLogout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </nav>

        <main>
          {/* ── GREETING ── */}
          <div className="greeting-block">
            <h1 className="greeting-h">Hey {displayName} 👋</h1>
            <p className="greeting-sub">
              {activeOrders.length > 0
                ? `You have ${activeOrders.length} active order${activeOrders.length > 1 ? "s" : ""}.`
                : "What are you eating today?"}
            </p>
          </div>

          {/* ── ACTIVE ORDER TRACKER ── */}
          {activeOrders.length > 0 && (
            <section className="tracker-section">
              <div className="section-label">Active Orders</div>
              {activeOrders.map((order) => {
                const cfg = getStatusConfig(order.status);
                return (
                  <div key={order.id} className={`tracker-card ${cfg.class}`}>
                    <div className="tracker-left">
                      <div className="tracker-icon">{cfg.emoji}</div>
                      <div>
                        <div className="tracker-status">{cfg.label}</div>
                        <div className="tracker-meal">{order.mealName}</div>
                        <div className="tracker-vendor">{order.vendorName}</div>
                        {cfg.progress && (
                          <div className="progress-bar-wrap">
                            <div
                              className={`progress-bar-fill ${cfg.progress}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="tracker-right">
                      <div className="tracker-price">
                        ₦{(order.price || 0).toLocaleString()}
                      </div>
                      <div className="tracker-eta">{cfg.etaText}</div>
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

          {/* ── CATEGORY FILTER ── */}
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
          <section className="meals-section">
            <div className="section-label">
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
                      background: "var(--white)",
                      borderRadius: 22,
                      overflow: "hidden",
                      border: "1.5px solid var(--border)",
                    }}
                  >
                    <div className="skeleton" style={{ height: 110 }} />
                    <div style={{ padding: "18px 20px" }}>
                      <div
                        className="skeleton"
                        style={{ height: 12, width: "40%", marginBottom: 12 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 18, marginBottom: 8 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 12, width: "60%", marginBottom: 20 }}
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
                          style={{ height: 24, width: 80 }}
                        />
                        <div
                          className="skeleton"
                          style={{ height: 38, width: 90, borderRadius: 50 }}
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
                  {search ? "No results found" : "No meals available right now"}
                </div>
                <div className="empty-sub">
                  {search
                    ? "Try a different search term"
                    : "Vendors haven't added any meals yet. Check back soon!"}
                </div>
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
                        <span className="meal-meta-item">
                          <Clock size={12} />
                          {meal.estimatedTime || "15 mins"}
                        </span>
                        {typeof meal.rating === "number" && (
                          <span className="meal-meta-item">
                            <Star
                              size={12}
                              color="var(--amber)"
                              fill="var(--amber)"
                            />
                            {meal.rating}
                          </span>
                        )}
                        {meal.category && (
                          <span
                            style={{
                              background: "var(--surface)",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {meal.category}
                          </span>
                        )}
                        {meal.description && (
                          <span
                            style={{
                              color: "var(--muted)",
                              fontSize: 11,
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 160,
                            }}
                          >
                            {meal.description}
                          </span>
                        )}
                      </div>
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
                                  width: 14,
                                  height: 14,
                                  border: "2px solid rgba(255,255,255,0.4)",
                                  borderTopColor: "#fff",
                                  borderRadius: "50%",
                                  animation: "spin 0.7s linear infinite",
                                }}
                              />
                              Ordering…
                            </>
                          ) : (
                            <>
                              <Plus size={16} /> Order
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

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
                  <div key={o.id} className="history-row">
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
                    {/* Reorder button — only if meal still exists and is available */}
                    {meal && (
                      <button
                        className="reorder-btn"
                        onClick={() => placeOrder(meal)}
                        disabled={ordering[meal.id]}
                      >
                        <RotateCcw size={13} /> Reorder
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
            <CheckCircle2 size={16} color="var(--green)" /> {toast}
          </div>
        )}
      </div>

      {/* ── PROFILE / ADDRESS MODAL ── */}
      {showProfile && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowProfile(false)}
        >
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit Profile</div>
              <button
                className="modal-close"
                onClick={() => setShowProfile(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-section-label">Personal Info</div>
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

            <div className="modal-section-label">Delivery Address</div>
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
                <label className="form-label">Landmark (optional)</label>
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

            {/* Preview */}
            {profileForm.hostel && (
              <div
                style={{
                  background: "rgba(5,205,153,0.06)",
                  border: "1px solid rgba(5,205,153,0.2)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  marginBottom: 16,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--dark)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MapPin size={14} color="var(--green)" />
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
