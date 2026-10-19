'use client';

export default function AdminSidebar({ active }: { active: 'overview' | 'feedback' | 'chat' }) {
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.assign('/admin/login');
  }

  return (
    <aside className="feedback-sidebar">
      <a className="feedback-brand" href="/admin/feedback"><span className="feedback-brand-mark">f</span>feedbackbutton</a>
      <div className="feedback-workspace"><span className="feedback-app-icon">D</span><span><strong>App Feedback</strong><small>Team Neo</small></span><span className="feedback-chevron">⌄</span></div>
      <nav className="feedback-nav" aria-label="Admin navigation">
        <a href="/admin/feedback" className={active === 'overview' ? 'selected' : ''}><span>⌁</span>Overview</a>
        <a href="/admin/feedback/all" className={active === 'feedback' ? 'selected' : ''}><span>☷</span>Feedback</a>
        <a href="/admin/chat" className={active === 'chat' ? 'selected' : ''}><span>↗</span>Chat</a>
      </nav>
      <div className="feedback-sidebar-bottom"><span className="admin-avatar">K</span><span><strong>Administrator</strong><small>Feedback analytics</small></span><button onClick={() => void logout()} aria-label="Sign out">↪</button></div>
    </aside>
  );
}
