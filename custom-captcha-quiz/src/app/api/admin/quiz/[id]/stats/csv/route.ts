import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params

  const sessions = await prisma.session.findMany({
    where: { quizId },
    include: {
      answers: {
        include: { question: { select: { text: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows: string[] = [
    'Session ID,Created At,Completed,Total Time (s),Question,Correct,Time (s),Attempt',
  ]

  for (const s of sessions) {
    const lastPerQ = new Map<string, typeof s.answers[number]>()
    for (const a of s.answers) lastPerQ.set(a.questionId, a)

    if (lastPerQ.size === 0) {
      rows.push(`${s.id},${s.createdAt.toISOString()},${s.completed},${s.totalTime ?? ''},(no answers),,,`)
    } else {
      for (const a of lastPerQ.values()) {
        const q = a.question.text.replace(/"/g, '""')
        rows.push(`${s.id},${s.createdAt.toISOString()},${s.completed},${s.totalTime ?? ''},"${q}",${a.isCorrect},${a.timeTaken ?? ''},${a.attempt}`)
      }
    }
  }

  const csv = rows.join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="quiz-${quizId}-stats.csv"`,
    },
  })
}
