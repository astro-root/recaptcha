'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon, PlusIcon, TrashIcon, CheckIcon, LinkIcon, ImageIcon } from '@/components/icons'

interface Choice { id: string; text: string; imageUrl: string | null; isCorrect: boolean; order: number }
interface Question { id: string; text: string; order: number; choices: Choice[] }
interface Quiz { id: string; title: string; description: string | null; maxAttempts: number; sessionMax: number; questionsPerSession: number; questions: Question[] }

export default function QuizEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newQText, setNewQText] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [signedUrl, setSignedUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/quiz/${id}`)
    if (res.ok) setQuiz(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (typeof window !== 'undefined') setShareUrl(`${window.location.origin}/quiz/${id}`)
  }, [id])

  async function generateSignedUrl() {
    const res = await fetch('/api/quiz/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: id }),
    })
    const data = await res.json()
    const full = `${window.location.origin}${data.url}`
    setSignedUrl(full)
    await navigator.clipboard.writeText(full).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveQuiz() {
    if (!quiz) return
    setSaving(true)
    await fetch(`/api/admin/quiz/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: quiz.title, description: quiz.description, maxAttempts: quiz.maxAttempts, sessionMax: quiz.sessionMax, questionsPerSession: quiz.questionsPerSession }),
    })
    setSaving(false)
  }

  async function deleteQuiz() {
    if (!confirm('このクイズを削除しますか？')) return
    await fetch(`/api/admin/quiz/${id}`, { method: 'DELETE' })
    router.push('/admin')
  }

  async function addQuestion() {
    if (!newQText.trim()) return
    await fetch(`/api/admin/quiz/${id}/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newQText }),
    })
    setNewQText(''); await load()
  }

  async function deleteQuestion(qId: string) {
    if (!confirm('この問題を削除しますか？')) return
    await fetch(`/api/admin/quiz/${id}/question/${qId}`, { method: 'DELETE' })
    await load()
  }

  async function addChoice(qId: string, text: string, imageUrl: string, isCorrect: boolean) {
    await fetch(`/api/admin/quiz/${id}/question/${qId}/choice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, imageUrl: imageUrl || null, isCorrect }),
    })
    await load()
  }

  async function deleteChoice(qId: string, cId: string) {
    await fetch(`/api/admin/quiz/${id}/question/${qId}/choice/${cId}`, { method: 'DELETE' })
    await load()
  }

  async function toggleCorrect(qId: string, choice: Choice) {
    await fetch(`/api/admin/quiz/${id}/question/${qId}/choice/${choice.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: choice.text, imageUrl: choice.imageUrl, isCorrect: !choice.isCorrect }),
    })
    await load()
  }

  if (loading) return <div className="container page"><p className="text-muted">読み込み中...</p></div>
  if (!quiz) return <div className="container page"><p className="text-danger">クイズが見つかりません</p></div>

  return (
    <div className="container page">
      <div className="mb-4">
        <Link href="/admin" className="text-muted text-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeftIcon size={14} />
          管理画面に戻る
        </Link>
      </div>
      <div className="card mb-4">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>クイズ設定</h2>
        <div className="form-group">
          <label className="label">タイトル</label>
          <input value={quiz.title} onChange={e => setQuiz({ ...quiz, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="label">説明</label>
          <textarea value={quiz.description ?? ''} onChange={e => setQuiz({ ...quiz, description: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="label">問題ごとの試行上限</label>
            <input type="number" min={1} value={quiz.maxAttempts} onChange={e => setQuiz({ ...quiz, maxAttempts: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">セッション上限</label>
            <input type="number" min={1} value={quiz.sessionMax} onChange={e => setQuiz({ ...quiz, sessionMax: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">1回の出題数</label>
            <input type="number" min={1} value={quiz.questionsPerSession} onChange={e => setQuiz({ ...quiz, questionsPerSession: Number(e.target.value) })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={saveQuiz} disabled={saving}>{saving ? '保存中...' : '設定を保存'}</button>
          <button className="btn btn-danger" onClick={deleteQuiz}>
            <TrashIcon size={13} />
            クイズを削除
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <span className="label" style={{ display: 'inline', marginRight: 8 }}>共有URL：</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text2)' }}>{shareUrl}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={generateSignedUrl} style={{ whiteSpace: 'nowrap' }}>
              <LinkIcon size={14} />
              署名付きURLを発行
            </button>
            {copied && <span className="text-success text-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckIcon size={13} />コピーしました</span>}
          </div>
          {signedUrl && (
            <div style={{ padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 'var(--radius)', border: '1px solid var(--accent)' }}>
              <span className="label" style={{ display: 'inline', marginRight: 8 }}>署名付きURL：</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)', wordBreak: 'break-all' }}>{signedUrl}</span>
            </div>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>問題一覧（{quiz.questions.length}件）</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {quiz.questions.map((q, qi) => (
          <QuestionEditor key={q.id} question={q} index={qi}
            onDelete={() => deleteQuestion(q.id)}
            onAddChoice={(text, imageUrl, isCorrect) => addChoice(q.id, text, imageUrl, isCorrect)}
            onDeleteChoice={(cId) => deleteChoice(q.id, cId)}
            onToggleCorrect={(c) => toggleCorrect(q.id, c)}
          />
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>問題を追加</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newQText} onChange={e => setNewQText(e.target.value)} placeholder="問題文を入力..." onKeyDown={e => { if (e.key === 'Enter') addQuestion() }} />
          <button className="btn btn-primary" onClick={addQuestion} style={{ whiteSpace: 'nowrap' }}>
            <PlusIcon size={14} />
            追加
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionEditor({ question, index, onDelete, onAddChoice, onDeleteChoice, onToggleCorrect }: {
  question: Question; index: number
  onDelete: () => void
  onAddChoice: (text: string, imageUrl: string, isCorrect: boolean) => void
  onDeleteChoice: (id: string) => void
  onToggleCorrect: (c: Choice) => void
}) {
  const [cText, setCText] = useState('')
  const [cImage, setCImage] = useState('')
  const [cCorrect, setCCorrect] = useState(false)

  async function handleAdd() {
    if (!cText.trim()) return
    await onAddChoice(cText, cImage, cCorrect)
    setCText(''); setCImage(''); setCCorrect(false)
  }

  return (
    <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
      <div className="flex-between mb-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>問{index + 1}</span>
          <span style={{ fontWeight: 600 }}>{question.text}</span>
        </div>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          <TrashIcon size={13} />
          削除
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {question.choices.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface2)', borderRadius: 'var(--radius)', border: `1px solid ${c.isCorrect ? 'var(--success)' : 'var(--border)'}` }}>
            <button
              onClick={() => onToggleCorrect(c)}
              style={{
                width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                border: `2px solid ${c.isCorrect ? 'var(--success)' : 'var(--border)'}`,
                background: c.isCorrect ? 'var(--success)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {c.isCorrect && <CheckIcon size={13} color="#fff" />}
            </button>
            <span style={{ flex: 1, fontSize: 13 }}>{c.text}</span>
            {c.imageUrl && <span className="badge badge-accent"><ImageIcon size={11} />画像</span>}
            <button className="btn btn-danger btn-sm" onClick={() => onDeleteChoice(c.id)} style={{ padding: '4px 8px' }}>
              <TrashIcon size={12} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, alignItems: 'center' }}>
        <input value={cText} onChange={e => setCText(e.target.value)} placeholder="選択肢のテキスト" style={{ fontSize: 13 }} onKeyDown={e => { if (e.key === 'Enter') handleAdd() }} />
        <input value={cImage} onChange={e => setCImage(e.target.value)} placeholder="画像URL（任意）" style={{ fontSize: 13 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
          <input type="checkbox" checked={cCorrect} onChange={e => setCCorrect(e.target.checked)} style={{ width: 'auto' }} />
          正解
        </label>
        <button className="btn btn-secondary btn-sm" onClick={handleAdd} style={{ whiteSpace: 'nowrap' }}>
          <PlusIcon size={13} />
          選択肢追加
        </button>
      </div>
    </div>
  )
}
