'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeftIcon, DownloadIcon } from '@/components/icons'

interface QuestionStat { questionId: string; questionText: string; attempts: number; correct: number; avgTime: number }
interface StatsData { quiz: { id: string; title: string }; questionStats: QuestionStat[]; totalSessions: number; completedSessions: number; avgTotalTime: number }

export default function StatsPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/quiz/${id}/stats`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="container page"><p className="text-muted">読み込み中...</p></div>
  if (!data) return <div className="container page"><p className="text-danger">データが見つかりません</p></div>

  return (
    <div className="container page">
      <div className="mb-4">
        <Link href="/admin" className="text-muted text-sm" style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
          <ArrowLeftIcon size={14} />管理画面に戻る
        </Link>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, gap:12, flexWrap:'wrap' }}>
          <h1 style={{ fontSize:'clamp(16px,5vw,20px)', fontWeight:700 }}>統計：{data.quiz.title}</h1>
          <a href={`/api/admin/quiz/${id}/stats/csv`} className="btn btn-secondary btn-sm" download style={{ borderRadius:3, whiteSpace:'nowrap' }}>
            <DownloadIcon size={13} />CSVダウンロード
          </a>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:22 }}>
        <div className="card" style={{ textAlign:'center', padding:'16px 12px' }}>
          <div style={{ fontSize:'clamp(24px,6vw,30px)', fontWeight:800, color:'var(--accent)' }}>{data.totalSessions}</div>
          <div className="text-muted text-sm">総セッション数</div>
        </div>
        <div className="card" style={{ textAlign:'center', padding:'16px 12px' }}>
          <div style={{ fontSize:'clamp(24px,6vw,30px)', fontWeight:800, color:'var(--success)' }}>{data.completedSessions}</div>
          <div className="text-muted text-sm">完了数</div>
        </div>
        <div className="card" style={{ textAlign:'center', padding:'16px 12px' }}>
          <div style={{ fontSize:'clamp(24px,6vw,30px)', fontWeight:800, color:'var(--text)' }}>{data.avgTotalTime}秒</div>
          <div className="text-muted text-sm">平均所要時間</div>
        </div>
      </div>

      <h2 style={{ fontSize:'clamp(14px,4vw,16px)', fontWeight:700, marginBottom:12 }}>問題別の統計</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {data.questionStats.map((q, i) => {
          const rate = q.attempts > 0 ? Math.round((q.correct / q.attempts) * 100) : 0
          return (
            <div key={q.questionId} className="card" style={{ padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <span style={{ fontWeight:700, color:'var(--accent)', fontSize:13, minWidth:30, flexShrink:0 }}>問{i + 1}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, marginBottom:10, fontSize:'clamp(12px,3.5vw,14px)', wordBreak:'break-word' }}>{q.questionText}</div>
                  <div style={{ background:'#e0e0e0', borderRadius:2, height:5, marginBottom:10, overflow:'hidden' }}>
                    <div style={{ background: rate >= 70 ? 'var(--success)' : rate >= 40 ? 'var(--warn)' : 'var(--danger)', height:'100%', width:`${rate}%`, transition:'width 0.4s ease' }} />
                  </div>
                  <div style={{ display:'flex', gap:'clamp(8px,3vw,16px)', fontSize:'clamp(11px,3vw,12.5px)', color:'var(--text2)', flexWrap:'wrap' }}>
                    <span>試行：<strong style={{ color:'var(--text)' }}>{q.attempts}</strong></span>
                    <span>正解：<strong style={{ color:'var(--success)' }}>{q.correct}</strong></span>
                    <span>正答率：<strong style={{ color:'var(--text)' }}>{rate}%</strong></span>
                    <span>平均時間：<strong style={{ color:'var(--text)' }}>{q.avgTime}秒</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {data.questionStats.length === 0 && (
          <div className="card" style={{ textAlign:'center', padding:'40px 24px' }}>
            <p className="text-muted">まだ回答データがありません。</p>
          </div>
        )}
      </div>
    </div>
  )
}
