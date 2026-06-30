'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewQuizPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [maxAttempts, setMaxAttempts] = useState(3)
  const [sessionMax, setSessionMax] = useState(10)
  const [questionsPerSession, setQuestionsPerSession] = useState(3)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, maxAttempts, sessionMax, questionsPerSession }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return }
      const quiz = await res.json()
      router.push(`/admin/quiz/${quiz.id}`)
    } finally { setLoading(false) }
  }

  return (
    <div className="container page">
      <div className="mb-4">
        <Link href="/admin" className="text-muted text-sm">← Back to Admin</Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>Create New Quiz</h1>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="form-group">
          <label className="label">Quiz Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Image Recognition Test" />
        </div>
        <div className="form-group">
          <label className="label">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description" style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="label">Max Attempts/Q</label>
            <input type="number" min={1} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Session Max</label>
            <input type="number" min={1} value={sessionMax} onChange={e => setSessionMax(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Questions/Session</label>
            <input type="number" min={1} value={questionsPerSession} onChange={e => setQuestionsPerSession(Number(e.target.value))} />
          </div>
        </div>
        {error && <p className="error-msg mb-3">{error}</p>}
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Create Quiz'}
        </button>
      </div>
    </div>
  )
}
