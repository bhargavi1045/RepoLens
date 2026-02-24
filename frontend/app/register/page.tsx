'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Github, Mail, Lock, User, ArrowRight, Loader2, Check } from 'lucide-react';
import { register } from '@/lib/api';

const AMETHYST_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .ah-body { min-height:100vh; background:#0d0a14; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; padding:2rem 1rem; }
  .ah-orb { position:fixed; border-radius:50%; pointer-events:none; filter:blur(100px); z-index:0; }
  .ah-orb-1 { width:700px; height:700px; top:-18%; left:-10%; background:radial-gradient(ellipse,rgba(100,70,160,0.26) 0%,transparent 70%); }
  .ah-orb-2 { width:480px; height:480px; top:5%; right:-8%; background:radial-gradient(ellipse,rgba(155,115,205,0.15) 0%,transparent 70%); }
  .ah-orb-3 { width:360px; height:360px; bottom:-5%; left:38%; background:radial-gradient(ellipse,rgba(80,55,130,0.13) 0%,transparent 70%); }
  .ah-grain { position:fixed; inset:0; z-index:1; pointer-events:none; opacity:0.03; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size:180px 180px; }
  .ah-grid { position:fixed; inset:0; z-index:1; pointer-events:none; background-image:linear-gradient(rgba(160,130,210,0.038) 1px,transparent 1px),linear-gradient(90deg,rgba(160,130,210,0.038) 1px,transparent 1px); background-size:48px 48px; -webkit-mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,black 10%,transparent 80%); mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,black 10%,transparent 80%); }
  .ah-card { position:relative; z-index:2; width:100%; max-width:440px; background:rgba(16,12,26,0.72); border:1px solid rgba(180,150,230,0.1); border-radius:22px; padding:2.4rem 2.25rem 2rem; backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px); box-shadow:0 0 0 1px rgba(255,255,255,0.03),0 40px 80px rgba(0,0,0,0.55),0 0 100px rgba(100,70,160,0.09); animation:cardIn 0.65s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes cardIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  .ah-card::before { content:''; position:absolute; top:0; left:15%; right:15%; height:1px; background:linear-gradient(90deg,transparent,rgba(180,150,230,0.32),transparent); border-radius:0 0 4px 4px; }
  .ah-corner { position:absolute; width:5px; height:5px; border-radius:50%; background:rgba(180,150,230,0.22); }
  .ah-corner-tl{top:12px;left:12px} .ah-corner-tr{top:12px;right:12px} .ah-corner-bl{bottom:12px;left:12px} .ah-corner-br{bottom:12px;right:12px}
  .ah-logo { display:flex; align-items:center; gap:0.6rem; margin-bottom:1.75rem; }
  .ah-logo-icon { width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,#4e2e7e,#8056b8); display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 3px 14px rgba(110,80,180,0.4); }
  .ah-logo-name { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:500; color:#ede8f5; letter-spacing:0.02em; }
  .ah-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:400; line-height:1.15; color:#ede8f5; margin-bottom:0.35rem; letter-spacing:-0.01em; }
  .ah-title em { font-style:italic; color:#c4aaee; }
  .ah-sub { font-size:0.8rem; color:#6e6282; margin-bottom:1.75rem; line-height:1.5; }
  .ah-oauth { width:100%; display:flex; align-items:center; justify-content:center; gap:0.55rem; padding:0.62rem 1rem; border-radius:11px; border:1px solid rgba(180,150,230,0.11); background:rgba(255,255,255,0.025); color:#ccc4d8; font-family:'DM Sans',sans-serif; font-size:0.82rem; font-weight:400; cursor:pointer; transition:all 0.18s ease; margin-bottom:0.45rem; outline:none; }
  .ah-oauth:hover { border-color:rgba(180,150,230,0.28); background:rgba(124,106,158,0.08); box-shadow:0 0 18px rgba(124,106,158,0.1); color:#ede8f5; }
  .ah-divider { display:flex; align-items:center; gap:0.75rem; margin:1.35rem 0; }
  .ah-divider-line { flex:1; height:1px; background:rgba(180,150,230,0.1); }
  .ah-divider-text { font-size:0.68rem; color:#3d3452; letter-spacing:0.08em; text-transform:uppercase; }
  .ah-field { margin-bottom:0.85rem; }
  .ah-row { display:flex; gap:0.7rem; }
  .ah-row .ah-field { flex:1; }
  .ah-label { display:block; font-size:0.7rem; color:#7a6d8e; margin-bottom:0.3rem; letter-spacing:0.05em; text-transform:uppercase; }
  .ah-field-wrap { position:relative; }
  .ah-field-icon { position:absolute; left:0.85rem; top:50%; transform:translateY(-50%); color:#3d3452; pointer-events:none; width:14px; height:14px; }
  .ah-field-btn { position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#3d3452; padding:0; display:flex; align-items:center; transition:color 0.15s; }
  .ah-field-btn:hover { color:#9080b0; }
  .ah-input { width:100%; padding:0.63rem 0.85rem 0.63rem 2.2rem; background:rgba(255,255,255,0.025); border:1px solid rgba(180,150,230,0.1); border-radius:11px; color:#ede8f5; font-family:'DM Sans',sans-serif; font-size:0.84rem; outline:none; transition:all 0.18s ease; }
  .ah-input::placeholder { color:#3d3452; }
  .ah-input:focus { border-color:rgba(124,106,158,0.45); background:rgba(124,106,158,0.06); box-shadow:0 0 0 3px rgba(124,106,158,0.1),0 0 22px rgba(124,106,158,0.07); }
  .ah-strength { margin-top:0.45rem; }
  .ah-strength-bars { display:flex; gap:4px; margin-bottom:0.25rem; }
  .ah-strength-bar { flex:1; height:3px; border-radius:2px; background:rgba(255,255,255,0.08); transition:background 0.3s; }
  .ah-strength-bar.s1{background:#c05858} .ah-strength-bar.s2{background:#c09050} .ah-strength-bar.s3{background:#7a9a60} .ah-strength-bar.s4{background:#6080c8}
  .ah-strength-label { font-size:0.68rem; color:#6e6282; }
  .ah-terms { display:flex; align-items:flex-start; gap:0.6rem; margin-bottom:1rem; cursor:pointer; }
  .ah-checkbox { width:16px; height:16px; border-radius:5px; flex-shrink:0; margin-top:1px; border:1px solid rgba(180,150,230,0.2); background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; transition:all 0.18s ease; cursor:pointer; }
  .ah-checkbox.checked { background:linear-gradient(135deg,#4e2e7e,#7450b0); border-color:rgba(180,150,230,0.4); }
  .ah-terms-text { font-size:0.76rem; color:#6e6282; line-height:1.5; }
  .ah-terms-text a { color:#c4aaee; text-decoration:none; }
  .ah-terms-text a:hover { color:#ddd0f8; }
  .ah-btn { width:100%; padding:0.75rem; background:linear-gradient(135deg,#4e2e7e 0%,#7450b0 100%); border:1px solid rgba(180,150,230,0.2); border-radius:11px; color:#fff; font-family:'DM Sans',sans-serif; font-size:0.88rem; font-weight:500; cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center; gap:0.5rem; box-shadow:0 4px 28px rgba(90,50,160,0.35); outline:none; letter-spacing:0.01em; }
  .ah-btn:hover:not(:disabled) { background:linear-gradient(135deg,#5d3894 0%,#8460c4 100%); box-shadow:0 6px 36px rgba(90,50,160,0.5); transform:translateY(-1px); }
  .ah-btn:active:not(:disabled) { transform:translateY(0); }
  .ah-btn:disabled { opacity:0.55; cursor:not-allowed; }
  .ah-error { background:rgba(200,60,60,0.08); border:1px solid rgba(200,80,80,0.2); border-radius:9px; padding:0.6rem 0.85rem; font-size:0.78rem; color:#e08080; margin-bottom:0.9rem; }
  .ah-footer { text-align:center; margin-top:1.4rem; font-size:0.78rem; color:#6e6282; }
  .ah-footer a { color:#c4aaee; text-decoration:none; transition:color 0.15s; }
  .ah-footer a:hover { color:#ddd0f8; }
`;

function getStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [agreed,    setAgreed]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) { setError('First name is required.'); return; }
    if (!email.trim())      { setError('Email is required.'); return; }
    if (!password)          { setError('Password is required.'); return; }
    if (strength < 2)       { setError('Please choose a stronger password.'); return; }
    if (!agreed)            { setError('You must agree to the terms to continue.'); return; }

    setLoading(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

      const data = await register(fullName, email.trim(), password);

      const cookieRes = await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token }),
      });

      if (!cookieRes.ok) throw new Error('Failed to persist session.');

      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{AMETHYST_STYLES}</style>

      <div className="ah-body">
        <div className="ah-orb ah-orb-1" />
        <div className="ah-orb ah-orb-2" />
        <div className="ah-orb ah-orb-3" />
        <div className="ah-grain" />
        <div className="ah-grid" />

        <div className="ah-card">
          <div className="ah-corner ah-corner-tl" />
          <div className="ah-corner ah-corner-tr" />
          <div className="ah-corner ah-corner-bl" />
          <div className="ah-corner ah-corner-br" />

          <div className="ah-logo">
            <div className="ah-logo-icon">🔍</div>
            <span className="ah-logo-name">RepoLens</span>
          </div>

          <h1 className="ah-title">Create an <em>account.</em></h1>
          <p className="ah-sub">Start exploring any GitHub repository in seconds.</p>

          <div className="ah-divider">
            <div className="ah-divider-line" />
            <div className="ah-divider-line" />
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="ah-error">{error}</div>}

            <div className="ah-row">
              <div className="ah-field">
                <label className="ah-label">First name</label>
                <div className="ah-field-wrap">
                  <User className="ah-field-icon" />
                  <input
                    className="ah-input" type="text" 
                    value={firstName} onChange={e => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
              </div>
              <div className="ah-field">
                <label className="ah-label">Last name</label>
                <div className="ah-field-wrap">
                  <User className="ah-field-icon" />
                  <input
                    className="ah-input" type="text"
                    value={lastName} onChange={e => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>
            </div>

            <div className="ah-field">
              <label className="ah-label">Email</label>
              <div className="ah-field-wrap">
                <Mail className="ah-field-icon" />
                <input
                  className="ah-input" type="email" 
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="ah-field">
              <label className="ah-label">Password</label>
              <div className="ah-field-wrap">
                <Lock className="ah-field-icon" />
                <input
                  className="ah-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button type="button" className="ah-field-btn" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="ah-strength">
                  <div className="ah-strength-bars">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className={`ah-strength-bar${strength >= n ? ` s${strength}` : ''}`} />
                    ))}
                  </div>
                  <span className="ah-strength-label">{STRENGTH_LABELS[strength]}</span>
                </div>
              )}
            </div>

            <div className="ah-terms" onClick={() => setAgreed(a => !a)}>
              <div className={`ah-checkbox${agreed ? ' checked' : ''}`}>
                {agreed && <Check size={10} color="#fff" />}
              </div>
              <p className="ah-terms-text">
                I agree to the{' '}
                <a href="/terms" onClick={e => e.stopPropagation()}>Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" onClick={e => e.stopPropagation()}>Privacy Policy</a>
              </p>
            </div>

            <button className="ah-btn" type="submit" disabled={loading}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Creating account…</>
                : <>Create account <ArrowRight size={15} /></>
              }
            </button>
          </form>

          <div className="ah-footer">
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </>
  );
}