import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '人間確認 | QuizShield',
  description: '選択式クイズによる人間性確認システム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body>{children}</body></html>
}
