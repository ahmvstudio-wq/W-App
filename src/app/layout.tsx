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
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo-cultlike.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/logo-cultlike.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
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
