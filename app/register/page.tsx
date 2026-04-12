'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Utensils, Store, Bike, Zap, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RegistrationSystem } from '@/lib/RegistrationSystem';

// ── Shared ODG CSS tokens (keep in sync with landing page) ──────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --red:    #e60000;
    --dark:   #0f172a;
    --muted:  #64748b;
    --light:  #f8f9fa;
    --white:  #ffffff;
    --border: #eaeaea;
    --green:  #16a34a;
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--light);
    color: var(--dark);
    min-height: 100vh;
  }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

  .page {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* ── LEFT PANEL ── */
  .left-panel {
    background: var(--red);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 56px;
    position: relative;
    overflow: hidden;
  }
  .left-panel::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .left-logo {
    font-family: 'Syne', sans-serif;
    font-size: 32px; font-weight: 900;
    color: #fff; text-decoration: none;
    position: relative; z-index: 1;
    letter-spacing: -1px;
  }
  .left-logo span { opacity: 0.6; }
  .left-content { position: relative; z-index: 1; }
  .left-h1 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(38px, 4vw, 58px);
    font-weight: 900;
    color: #fff;
    line-height: 1.06;
    letter-spacing: -1.5px;
    margin-bottom: 20px;
  }
  .left-sub {
    color: rgba(255,255,255,0.75);
    font-size: 17px;
    line-height: 1.65;
    font-weight: 500;
    max-width: 380px;
  }
  .role-benefits {
    display: flex; flex-direction: column; gap: 16px;
    position: relative; z-index: 1;
  }
  .role-benefit {
    display: flex; align-items: center; gap: 14px;
  }
  .role-benefit-icon {
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.15);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .role-benefit-text { color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 600; }

  /* ── RIGHT PANEL ── */
  .right-panel {
    background: var(--white);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
  }
  .form-card {
    width: 100%;
    max-width: 460px;
    animation: fadeUp 0.4s ease;
  }
  .back-link {
    display: inline-flex; align-items: center; gap: 6px;
    color: var(--muted); font-size: 14px; font-weight: 600;
    text-decoration: none; margin-bottom: 32px;
    transition: color 0.2s;
    cursor: pointer; border: none; background: none; padding: 0;
  }
  .back-link:hover { color: var(--dark); }

  .form-title {
    font-family: 'Syne', sans-serif;
    font-size: 32px; font-weight: 900;
    color: var(--dark);
    margin-bottom: 6px; letter-spacing: -0.5px;
  }
  .form-sub {
    color: var(--muted); font-size: 15px;
    font-weight: 500; margin-bottom: 32px;
  }

  /* Role tabs */
  .role-tabs { display: flex; gap: 8px; margin-bottom: 28px; }
  .role-tab {
    flex: 1; padding: 12px 8px;
    border-radius: 12px; border: 1.5px solid var(--border);
    background: var(--light); cursor: pointer;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .role-tab:hover { border-color: rgba(230,0,0,0.3); }
  .role-tab.active {
    background: rgba(230,0,0,0.06);
    border-color: var(--red);
  }
  .role-tab-label {
    font-size: 13px; font-weight: 700;
    color: var(--muted);
  }
  .role-tab.active .role-tab-label { color: var(--red); }

  /* Inputs */
  .field { margin-bottom: 14px; }
  .field-label {
    display: block;
    font-size: 13px; font-weight: 700;
    color: var(--dark); margin-bottom: 6px;
    letter-spacing: 0.2px;
  }
  .input-wrap { position: relative; }
  .reg-input {
    width: 100%;
    background: var(--light);
    border: 1.5px solid transparent;
    outline: none;
    padding: 15px 18px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 500;
    color: var(--dark);
    transition: border-color 0.2s, background 0.2s;
  }
  .reg-input:focus  { background: #fff; border-color: var(--red); }
  .reg-input.error  { border-color: #dc2626; background: #fff5f5; }
  .reg-input.pr     { padding-right: 48px; }
  .eye-btn {
    position: absolute; right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--muted); padding: 2px;
  }
  .field-error {
    color: #dc2626; font-size: 12px;
    font-weight: 600; margin-top: 5px;
  }

  /* Password strength */
  .strength-bar { display: flex; gap: 4px; margin-top: 8px; }
  .strength-seg {
    height: 3px; flex: 1; border-radius: 2px;
    background: var(--border); transition: background 0.3s;
  }
  .strength-label { font-size: 11px; font-weight: 700; margin-top: 4px; }

  /* Submit */
  .btn-submit {
    width: 100%; padding: 16px;
    background: var(--red); color: #fff;
    border: none; border-radius: 50px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 800; font-size: 16px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 9px;
    transition: opacity 0.2s, transform 0.15s;
    margin-top: 20px;
  }
  .btn-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
  .btn-submit.shake { animation: shake 0.45s ease; }

  .spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }

  /* Divider */
  .divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
  .divider-line { flex: 1; height: 1px; background: var(--border); }
  .divider-text { font-size: 12px; font-weight: 700; color: var(--muted); }

  /* Google button */
  .btn-google {
    width: 100%; padding: 14px;
    background: #fff; color: var(--dark);
    border: 1.5px solid var(--border);
    border-radius: 50px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700; font-size: 15px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .btn-google:hover { border-color: #aaa; box-shadow: 0 4px 12px rgba(0,0,0,0.07); }

  /* Sign in link */
  .signin-link {
    text-align: center; margin-top: 20px;
    font-size: 14px; color: var(--muted); font-weight: 500;
  }
  .signin-link a { color: var(--red); font-weight: 700; text-decoration: none; }
  .signin-link a:hover { text-decoration: underline; }

  /* Success state */
  .success-state {
    text-align: center; padding: 20px 0;
    animation: fadeUp 0.4s ease;
  }
  .success-icon { color: var(--green); margin-bottom: 20px; }
  .success-h { font-family: 'Syne',sans-serif; font-size: 30px; font-weight: 900; margin-bottom: 8px; }
  .success-sub { color: var(--muted); font-size: 15px; font-weight: 500; }

  /* Error banner */
  .error-banner {
    background: #fff5f5; border: 1.5px solid #fca5a5;
    border-radius: 12px; padding: 12px 16px;
    color: #dc2626; font-size: 14px; font-weight: 600;
    margin-bottom: 16px; animation: fadeUp 0.2s ease;
  }

  /* Responsive */
  @media (max-width: 900px) {
    .page { grid-template-columns: 1fr; }
    .left-panel { display: none; }
    .right-panel { padding: 32px 24px; align-items: flex-start; }
    .form-card { max-width: 100%; }
  }
`;

// ── Password strength helper ─────────────────────────────────────────────────
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)             score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  return score; // 0-4
}

const strengthColors = ['#dc2626', '#f97316', '#eab308', '#16a34a'];
const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Strong'];

// ── Google SVG icon ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.3 3.1 29.4 1 24 1 14.8 1 7 6.7 3.7 14.6l7 5.4C12.5 13.5 17.8 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.9-2.2 5.3-4.7 6.9l7.3 5.7c4.3-3.9 6.7-9.7 6.7-16.6z"/>
      <path fill="#FBBC05" d="M10.7 28.6A14.9 14.9 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7-5.4A23.8 23.8 0 0 0 .5 24c0 3.8.9 7.4 2.4 10.6l7.8-6z"/>
      <path fill="#34A853" d="M24 47c5.4 0 10-1.8 13.3-4.8l-7.3-5.7c-1.8 1.2-4.1 1.9-6.8 1.9-6.2 0-11.4-4.1-13.3-9.7l-7.8 6C7 41.3 14.8 47 24 47z"/>
    </svg>
  );
}

// ── Registration Page ────────────────────────────────────────────────────────
const registrationSystem = new RegistrationSystem();

const ROLES = [
  { key: 'user',   label: 'Student', icon: <Utensils size={20} color="var(--red)" /> },
  { key: 'vendor', label: 'Vendor',  icon: <Store    size={20} color="var(--red)" /> },
  { key: 'rider',  label: 'Rider',   icon: <Bike     size={20} color="var(--red)" /> },
];

export default function RegisterPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [role,         setRole]         = useState(searchParams.get('role') || 'user');
  const [form,         setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw,       setShowPw]       = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [status,       setStatus]       = useState('idle'); // idle | loading | success
  const [error,        setError]        = useState('');
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [submitShake,  setSubmitShake]  = useState(false);

  const strength = getStrength(form.password);

  function validate() {
    const errs = {};
    if (!form.name.trim())              errs.name     = 'Name is required.';
    if (!form.email.includes('@'))      errs.email    = 'Enter a valid email.';
    if (form.password.length < 8)       errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) errs.confirm  = 'Passwords do not match.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setSubmitShake(true);
      setTimeout(() => setSubmitShake(false), 500);
      return;
    }
    setFieldErrors({});
    setStatus('loading');

    try {
      await registrationSystem.register({
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     role === 'rider' ? 'rider' : role, // extend schema later
      });

      setStatus('success');

      // Confetti 🎉
      const end = Date.now() + 2600;
      const fire = () => {
        confetti({ particleCount: 6, angle: 60,  spread: 52, origin: { x: 0 }, colors: ['#e60000','#fff','#ff6b35'] });
        confetti({ particleCount: 6, angle: 120, spread: 52, origin: { x: 1 }, colors: ['#e60000','#fff','#ff6b35'] });
        if (Date.now() < end) requestAnimationFrame(fire);
      };
      fire();

      const dest = searchParams.get('next') || (role === 'vendor' ? '/dashboard/vendor' : '/dashboard/user');
      setTimeout(() => router.push(dest), 2500);

    } catch (err) {
      setStatus('idle');
      // Friendly Firebase error messages
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setError('An account with this email already exists.');
      else if (code === 'auth/invalid-email')   setError('Please enter a valid email address.');
      else if (code === 'auth/weak-password')   setError('Choose a stronger password (min 8 characters).');
      else                                      setError(err?.message || 'Registration failed. Please try again.');
    }
  }

  async function handleGoogle() {
    setError('');
    setStatus('loading');
    try {
      const { AuthSystem } = await import('@/lib/RegistrationSystem');
      const authSys = new AuthSystem();
      const { role: resolvedRole } = await authSys.loginWithGoogle();
      setStatus('success');
      const dest = resolvedRole === 'vendor' ? '/dashboard/vendor' : '/dashboard/user';
      setTimeout(() => router.push(dest), 1000);
    } catch (err) {
      setStatus('idle');
      setError(err?.message || 'Google sign-in failed.');
    }
  }

  const namePlaceholder = role === 'vendor' ? 'Restaurant name' : role === 'rider' ? 'Full name' : 'Full name';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="page">

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <a href="/" className="left-logo">ODG<span>.</span></a>

          <div className="left-content">
            <h1 className="left-h1">Join the<br />campus<br />network.</h1>
            <p className="left-sub">
              Students, vendors, and riders powering the fastest food delivery on Nigerian campuses.
            </p>
          </div>

          <div className="role-benefits">
            {[
              { icon: <Utensils size={18} color="#fff" />, text: 'Students — hot meals in 15 minutes, hostel-precise.' },
              { icon: <Store    size={18} color="#fff" />, text: 'Vendors — live orders, analytics, zero commission setup.' },
              { icon: <Bike     size={18} color="#fff" />, text: 'Riders — flexible earnings, daily payouts.' },
            ].map((b, i) => (
              <div key={i} className="role-benefit">
                <div className="role-benefit-icon">{b.icon}</div>
                <span className="role-benefit-text">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="form-card">
            <button className="back-link" onClick={() => router.push('/')}>
              <ArrowLeft size={16} /> Back to home
            </button>

            {status === 'success' ? (
              <div className="success-state">
                <CheckCircle2 size={72} className="success-icon" />
                <h2 className="success-h">You're in!</h2>
                <p className="success-sub">Account created. Heading to your dashboard…</p>
              </div>
            ) : (
              <>
                <h1 className="form-title">Create account</h1>
                <p className="form-sub">Choose your role and fill in your details.</p>

                {/* Role selector */}
                <div className="role-tabs">
                  {ROLES.map(r => (
                    <button
                      key={r.key}
                      type="button"
                      className={`role-tab ${role === r.key ? 'active' : ''}`}
                      onClick={() => { setRole(r.key); setError(''); setFieldErrors({}); }}
                    >
                      {r.icon}
                      <span className="role-tab-label">{r.label}</span>
                    </button>
                  ))}
                </div>

                {/* Error banner */}
                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Name */}
                  <div className="field">
                    <label className="field-label">
                      {role === 'vendor' ? 'Restaurant name' : 'Full name'}
                    </label>
                    <input
                      type="text"
                      className={`reg-input${fieldErrors.name ? ' error' : ''}`}
                      placeholder={namePlaceholder}
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      autoComplete="name"
                    />
                    {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
                  </div>

                  {/* Email */}
                  <div className="field">
                    <label className="field-label">Email address</label>
                    <input
                      type="email"
                      className={`reg-input${fieldErrors.email ? ' error' : ''}`}
                      placeholder="you@university.edu"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      autoComplete="email"
                    />
                    {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
                  </div>

                  {/* Password */}
                  <div className="field">
                    <label className="field-label">Password</label>
                    <div className="input-wrap">
                      <input
                        type={showPw ? 'text' : 'password'}
                        className={`reg-input pr${fieldErrors.password ? ' error' : ''}`}
                        placeholder="Min 8 characters"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        autoComplete="new-password"
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)}>
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {form.password && (
                      <>
                        <div className="strength-bar">
                          {[0,1,2,3].map(i => (
                            <div
                              key={i}
                              className="strength-seg"
                              style={{ background: i < strength ? strengthColors[strength - 1] : undefined }}
                            />
                          ))}
                        </div>
                        <p className="strength-label" style={{ color: strength > 0 ? strengthColors[strength - 1] : 'var(--muted)' }}>
                          {strengthLabels[strength - 1] || 'Too weak'}
                        </p>
                      </>
                    )}
                    {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
                  </div>

                  {/* Confirm password */}
                  <div className="field">
                    <label className="field-label">Confirm password</label>
                    <div className="input-wrap">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        className={`reg-input pr${fieldErrors.confirm ? ' error' : ''}`}
                        placeholder="Repeat your password"
                        value={form.confirm}
                        onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                        autoComplete="new-password"
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowConfirm(v => !v)}>
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {fieldErrors.confirm && <p className="field-error">{fieldErrors.confirm}</p>}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className={`btn-submit${submitShake ? ' shake' : ''}`}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading'
                      ? <><div className="spinner" /> Creating account…</>
                      : <><Zap size={18} /> Sign up &amp; continue</>
                    }
                  </button>
                </form>

                <div className="divider">
                  <div className="divider-line" />
                  <span className="divider-text">OR</span>
                  <div className="divider-line" />
                </div>

                <button className="btn-google" onClick={handleGoogle} disabled={status === 'loading'}>
                  <GoogleIcon /> Continue with Google
                </button>

                <p className="signin-link">
                  Already have an account? <a href="/login">Sign in →</a>
                </p>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  );
}