import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FOCUS OS — Operate at Speed',
  description: 'The productivity operating system for teams who ship. Output over activity. Speed over safety. One owner per task.',
  keywords: ['productivity', 'project management', 'focus', 'operating system', 'tasks', 'teams'],
  openGraph: {
    title: 'FOCUS OS',
    description: 'Operate at speed. Ship or kill.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
