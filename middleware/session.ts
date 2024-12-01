import type { NextRequest } from 'next/server'
import type { MiddlewareSessionData } from 'types'
import { prisma } from '@backend/database'
import { getPermissionsByRoleAndPlan } from './session.utils'

const validateSession = async (
  request: NextRequest,
): Promise<MiddlewareSessionData | null> => {
  try {
    const sessionToken =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!sessionToken) return null

    const session = await prisma.session.findUnique({
      where: {
        sessionToken,
      },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            plan: true,
            active: true,
          },
        },
      },
    })

    if (session && session.expires < new Date()) {
      await prisma.session
        .delete({
          where: { id: session.id },
        })
        .catch((err) => {
          console.error('Failed to delete expired session:', err)
        })
      return null
    }

    if (!session) {
      return null
    }

    if (!session.user || !session.user.active) {
      return null
    }

    const permissions = getPermissionsByRoleAndPlan(
      session.user.role,
      session.user.plan,
    )

    await prisma.session
      .update({
        where: { id: session.id },
        data: {
          ipAddress: request.ip,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
      .catch(() => {
        // Ignore update errors - don't break the flow if this fails
      })

    return {
      userId: session.user.id,
      role: session.user.role,
      plan: session.user.plan,
      active: session.user.active,
      permissions,
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

const isValidSession = (
  session: MiddlewareSessionData | null,
): session is MiddlewareSessionData => {
  return (
    session !== null &&
    typeof session.userId === 'string' &&
    typeof session.role === 'string' &&
    Array.isArray(session.permissions)
  )
}

export { validateSession, isValidSession }
