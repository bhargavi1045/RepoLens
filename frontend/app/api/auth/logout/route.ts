import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {

  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0), 
    path: '/',
  });
  return res;
}
