import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; questionId: string }> }) {
  const { questionId } = await params
  const body = await req.json()
  if (!body.text) return NextResponse.json({ error: 'text required' }, { status: 400 })
  const count = await prisma.choice.count({ where: { questionId } })
  const choice = await prisma.choice.create({
    data: { questionId, text: body.text, imageUrl: body.imageUrl ?? null, isCorrect: body.isCorrect ?? false, order: count },
  })
  return NextResponse.json(choice, { status: 201 })
}
