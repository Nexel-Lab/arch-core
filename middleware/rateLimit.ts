const rateLimitStore = new Map<
  string,
  { requests: number; timestamp: number }
>()

export function checkRateLimit(
  ip: string,
  { requests, window }: { requests: number; window: number },
): boolean {
  const now = Date.now()
  const key = `rate_limit:${ip}`
  const record = rateLimitStore.get(key)

  if (!record) {
    rateLimitStore.set(key, { requests: 1, timestamp: now })
    return false
  }

  if (now - record.timestamp > window * 1000) {
    rateLimitStore.set(key, { requests: 1, timestamp: now })
    return false
  }

  if (record.requests >= requests) {
    return true
  }

  record.requests++
  return false
}

export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > 24 * 60 * 60 * 1000) {
      rateLimitStore.delete(key)
    }
  }
}
