import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set('auth_token', token, {
    httpOnly: true,        
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax',    
    maxAge: 60 * 60 * 24 * 7, 
    path: '/',
  });

  return res;
}