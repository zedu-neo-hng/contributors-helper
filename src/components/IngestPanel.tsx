'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { isAdmin, isSuperAdmin, isUserRole, type UserRole } from '@/lib/roles';
import DocumentUpload from './DocumentUpload';

type IngestResult = {
  processed: string[];
  failed: { id: string; error: string }[];
  remaining: number;
};

type AdminUser = {
  id: string;
  email: string | null;
  role: string;
  createdAt: string;
};

const card = {
  width: '100%',
  maxWidth: '750px',
  marginTop: '16px',
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '12px',
  padding: '16px 20px',
  color: '#f0f6fc',
} as const;

const button = {
  backgroundColor: '#7c3aed',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: '6px',
  cursor: 'pointer',
} as const;

const quietButton = {
  backgroundColor: 'transparent',
  color: '#c9d1d9',
  border: '1px solid #30363d',
  padding: '6px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
} as const;

export default function IngestPanel() {
  const { status } = useSession();
  const [role, setRole] = useState<UserRole | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);

  // The role comes from the server, so a promotion or demotion applies without the
  // contributor signing in again.
  useEffect(() => {
    if (status !== 'authenticated') {
      setRole(null);
      return;
    }

    let cancelled = false;
    fetch('/api/admin/me')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data && isUserRole(data.role)) setRole(data.role);
      })
      .catch(() => {
        // A failed lookup just leaves the panel hidden.
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const superAdmin = role !== null && isSuperAdmin(role);

  const loadUsers = useCallback(async () => {
    const response = await fetch('/api/admin/users');
    const data = await response.json().catch(() => null);
    if (response.ok && Array.isArray(data?.users)) setUsers(data.users);
  }, []);

  useEffect(() => {
    if (superAdmin) void loadUsers();
  }, [superAdmin, loadUsers]);

  const runIngest = async () => {
    setRunning(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/ingest', { method: 'POST' });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Ingest failed (${response.status}).`);
      }

      setResult({
        processed: Array.isArray(data?.processed) ? data.processed : [],
        failed: Array.isArray(data?.failed) ? data.failed : [],
        remaining: typeof data?.remaining === 'number' ? data.remaining : 0,
      });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Ingest failed.');
    } finally {
      setRunning(false);
    }
  };

  const setUserRole = async (id: string, next: 'USER' | 'ADMIN') => {
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: next }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `Could not update the role (${response.status}).`);
      }

      await loadUsers();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not update the role.');
    }
  };

  // Ordinary contributors see no ingestion controls at all.
  if (role === null || !isAdmin(role)) return null;

  return (
    <div style={card}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 4px' }}>Knowledge ingestion</h2>
      <p style={{ color: '#8b949e', fontSize: '0.8rem', margin: '0 0 12px' }}>
        Upload a call transcript or document, then run ingestion to add it to Zoe&apos;s context.
      </p>

      <DocumentUpload />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
        <button type="button" style={button} onClick={() => void runIngest()} disabled={running}>
          {running ? 'Running ingestion…' : 'Run ingest'}
        </button>
        <span role="status" aria-live="polite" style={{ fontSize: '0.85rem', color: result?.failed.length ? '#f85149' : '#8b949e' }}>
          {result
            ? `Processed ${result.processed.length} document(s), failed ${result.failed.length}, ${result.remaining} still staged.`
            : ''}
        </span>
      </div>

      {result?.failed.map((failure) => (
        <p key={failure.id} style={{ color: '#f85149', fontSize: '0.8rem', margin: '6px 0 0' }}>
          {failure.id}: {failure.error}
        </p>
      ))}

      {error && (
        <p role="alert" style={{ color: '#f85149', fontSize: '0.8rem', margin: '8px 0 0' }}>
          {error}
        </p>
      )}

      {superAdmin && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 8px' }}>Contributors</h3>
          {users.length === 0 && <p style={{ color: '#8b949e', fontSize: '0.8rem', margin: 0 }}>No contributors have signed in yet.</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {users.map((user) => (
              <li key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid #21262d' }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>
                  {user.email || user.id}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#c9d1d9' }}>{user.role}</span>
                {user.role === 'SUPER_ADMIN' ? (
                  <span style={{ fontSize: '0.7rem', color: '#8b949e' }}>seeded</span>
                ) : (
                  <button
                    type="button"
                    style={quietButton}
                    onClick={() => void setUserRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                    aria-label={`${user.role === 'ADMIN' ? 'Remove admin from' : 'Make admin'} ${user.email || user.id}`}
                  >
                    {user.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
