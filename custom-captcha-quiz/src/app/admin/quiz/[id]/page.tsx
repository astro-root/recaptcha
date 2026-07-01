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
  const [directUrl, setDirectUrl] = useState('')
  const [signedUrl, setSignedUrl] = useState('')
  const [copiedDirect, setCopiedDirect] = useState(false)
  const [copiedSigned, setCopiedSigned] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/quiz/${id}`)
    if (res.ok) setQuiz(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (typeof window !== 'undefined') setDirectUrl(`${window.location.origin}/quiz/${id}`)
  }, [id])

  async function copyDirect() {
    await navigator.clipboard.writeText(directUrl).catch(() => {})
    setCopiedDirect(true); setTimeout(() => setCopiedDirect(false), 2000)
  }

  async function generateSignedUrl() {
    const res = await fetch('/api/quiz/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: id }),
    })
    const data = await res.json()
    const full = `${window.location.origin}${data.url}`
    setSignedUrl(full)
    await navigator.clipboard.writeText(full).catch(() => {})
    setCopiedSigned(true); setTimeout(() => setCopiedSigned(false), 2000)
  }

  async function saveQuiz() {
    if (!quiz) return
    setSaving(true)
    await fetch(`/api/admin/quiz/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newQText }),
    })
    setNewQText(''); await load()
  }

  async function deleteQuestion(qId: string) {
    if (!confirm('この問題を削除しますか？')) return
    await fetch(`/api/admin/quiz/${id}/question/${qId}`, { method: 'DELETE' })
    await load()
  }

  async function updateQuestion(qId: string, text: string) {
    await fetch(`/api/admin/quiz/${id}/question/${qId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    await load()
  }

  async function addChoice(qId: string, text: string, imageUrl: string, isCorrect: boolean) {
    await fetch(`/api/admin/quiz/${id}/question/${qId}/choice`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, imageUrl: imageUrl || null, isCorrect }),
    })
    await load()
  }

  async function updateChoice(qId: string, choice: Choice, updates: Partial<Choice>) {
    await fetch(`/api/admin/quiz/${id}/question/${qId}/choice/${choice.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: updates.text ?? choice.text, imageUrl: updates.imageUrl ?? choice.imageUrl, isCorrect: updates.isCorrect ?? choice.isCorrect }),
    })
    await load()
  }

  async function deleteChoice(qId: string, cId: string) {
    await fetch(`/api/admin/quiz/${id}/question/${qId}/choice/${cId}`, { method: 'DELETE' })
    await load()
  }

  if (loading) return <div className="container page"><p className="text-muted">読み込み中...</p></div>
  if (!quiz) return <div className="container page"><p className="text-danger">クイズが見つかりません</p></div>

  return (
    <div className="container page">
      <div className="mb-4">
        <Link href="/admin" className="text-muted text-sm" style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
          <ArrowLeftIcon size={14} />管理画面に戻る
        </Link>
      </div>

      <div className="card mb-4">
        <h2 style={{ fontSize:'clamp(14px,4vw,16px)', fontWeight:700, marginBottom:16 }}>クイズ設定</h2>
        <div className="form-group">
          <label className="label">タイトル</label>
          <input value={quiz.title} onChange={e => setQuiz({ ...quiz, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="label">説明</label>
          <textarea value={quiz.description ?? ''} onChange={e => setQuiz({ ...quiz, description: e.target.value })} rows={2} style={{ resize:'vertical' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:16 }}>
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
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
          <button className="btn btn-primary" onClick={saveQuiz} disabled={saving} style={{ borderRadius:3 }}>{saving ? '保存中...' : '設定を保存'}</button>
          <button className="btn btn-danger" onClick={deleteQuiz} style={{ borderRadius:3 }}><TrashIcon size={13} />削除</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div>
            <label className="label">配布URL（直接リンク）</label>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ flex:1, padding:'8px 12px', background:'#f9f9f9', borderRadius:3, border:'1px solid var(--border)', fontSize:12, fontFamily:'monospace', color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {directUrl}
              </div>
              <button onClick={copyDirect} className="btn btn-secondary btn-sm" style={{ borderRadius:3, whiteSpace:'nowrap', flexShrink:0 }}>
                {copiedDirect ? <><CheckIcon size={13} />コピー済</> : <><LinkIcon size={13} />コピー</>}
              </button>
            </div>
          </div>
          <div>
            <label className="label">署名付きURL（改ざん防止）</label>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ flex:1, padding:'8px 12px', background:'#f9f9f9', borderRadius:3, border:'1px solid var(--border)', fontSize:12, fontFamily:'monospace', color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {signedUrl || '（ボタンを押して生成）'}
              </div>
              <button onClick={generateSignedUrl} className="btn btn-secondary btn-sm" style={{ borderRadius:3, whiteSpace:'nowrap', flexShrink:0 }}>
                {copiedSigned ? <><CheckIcon size={13} />コピー済</> : <><LinkIcon size={13} />{signedUrl ? 'コピー' : '生成'}</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize:'clamp(14px,4vw,16px)', fontWeight:700, marginBottom:12 }}>問題一覧（{quiz.questions.length}件）</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:22 }}>
        {quiz.questions.map((q, qi) => (
          <QuestionEditor key={q.id} question={q} index={qi}
            onDelete={() => deleteQuestion(q.id)}
            onUpdate={(text) => updateQuestion(q.id, text)}
            onAddChoice={(text, imageUrl, isCorrect) => addChoice(q.id, text, imageUrl, isCorrect)}
            onUpdateChoice={(choice, updates) => updateChoice(q.id, choice, updates)}
            onDeleteChoice={(cId) => deleteChoice(q.id, cId)}
          />
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>問題を追加</h3>
        <div style={{ display:'flex', gap:8 }}>
          <input value={newQText} onChange={e => setNewQText(e.target.value)} placeholder="問題文を入力..." onKeyDown={e => { if (e.key === 'Enter') addQuestion() }} />
          <button className="btn btn-primary" onClick={addQuestion} style={{ whiteSpace:'nowrap', borderRadius:3, flexShrink:0 }}>
            <PlusIcon size={14} />追加
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionEditor({ question, index, onDelete, onUpdate, onAddChoice, onUpdateChoice, onDeleteChoice }: {
  question: Question; index: number
  onDelete: () => void
  onUpdate: (text: string) => void
  onAddChoice: (text: string, imageUrl: string, isCorrect: boolean) => void
  onUpdateChoice: (choice: Choice, updates: Partial<Choice>) => void
  onDeleteChoice: (id: string) => void
}) {
  const [editingQ, setEditingQ] = useState(false)
  const [qText, setQText] = useState(question.text)
  const [cText, setCText] = useState('')
  const [cImage, setCImage] = useState('')
  const [cCorrect, setCCorrect] = useState(false)
  const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null)
  const [editChoiceText, setEditChoiceText] = useState('')
  const [editChoiceImage, setEditChoiceImage] = useState('')

  async function saveQuestion() {
    if (!qText.trim()) return
    await onUpdate(qText)
    setEditingQ(false)
  }

  async function handleAdd() {
    if (!cText.trim()) return
    await onAddChoice(cText, cImage, cCorrect)
    setCText(''); setCImage(''); setCCorrect(false)
  }

  function startEditChoice(c: Choice) {
    setEditingChoiceId(c.id)
    setEditChoiceText(c.text)
    setEditChoiceImage(c.imageUrl ?? '')
  }

  async function saveChoice(c: Choice) {
    await onUpdateChoice(c, { text: editChoiceText, imageUrl: editChoiceImage || null })
    setEditingChoiceId(null)
  }

  return (
    <div className="card" style={{ borderLeft:'3px solid #4a90d9', padding:'16px 18px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <span style={{ fontWeight:700, color:'#4a90d9', fontSize:13, flexShrink:0 }}>問{index + 1}</span>
          {editingQ ? (
            <div style={{ display:'flex', gap:6, flex:1, flexWrap:'wrap' }}>
              <input value={qText} onChange={e => setQText(e.target.value)} style={{ flex:1, minWidth:120, fontSize:13 }} autoFocus onKeyDown={e => { if (e.key === 'Enter') saveQuestion(); if (e.key === 'Escape') setEditingQ(false) }} />
              <button className="btn btn-primary btn-sm" onClick={saveQuestion} style={{ borderRadius:3 }}><CheckIcon size={13} />保存</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditingQ(false); setQText(question.text) }} style={{ borderRadius:3 }}>キャンセル</button>
            </div>
          ) : (
            <button onClick={() => setEditingQ(true)} style={{ background:'none', border:'none', textAlign:'left', fontSize:'clamp(12px,3.5vw,14px)', fontWeight:600, cursor:'pointer', color:'var(--text)', padding:'2px 4px', borderRadius:3, flex:1 }} title="クリックして編集">
              {question.text}
              <span style={{ fontSize:10, color:'#4a90d9', marginLeft:6 }}>編集</span>
            </button>
          )}
        </div>
        <button className="btn btn-danger btn-sm" onClick={onDelete} style={{ borderRadius:3, flexShrink:0 }}><TrashIcon size={13} />削除</button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
        {question.choices.map((c) => (
          <div key={c.id}>
            {editingChoiceId === c.id ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6, padding:'8px 10px', background:'#e8f0fb', borderRadius:3, border:'1px solid #4a90d9' }}>
                <input value={editChoiceText} onChange={e => setEditChoiceText(e.target.value)} placeholder="選択肢テキスト" style={{ fontSize:13 }} autoFocus />
                <input value={editChoiceImage} onChange={e => setEditChoiceImage(e.target.value)} placeholder="画像URL（任意）" style={{ fontSize:13 }} />
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => saveChoice(c)} style={{ borderRadius:3 }}><CheckIcon size={13} />保存</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingChoiceId(null)} style={{ borderRadius:3 }}>キャンセル</button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'#f9f9f9', borderRadius:3, border:`1px solid ${c.isCorrect ? 'var(--success)' : 'var(--border)'}` }}>
                <button onClick={() => onUpdateChoice(c, { isCorrect: !c.isCorrect })}
                  style={{ width:22, height:22, borderRadius:3, flexShrink:0, border:`2px solid ${c.isCorrect ? 'var(--success)' : '#c1c1c1'}`, background: c.isCorrect ? 'var(--success)' : '#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {c.isCorrect && <CheckIcon size={13} color="#fff" />}
                </button>
                <span style={{ flex:1, fontSize:'clamp(11px,3vw,13px)', wordBreak:'break-word' }}>{c.text}</span>
                {c.imageUrl && <span className="badge badge-accent"><ImageIcon size={11} />画像</span>}
                <button onClick={() => startEditChoice(c)} className="btn btn-secondary btn-sm" style={{ padding:'3px 8px', borderRadius:3, flexShrink:0, fontSize:11 }}>編集</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDeleteChoice(c.id)} style={{ padding:'4px 8px', borderRadius:3, flexShrink:0 }}><TrashIcon size={12} /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
        <input value={cText} onChange={e => setCText(e.target.value)} placeholder="選択肢のテキスト" style={{ fontSize:13 }} onKeyDown={e => { if (e.key === 'Enter') handleAdd() }} />
        <input value={cImage} onChange={e => setCImage(e.target.value)} placeholder="画像URL（任意）" style={{ fontSize:13 }} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text2)', cursor:'pointer', userSelect:'none' }}>
          <input type="checkbox" checked={cCorrect} onChange={e => setCCorrect(e.target.checked)} style={{ width:'auto' }} />
          正解
        </label>
        <button className="btn btn-secondary btn-sm" onClick={handleAdd} style={{ borderRadius:3 }}>
          <PlusIcon size={13} />選択肢を追加
        </button>
      </div>
    </div>
  )
}
