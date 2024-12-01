import { NextResponse } from 'next/server'

export function applySecurityHeaders(response: NextResponse) {
  const headers = response.headers
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  )

  headers.set(
    'Content-Security-Policy',
    `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
  `
      .replace(/\s+/g, ' ')
      .trim(),
  )
}
