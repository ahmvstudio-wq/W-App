import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'W — Operate at Speed',
  description: 'The productivity operating system for teams who ship. Output over activity. Speed over safety. One owner per task.',
  keywords: ['productivity', 'project management', 'focus', 'operating system', 'tasks', 'teams'],
  openGraph: {
    title: 'W',
    description: 'Operate at speed. Ship or kill.',
    type: 'website',
  },
}

import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  )
}
