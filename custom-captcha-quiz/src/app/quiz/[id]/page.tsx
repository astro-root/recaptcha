'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
        if (!data.valid) { setErrorMsg('Invalid or tampered URL signature.'); setPhase('error'); return }
      }
      setPhase('loading')
      const res = await fetch('/api/quiz/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      })
      if (!res.ok) { const d = await res.json(); setErrorMsg(d.error ?? 'Failed to start'); setPhase('error'); return }
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
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <p className="text-muted">{phase === 'verifying' ? 'Verifying URL...' : 'Starting session...'}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (phase === 'error') return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <p className="text-danger" style={{ fontWeight: 600, marginBottom: 8 }}>Unable to start quiz</p>
        <p className="text-muted text-sm">{errorMsg}</p>
        <Link href="/quiz" className="btn btn-secondary mt-4">Back to Quizzes</Link>
      </div>
    </div>
  )

  if (phase === 'done') {
    const passed = finalCorrect === finalTotal
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', padding: 20 }}>
        <div className="card" style={{ maxWidth: 520, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '✅' : '❌'}</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{passed ? 'Verification Passed!' : 'Verification Failed'}</h2>
            <p className="text-muted">{finalCorrect} / {finalTotal} correct · {finalTime}s total</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {finalResults.map((r) => (
              <div key={r.questionId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${r.isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
                <span>{r.isCorrect ? '✅' : '❌'}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{r.questionText}</span>
                <span className="text-muted text-sm">{r.timeTaken ?? '?'}s</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/quiz/${quizId}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Try Again</Link>
            <Link href="/quiz" className="btn btn-secondary">All Quizzes</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !currentQuestion) return null

  const progress = (currentIdx / session.questions.length) * 100
  const isAnsweredCorrect = answeredCorrect.has(currentQuestion.id)
  const isLimitReached = answerResult !== null && !answerResult.isCorrect && (answerResult.limitReached || answerResult.attempt >= answerResult.maxAttempts)
  const canProceed = isAnsweredCorrect || isLimitReached

  return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{session.quizTitle}</span>
            <span className="text-muted text-sm">Question {currentIdx + 1} / {session.questions.length}</span>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent)', height: '100%', width: `${progress}%`, transition: 'width 0.3s ease' }} />
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(91,110,245,0.1)', borderRadius: 20, marginBottom: 16, fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            🛡 QuizShield Verification
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, lineHeight: 1.4 }}>{currentQuestion.text}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {currentQuestion.choices.map((c) => {
              const isSelected = selectedChoice === c.id
              let borderColor = 'var(--border)', bg = 'var(--surface2)'
              if (answerResult && isSelected) {
                borderColor = answerResult.isCorrect ? 'var(--success)' : 'var(--danger)'
                bg = answerResult.isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'
              } else if (isSelected) {
                borderColor = 'var(--accent)'; bg = 'rgba(91,110,245,0.08)'
              }
              return (
                <button key={c.id} onClick={() => { if (!isAnsweredCorrect) setSelectedChoice(c.id) }} disabled={isAnsweredCorrect}
                  style={{ border: `2px solid ${borderColor}`, background: bg, borderRadius: 'var(--radius)', padding: '12px 16px', textAlign: 'left', color: 'var(--text)', cursor: isAnsweredCorrect ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                  {c.imageUrl && <img src={c.imageUrl} alt={c.text} style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />}
                  <span style={{ fontWeight: isSelected ? 600 : 400 }}>{c.text}</span>
                </button>
              )
            })}
          </div>
          {answerResult && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 16, background: answerResult.isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${answerResult.isCorrect ? 'var(--success)' : 'var(--danger)'}`, color: answerResult.isCorrect ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: 14 }}>
              {answerResult.isCorrect ? '✅ Correct!' : isLimitReached ? `❌ No more attempts. (${answerResult.attempt}/${answerResult.maxAttempts})` : `❌ Try again. (${answerResult.attempt}/${answerResult.maxAttempts})`}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {!canProceed && <button className="btn btn-primary" style={{ flex: 1 }} onClick={submitAnswer} disabled={!selectedChoice}>Submit Answer</button>}
            {canProceed && <button className="btn btn-primary" style={{ flex: 1 }} onClick={nextQuestion}>{currentIdx + 1 < session.questions.length ? 'Next Question →' : 'See Results'}</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="flex-center" style={{ minHeight: '100vh' }}><p className="text-muted">Loading...</p></div>}>
      <QuizInner />
    </Suspense>
  )
}
