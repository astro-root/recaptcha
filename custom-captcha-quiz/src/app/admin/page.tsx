import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PlusIcon, ChartIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const quizzes = await prisma.quiz.findMany({
    include: { _count: { select: { questions: true, sessions: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container page">
      <div className="flex-between mb-4" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(17px,4vw,21px)', fontWeight: 700, marginBottom: 4 }}>管理画面</h1>
          <p className="text-muted text-sm">クイズの作成・編集・統計の確認</p>
        </div>
        <Link href="/admin/quiz/new" className="btn btn-primary" style={{ borderRadius: 3 }}>
          <PlusIcon size={15} />新規クイズ作成
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p className="text-muted" style={{ marginBottom: 16 }}>クイズがまだありません。</p>
          <Link href="/admin/quiz/new" className="btn btn-primary" style={{ borderRadius: 3 }}>クイズを作成</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {quizzes.map((q: typeof quizzes[number]) => (
            <div key={q.id} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 'clamp(13px,3.5vw,15px)', wordBreak: 'break-word' }}>{q.title}</div>
                  {q.description && <p className="text-muted text-sm" style={{ marginBottom: 8, wordBreak: 'break-word' }}>{q.description}</p>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-accent">問題数 {q._count.questions}</span>
                    <span className="badge badge-success">受験数 {q._count.sessions}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link href={`/admin/quiz/${q.id}/stats`} className="btn btn-secondary btn-sm" style={{ borderRadius: 3 }}>
                    <ChartIcon size={13} /><span className="hide-sp">統計</span>
                  </Link>
                  <Link href={`/admin/quiz/${q.id}`} className="btn btn-primary btn-sm" style={{ borderRadius: 3 }}>編集</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
