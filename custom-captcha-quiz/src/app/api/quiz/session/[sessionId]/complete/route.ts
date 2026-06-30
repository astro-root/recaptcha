import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionToken } from '@/lib/hmac'

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const body = await req.json()
  const { token, signature, totalTime } = body

  if (!token || !signature) return NextResponse.json({ error: 'Missing auth' }, { status: 401 })
  if (!verifySessionToken(token, signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { answers: { include: { question: { select: { text: true } } }, orderBy: { createdAt: 'asc' } } },
  })
  if (!session || session.token !== token) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  await prisma.session.update({ where: { id: sessionId }, data: { completed: true, totalTime: totalTime ?? null } })

  const lastPerQuestion = new Map<string, typeof session.answers[number]>()
  for (const a of session.answers) lastPerQuestion.set(a.questionId, a)

  const results = Array.from(lastPerQuestion.values()).map(a => ({
    questionId: a.questionId,
    questionText: a.question.text,
    isCorrect: a.isCorrect,
    timeTaken: a.timeTaken,
    attempt: a.attempt,
  }))

  const correct = results.filter(r => r.isCorrect).length
  return NextResponse.json({ results, correct, total: results.length, totalTime })
}
