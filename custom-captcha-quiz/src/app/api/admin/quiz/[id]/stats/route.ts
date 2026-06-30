import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: 'asc' } } },
  })
  if (!quiz) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const sessions = await prisma.session.findMany({
    where: { quizId },
    include: { answers: true },
    orderBy: { createdAt: 'desc' },
  })

  const questionStats = await Promise.all(
    quiz.questions.map(async (q) => {
      const answers = await prisma.answer.findMany({
        where: { questionId: q.id },
        orderBy: { createdAt: 'asc' },
      })
      const attempts = answers.length
      const correct = answers.filter(a => a.isCorrect).length
      const times = answers.map(a => a.timeTaken).filter((t): t is number => t !== null)
      const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
      return { questionId: q.id, questionText: q.text, attempts, correct, avgTime }
    })
  )

  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.completed).length
  const totalTime = sessions.map(s => s.totalTime).filter((t): t is number => t !== null)
  const avgTotalTime = totalTime.length > 0 ? Math.round(totalTime.reduce((a, b) => a + b, 0) / totalTime.length) : 0

  return NextResponse.json({ quiz, questionStats, totalSessions, completedSessions, avgTotalTime, sessions })
}
