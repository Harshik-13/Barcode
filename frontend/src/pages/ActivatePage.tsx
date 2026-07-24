import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { activationApi } from '../services/apiService';

type Step = 'roll' | 'otp' | 'password' | 'done';

export default function ActivatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('roll');
  const [roll, setRoll] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationToken, setActivationToken] = useState('');
  const [studentName, setStudentName] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCooldown(seconds: number) {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleRollSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!roll.trim()) { setError('Roll number is required'); return; }
    setLoading(true);
    try {
      const res = await activationApi.start(roll.trim());
      setEmailDomain(res.data.emailDomain);
      startCooldown(30);
      setStep('otp');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setLoading(true);
    try {
      await activationApi.resendOtp(roll);
      startCooldown(30);
      setOtp('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!otp.trim() || otp.length !== 6) { setError('Please enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await activationApi.verifyOtp(roll, otp.trim());
      setActivationToken(res.data.activationToken);
      setStep('password');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!password) { setError('Password is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await activationApi.setPassword(activationToken, password);
      setStep('done');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to set password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '32px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6b7280', padding: '4px' }}>&larr;</button>
          <h1 style={{ fontSize: '20px' }}>Activate Account</h1>
        </div>

        {error && (
          <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
          {(['roll', 'otp', 'password'] as Step[]).map((s, i) => {
            const idx = ['roll', 'otp', 'password'].indexOf(s);
            const currentIdx = ['roll', 'otp', 'password'].indexOf(step);
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {i > 0 && <div style={{ width: '24px', height: '2px', background: done ? '#2563eb' : '#e5e7eb' }} />}
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, background: done ? '#2563eb' : active ? '#eff6ff' : '#f3f4f6', color: done ? '#fff' : active ? '#2563eb' : '#9ca3af', border: active ? '2px solid #2563eb' : '2px solid transparent' }}>
                  {i + 1}
                </div>
              </div>
            );
          })}
        </div>

        {step === 'roll' && (
          <form onSubmit={handleRollSubmit}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Enter your roll number to receive an OTP at your college email.</p>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="roll" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Roll Number</label>
              <input
                id="roll"
                type="text"
                value={roll}
                onChange={(e) => setRoll(e.target.value.toUpperCase())}
                placeholder="e.g. 20A81A05A1"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: loading ? '#9ca3af' : '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Enter the 6-digit OTP sent to</p>
            <p style={{ fontWeight: 500, fontSize: '14px', marginBottom: '16px' }}>{roll.toLowerCase()}{emailDomain}</p>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="otp" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>OTP</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', letterSpacing: '8px', textAlign: 'center', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: loading ? '#9ca3af' : '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '12px' }}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" onClick={handleResend} disabled={loading || cooldown > 0} style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer', color: cooldown > 0 ? '#9ca3af' : '#2563eb' }}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Create a password for your account.</p>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                minLength={8}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: loading ? '#9ca3af' : '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Activating...' : 'Activate & Sign In'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>&#10003;</div>
            <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Account Activated!</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Your account has been activated successfully. You can now sign in with your college email.</p>
            <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
