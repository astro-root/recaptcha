import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: 'asc' }, include: { choices: { orderBy: { order: 'asc' } } } } },
  })
  if (!quiz) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(quiz)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const quiz = await prisma.quiz.update({
    where: { id },
    data: { title: body.title, description: body.description, maxAttempts: body.maxAttempts, sessionMax: body.sessionMax, questionsPerSession: body.questionsPerSession },
  })
  return NextResponse.json(quiz)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.quiz.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
