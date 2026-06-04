'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, AlertCircle, Check } from 'lucide-react';

const BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    } else {
      setError('');
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

  const strengthLabel = [
    'Very Weak',
    'Weak',
    'Fair',
    'Good',
    'Strong',
  ][strength] ?? '';

  const strengthColor = [
    '#e03535',
    '#e07a35',
    '#a0c030',
    '#35c070',
    '#0cc070',
  ][strength] ?? '#555';

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
      setError(
        'Password is too weak. Use uppercase, lowercase, numbers, and symbols.'
      );
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/login');
      }, 2500);
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
            href="/login"
            className="inline-flex items-center gap-2 text-sm mb-6"
            style={{ color: '#888888' }}
          >
            <ArrowLeft size={14} />
            <span>Back to login</span>
          </Link>

          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: '#ffffff' }}
          >
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
              <Check size={18} style={{ color: '#35c070' }} />
              <div>
                <p
                  className="font-semibold mb-1"
                  style={{ color: '#35c070' }}
                >
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
            {/* Password */}
            <div className="mb-4">
              <label
                className="block text-xs mb-2 uppercase"
                style={{ color: '#555555' }}
              >
                --password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0a0a0a',
                    border: '1px solid rgba(255, 107, 0, 0.15)',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>

              {/* Strength */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 4,
                          background:
                            i < strength ? strengthColor : '#333',
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ color: strengthColor, fontSize: 12 }}>
                    Strength: <b>{strengthLabel}</b>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="mb-4">
              <label
                className="block text-xs mb-2 uppercase"
                style={{ color: '#555555' }}
              >
                --confirm password
              </label>

              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  disabled={loading}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleSubmit()
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0a0a0a',
                    border: '1px solid rgba(255, 107, 0, 0.15)',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirm((p) => !p)
                  }
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#888',
                  }}
                >
                  {showConfirm ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 p-3 rounded-lg"
                style={{
                  background: 'rgba(224, 53, 53, 0.08)',
                  border: '1px solid rgba(224, 53, 53, 0.2)',
                  color: '#e03535',
                }}
              >
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !token || strength < 2}
              style={{
                width: '100%',
                padding: 10,
                background:
                  loading || !token
                    ? '#555'
                    : 'linear-gradient(135deg,#ff6b00,#ff8c3a)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                opacity:
                  loading || !token || strength < 2 ? 0.6 : 1,
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