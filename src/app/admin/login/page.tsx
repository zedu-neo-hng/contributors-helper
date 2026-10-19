'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not sign in.');
      router.replace('/admin/feedback');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand"><span className="login-mark">Z</span><span>feedback<span>button</span></span></div>
        <p className="admin-eyebrow">ADMINISTRATOR ACCESS</p>
        <h1>Sign in to analytics</h1>
        <p className="login-copy">Use the admin credentials configured for this Contributors Helper deployment.</p>
        <label htmlFor="username">Username</label>
        <input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        <a className="login-back" href="/">Back to contributor chat</a>
      </form>
    </main>
  );
}
