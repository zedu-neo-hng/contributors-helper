import { NextResponse } from 'next/server';
import { saveFeedback, type Rating } from '@/lib/feedback-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 2048) return NextResponse.json({ error: 'Feedback request is too large.' }, { status: 413 });

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 2048) return NextResponse.json({ error: 'Feedback request is too large.' }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid feedback.' }, { status: 400 });
  const feedback = body as { responseId?: unknown; rating?: unknown; comment?: unknown };
  if (typeof feedback.responseId !== 'string' || !/^[0-9a-f-]{36}$/i.test(feedback.responseId)) {
    return NextResponse.json({ error: 'A valid response ID is required.' }, { status: 400 });
  }
  if (feedback.rating !== 'up' && feedback.rating !== 'down') {
    return NextResponse.json({ error: 'Rating must be up or down.' }, { status: 400 });
  }
  if (feedback.comment !== undefined && typeof feedback.comment !== 'string') {
    return NextResponse.json({ error: 'Comment must be text.' }, { status: 400 });
  }
  const comment = typeof feedback.comment === 'string' ? feedback.comment.trim() : '';
  if (comment.length > 500) return NextResponse.json({ error: 'Comments must be 500 characters or fewer.' }, { status: 400 });

  try {
    await saveFeedback({ responseId: feedback.responseId, rating: feedback.rating as Rating, comment: feedback.rating === 'down' ? comment : '' });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: 'Feedback could not be saved. Please try again later.' }, { status: 500 });
  }
}
