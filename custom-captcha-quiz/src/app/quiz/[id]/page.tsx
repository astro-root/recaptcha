'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldIcon, CheckIcon, XIcon, AlertIcon, SpinnerIcon, ClockIcon } from '@/components/icons'

interface Choice { id: string; text: string; imageUrl: string | null }
interface Question { id: string; text: string; choices: Choice[] }
interface SessionData { sessionId: string; token: string; signature: string; quizTitle: string; maxAttempts: number; questions: Question[] }
interface AnswerResult { isCorrect: boolean; attempt: number; maxAttempts: number; limitReached?: boolean }
interface FinalResult { questionId: string; questionText: string; isCorrect: boolean; timeTaken: number | null; attempt: number }

type Phase = 'verifying' | 'loading' | 'error' | 'quiz' | 'done'

function QuizInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const quizId = params.id as string
  const sig = searchParams.get('sig')

  const [phase, setPhase] = useState<Phase>(sig ? 'verifying' : 'loading')
  const [session, setSession] = useState<SessionData | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [answeredCorrect, setAnsweredCorrect] = useState<Set<string>>(new Set())
  const [errorMsg, setErrorMsg] = useState('')
  const [finalResults, setFinalResults] = useState<FinalResult[]>([])
  const [finalCorrect, setFinalCorrect] = useState(0)
  const [finalTotal, setFinalTotal] = useState(0)
  const [finalTime, setFinalTime] = useState(0)
  const startTimeRef = useRef<number>(Date.now())
  const questionStartRef = useRef<number>(Date.now())

  useEffect(() => {
    async function init() {
      if (sig) {
        const res = await fetch(`/api/quiz/verify?quizId=${quizId}&sig=${sig}`)
        const data = await res.json()
        if (!data.valid) { setErrorMsg('URLの署名が無効、または改ざんされています。'); setPhase('error'); return }
      }
      setPhase('loading')
      const res = await fetch('/api/quiz/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      })
      if (!res.ok) { const d = await res.json(); setErrorMsg(d.error ?? 'クイズを開始できませんでした'); setPhase('error'); return }
      const data: SessionData = await res.json()
      setSession(data)
      startTimeRef.current = Date.now()
      questionStartRef.current = Date.now()
      setPhase('quiz')
    }
    init()
  }, [quizId, sig])

  const currentQuestion = session?.questions[currentIdx]

  async function submitAnswer() {
    if (!session || !selectedChoice || !currentQuestion) return
    const timeTaken = Math.round((Date.now() - questionStartRef.current) / 1000)
    const res = await fetch(`/api/quiz/session/${session.sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: session.token, signature: session.signature, questionId: currentQuestion.id, choiceId: selectedChoice, timeTaken }),
    })
    const result: AnswerResult = await res.json()
    setAnswerResult(result)
    if (result.isCorrect) setAnsweredCorrect(prev => new Set(prev).add(currentQuestion.id))
  }

  async function nextQuestion() {
    setAnswerResult(null); setSelectedChoice(null)
    questionStartRef.current = Date.now()
    if (currentIdx + 1 < (session?.questions.length ?? 0)) {
      setCurrentIdx(prev => prev + 1)
    } else {
      if (!session) return
      const totalTime = Math.round((Date.now() - startTimeRef.current) / 1000)
      const res = await fetch(`/api/quiz/session/${session.sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: session.token, signature: session.signature, totalTime }),
      })
      const data = await res.json()
      setFinalResults(data.results ?? [])
      setFinalCorrect(data.correct ?? 0)
      setFinalTotal(data.total ?? 0)
      setFinalTime(data.totalTime ?? totalTime)
      setPhase('done')
    }
  }

  if (phase === 'verifying' || phase === 'loading') return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16, background: 'var(--bg)' }}>
      <SpinnerIcon size={30} color="var(--accent)" />
      <p className="text-muted">{phase === 'verifying' ? 'URLを検証しています...' : 'セッションを開始しています...'}</p>
    </div>
  )

  if (phase === 'error') return (
    <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: 380, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--danger)' }}>
          <AlertIcon size={30} />
        </div>
        <p className="text-danger" style={{ fontWeight: 600, marginBottom: 8 }}>クイズを開始できません</p>
        <p className="text-muted text-sm">{errorMsg}</p>
        <Link href="/quiz" className="btn btn-secondary mt-4">クイズ一覧に戻る</Link>
      </div>
    </div>
  )

  if (phase === 'done') {
    const passed = finalCorrect === finalTotal
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', padding: 20, background: 'var(--bg)' }}>
        <div className="card" style={{ maxWidth: 460, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 48, borderRadius: '50%', marginBottom: 12,
              background: passed ? 'var(--success-dim)' : 'var(--danger-dim)',
              color: passed ? 'var(--success)' : 'var(--danger)',
            }}>
              {passed ? <CheckIcon size={24} /> : <XIcon size={24} />}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{passed ? '確認が完了しました' : '確認に失敗しました'}</h2>
            <p className="text-muted text-sm">{finalCorrect} / {finalTotal} 問正解 ・ 合計 {finalTime} 秒</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {finalResults.map((r) => (
              <div key={r.questionId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${r.isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
                {r.isCorrect ? <CheckIcon size={14} color="var(--success)" /> : <XIcon size={14} color="var(--danger)" />}
                <span style={{ flex: 1, fontSize: 12.5 }}>{r.questionText}</span>
                <span className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ClockIcon size={12} />
                  {r.timeTaken ?? '?'}秒
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/quiz/${quizId}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>もう一度挑戦</Link>
            <Link href="/quiz" className="btn btn-secondary">クイズ一覧へ</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !currentQuestion) return null

  const isAnsweredCorrect = answeredCorrect.has(currentQuestion.id)
  const isLimitReached = answerResult !== null && !answerResult.isCorrect && (answerResult.limitReached || answerResult.attempt >= answerResult.maxAttempts)
  const canProceed = isAnsweredCorrect || isLimitReached
  const hasImages = currentQuestion.choices.some(c => c.imageUrl)

  return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', padding: 20, background: 'var(--bg)' }}>
      <div style={{
        width: '100%', maxWidth: hasImages ? 360 : 420,
        background: 'var(--surface)', borderRadius: 3,
        border: '1px solid var(--border-dark)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
      }}>
        <div style={{ background: 'var(--accent)', padding: '14px 18px', color: '#fff' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{currentQuestion.text}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>{session.quizTitle}（{currentIdx + 1} / {session.questions.length} 問）</div>
        </div>

        <div style={{ padding: 4 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: hasImages ? 'repeat(2, 1fr)' : '1fr',
            gap: hasImages ? 4 : 0,
          }}>
            {currentQuestion.choices.map((c) => {
              const isSelected = selectedChoice === c.id
              const showResult = !!answerResult && isSelected

              if (hasImages) {
                return (
                  <button
                    key={c.id}
                    onClick={() => { if (!isAnsweredCorrect) setSelectedChoice(c.id) }}
                    disabled={isAnsweredCorrect}
                    className="tile-flip"
                    style={{
                      position: 'relative', aspectRatio: '1', overflow: 'hidden',
                      border: 'none', cursor: isAnsweredCorrect ? 'not-allowed' : 'pointer',
                      background: '#eee',
                    }}
                  >
                    <img src={c.imageUrl ?? ''} alt={c.text} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {isSelected && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: showResult ? (answerResult!.isCorrect ? 'rgba(30,142,62,0.55)' : 'rgba(217,48,37,0.55)') : 'rgba(74,144,217,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {showResult
                            ? (answerResult!.isCorrect ? <CheckIcon size={18} color="var(--success)" /> : <XIcon size={18} color="var(--danger)" />)
                            : <CheckIcon size={18} color="var(--accent)" />}
                        </div>
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11,
                      padding: '4px 6px', textAlign: 'center',
                    }}>
                      {c.text}
                    </div>
                  </button>
                )
              }

              let borderColor = 'var(--border)', bg = 'var(--surface)'
              if (showResult) {
                borderColor = answerResult!.isCorrect ? 'var(--success)' : 'var(--danger)'
                bg = answerResult!.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)'
              } else if (isSelected) {
                borderColor = 'var(--accent)'; bg = 'var(--accent-dim)'
              }
              return (
                <button key={c.id} onClick={() => { if (!isAnsweredCorrect) setSelectedChoice(c.id) }} disabled={isAnsweredCorrect}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    border: `1px solid ${borderColor}`, background: bg, borderRadius: 'var(--radius)',
                    padding: '12px 14px', margin: 4, textAlign: 'left', color: 'var(--text)',
                    cursor: isAnsweredCorrect ? 'not-allowed' : 'pointer',
                  }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 3, flexShrink: 0,
                    border: `2px solid ${isSelected ? (showResult ? borderColor : 'var(--accent)') : 'var(--border-dark)'}`,
                    background: isSelected ? (showResult ? borderColor : 'var(--accent)') : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && (showResult
                      ? (answerResult!.isCorrect ? <CheckIcon size={12} color="#fff" /> : <XIcon size={12} color="#fff" />)
                      : <CheckIcon size={12} color="#fff" />)}
                  </div>
                  <span style={{ fontSize: 13.5 }}>{c.text}</span>
                </button>
              )
            })}
          </div>
        </div>

        {answerResult && (
          <div style={{
            margin: '0 8px 8px', display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 'var(--radius)',
            background: answerResult.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)',
            color: answerResult.isCorrect ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: 12.5,
          }}>
            {answerResult.isCorrect ? <CheckIcon size={14} /> : <XIcon size={14} />}
            {answerResult.isCorrect ? '正解です' : isLimitReached ? `不正解です（試行上限：${answerResult.attempt}/${answerResult.maxAttempts}）` : `不正解です。もう一度お試しください（${answerResult.attempt}/${answerResult.maxAttempts}）`}
          </div>
        )}

        <div style={{
          borderTop: '1px solid var(--border)', padding: '10px 14px', background: 'var(--surface2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text3)' }}>
            <ShieldIcon size={18} />
            <span style={{ fontSize: 9, fontWeight: 600 }}>QuizShield</span>
          </div>
          {!canProceed && <button className="btn btn-primary btn-sm" onClick={submitAnswer} disabled={!selectedChoice}>確認</button>}
          {canProceed && <button className="btn btn-primary btn-sm" onClick={nextQuestion}>{currentIdx + 1 < session.questions.length ? '次へ' : '結果を見る'}</button>}
        </div>
      </div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg)' }}><p className="text-muted">読み込み中...</p></div>}>
      <QuizInner />
    </Suspense>
  )
}
