import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'equipment-app-auth';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Exclude static files, API routes, and the login page itself
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname === '/login' ||
    url.pathname.includes('.') // images, favicon, etc.
  ) {
    return NextResponse.next();
  }

  // Check for the authentication cookie
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const isAuthenticated = authCookie?.value === 'authenticated';

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
