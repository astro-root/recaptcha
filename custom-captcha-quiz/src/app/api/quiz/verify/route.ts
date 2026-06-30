import { NextRequest, NextResponse } from 'next/server'
import { signPayload } from '@/lib/hmac'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { quizId } = body
  if (!quizId) return NextResponse.json({ error: 'quizId required' }, { status: 400 })
  const payload = `share:${quizId}`
  const signature = signPayload(payload)
  const url = `/quiz/${quizId}?sig=${signature}`
  return NextResponse.json({ url, signature })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const quizId = searchParams.get('quizId')
  const sig = searchParams.get('sig')
  if (!quizId || !sig) return NextResponse.json({ valid: false, error: 'Missing params' }, { status: 400 })
  const expected = signPayload(`share:${quizId}`)
  const valid = expected === sig
  return NextResponse.json({ valid })
}
