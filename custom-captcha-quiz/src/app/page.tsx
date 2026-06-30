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
    setTimeout(() => {
      setLoading(false)
      setChecked(true)
    }, 800)
  }

  return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 28, padding: 20, background: 'var(--bg)' }}>
      <div className="fade-up" style={{ textAlign: 'center', maxWidth: 380 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>本人確認</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13.5 }}>
          下のチェックボックスを選択して、自動プログラムでないことを確認してください。
        </p>
      </div>

      <div
        className="fade-up"
        style={{
          width: 304, background: 'var(--surface)', borderRadius: 3,
          border: '1px solid var(--border-dark)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
          <button
            onClick={handleCheck}
            style={{
              width: 28, height: 28, borderRadius: 3, flexShrink: 0,
              border: `2px solid ${checked ? 'var(--success)' : 'var(--border-dark)'}`,
              background: checked ? 'var(--success)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {loading && <SpinnerIcon size={16} color="var(--text3)" />}
            {checked && !loading && <span className="check-pop" style={{ display: 'flex' }}><CheckIcon size={17} color="#fff" /></span>}
          </button>
          <span style={{ fontSize: 14.5, color: 'var(--text)' }}>私は人間です</span>
        </div>
        <div style={{
          borderTop: '1px solid var(--border)', padding: '8px 22px', background: 'var(--surface2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text3)' }}>
            <ShieldIcon size={20} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.2px' }}>QuizShield</div>
            <div style={{ fontSize: 8.5, color: 'var(--text3)' }}>プライバシー - 利用規約</div>
          </div>
        </div>
      </div>

      {checked && (
        <div className="fade-up" style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin" className="btn btn-secondary">管理画面</Link>
          <Link href="/quiz" className="btn btn-primary">クイズ一覧へ</Link>
        </div>
      )}
    </div>
  )
}
