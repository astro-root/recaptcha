import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSessionToken } from '@/lib/hmac'
import { randomBytes } from 'crypto'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { quizId } = body
  if (!quizId) return NextResponse.json({ error: 'quizId required' }, { status: 400 })

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { choices: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
  })
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  if (quiz.questions.length === 0) return NextResponse.json({ error: 'Quiz has no questions' }, { status: 400 })

  const sessionCount = await prisma.session.count({ where: { quizId } })
  if (sessionCount >= quiz.sessionMax) return NextResponse.json({ error: 'Session limit reached' }, { status: 429 })

  const sessionId = randomBytes(16).toString('hex')
  const { token, signature } = createSessionToken(quizId, sessionId)
  const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null
  const userAgent = req.headers.get('user-agent') ?? null

  await prisma.session.create({
    data: { id: sessionId, quizId, token, signature, ipAddress, userAgent },
  })

  const selected = shuffle(quiz.questions).slice(0, quiz.questionsPerSession)
  const questions = selected.map(q => {
    const correctCount = q.choices.filter(c => c.isCorrect).length
    return {
      id: q.id,
      text: q.text,
      multiSelect: correctCount > 1,
      correctCount,
      choices: shuffle(q.choices).map(c => ({ id: c.id, text: c.text, imageUrl: c.imageUrl })),
    }
  })

  return NextResponse.json({
    sessionId, token, signature,
    quizTitle: quiz.title,
    maxAttempts: quiz.maxAttempts,
    questions,
  }, { status: 201 })
}
