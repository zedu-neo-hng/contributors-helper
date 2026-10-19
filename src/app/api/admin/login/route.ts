import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, adminCredentialsConfigured, createAdminSession, verifyAdminCredentials } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!adminCredentialsConfigured()) {
    return NextResponse.json({ error: 'Admin access is not configured on this server.' }, { status: 503 });
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 2048) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const credentials = body && typeof body === 'object' ? body as { username?: unknown; password?: unknown } : {};
  if (!verifyAdminCredentials(credentials.username, credentials.password)) {
    return NextResponse.json({ error: 'Username or password is incorrect.' }, { status: 401 });
  }
  const session = createAdminSession();
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: session.maxAge,
  });
  return response;
}
