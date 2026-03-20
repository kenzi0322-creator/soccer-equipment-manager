'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUTH_COOKIE_NAME = 'equipment-app-auth';
const APP_PASSWORD = process.env.APP_PASSWORD || 'secret'; // fallback mainly prevents crash if not set, though shouldn't rely on it

export async function login(formData: FormData) {
  const password = formData.get('password') as string;

  if (password !== APP_PASSWORD) {
    return { error: 'パスワードが間違っています。' };
  }

  // Set auth cookie
  // Note: in Next.js 15, cookies() is awaited
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect('/login');
}
