import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AIHunter — AI 猎头平台',
  description: '基于 X 实时语境分析，精准猎获最匹配的人才',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
