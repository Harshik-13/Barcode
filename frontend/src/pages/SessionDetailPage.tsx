import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { sessionsApi } from '../services/apiService';
import type { SessionWithDetails } from '../services/apiService';
import type { SessionStatus } from '@workspace/shared';

const STATUS_LABELS: Record<SessionStatus, string> = {
  created: 'Created',
  active: 'Active',
  awaiting_summary: 'Awaiting Summary',
  completed: 'Completed',
  archived: 'Archived',
};

const STATUS_COLORS: Record<SessionStatus, string> = {
  created: '#f59e0b',
  active: '#10b981',
  awaiting_summary: '#f97316',
  completed: '#6b7280',
  archived: '#9ca3af',
};

export default function SessionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    sessionsApi.get(parseInt(id, 10))
      .then((res) => {
        setSession(res.data);
        setSummary(res.data.summary || '');
      })
      .catch(() => setError('Session not found'))
      .finally(() => setLoading(false));
  }, [id]);

  function handleSubmitSummary() {
    if (!session || !summary.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    sessionsApi.complete(session.id, summary.trim())
      .then((res) => {
        setSession(res.data);
        setSuccess('Summary submitted successfully');
      })
      .catch(() => setError('Failed to submit summary'))
      .finally(() => setSubmitting(false));
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading session...</div>;
  }

  if (!session) {
    return <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>{error || 'Session not found'}</div>;
  }

  const isOwner = user?.role === 'student' && session.studentId === user?.id;
  const canSubmit = (user?.role === 'student' && isOwner || user?.role === 'faculty' || user?.role === 'admin') && session.status === 'awaiting_summary';

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '16px', padding: '6px 12px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>
        &larr; Back
      </button>

      <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Session #{session.id}</h1>
        {session.studentName && <p style={{ color: '#6b7280', marginBottom: '20px' }}>{session.studentName} {session.studentRoll ? `(${session.studentRoll})` : ''}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>Status</div>
            <span style={{ display: 'inline-block', marginTop: '2px', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, background: `${STATUS_COLORS[session.status as SessionStatus]}20`, color: STATUS_COLORS[session.status as SessionStatus] }}>
              {STATUS_LABELS[session.status as SessionStatus] || session.status}
            </span>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>Category</div>
            <div style={{ marginTop: '2px', fontSize: '14px' }}>{session.categoryName || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>Entry Time</div>
            <div style={{ marginTop: '2px', fontSize: '14px' }}>{new Date(session.entryTime).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>Exit Time</div>
            <div style={{ marginTop: '2px', fontSize: '14px' }}>{session.exitTime ? new Date(session.exitTime).toLocaleString() : '-'}</div>
          </div>
          {session.completionReason && (
            <div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>Completion Reason</div>
              <div style={{ marginTop: '2px', fontSize: '14px' }}>{session.completionReason}</div>
            </div>
          )}
        </div>

        {session.summary && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Summary</h3>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '14px', lineHeight: 1.6 }}>{session.summary}</div>
          </div>
        )}

        {canSubmit && (
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Submit Summary</h3>
            {success && <div style={{ marginBottom: '12px', padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#16a34a', fontSize: '14px' }}>{success}</div>}
            {error && <div style={{ marginBottom: '12px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '14px' }}>{error}</div>}
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe what you worked on..."
              rows={4}
              style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <button
              onClick={handleSubmitSummary}
              disabled={submitting || !summary.trim()}
              style={{ marginTop: '12px', padding: '8px 20px', background: submitting || !summary.trim() ? '#9ca3af' : '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: submitting || !summary.trim() ? 'not-allowed' : 'pointer', fontSize: '14px' }}
            >
              {submitting ? 'Submitting...' : 'Submit Summary'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
