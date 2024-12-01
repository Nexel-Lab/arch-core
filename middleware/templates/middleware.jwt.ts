import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export const config = {
  matcher: ['/app/:path*', '/dashboard/:path*', '/settings/:path*'],
}

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.role === 'admin'
        }
        return !!token // Returns true if user is authenticated
      },
    },

    pages: {
      signIn: '/portal',
    },
  },
)
