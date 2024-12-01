import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// const authPaths = ['/app', '/dashboard', '/settings']
export const config = {
  matcher: ['/app/:path*', '/dashboard/:path*', '/settings/:path*'],
}

export async function middleware(req: NextRequest) {
  const sessionToken =
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value

  if (!sessionToken) {
    const loginUrl = new URL('/portal', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}
