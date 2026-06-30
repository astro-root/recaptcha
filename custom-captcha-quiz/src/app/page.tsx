import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 32 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 800, background: 'linear-gradient(135deg, #5b6ef5 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8, letterSpacing: '-1px' }}>
          QuizShield
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 16 }}>Quiz-based human verification system</p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/admin" className="btn btn-primary">Admin Panel</Link>
        <Link href="/quiz" className="btn btn-secondary">Take a Quiz</Link>
      </div>
    </div>
  )
}
