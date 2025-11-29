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
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/products',
    '/cart',
    '/checkout',
    '/pricing-test',
    '/test-payments',
    '/square-test',
    '/api/auth',
    '/api/products',
    '/api/cart',
    '/api/checkout',
    '/api/shipping',
    '/api/files',
    '/api/addons',
    '/api/upload',
    '/api/health',
    '/api/orders/create',
  ];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If trying to access protected route without authentication
  if (!isPublicPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login/signup, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Admin-only routes
  if (pathname.startsWith('/admin')) {
    if (token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Staff and admin can access staff routes
  if (pathname.startsWith('/staff')) {
    if (token?.role !== 'staff' && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

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
