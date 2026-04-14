import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/types';

// Page-level role restrictions (UI routes only, not API)
const pageRoleAccess: Record<string, UserRole[]> = {
  '/settings': ['admin'],
  '/patients': ['admin', 'doctor', 'receptionist'],
  '/records': ['admin', 'doctor'],
  '/lab': ['admin', 'doctor', 'lab-tech'],
  '/imaging': ['admin', 'doctor'],
  '/pharmacy': ['admin', 'pharmacist'],
  '/billing': ['admin', 'billing', 'receptionist'],
  '/reports': ['admin', 'billing', 'doctor'],
};

// Pages receptionist can access
const receptionistPages = ['/dashboard', '/appointments', '/billing', '/patients'];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const isApi = pathname.startsWith('/api/');

    // API routes: let them through — each API route handles its own auth/role checks
    // This prevents HTML redirects breaking JSON responses
    if (isApi) {
      return NextResponse.next();
    }

    // Page routes: role-based access
    const basePath = '/' + pathname.split('/')[1];

    // Receptionist: restricted page access
    if (token?.role === 'receptionist') {
      if (!receptionistPages.includes(basePath)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Other roles: check page access
    const allowedRoles = pageRoleAccess[basePath];
    if (allowedRoles && token?.role) {
      if (!allowedRoles.includes(token.role as UserRole)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/patients/:path*',
    '/appointments/:path*',
    '/records/:path*',
    '/lab/:path*',
    '/imaging/:path*',
    '/pharmacy/:path*',
    '/billing/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/api/dashboard/:path*',
    '/api/patients/:path*',
    '/api/appointments/:path*',
    '/api/records/:path*',
    '/api/lab/:path*',
    '/api/imaging/:path*',
    '/api/pharmacy/:path*',
    '/api/billing/:path*',
    '/api/reports/:path*',
    '/api/settings/:path*',
    '/api/sidebar/:path*',
    '/api/alerts/:path*',
  ],
};
