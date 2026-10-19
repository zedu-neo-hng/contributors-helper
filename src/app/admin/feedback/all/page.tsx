import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import AllFeedbackPage from './list';

export const dynamic = 'force-dynamic';

export default function AdminAllFeedbackPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSession(token)) redirect('/admin/login');
  return <AllFeedbackPage />;
}
