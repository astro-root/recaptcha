import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; questionId: string; choiceId: string }> }) {
  const { choiceId } = await params
  const body = await req.json()
  const choice = await prisma.choice.update({
    where: { id: choiceId },
    data: { text: body.text, imageUrl: body.imageUrl ?? null, isCorrect: body.isCorrect ?? false },
  })
  return NextResponse.json(choice)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; questionId: string; choiceId: string }> }) {
  const { choiceId } = await params
  await prisma.choice.delete({ where: { id: choiceId } })
  return NextResponse.json({ ok: true })
}
