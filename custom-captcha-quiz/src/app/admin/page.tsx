import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PlusIcon, GridIcon, ChartIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const quizzes = await prisma.quiz.findMany({
    include: { _count: { select: { questions: true, sessions: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container page">
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>管理画面</h1>
          <p className="text-muted text-sm">クイズの作成・編集・統計の確認</p>
        </div>
        <Link href="/admin/quiz/new" className="btn btn-primary">
          <PlusIcon size={15} />
          新規クイズ作成
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <GridIcon size={32} color="var(--text3)" />
          <p className="text-muted mt-3">クイズがまだありません。最初のクイズを作成しましょう。</p>
          <Link href="/admin/quiz/new" className="btn btn-primary mt-3">クイズを作成</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quizzes.map((q: typeof quizzes[number]) => (
            <div key={q.id} className="card">
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.title}</div>
                  {q.description && <p className="text-muted text-sm">{q.description}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span className="badge badge-accent">問題数 {q._count.questions}</span>
                    <span className="badge badge-success">受験数 {q._count.sessions}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/admin/quiz/${q.id}/stats`} className="btn btn-secondary btn-sm">
                    <ChartIcon size={13} />
                    統計
                  </Link>
                  <Link href={`/admin/quiz/${q.id}`} className="btn btn-primary btn-sm">編集</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
