import Link from 'next/link'
import { prisma } from '@/lib/prisma'

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
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Admin Panel</h1>
          <p className="text-muted text-sm">Manage quizzes and view statistics</p>
        </div>
        <Link href="/admin/quiz/new" className="btn btn-primary">+ New Quiz</Link>
      </div>
      {quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <p className="text-muted">No quizzes yet.</p>
          <Link href="/admin/quiz/new" className="btn btn-primary mt-3">Create Quiz</Link>
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
                    <span className="badge badge-accent">{q._count.questions} questions</span>
                    <span className="badge badge-success">{q._count.sessions} sessions</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/admin/quiz/${q.id}/stats`} className="btn btn-secondary btn-sm">Stats</Link>
                  <Link href={`/admin/quiz/${q.id}`} className="btn btn-primary btn-sm">Edit</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
