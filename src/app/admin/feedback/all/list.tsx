'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminSidebar from '../../admin-sidebar';

type FeedbackRow = { responseId: string; rating: 'up' | 'down'; comment: string; createdAt: string; updatedAt: string };
type FeedbackResponse = { records: FeedbackRow[]; totalRecords: number; page: number; pageSize: number; totalPages: number };
type RatingFilter = 'all' | 'up' | 'down';

const countFormat = new Intl.NumberFormat();

export default function AllFeedbackPage() {
  const [result, setResult] = useState<FeedbackResponse | null>(null);
  const [filter, setFilter] = useState<RatingFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ view: 'all', page: String(page) });
      if (filter !== 'all') query.set('rating', filter);
      const response = await fetch(`/api/admin/feedback?${query}`, { cache: 'no-store' });
      if (response.status === 401) {
        window.location.assign('/admin/login');
        return;
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Feedback could not be loaded.');
      setResult(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Feedback could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { void load(); }, [load]);

  function changeFilter(value: RatingFilter) {
    setFilter(value);
    setPage(1);
  }

  return (
    <main className="feedback-admin-shell">
      <AdminSidebar active="feedback" />
      <section className="feedback-main">
        <header className="feedback-topbar"><div className="feedback-breadcrumb">App Feedback <span>/</span> <strong>Feedback</strong></div><div className="admin-online"><i /> Admin dashboard</div></header>
        <div className="feedback-content all-feedback-content">
          <div className="feedback-title-row"><div><p className="feedback-eyebrow">QUALITY CONTROL</p><h1>All feedback</h1><p>Review every rating and any note contributors left on downvotes.</p></div><button className="refresh-button" onClick={() => void load()} disabled={loading}>↻ <span>{loading ? 'Updating…' : 'Refresh'}</span></button></div>

          <section className="analytics-panel all-feedback-panel">
            <div className="all-feedback-toolbar"><div className="filter-tabs" role="group" aria-label="Filter feedback by rating"><button className={filter === 'all' ? 'active' : ''} onClick={() => changeFilter('all')}>All ratings</button><button className={filter === 'up' ? 'active' : ''} onClick={() => changeFilter('up')}>Positive</button><button className={filter === 'down' ? 'active' : ''} onClick={() => changeFilter('down')}>Negative</button></div><span className="all-feedback-count">{loading ? 'Loading…' : `${countFormat.format(result?.totalRecords ?? 0)} ratings`}</span></div>
            {error && <div className="dashboard-error" role="alert"><span>{error}</span><button onClick={() => void load()}>Try again</button></div>}
            {loading ? <div className="all-feedback-empty" role="status">Loading feedback records…</div> : !result?.records.length ? <div className="all-feedback-empty">{filter === 'all' ? 'No feedback has been submitted yet.' : `No ${filter === 'up' ? 'positive' : 'negative'} ratings yet.`}</div> : <>
              <div className="feedback-table-scroll"><table className="feedback-table all-feedback-table"><thead><tr><th>Rating</th><th>Contributor comment</th><th>Response ID</th><th>Received</th></tr></thead><tbody>{result.records.map((entry) => <tr key={entry.responseId}><td><span className={`rating-pill ${entry.rating}`}>{entry.rating === 'up' ? '↑ Positive' : '↓ Negative'}</span></td><td className="feedback-comment-cell">{entry.rating === 'down' ? (entry.comment || <span className="no-comment">No comment provided</span>) : <span className="no-comment">—</span>}</td><td className="response-id-cell">{entry.responseId.slice(0, 12)}</td><td>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.updatedAt))}</td></tr>)}</tbody></table></div>
              <div className="pagination"><span>Page {result.page} of {result.totalPages}</span><div><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={result.page <= 1 || loading}>← Previous</button><button onClick={() => setPage((current) => Math.min(result.totalPages, current + 1))} disabled={result.page >= result.totalPages || loading}>Next →</button></div></div>
            </>}
          </section>
        </div>
      </section>
    </main>
  );
}
