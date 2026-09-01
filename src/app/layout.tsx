import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CallMy Mgmt — Executive Operations & Focus System',
  description: 'The executive operations and task management operating system. Output over activity. Speed over safety.',
  keywords: ['productivity', 'project management', 'focus', 'operating system', 'tasks', 'callmy-mgmt'],
  openGraph: {
    title: 'CallMy Mgmt',
    description: 'Executive operations management platform.',
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
      <body suppressHydrationWarning>
        {children}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  )
}
