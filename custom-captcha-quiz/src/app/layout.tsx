import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuizShield - Human Verification',
  description: 'Interactive quiz-based human verification system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
