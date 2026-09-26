import React from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — Cultlike by AHMV Systems',
  description: 'Terms of Service for Cultlike by AHMV Systems.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#111827] font-sans selection:bg-black/10">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto object-contain hover:opacity-80 transition-opacity" />
            <span className="text-sm font-semibold tracking-tight text-black">Cultlike</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6 text-xs font-medium text-neutral-600">
            <Link href="/privacy" className="hover:text-black transition-colors hidden sm:inline">Privacy Policy</Link>
            <Link href="/data-deletion" className="hover:text-black transition-colors hidden sm:inline">Data Deletion</Link>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-neutral-800 text-white transition-all shadow-xs"
            >
              <ArrowLeft size={13} />
              <span>Back to App</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-black/[0.08] shadow-sm p-6 sm:p-12 space-y-8">
          
          {/* Header Title Banner */}
          <div className="border-b border-neutral-100 pb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-mono font-medium mb-4">
              <FileText size={12} className="text-sky-600" />
              <span>Legal Terms</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-light mt-2">
              Effective Date: September 25, 2026 &bull; Published by AHMV Systems for Cultlike
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              1. Acceptance of Terms
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              By accessing or using Cultlike, operated by AHMV Systems, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              2. Use License &amp; Intellectual Property
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              You retain 100% intellectual property ownership of all videos, assets, scripts, deliverables, and media content uploaded, created, or scheduled inside your Cultlike workspace. Cultlike claims zero ownership of your creative work.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              3. Third-Party Platform Integrations
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              Cultlike interfaces with third-party APIs including Google APIs (YouTube Data API, Google Drive, Google Calendar) and Meta Platforms (Instagram Graph API). Your use of these features is subject to the respective terms and privacy policies of Google and Meta.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              4. Termination
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              You may terminate your account at any time. Upon termination, all personal data and uploaded deliverables will be purged in accordance with our Privacy Policy and Data Deletion guidelines.
            </p>
          </section>

          <section className="pt-6 border-t border-neutral-100 space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              5. Contact Information
            </h2>
            <div className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 text-xs text-neutral-600 space-y-1">
              <div className="font-semibold text-neutral-900 text-sm">AHMV Systems &bull; Cultlike Legal</div>
              <div>Email: <a href="mailto:w.taufiqq@gmail.com" className="text-black underline">w.taufiqq@gmail.com</a></div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] py-8 text-center text-xs text-neutral-400 font-light">
        <p>&copy; {new Date().getFullYear()} Cultlike by AHMV Systems. All rights reserved.</p>
      </footer>
    </div>
  )
}
