import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/api/auth', '/test-payments', '/square-test', '/products', '/cart', '/api/products', '/api/cart', '/images'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If trying to access protected route without authentication
  if (!isPublicPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login/signup, redirect to dashboard
  // The dashboard layout will handle role-based redirects
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Note: Role-based access control is handled by the layouts (admin/layout.tsx and dashboard/layout.tsx)
  // because getToken() in middleware doesn't run JWT callbacks to fetch the latest role from DB

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
