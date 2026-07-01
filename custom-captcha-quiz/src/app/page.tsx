'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShieldIcon, CheckIcon, SpinnerIcon } from '@/components/icons'

export default function Home() {
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleCheck() {
    if (checked || loading) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setChecked(true) }, 900)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ width:'100%', maxWidth:360, display:'flex', flexDirection:'column', gap:20 }}>
        <div className="fade-up" style={{ textAlign:'center' }}>
          <h1 style={{ fontSize:'clamp(16px,4vw,18px)', fontWeight:700, marginBottom:6 }}>本人確認が必要です</h1>
          <p style={{ color:'var(--text2)', fontSize:'clamp(12px,3vw,13px)', lineHeight:1.6 }}>このサービスを利用するには、自動プログラムでないことを確認してください。</p>
        </div>
        <div className="fade-up" style={{ background:'var(--surface)', border:'1px solid var(--border-dark)', borderRadius:3, boxShadow:'var(--shadow-lg)', overflow:'hidden' }}>
          <div style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:16 }}>
            <button onClick={handleCheck} aria-label="私は人間ですチェックボックス"
              style={{ width:28, height:28, borderRadius:3, flexShrink:0, border:`2px solid ${checked ? 'var(--success)' : '#c1c1c1'}`, background:checked ? 'var(--success)' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
              {loading && <SpinnerIcon size={16} color="#9aa0a6" />}
              {checked && !loading && <span className="check-pop" style={{ display:'flex' }}><CheckIcon size={17} color="#fff" /></span>}
            </button>
            <span style={{ fontSize:15, userSelect:'none' }}>私は人間です</span>
          </div>
          <div style={{ borderTop:'1px solid var(--border)', padding:'8px 14px', background:'#f9f9f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
              <ShieldIcon size={28} color="#4a90d9" />
              <span style={{ fontSize:8, color:'#9aa0a6', fontWeight:600, letterSpacing:'0.3px' }}>QuizShield</span>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:9, color:'#9aa0a6' }}>プライバシー</div>
              <div style={{ fontSize:9, color:'#9aa0a6' }}>利用規約</div>
            </div>
          </div>
        </div>
        {checked && (
          <div className="fade-up" style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <Link href="/quiz" className="btn btn-primary" style={{ width:'100%', borderRadius:3, fontSize:14 }}>クイズで本人確認を行う</Link>
            <Link href="/admin" className="btn btn-secondary" style={{ width:'100%', borderRadius:3, fontSize:13 }}>管理画面</Link>
          </div>
        )}
      </div>
    </div>
  )
}
