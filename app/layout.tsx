import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Echoes of Growth',
  description: '让过去的你，照亮此刻的路',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
