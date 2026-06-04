'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

const BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!email) {
      setError('Email is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data: { message?: string } = await response.json();
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
      setEmail('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0a0a0a' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm mb-6"
            style={{ color: '#888888' }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>

          <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>
            Forgot Password?
          </h1>

          <p style={{ color: '#888888', fontSize: '14px' }}>
            Enter your email to receive a password reset link.
          </p>
        </div>

        {success ? (
          <div
            className="p-4 rounded-lg border mb-6"
            style={{
              background: 'rgba(53, 192, 112, 0.08)',
              borderColor: 'rgba(53, 192, 112, 0.2)',
            }}
          >
            <div className="flex gap-3">
              <Mail size={18} style={{ color: '#35c070' }} />
              <div>
                <p className="font-semibold mb-1" style={{ color: '#35c070' }}>
                  Email sent!
                </p>
                <p style={{ color: '#888888', fontSize: '14px' }}>
                  Check your inbox for a password reset link. The link will
                  expire in 24 hours.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="p-6 rounded-lg border mb-6"
            style={{
              background: '#111111',
              borderColor: 'rgba(255, 107, 0, 0.1)',
            }}
          >
            <div className="mb-4">
              <label
                className="block text-xs mb-2 uppercase tracking-wide"
                style={{ color: '#555555' }}
              >
                --email
              </label>

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e =>
                  e.key === 'Enter' && !loading && handleSubmit()
                }
                placeholder="your@email.com"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid rgba(255, 107, 0, 0.15)',
                  borderRadius: '6px',
                  color: '#e0e0e0',
                  fontSize: '14px',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>

            {error && (
              <div
                className="text-sm mb-4 p-3 rounded-lg"
                style={{
                  background: 'rgba(224, 53, 53, 0.08)',
                  border: '1px solid rgba(224, 53, 53, 0.2)',
                  color: '#e03535',
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email}
              style={{
                width: '100%',
                padding: '10px',
                background: loading
                  ? '#555555'
                  : 'linear-gradient(135deg, #ff6b00, #ff8c3a)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !email ? 0.6 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm" style={{ color: '#555555' }}>
          <span>Remember your password? </span>
          <Link
            href="/login"
            style={{
              color: '#ff6b00',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}