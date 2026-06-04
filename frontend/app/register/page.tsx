'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { register } from '@/lib/api';

function getStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_LABELS = ['', 'weak', 'fair', 'good', 'strong'];
const STRENGTH_COLORS = ['', '#e03535', '#888', '#aaa', '#35c070'];

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getStrength(password);



  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 10px 9px 26px',
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: 4,
    color: '#e0e0e0',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) return setError('--first-name is required');
    if (!email.trim()) return setError('--email is required');
    if (!password) return setError('--password is required');
    if (strength < 2) return setError('password strength too low');
    if (!agreed) return setError('must agree to terms');

    setLoading(true);

    try {
      const fullName = [firstName.trim(), lastName.trim()]
        .filter(Boolean)
        .join(' ');

      const data = await register(fullName, email.trim(), password);

      const cookieRes = await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token }),
      });

      if (!cookieRes.ok) {
        throw new Error('Failed to persist session.');
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, #0d0d0d 2px, #0d0d0d 4px)',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: '#1a1010',
                border: '1px solid #773333',
                borderRadius: 4,
                padding: '8px 12px',
                fontSize: 12,
                color: '#e08080',
                marginBottom: 14,
              }}
            >
              <span style={{ color: '#ff5555' }}>error: </span>
              {error}
            </div>
          )}

          {/* NAME */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {([firstName, lastName] as const).map((val, i) => (
              <input
                key={i}
                value={val}
                onChange={e =>
                  i === 0
                    ? setFirstName(e.target.value)
                    : setLastName(e.target.value)
                }
                placeholder={i === 0 ? 'first name' : 'last name'}
                style={inputStyle}
              />
            ))}
          </div>

          {/* EMAIL */}
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email"
            style={{ ...inputStyle, marginBottom: 12 }}
          />

          {/* PASSWORD */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
              style={{ ...inputStyle, paddingRight: 36 }}
            />

            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#444',
              }}
            >
              {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          {/* STRENGTH INDICATOR */}
          {password && (
            <div style={{ marginTop: -10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 2,
                      background: i <= strength ? STRENGTH_COLORS[strength] : '#2a2a2a',
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 11, color: STRENGTH_COLORS[strength] }}>
                {STRENGTH_LABELS[strength]}
              </p>
            </div>
          }

          {/* TERMS */}
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              id="agreed"
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="agreed" style={{ fontSize: 12, color: '#666', cursor: 'pointer' }}>
              I agree to the terms of service
            </label>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 10,
              background: loading ? '#1a1a1a' : '#fff',
              border: '1px solid #ddd',
              borderRadius: 4,
              color: loading ? '#888' : '#000',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                creating account...
              </>
            ) : (
              <>
                $ create-account <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#444' }}>
          already have an account?{' '}
          <Link href="/login" style={{ color: '#bbb' }}>
            --login
          </Link>
        </div>
      </div>
    </div>
  );
}