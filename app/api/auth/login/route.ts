import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      const sessionExpiry = new Date(Date.now() + SESSION_DURATION);
      
      cookieStore.set('admin-session', 'authenticated', {
        expires: sessionExpiry,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      return NextResponse.json({ 
        success: true,
        message: 'Login successful'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
