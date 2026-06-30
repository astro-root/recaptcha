import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params
  const body = await req.json()
  if (!body.text) return NextResponse.json({ error: 'text required' }, { status: 400 })
  const count = await prisma.question.count({ where: { quizId } })
  const question = await prisma.question.create({
    data: { quizId, text: body.text, order: count },
    include: { choices: true },
  })
  return NextResponse.json(question, { status: 201 })
}
