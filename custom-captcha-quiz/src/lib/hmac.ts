import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.HMAC_SECRET ?? 'fallback-secret'

export function signPayload(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('hex')
}

export function verifySignature(payload: string, signature: string): boolean {
  const expected = signPayload(payload)
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}

export function createSessionToken(quizId: string, sessionId: string): { token: string; signature: string } {
  const token = `${quizId}:${sessionId}:${Date.now()}`
  return { token, signature: signPayload(token) }
}

export function verifySessionToken(token: string, signature: string): boolean {
  return verifySignature(token, signature)
}
