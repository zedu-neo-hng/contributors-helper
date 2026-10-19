'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../admin-sidebar';

type DashboardData = {
  positive: number;
  negative: number;
  total: number;
  approvalRate: number;
  lastResponseAt: string | null;
  trend: { date: string; up: number; down: number }[];
  recentFeedback: { responseId: string; rating: 'up' | 'down'; comment: string; updatedAt: string }[];
  recentComments: { responseId: string; rating: 'up' | 'down'; comment: string; updatedAt: string }[];
};

const numberFormat = new Intl.NumberFormat();

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00Z`));
}

function formatRelative(value: string | null) {
  if (!value) return 'No ratings yet';
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function FeedbackDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/feedback', { cache: 'no-store' });
      if (response.status === 401) {
        window.location.assign('/admin/login');
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Analytics could not be loaded.');
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Analytics could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const maxDaily = useMemo(() => Math.max(1, ...(data?.trend.map((day) => day.up + day.down) ?? [1])), [data]);
  const total = data?.total ?? 0;
  const positivePercent = total ? ((data?.positive ?? 0) / total) * 100 : 0;
  const negativePercent = total ? 100 - positivePercent : 0;

  return (
    <main className="feedback-admin-shell">
      <AdminSidebar active="overview" />

      <section className="feedback-main">
        <header className="feedback-topbar"><div className="feedback-breadcrumb">App Feedback <span>/</span> <strong>Overview</strong></div><div className="admin-online"><i /> Admin dashboard</div></header>
        <div className="feedback-content">
          <div className="feedback-title-row"><div><p className="feedback-eyebrow">QUALITY CONTROL</p><h1>Feedback overview</h1><p>Monitor how contributors rate Zoe&apos;s responses.</p></div><button className="refresh-button" onClick={() => void load()} disabled={loading}>↻ <span>{loading ? 'Updating…' : 'Refresh'}</span></button></div>

          {error && <div className="dashboard-error" role="alert"><span>{error}</span><button onClick={() => void load()}>Try again</button></div>}
          <div className="analytics-cards">
            <article className="analytics-card"><div className="card-label">Approval rate <span className="card-icon purple">↗</span></div><strong className="card-number">{loading ? '—' : `${data?.approvalRate ?? 0}%`}</strong><div className="card-foot">Positive ratings out of all votes</div></article>
            <article className="analytics-card"><div className="card-label">Positive feedback <span className="card-icon green">＋</span></div><strong className="card-number">{loading ? '—' : numberFormat.format(data?.positive ?? 0)}</strong><div className="card-foot">Thumbs-up ratings</div></article>
            <article className="analytics-card"><div className="card-label">Negative feedback <span className="card-icon red">−</span></div><strong className="card-number">{loading ? '—' : numberFormat.format(data?.negative ?? 0)}</strong><div className="card-foot">Thumbs-down ratings</div></article>
            <article className="analytics-card"><div className="card-label">Total responses <span className="card-icon blue">◷</span></div><strong className="card-number">{loading ? '—' : numberFormat.format(total)}</strong><div className="card-foot">Last rating · {formatRelative(data?.lastResponseAt ?? null)}</div></article>
          </div>

          <div className="chart-grid">
            <section className="analytics-panel trend-panel"><div className="panel-heading"><div><h2>Feedback trends</h2><p>Daily ratings over the last 14 days</p></div><span className="period-pill">Last 14 days⌄</span></div>
              {loading ? <div className="chart-placeholder" role="status">Loading rating trends…</div> : total === 0 ? <div className="chart-placeholder">Trend data will appear when contributors rate a response.</div> : <div className="trend-chart-wrap"><div className="trend-legend"><span><i className="legend-up" /> Positive</span><span><i className="legend-down" /> Negative</span></div><div className="trend-chart" role="img" aria-label="Daily positive and negative feedback counts for the last 14 days"><div className="chart-y-labels"><span>{maxDaily}</span><span>{Math.ceil(maxDaily / 2)}</span><span>0</span></div><div className="chart-plot"><div className="chart-gridline top" /><div className="chart-gridline mid" /><div className="chart-gridline bottom" />{data?.trend.map((day) => <div className="trend-day" key={day.date} title={`${formatDate(day.date)}: ${day.up} positive, ${day.down} negative`}><div className="trend-bars"><i className="bar-up" style={{ height: `${(day.up / maxDaily) * 100}%` }} /><i className="bar-down" style={{ height: `${(day.down / maxDaily) * 100}%` }} /></div><span>{formatDate(day.date)}</span></div>)}</div></div></div>}
            </section>

            <section className="analytics-panel breakdown-panel"><div className="panel-heading"><div><h2>Rating breakdown</h2><p>All submitted ratings</p></div><span className="period-pill">All time⌄</span></div>
              {loading ? <div className="chart-placeholder" role="status">Loading feedback…</div> : total === 0 ? <div className="breakdown-empty">No ratings to break down yet.</div> : <div className="breakdown-content"><div className="donut-chart" style={{ background: `conic-gradient(#28bd75 0 ${positivePercent}%, #e14a4a ${positivePercent}% 100%)` }}><div className="donut-hole"><strong>{numberFormat.format(total)}</strong><span>ratings</span></div></div><div className="breakdown-legend"><div><span className="legend-swatch positive" /><span>Positive</span><strong>{numberFormat.format(data?.positive ?? 0)}</strong></div><div><span className="legend-swatch negative" /><span>Negative</span><strong>{numberFormat.format(data?.negative ?? 0)}</strong></div></div></div>}
            </section>
          </div>

          <section className="analytics-panel comments-panel latest-feedback-panel"><div className="panel-heading"><div><h2>Latest feedback</h2><p>The seven most recent ratings from contributors</p></div><div className="latest-feedback-actions">{data && data.total > 7 && <a className="view-all-link" href="/admin/feedback/all">View all feedback <span aria-hidden="true">→</span></a>}<span className="comment-count">{loading ? '—' : `${Math.min(7, data?.total ?? 0)} of ${numberFormat.format(total)}`}</span></div></div>
            {loading ? <div className="comments-empty" role="status">Loading latest feedback…</div> : !data?.recentFeedback.length ? <div className="comments-empty">No ratings yet. Feedback will appear after contributors rate a response in chat.</div> : <div className="feedback-table-scroll"><table className="feedback-table"><thead><tr><th>Rating</th><th>Comment</th><th>Response</th><th>Received</th></tr></thead><tbody>{data.recentFeedback.map((entry) => <tr key={entry.responseId}><td><span className={`rating-pill ${entry.rating}`}>{entry.rating === 'up' ? '↑ Positive' : '↓ Negative'}</span></td><td className="feedback-comment-cell">{entry.rating === 'down' ? (entry.comment || <span className="no-comment">No comment left</span>) : <span className="no-comment">—</span>}</td><td className="response-id-cell">{entry.responseId.slice(0, 8)}</td><td>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.updatedAt))}</td></tr>)}</tbody></table></div>}
          </section>
          {!loading && total === 0 && <p className="dashboard-footnote">Ratings appear here after contributors vote on an assistant response in chat.</p>}
        </div>
      </section>
    </main>
  );
}
