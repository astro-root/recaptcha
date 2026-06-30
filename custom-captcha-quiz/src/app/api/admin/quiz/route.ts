import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const quizzes = await prisma.quiz.findMany({
    include: { _count: { select: { questions: true, sessions: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(quizzes)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, maxAttempts, sessionMax, questionsPerSession } = body
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const quiz = await prisma.quiz.create({
    data: { title, description: description ?? null, maxAttempts: maxAttempts ?? 3, sessionMax: sessionMax ?? 10, questionsPerSession: questionsPerSession ?? 3 },
  })
  return NextResponse.json(quiz, { status: 201 })
}
