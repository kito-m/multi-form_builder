import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin-session');
  
  return session && session.value === 'authenticated';
}

export async function requireAuth() {
  const isAuthenticated = await checkAuth();
  
  if (!isAuthenticated) {
    redirect('/login');
  }
}