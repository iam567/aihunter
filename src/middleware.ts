import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;

  // e.areu.pro → /events にリダイレクト
  if (host.startsWith('e.') && pathname === '/') {
    return NextResponse.rewrite(new URL('/events', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/events'],
};
