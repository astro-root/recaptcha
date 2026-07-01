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
  const [passed, setPassed] = useState(false)
  const startTimeRef = useRef<number>(Date.now())
  const questionStartRef = useRef<number>(Date.now())

  useEffect(() => {
    async function init() {
      if (sig) {
        const res = await fetch(`/api/quiz/verify?quizId=${quizId}&sig=${sig}`)
        const data = await res.json()
        if (!data.valid) { setErrorMsg('URLの署名が無効です。'); setPhase('error'); return }
      }
      setPhase('loading')
      const res = await fetch('/api/quiz/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: session.token, signature: session.signature, totalTime }),
      })
      const data = await res.json()
      setFinalResults(data.results ?? [])
      setFinalCorrect(data.correct ?? 0)
      setFinalTotal(data.total ?? 0)
      setFinalTime(data.totalTime ?? totalTime)
      setPassed(data.passed ?? false)
      setPhase('done')
    }
  }

  if (phase === 'verifying' || phase === 'loading') return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
      <SpinnerIcon size={28} color="#4a90d9" />
      <p style={{ color:'var(--text2)', fontSize:13 }}>{phase === 'verifying' ? 'URLを検証中...' : 'セッションを開始中...'}</p>
    </div>
  )

  if (phase === 'error') return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border-dark)', borderRadius:3, padding:'28px 24px', width:'100%', maxWidth:360, textAlign:'center', boxShadow:'var(--shadow-lg)' }}>
        <div style={{ color:'var(--danger)', marginBottom:12, display:'flex', justifyContent:'center' }}><AlertIcon size={28} /></div>
        <p style={{ fontWeight:700, marginBottom:6, fontSize:15 }}>確認を開始できません</p>
        <p style={{ color:'var(--text2)', fontSize:13, marginBottom:18 }}>{errorMsg}</p>
        <Link href="/quiz" className="btn btn-secondary" style={{ borderRadius:3, fontSize:13 }}>クイズ一覧に戻る</Link>
      </div>
    </div>
  )

  if (phase === 'done') return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border-dark)', borderRadius:3, width:'100%', maxWidth:400, boxShadow:'var(--shadow-lg)', overflow:'hidden' }}>
        <div style={{ background: passed ? 'var(--success)' : 'var(--danger)', padding:'20px 22px', color:'#fff', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {passed ? <CheckIcon size={22} color="#fff" /> : <XIcon size={22} color="#fff" />}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:'clamp(14px,4vw,16px)' }}>{passed ? '本人確認が完了しました' : '本人確認に失敗しました'}</div>
            <div style={{ fontSize:'clamp(11px,3vw,12px)', opacity:0.85, marginTop:2 }}>
              {passed ? `全${finalTotal}問正解 · ${finalTime}秒` : `${finalTotal}問中${finalCorrect}問正解 · 全問正解が必要です`}
            </div>
          </div>
        </div>
        <div style={{ padding:'16px 18px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
            {finalResults.map((r) => (
              <div key={r.questionId} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background: r.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)', borderRadius:3, borderLeft:`3px solid ${r.isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
                {r.isCorrect ? <CheckIcon size={14} color="var(--success)" /> : <XIcon size={14} color="var(--danger)" />}
                <span style={{ flex:1, fontSize:'clamp(11px,3vw,12.5px)', color:'var(--text)' }}>{r.questionText}</span>
                <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11.5, color:'var(--text2)', whiteSpace:'nowrap' }}>
                  <ClockIcon size={11} />{r.timeTaken ?? '?'}秒
                </span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Link href={`/quiz/${quizId}`} className="btn btn-primary" style={{ flex:1, borderRadius:3, fontSize:13, minWidth:120 }}>もう一度挑戦</Link>
            <Link href="/quiz" className="btn btn-secondary" style={{ borderRadius:3, fontSize:13 }}>一覧へ</Link>
          </div>
        </div>
        <div style={{ borderTop:'1px solid var(--border)', padding:'8px 14px', background:'#f9f9f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <ShieldIcon size={16} color="#4a90d9" />
            <span style={{ fontSize:9, color:'#9aa0a6', fontWeight:600 }}>QuizShield</span>
          </div>
          <span style={{ fontSize:9, color:'#9aa0a6' }}>プライバシー · 利用規約</span>
        </div>
      </div>
    </div>
  )

  if (!session || !currentQuestion) return null

  const isAnsweredCorrect = answeredCorrect.has(currentQuestion.id)
  const isLimitReached = answerResult !== null && !answerResult.isCorrect && (answerResult.limitReached || answerResult.attempt >= answerResult.maxAttempts)
  const canProceed = isAnsweredCorrect || isLimitReached
  const hasImages = currentQuestion.choices.some(c => c.imageUrl)
  const progress = (currentIdx / session.questions.length) * 100

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth: hasImages ? 420 : 380 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border-dark)', borderRadius:3, boxShadow:'var(--shadow-lg)', overflow:'hidden' }}>
          <div style={{ background:'#4a90d9', padding:'14px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <ShieldIcon size={15} color="rgba(255,255,255,0.85)" />
                <span style={{ fontSize:'clamp(10px,3vw,11px)', color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{session.quizTitle}</span>
              </div>
              <span style={{ fontSize:'clamp(10px,3vw,11px)', color:'rgba(255,255,255,0.75)', whiteSpace:'nowrap' }}>{currentIdx + 1} / {session.questions.length}</span>
            </div>
            <div style={{ background:'rgba(255,255,255,0.25)', borderRadius:2, height:3, overflow:'hidden', marginBottom:12 }}>
              <div style={{ background:'#fff', height:'100%', width:`${progress}%`, transition:'width 0.3s ease' }} />
            </div>
            <div style={{ color:'#fff', fontSize:'clamp(13px,4vw,14.5px)', fontWeight:600, lineHeight:1.45 }}>{currentQuestion.text}</div>
          </div>

          <div style={{ padding: hasImages ? 4 : 8 }}>
            <div style={{ display:'grid', gridTemplateColumns: hasImages ? 'repeat(2,1fr)' : '1fr', gap: hasImages ? 3 : 0 }}>
              {currentQuestion.choices.map((c) => {
                const isSelected = selectedChoice === c.id
                const showResult = !!answerResult && isSelected
                if (hasImages) {
                  return (
                    <button key={c.id} onClick={() => { if (!isAnsweredCorrect) setSelectedChoice(c.id) }} disabled={isAnsweredCorrect}
                      style={{ position:'relative', aspectRatio:'1', overflow:'hidden', border:'none', cursor: isAnsweredCorrect ? 'not-allowed' : 'pointer', background:'#eee', display:'block', width:'100%' }}>
                      <img src={c.imageUrl ?? ''} alt={c.text} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      {isSelected && (
                        <div style={{ position:'absolute', inset:0, background: showResult ? (answerResult!.isCorrect ? 'rgba(30,142,62,0.6)' : 'rgba(217,48,37,0.6)') : 'rgba(74,144,217,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <div style={{ width:34, height:34, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {showResult ? (answerResult!.isCorrect ? <CheckIcon size={19} color="var(--success)" /> : <XIcon size={19} color="var(--danger)" />) : <CheckIcon size={19} color="#4a90d9" />}
                          </div>
                        </div>
                      )}
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.52)', color:'#fff', fontSize:'clamp(10px,2.5vw,11px)', padding:'4px 6px', textAlign:'center' }}>{c.text}</div>
                    </button>
                  )
                }
                let borderColor='#e0e0e0', bg='#fff'
                if (showResult) { borderColor = answerResult!.isCorrect ? 'var(--success)' : 'var(--danger)'; bg = answerResult!.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)' }
                else if (isSelected) { borderColor='#4a90d9'; bg='#e8f0fb' }
                return (
                  <button key={c.id} onClick={() => { if (!isAnsweredCorrect) setSelectedChoice(c.id) }} disabled={isAnsweredCorrect}
                    style={{ display:'flex', alignItems:'center', gap:12, border:`1px solid ${borderColor}`, background:bg, borderRadius:3, padding:'11px 14px', margin:'3px 4px', textAlign:'left', color:'var(--text)', cursor: isAnsweredCorrect ? 'not-allowed' : 'pointer', transition:'all 0.12s', width:'calc(100% - 8px)' }}>
                    <div style={{ width:20, height:20, borderRadius:3, flexShrink:0, border:`2px solid ${isSelected ? (showResult ? borderColor : '#4a90d9') : '#c1c1c1'}`, background: isSelected ? (showResult ? borderColor : '#4a90d9') : '#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.08)' }}>
                      {isSelected && (showResult ? (answerResult!.isCorrect ? <CheckIcon size={12} color="#fff" /> : <XIcon size={12} color="#fff" />) : <CheckIcon size={12} color="#fff" />)}
                    </div>
                    <span style={{ fontSize:'clamp(12px,3.5vw,13.5px)', lineHeight:1.4 }}>{c.text}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {answerResult && (
            <div style={{ margin:'0 8px 6px', display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:3, background: answerResult.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)', color: answerResult.isCorrect ? 'var(--success)' : 'var(--danger)', fontWeight:600, fontSize:'clamp(11px,3vw,12.5px)' }}>
              {answerResult.isCorrect ? <CheckIcon size={14} /> : <XIcon size={14} />}
              {answerResult.isCorrect ? '正解です' : isLimitReached ? `不正解です（試行上限 ${answerResult.attempt}/${answerResult.maxAttempts}）` : `不正解です。もう一度選んでください（${answerResult.attempt}/${answerResult.maxAttempts}）`}
            </div>
          )}

          <div style={{ borderTop:'1px solid var(--border)', padding:'10px 14px', background:'#f9f9f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
              <ShieldIcon size={22} color="#4a90d9" />
              <span style={{ fontSize:8, color:'#9aa0a6', fontWeight:600 }}>QuizShield</span>
            </div>
            <div>
              {!canProceed && <button className="btn btn-primary btn-sm" onClick={submitAnswer} disabled={!selectedChoice} style={{ borderRadius:3, fontSize:'clamp(12px,3vw,13px)', padding:'8px 20px' }}>確認</button>}
              {canProceed && <button className="btn btn-primary btn-sm" onClick={nextQuestion} style={{ borderRadius:3, fontSize:'clamp(12px,3vw,13px)', padding:'8px 20px' }}>{currentIdx + 1 < session.questions.length ? '次へ' : '結果を見る'}</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}><SpinnerIcon size={28} color="#4a90d9" /></div>}>
      <QuizInner />
    </Suspense>
  )
}
