import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cultlike OS — Executive Operating System by AHMV Systems',
  description: 'The executive operations and multi-platform distribution operating system for high-agency creators and operators. Output over activity.',
  keywords: ['productivity', 'content vault', 'cultlike', 'ahmv', 'operating system', 'tasks', 'whiteboard'],
  openGraph: {
    title: 'Cultlike OS by AHMV Systems',
    description: 'Executive operations and distribution operating system.',
    type: 'website',
  },
  icons: {
    icon: '/logo.png',
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
