'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import { register } from '@/lib/api';

function getStrength(pw: string): 0|1|2|3|4 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s as 0|1|2|3|4;
}
const STRENGTH_LABELS = ['', 'weak', 'fair', 'good', 'strong'];
const STRENGTH_COLORS = ['', '#e03535', '#888', '#aaa', '#35c070'];

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 10px 9px 26px', background: '#111',
    border: '1px solid #2a2a2a', borderRadius: 4, color: '#e0e0e0',
    fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: 'none',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!firstName.trim()) { setError('--first-name is required'); return; }
    if (!email.trim())      { setError('--email is required'); return; }
    if (!password)          { setError('--password is required'); return; }
    if (strength < 2)       { setError('password strength too low'); return; }
    if (!agreed)            { setError('must agree to terms'); return; }
    setLoading(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      const data = await register(fullName, email.trim(), password);
      const cookieRes = await fetch('/api/auth/set-cookie', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token }),
      });
      if (!cookieRes.ok) throw new Error('Failed to persist session.');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", padding: '2rem 1rem' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #0d0d0d 2px, #0d0d0d 4px)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>
        <div style={{ background: '#111', border: '1px solid #222', borderBottom: 'none', borderRadius: '8px 8px 0 0', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#555' }}>repolens — register</span>
        </div>

        <div style={{ background: '#0d0d0d', border: '1px solid #222', borderRadius: '0 0 8px 8px', padding: '28px 28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: '#1a1a1a', border: '1px solid #444', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔍</div>
            <span style={{ color: '#ddd', fontWeight: 600, fontSize: 15 }}>RepoLens</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#555', fontSize: 12, marginBottom: 4 }}>$ auth --mode register</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Create an <span style={{ color: '#bbb' }}>account.</span></div>
            <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>Start exploring any GitHub repo in seconds.</div>
          </div>

          <div style={{ borderTop: '1px solid #1e1e1e', margin: '0 0 20px' }} />

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#1a1010', border: '1px solid #773333', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#e08080', marginBottom: 14 }}>
                <span style={{ color: '#ff5555' }}>error: </span>{error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {[
                { label: '--first-name', val: firstName, set: setFirstName, ac: 'given-name' },
                { label: '--last-name',  val: lastName,  set: setLastName,  ac: 'family-name' },
              ].map(f => (
                <div key={f.label} style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{f.label}</div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: 12 }}>›</span>
                    <input type="text" value={f.val} onChange={e => f.set(e.target.value)} autoComplete={f.ac} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#666'}
                      onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>--email</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: 12 }}>›</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#666'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>--password</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: 12 }}>›</span>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="min. 8 chars" autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 36 }}
                  onFocus={e => e.target.style.borderColor = '#666'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 0 }}>
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1,2,3,4].map(n => (
                      <div key={n} style={{ flex: 1, height: 2, background: strength >= n ? STRENGTH_COLORS[strength] : '#222', borderRadius: 1, transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: strength > 0 ? STRENGTH_COLORS[strength] : '#555', marginTop: 3 }}>{STRENGTH_LABELS[strength]}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16, cursor: 'pointer' }} onClick={() => setAgreed(a => !a)}>
              <div style={{ width: 15, height: 15, border: `1px solid ${agreed ? '#aaa' : '#333'}`, borderRadius: 3, background: agreed ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
                {agreed && <Check size={10} color="#000" />}
              </div>
              <span style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
                I agree to the{' '}
                <a href="/terms" style={{ color: '#bbb', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>Terms</a>
                {' '}and{' '}
                <a href="/privacy" style={{ color: '#bbb', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>Privacy Policy</a>
              </span>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: 10, background: loading ? '#1a1a1a' : '#fff', border: '1px solid #ddd', borderRadius: 4, color: loading ? '#888' : '#000', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace" }}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> creating account...</> : <>$ create-account <ArrowRight size={14} /></>}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#444' }}>
            already registered?{' '}
            <Link href="/login" style={{ color: '#bbb', textDecoration: 'none' }}>--login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}