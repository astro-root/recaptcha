import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { GridIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function QuizListPage() {
  const quizzes = await prisma.quiz.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container page">
      <div className="mb-4">
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>利用可能なクイズ</h1>
        <p className="text-muted text-sm">クイズを選んで人間性の確認を行ってください</p>
      </div>
      {quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <GridIcon size={32} color="var(--text3)" />
          <p className="text-muted mt-3">利用可能なクイズがありません。</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quizzes.map((q: typeof quizzes[number]) => (
            <div key={q.id} className="card">
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.title}</div>
                  {q.description && <p className="text-muted text-sm">{q.description}</p>}
                  <span className="badge badge-accent mt-2">問題数 {q._count.questions}</span>
                </div>
                <Link href={`/quiz/${q.id}`} className="btn btn-primary">開始</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
