'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@/components/icons'

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
    if (!title.trim()) { setError('タイトルは必須です'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, maxAttempts, sessionMax, questionsPerSession }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'エラーが発生しました'); return }
      const quiz = await res.json()
      router.push(`/admin/quiz/${quiz.id}`)
    } finally { setLoading(false) }
  }

  return (
    <div className="container page">
      <div className="mb-4">
        <Link href="/admin" className="text-muted text-sm" style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
          <ArrowLeftIcon size={14} />管理画面に戻る
        </Link>
        <h1 style={{ fontSize:'clamp(17px,5vw,20px)', fontWeight:700, marginTop:10 }}>新規クイズ作成</h1>
      </div>
      <div className="card" style={{ maxWidth:560 }}>
        <div className="form-group">
          <label className="label">クイズタイトル *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="例：画像認識テスト" />
        </div>
        <div className="form-group">
          <label className="label">説明</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="任意の説明文" style={{ resize:'vertical' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:16 }}>
          <div>
            <label className="label">問題ごとの試行上限</label>
            <input type="number" min={1} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">セッション上限</label>
            <input type="number" min={1} value={sessionMax} onChange={e => setSessionMax(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">1回の出題数</label>
            <input type="number" min={1} value={questionsPerSession} onChange={e => setQuestionsPerSession(Number(e.target.value))} />
          </div>
        </div>
        {error && <p className="error-msg mb-3">{error}</p>}
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ borderRadius:3, width:'100%' }}>
          {loading ? '作成中...' : 'クイズを作成'}
        </button>
      </div>
    </div>
  )
}
