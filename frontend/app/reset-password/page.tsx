'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { env } from "process";
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const getStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const strengthLabel = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['#e03535', '#e07a35', '#a0c030', '#35c070', '#0cc070'][strength];

  const handleSubmit = async () => {
    setError('');

    if (!token) {
      setError('Invalid reset link.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Both fields are required.');
      return;
    }

    if (strength < 2) {
      setError('Password is too weak. Use uppercase, lowercase, numbers, and symbols.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
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
          <Link href="/login" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: '#888888' }}>
            <ArrowLeft size={14} />
            <span>Back to login</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>
            Create New Password
          </h1>
          <p style={{ color: '#888888', fontSize: '14px' }}>
            Enter a strong password to secure your account.
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
              <Check size={18} style={{ color: '#35c070', flexShrink: 0 }} />
              <div>
                <p className="font-semibold mb-1" style={{ color: '#35c070' }}>
                  Password reset successful!
                </p>
                <p style={{ color: '#888888', fontSize: '14px' }}>
                  Redirecting to login page...
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
            {/* Password Field */}
            <div className="mb-4">
              <label className="block text-xs mb-2 uppercase tracking-wide" style={{ color: '#555555' }}>
                --password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid rgba(255, 107, 0, 0.15)',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#888888',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          background: i < strength ? strengthColor : '#333333',
                          borderRadius: '2px',
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ color: strengthColor, fontSize: '12px' }}>
                    Strength: <strong>{strengthLabel}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="mb-4">
              <label className="block text-xs mb-2 uppercase tracking-wide" style={{ color: '#555555' }}>
                --confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid rgba(255, 107, 0, 0.15)',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#888888',
                    cursor: 'pointer',
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-sm mb-4 p-3 rounded-lg flex gap-2"
                style={{
                  background: 'rgba(224, 53, 53, 0.08)',
                  border: '1px solid rgba(224, 53, 53, 0.2)',
                  color: '#e03535',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !token || strength < 2}
              style={{
                width: '100%',
                padding: '10px',
                background:
                  loading || !token ? '#555555' : 'linear-gradient(135deg, #ff6b00, #ff8c3a)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !token || strength < 2 ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
