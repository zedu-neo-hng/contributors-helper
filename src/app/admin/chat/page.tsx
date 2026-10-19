import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import AdminSidebar from '../admin-sidebar';
import { ChatInterface } from '../../chat-interface';

export const dynamic = 'force-dynamic';

export default function AdminChatPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirect('/admin/login');

  return (
    <div className="feedback-admin-shell">
      <AdminSidebar active="chat" />
      <section className="feedback-main admin-chat-main">
        <header className="feedback-topbar admin-chat-topbar"><div className="admin-chat-context"><div className="feedback-breadcrumb">App Feedback <span>/</span> <strong>Contributor chat</strong></div><small>Try Zoe with the same chat flow contributors use.</small></div><div className="admin-online"><i /> Admin view</div></header>
        <div className="admin-chat-content"><ChatInterface embedded /></div>
      </section>
    </div>
  );
}
