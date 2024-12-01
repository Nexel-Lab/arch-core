import type { NextRequest } from 'next/server'
import type { MiddlewareSessionData } from 'types'
import { NextResponse } from 'next/server'

export function addCustomHeaders(
  response: NextResponse,
  requestStartTime: number,
) {
  const headers = response.headers
  headers.set('X-Request-Id', crypto.randomUUID())
  headers.set('X-Response-Time', `${Date.now() - requestStartTime}ms`)
}

export function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/portal', request.url)
  loginUrl.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export function logRequest(
  request: NextRequest,
  sessionData: MiddlewareSessionData | null,
) {
  if (process.env.NODE_ENV === 'development') {
    console.log({
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.nextUrl.pathname,
      userId: sessionData?.userId,
      role: sessionData?.role,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip,
    })
  }
}

export function logError(error: any, request: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    console.error({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip,
    })
  } else {
    // In production, log less detailed error info
    console.error({
      timestamp: new Date().toISOString(),
      error: error.message,
      path: request.nextUrl.pathname,
      method: request.method,
    })
  }
}
