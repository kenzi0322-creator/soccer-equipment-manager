'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const AUTH_COOKIE_NAME = 'equipment-app-auth';
if (!process.env.APP_PASSWORD) {
  throw new Error('[auth] APP_PASSWORD environment variable is not set. Set it in .env.local (development) or Vercel (production).');
}
const APP_PASSWORD = process.env.APP_PASSWORD;

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
