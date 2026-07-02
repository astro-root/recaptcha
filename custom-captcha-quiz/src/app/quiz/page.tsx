import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function QuizListPage() {
  const quizzes = await prisma.quiz.findMany({
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container page">
      <div className="mb-4">
        <h1 style={{ fontSize: 'clamp(17px,4vw,21px)', fontWeight: 700, marginBottom: 4 }}>利用可能なクイズ</h1>
        <p className="text-muted text-sm">クイズを選んで人間性の確認を行ってください</p>
      </div>
      {quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p className="text-muted">利用可能なクイズがありません。</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {quizzes.map((q: typeof quizzes[number]) => (
            <div key={q.id} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 'clamp(13px,3.5vw,15px)', wordBreak: 'break-word' }}>{q.title}</div>
                  {q.description && <p className="text-muted text-sm" style={{ marginBottom: 8 }}>{q.description}</p>}
                  <span className="badge badge-accent">問題数 {q._count.questions}</span>
                </div>
                <Link href={`/quiz/${q.id}`} className="btn btn-primary btn-sm" style={{ borderRadius: 3, flexShrink: 0 }}>開始</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
