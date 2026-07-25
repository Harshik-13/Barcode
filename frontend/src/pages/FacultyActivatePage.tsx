import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { facultyActivationApi } from '../services/apiService';

type Step = 'email' | 'otp' | 'password' | 'done';

export default function FacultyActivatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationToken, setActivationToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCooldown = () => {
    setCooldown(30);
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
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await facultyActivationApi.start(email);
      startCooldown();
      setStep('otp');
    } catch (err: unknown) {
      setError((err as { message?: string } | null)?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      await facultyActivationApi.resendOtp(email);
      startCooldown();
    } catch (err: unknown) {
      setError((err as { message?: string } | null)?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await facultyActivationApi.verifyOtp(email, otp);
      setActivationToken(res.data.activationToken);
      setStep('password');
    } catch (err: unknown) {
      setError((err as { message?: string } | null)?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await facultyActivationApi.setPassword(activationToken, password);
      setStep('done');
    } catch (err: unknown) {
      setError((err as { message?: string } | null)?.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '24px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Faculty Activation</h1>

      {error && (
        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
            Enter your official email to receive an activation OTP.
          </p>
          <input
            type="email"
            placeholder="your.email@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
          />
          <button type="submit" disabled={loading} style={{ padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
            Enter the 6-digit OTP sent to <strong>{email}</strong>
          </p>
          <input
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', textAlign: 'center', letterSpacing: '8px', fontWeight: 600 }}
          />
          <button type="submit" disabled={loading || otp.length !== 6} style={{ padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer', opacity: loading || otp.length !== 6 ? 0.7 : 1 }}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button type="button" onClick={handleResend} disabled={loading || cooldown > 0} style={{ padding: '10px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer', color: '#2563eb' }}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
            Create a password for your faculty account.
          </p>
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px' }}
          />
          <button type="submit" disabled={loading} style={{ padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Setting password...' : 'Activate Account'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#10004;</div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Activation Complete!</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Your faculty account is now active. You can log in with your email and password.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
          >
            Go to Login
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '14px', cursor: 'pointer' }}>
          Back to Login
        </button>
      </div>
    </div>
  );
}
