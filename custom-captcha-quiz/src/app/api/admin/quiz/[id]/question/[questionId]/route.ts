import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const { questionId } = await params
  const body = await req.json()
  const question = await prisma.question.update({
    where: { id: questionId },
    data: { text: body.text },
    include: { choices: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(question)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const { questionId } = await params
  await prisma.question.delete({ where: { id: questionId } })
  return NextResponse.json({ ok: true })
}
