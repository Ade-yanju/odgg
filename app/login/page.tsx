"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red: #e60000; --dark: #0f172a; --muted: #64748b;
    --light: #f8f9fa; --white: #ffffff; --border: #eaeaea;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--light); color: var(--dark); min-height: 100vh; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform:rotate(360deg); } }
  @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

  .page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }

  .left-panel {
    background: var(--dark); display: flex; flex-direction: column;
    justify-content: space-between; padding: 48px 56px;
    position: relative; overflow: hidden;
  }
  .left-panel::before {
    content: ''; position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .left-logo { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 900; color: #fff; text-decoration: none; position: relative; z-index: 1; letter-spacing: -1px; }
  .left-logo span { color: var(--red); }
  .left-content { position: relative; z-index: 1; }
  .left-h1 { font-family: 'Syne', sans-serif; font-size: clamp(36px, 4vw, 56px); font-weight: 900; color: #fff; line-height: 1.06; letter-spacing: -1.5px; margin-bottom: 20px; }
  .left-h1 .accent { color: var(--red); }
  .left-sub { color: rgba(255,255,255,0.55); font-size: 16px; line-height: 1.65; font-weight: 500; max-width: 360px; }

  .testimonial { position: relative; z-index: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px 28px; }
  .testimonial-text { color: rgba(255,255,255,0.82); font-size: 15px; line-height: 1.65; font-weight: 500; margin-bottom: 16px; }
  .testimonial-author { display: flex; align-items: center; gap: 12px; }
  .testimonial-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--red); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; color: #fff; flex-shrink: 0; }
  .testimonial-name { color: #fff; font-size: 14px; font-weight: 700; }
  .testimonial-role { color: rgba(255,255,255,0.45); font-size: 12px; font-weight: 500; }

  .right-panel { background: var(--white); display: flex; align-items: center; justify-content: center; padding: 48px 40px; }
  .form-card { width: 100%; max-width: 440px; animation: fadeUp 0.4s ease; }

  .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 14px; font-weight: 600; text-decoration: none; margin-bottom: 32px; transition: color 0.2s; cursor: pointer; border: none; background: none; padding: 0; }
  .back-link:hover { color: var(--dark); }
  .form-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 900; color: var(--dark); margin-bottom: 6px; letter-spacing: -0.5px; }
  .form-sub { color: var(--muted); font-size: 15px; font-weight: 500; margin-bottom: 32px; }

  .field { margin-bottom: 16px; }
  .field-label { display: block; font-size: 13px; font-weight: 700; color: var(--dark); margin-bottom: 6px; letter-spacing: 0.2px; }
  .input-wrap { position: relative; }
  .reg-input { width: 100%; background: var(--light); border: 1.5px solid transparent; outline: none; padding: 15px 18px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; color: var(--dark); transition: border-color 0.2s, background 0.2s; }
  .reg-input:focus { background: #fff; border-color: var(--red); }
  .reg-input.error { border-color: #dc2626; background: #fff5f5; }
  .reg-input.pr { padding-right: 48px; }
  .eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--muted); padding: 2px; }
  .field-error { color: #dc2626; font-size: 12px; font-weight: 600; margin-top: 5px; }

  .forgot-row { display: flex; justify-content: flex-end; margin-top: -8px; margin-bottom: 4px; }
  .forgot-link { font-size: 13px; font-weight: 700; color: var(--red); text-decoration: none; cursor: pointer; border: none; background: none; padding: 0; }
  .forgot-link:hover { text-decoration: underline; }

  .btn-submit { width: 100%; padding: 16px; background: var(--red); color: #fff; border: none; border-radius: 50px; font-family: 'DM Sans', sans-serif; font-weight: 800; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px; transition: opacity 0.2s, transform 0.15s; margin-top: 24px; }
  .btn-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
  .btn-submit.shake { animation: shake 0.45s ease; }
  .spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }

  .divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
  .divider-line { flex: 1; height: 1px; background: var(--border); }
  .divider-text { font-size: 12px; font-weight: 700; color: var(--muted); }

  .btn-google { width: 100%; padding: 14px; background: #fff; color: var(--dark); border: 1.5px solid var(--border); border-radius: 50px; font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: border-color 0.2s, box-shadow 0.2s; }
  .btn-google:hover { border-color: #aaa; box-shadow: 0 4px 12px rgba(0,0,0,0.07); }
  .btn-google:disabled { opacity: 0.55; cursor: not-allowed; }

  .signup-link { text-align: center; margin-top: 20px; font-size: 14px; color: var(--muted); font-weight: 500; }
  .signup-link a { color: var(--red); font-weight: 700; text-decoration: none; }
  .signup-link a:hover { text-decoration: underline; }

  .error-banner { background: #fff5f5; border: 1.5px solid #fca5a5; border-radius: 12px; padding: 12px 16px; color: #dc2626; font-size: 14px; font-weight: 600; margin-bottom: 16px; animation: fadeUp 0.2s ease; }

  /* Role selector for Google sign-in new users */
  .role-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .role-modal { background: #fff; border-radius: 24px; padding: 36px; width: 100%; max-width: 420px; animation: fadeUp 0.25s ease; }
  .role-modal-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 900; margin-bottom: 8px; }
  .role-modal-sub { color: var(--muted); font-size: 14px; font-weight: 500; margin-bottom: 28px; }
  .role-options { display: flex; flex-direction: column; gap: 12px; }
  .role-option { display: flex; align-items: center; gap: 16px; padding: 18px 20px; border: 2px solid var(--border); border-radius: 16px; cursor: pointer; transition: all 0.18s; background: none; width: 100%; text-align: left; }
  .role-option:hover { border-color: var(--red); background: #fff5f5; }
  .role-option.selected { border-color: var(--red); background: #fff5f5; }
  .role-emoji { font-size: 28px; width: 44px; text-align: center; }
  .role-name { font-size: 16px; font-weight: 800; color: var(--dark); }
  .role-desc { font-size: 12px; color: var(--muted); font-weight: 500; margin-top: 2px; }
  .role-confirm-btn { width: 100%; margin-top: 20px; padding: 14px; background: var(--red); color: #fff; border: none; border-radius: 50px; font-family: 'DM Sans', sans-serif; font-weight: 800; font-size: 15px; cursor: pointer; transition: opacity 0.2s; }
  .role-confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 900px) {
    .page { grid-template-columns: 1fr; }
    .left-panel { display: none; }
    .right-panel { padding: 32px 24px; align-items: flex-start; }
    .form-card { max-width: 100%; }
  }
`;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.3 3.1 29.4 1 24 1 14.8 1 7 6.7 3.7 14.6l7 5.4C12.5 13.5 17.8 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.9-2.2 5.3-4.7 6.9l7.3 5.7c4.3-3.9 6.7-9.7 6.7-16.6z"
      />
      <path
        fill="#FBBC05"
        d="M10.7 28.6A14.9 14.9 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7-5.4A23.8 23.8 0 0 0 .5 24c0 3.8.9 7.4 2.4 10.6l7.8-6z"
      />
      <path
        fill="#34A853"
        d="M24 47c5.4 0 10-1.8 13.3-4.8l-7.3-5.7c-1.8 1.2-4.1 1.9-6.8 1.9-6.2 0-11.4-4.1-13.3-9.7l-7.8 6C7 41.3 14.8 47 24 47z"
      />
    </svg>
  );
}

const ROLE_OPTIONS = [
  {
    value: "student",
    emoji: "🎓",
    name: "Student",
    desc: "Order meals and track deliveries",
  },
  {
    value: "vendor",
    emoji: "🍽️",
    name: "Vendor",
    desc: "Manage your food stall and menu",
  },
  {
    value: "rider",
    emoji: "🛵",
    name: "Rider",
    desc: "Pick up and deliver orders",
  },
];

// ── Core: read role from whichever collection the user belongs to ────────────
async function getRoleFromFirestore(uid) {
  // Check all three collections in parallel
  const [userSnap, vendorSnap, riderSnap] = await Promise.all([
    getDoc(doc(db, "users", uid)),
    getDoc(doc(db, "vendors", uid)),
    getDoc(doc(db, "riders", uid)),
  ]);
  if (vendorSnap.exists()) return "vendor";
  if (riderSnap.exists()) return "rider";
  if (userSnap.exists()) return userSnap.data().role || "student";
  return null; // new user — needs onboarding
}

function getDashboardPath(role) {
  if (role === "vendor") return "/dashboard/vendor";
  if (role === "rider") return "/dashboard/rider";
  return "/dashboard/user"; // student / fallback
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  // Google new-user role picker
  const [pendingUser, setPendingUser] = useState(null); // firebase User object
  const [selectedRole, setSelectedRole] = useState("student");
  const [savingRole, setSavingRole] = useState(false);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function getRedirect(role) {
    const next = searchParams.get("next");
    if (next) return next;
    return getDashboardPath(role);
  }

  // ── Email / password login ─────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      triggerShake();
      return;
    }
    setStatus("loading");
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );
      const role = await getRoleFromFirestore(cred.user.uid);
      if (!role) {
        setError("Account found but no profile exists. Please register.");
        setStatus("idle");
        return;
      }
      router.push(getRedirect(role));
    } catch (err) {
      setStatus("idle");
      const code = err?.code || "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("Incorrect email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else if (code === "auth/user-disabled") {
        setError("This account has been disabled. Contact support.");
      } else {
        setError(err?.message || "Sign in failed. Please try again.");
      }
      triggerShake();
    }
  }

  // ── Google login ───────────────────────────────────────────────────────
  async function handleGoogle() {
    setError("");
    setStatus("loading");
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const role = await getRoleFromFirestore(cred.user.uid);

      if (role) {
        // Existing user — go straight to dashboard
        router.push(getRedirect(role));
      } else {
        // New Google user — ask them to pick a role
        setStatus("idle");
        setPendingUser(cred.user);
      }
    } catch (err) {
      setStatus("idle");
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err?.message || "Google sign-in failed.");
      }
    }
  }

  // ── Save role for new Google user ──────────────────────────────────────
  async function handleRoleConfirm() {
    if (!pendingUser) return;
    setSavingRole(true);
    try {
      const uid = pendingUser.uid;
      const displayName = pendingUser.displayName || "";
      const email = pendingUser.email || "";

      if (selectedRole === "vendor") {
        await setDoc(doc(db, "vendors", uid), {
          role: "vendor",
          ownerName: displayName,
          storeName: `${displayName}'s Store`,
          email,
          status: "open",
          balance: 0,
          totalOrders: 0,
          totalRevenue: 0,
          createdAt: Date.now(),
        });
      } else if (selectedRole === "rider") {
        await setDoc(doc(db, "riders", uid), {
          role: "rider",
          fullName: displayName,
          email,
          isOnline: false,
          balance: 0,
          totalDeliveries: 0,
          totalEarnings: 0,
          createdAt: Date.now(),
        });
      } else {
        await setDoc(doc(db, "users", uid), {
          role: "student",
          fullName: displayName,
          email,
          deliveryAddress: {},
          createdAt: Date.now(),
        });
      }
      router.push(getDashboardPath(selectedRole));
    } catch (err) {
      console.error(err);
      setError("Failed to save your profile. Please try again.");
      setSavingRole(false);
      setPendingUser(null);
    }
  }

  // ── Forgot password ────────────────────────────────────────────────────
  async function handleForgotPassword() {
    if (!form.email) {
      setError("Enter your email address first, then click Forgot password.");
      return;
    }
    try {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      await sendPasswordResetEmail(auth, form.email);
      setError("");
      alert(`Password reset email sent to ${form.email}. Check your inbox.`);
    } catch (err) {
      setError(err?.message || "Failed to send reset email.");
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="page">
        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <a href="/" className="left-logo">
            ODG<span>.</span>
          </a>
          <div className="left-content">
            <h1 className="left-h1">
              Welcome
              <br />
              back to
              <br />
              <span className="accent">ODG.</span>
            </h1>
            <p className="left-sub">
              Your meals, your dashboard, your campus network — all in one
              place.
            </p>
          </div>
          <div className="testimonial">
            <p className="testimonial-text">
              "I ordered from my hostel, and it arrived before I even locked my
              door. ODG is the real deal on this campus."
            </p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">A</div>
              <div>
                <div className="testimonial-name">Adaeze O.</div>
                <div className="testimonial-role">
                  200L, Lead City University
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="form-card">
            <button className="back-link" onClick={() => router.push("/")}>
              <ArrowLeft size={16} /> Back to home
            </button>
            <h1 className="form-title">Sign in</h1>
            <p className="form-sub">
              Enter your credentials to access your account.
            </p>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label className="field-label">Email address</label>
                <input
                  type="email"
                  className={`reg-input${error && !form.email ? " error" : ""}`}
                  placeholder="you@university.edu"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div className="field">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <input
                    type={showPw ? "text" : "password"}
                    className={`reg-input pr${error && !form.password ? " error" : ""}`}
                    placeholder="Your password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPw((v) => !v)}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="forgot-row">
                <button
                  type="button"
                  className="forgot-link"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                className={`btn-submit${shake ? " shake" : ""}`}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <div className="spinner" /> Signing in…
                  </>
                ) : (
                  <>
                    <Zap size={18} /> Sign in
                  </>
                )}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">OR</span>
              <div className="divider-line" />
            </div>

            <button
              className="btn-google"
              onClick={handleGoogle}
              disabled={status === "loading"}
            >
              <GoogleIcon /> Continue with Google
            </button>

            <p className="signup-link">
              Don't have an account? <a href="/register">Create one →</a>
            </p>
          </div>
        </div>
      </div>

      {/* ── ROLE PICKER MODAL (new Google users only) ── */}
      {pendingUser && (
        <div className="role-modal-overlay">
          <div className="role-modal">
            <div className="role-modal-title">One last step 👋</div>
            <p className="role-modal-sub">
              Welcome, {pendingUser.displayName?.split(" ")[0] || "there"}! What
              best describes you?
            </p>
            <div className="role-options">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`role-option${selectedRole === opt.value ? " selected" : ""}`}
                  onClick={() => setSelectedRole(opt.value)}
                >
                  <span className="role-emoji">{opt.emoji}</span>
                  <div>
                    <div className="role-name">{opt.name}</div>
                    <div className="role-desc">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              className="role-confirm-btn"
              onClick={handleRoleConfirm}
              disabled={savingRole}
            >
              {savingRole
                ? "Setting up…"
                : `Continue as ${ROLE_OPTIONS.find((o) => o.value === selectedRole)?.name}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
