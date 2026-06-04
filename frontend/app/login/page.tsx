'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { login } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const data = await login(email, password);
      const cookieRes = await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token }),
      });
      if (!cookieRes.ok) throw new Error('Failed to persist session.');
      router.push('/landing');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 10px 9px 26px', background: '#111',
    border: '1px solid #2a2a2a', borderRadius: 4, color: '#e0e0e0',
    fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", padding: '2rem 1rem' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #0d0d0d 2px, #0d0d0d 4px)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        <div style={{ background: '#111', border: '1px solid #222', borderBottom: 'none', borderRadius: '8px 8px 0 0', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#555' }}>repolens — login</span>
        </div>

        <div style={{ background: '#0d0d0d', border: '1px solid #222', borderRadius: '0 0 8px 8px', padding: '28px 28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: '#1a1a1a', border: '1px solid #444', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔍</div>
            <span style={{ color: '#ddd', fontWeight: 600, fontSize: 15 }}>RepoLens</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#555', fontSize: 12, marginBottom: 4 }}>$ auth --mode login</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Welcome <span style={{ color: '#bbb' }}>back.</span></div>
            <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>Sign in to continue exploring repositories.</div>
          </div>

          <div style={{ borderTop: '1px solid #1e1e1e', margin: '0 0 20px' }} />

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#1a1010', border: '1px solid #773333', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#e08080', marginBottom: 14 }}>
                <span style={{ color: '#ff5555' }}>error: </span>{error}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>--email</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: 12 }}>›</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#666'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
              </div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>--password</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: 12 }}>›</span>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 36 }}
                  onFocus={e => e.target.style.borderColor = '#666'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 0 }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link href="/forgot-password" style={{ fontSize: 11, color: '#555', textDecoration: 'none' }}>forgot-password?</Link>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '10px', background: loading ? '#1a1a1a' : '#fff', border: '1px solid #ddd', borderRadius: 4, color: loading ? '#888' : '#000', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.15s' }}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> authenticating...</> : <>$ sign-in <ArrowRight size={14} /></>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#444' }}>
            no account?{' '}
            <Link href="/register" style={{ color: '#bbb', textDecoration: 'none' }}>--register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}