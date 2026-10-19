import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { aggregateFeedback, readFeedback } from '@/lib/feedback-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSession(token)) return NextResponse.json({ error: 'Administrator access required.' }, { status: 401 });
  try {
    const records = await readFeedback();
    const search = new URL(request.url).searchParams;
    if (search.get('view') === 'all') {
      const rating = search.get('rating');
      if (rating && rating !== 'up' && rating !== 'down') {
        return NextResponse.json({ error: 'Rating filter must be up or down.' }, { status: 400 });
      }
      const filtered = records
        .filter((record) => !rating || record.rating === rating)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const pageSize = 20;
      const requestedPage = Number(search.get('page') || 1);
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      const page = Number.isFinite(requestedPage) ? Math.min(Math.max(1, Math.floor(requestedPage)), totalPages) : 1;
      return NextResponse.json({
        records: filtered.slice((page - 1) * pageSize, page * pageSize),
        totalRecords: filtered.length,
        page,
        pageSize,
        totalPages,
      });
    }
    return NextResponse.json(aggregateFeedback(records));
  } catch {
    return NextResponse.json({ error: 'Feedback analytics could not be loaded.' }, { status: 500 });
  }
}
