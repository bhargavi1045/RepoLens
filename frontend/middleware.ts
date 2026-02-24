import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const protectedPaths = ['/landing', '/dashboard'];
  const { pathname } = request.nextUrl;

  if (protectedPaths.some(path => pathname.startsWith(path)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/landing', '/dashboard'],
};
