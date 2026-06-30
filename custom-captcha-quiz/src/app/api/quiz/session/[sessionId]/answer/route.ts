import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionToken } from '@/lib/hmac'

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const body = await req.json()
  const { token, signature, questionId, choiceId, timeTaken } = body

  if (!token || !signature) return NextResponse.json({ error: 'Missing auth' }, { status: 401 })
  if (!verifySessionToken(token, signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })

  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.token !== token) return NextResponse.json({ error: 'Token mismatch' }, { status: 403 })
  if (session.completed) return NextResponse.json({ error: 'Session already completed' }, { status: 400 })

  const quiz = await prisma.quiz.findUnique({ where: { id: session.quizId } })
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

  const attemptCount = await prisma.answer.count({ where: { sessionId, questionId } })
  if (attemptCount >= quiz.maxAttempts) {
    return NextResponse.json({ error: 'Attempt limit reached', isCorrect: false, limitReached: true, attempt: attemptCount, maxAttempts: quiz.maxAttempts }, { status: 429 })
  }

  const choice = await prisma.choice.findUnique({ where: { id: choiceId } })
  if (!choice || choice.questionId !== questionId) return NextResponse.json({ error: 'Invalid choice' }, { status: 400 })

  const isCorrect = choice.isCorrect
  const attempt = attemptCount + 1
  await prisma.answer.create({
    data: { sessionId, questionId, choiceId, isCorrect, timeTaken: timeTaken ?? null, attempt },
  })

  return NextResponse.json({ isCorrect, attempt, maxAttempts: quiz.maxAttempts })
}
