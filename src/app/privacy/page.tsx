import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, CheckCircle2, ExternalLink } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — Cultlike by AHMV Systems',
  description: 'Privacy Policy for Cultlike regarding Meta Platform Data, Google APIs, and user data protection.',
}

export default function PrivacyPolicyPage() {
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
            <Link href="/terms" className="hover:text-black transition-colors hidden sm:inline">Terms of Service</Link>
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-black/[0.08] text-neutral-900 text-xs font-mono font-medium mb-4">
              <Shield size={12} className="text-black" />
              <span>Verified Privacy Standard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-light mt-2">
              Effective Date: September 25, 2026 &bull; Published by AHMV Systems for Cultlike
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              1. Introduction &amp; Commitment to Privacy
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              Cultlike (&ldquo;Cultlike&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), operated by AHMV Systems, provides an operations and distribution workspace for creators, directors, and studios. We are deeply committed to protecting your creative assets, personal data, and confidential productions.
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              This Privacy Policy describes our practices concerning data collection, usage, storage, security, and disclosure when you access our application and connected APIs at <strong>cultlike.ahmvsystems.com</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              2. Data We Collect
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              To deliver high-velocity creator workflows, Cultlike collects the following categories of information:
            </p>
            <ul className="space-y-2 text-sm text-neutral-600 font-light list-disc pl-5">
              <li>
                <strong className="font-medium text-neutral-900">Account &amp; Profile Information:</strong> Your name, email address, password hash, and workspace roles managed securely through Supabase Auth.
              </li>
              <li>
                <strong className="font-medium text-neutral-900">Creator Assets &amp; Deliverables:</strong> Video files, audio snippets, thumbnails, captions, scripts, task deadlines, and production notes you author or import into Cultlike.
              </li>
              <li>
                <strong className="font-medium text-neutral-900">Operational Telemetry:</strong> Anonymized performance metrics, error diagnostics, and session states necessary to maintain app reliability.
              </li>
            </ul>
          </section>

          {/* Section 3: Meta */}
          <section className="p-6 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-sky-600" />
              <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                3. Meta Platform Data Disclosures (Instagram &amp; Facebook)
              </h2>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              Cultlike integrates with Meta Platforms via the Instagram Graph API and Facebook Login for Business to enable automated video release scheduling and performance verification.
            </p>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider font-mono">
                Permissions Requested &amp; Purpose:
              </h3>
              <ul className="space-y-1.5 text-xs text-neutral-600 font-light list-disc pl-5">
                <li>
                  <strong className="font-medium text-neutral-900">instagram_content_publish:</strong> Allows you to schedule and publish video Reels and Carousels from your Content Vault directly to your verified Instagram Professional account.
                </li>
                <li>
                  <strong className="font-medium text-neutral-900">instagram_basic:</strong> Resolves your Instagram Business account ID and username to display verification badges in your private studio.
                </li>
                <li>
                  <strong className="font-medium text-neutral-900">pages_show_list &amp; pages_read_engagement:</strong> Allows our system to verify the linked Facebook Page required by Meta to route API requests to your Instagram Business account.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <p className="text-xs font-medium text-amber-900 leading-relaxed">
                <strong>Strict Non-Monetization Guarantee:</strong> We do NOT sell, rent, monetize, or transfer your Meta Platform Data to third-party brokers, advertisers, or unauthorized third parties under any circumstances.
              </p>
            </div>
            <p className="text-xs text-neutral-500 font-light">
              Meta OAuth access tokens are stored in encrypted httpOnly session cookies or encrypted server-side databases, accessible exclusively by the authenticated workspace owner.
            </p>
          </section>

          {/* Section 4: Google */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              4. Google API User Data Policy Compliance
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              Cultlike accesses Google APIs (Google Calendar, Google Docs, Google Drive, and YouTube Data API v3). Our use and transfer of information received from Google APIs adheres strictly to the <strong>Google API Services User Data Policy</strong>, including the Limited Use requirements.
            </p>
            <ul className="space-y-2 text-sm text-neutral-600 font-light list-disc pl-5">
              <li>
                <strong className="font-medium text-neutral-900">Google Drive:</strong> Used solely to allow you to ingest video deliverables from your Drive folders directly into your workspace.
              </li>
              <li>
                <strong className="font-medium text-neutral-900">YouTube Data API v3:</strong> Used solely to retrieve channel subscriber counts, video views, and publish approved video deliverables from your Content Studio.
              </li>
              <li>
                <strong className="font-medium text-neutral-900">Google Calendar:</strong> Used solely to overlay deadlines and schedule production events upon your request.
              </li>
            </ul>
          </section>

          {/* Section 5: Security */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              5. Data Storage, Security, &amp; Encryption
            </h2>
            <ul className="space-y-2 text-sm text-neutral-600 font-light list-disc pl-5">
              <li><strong className="font-medium text-neutral-900">Encryption at Rest:</strong> All database records and file storage are protected with AES-256 encryption.</li>
              <li><strong className="font-medium text-neutral-900">Encryption in Transit:</strong> All communications between your browser, our servers, and third-party APIs utilize TLS 1.3 / HTTPS.</li>
              <li><strong className="font-medium text-neutral-900">Multi-Tenant Isolation:</strong> Data access is partitioned by workspace through strict PostgreSQL Row Level Security (RLS) policies.</li>
            </ul>
          </section>

          {/* Section 6: Retention & Deletion */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              6. Data Retention &amp; User Data Deletion
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              We retain platform data and creative assets only as long as your workspace account remains active:
            </p>
            <ul className="space-y-2 text-sm text-neutral-600 font-light list-disc pl-5">
              <li>
                <strong className="font-medium text-neutral-900">Instant Disconnect:</strong> You can revoke Meta or Google access at any time in <strong>Settings &rarr; Integrations</strong>.
              </li>
              <li>
                <strong className="font-medium text-neutral-900">Complete Erasure:</strong> To request permanent deletion of all stored files, database records, and logs, visit our <Link href="/data-deletion" className="text-black underline font-medium">User Data Deletion Instructions</Link> or email our privacy team.
              </li>
            </ul>
          </section>

          {/* Section 7: Contact */}
          <section className="pt-6 border-t border-neutral-100 space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
              7. Contact Us
            </h2>
            <div className="p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 text-xs text-neutral-600 space-y-1">
              <div className="font-semibold text-neutral-900 text-sm">AHMV Systems &bull; Cultlike Privacy Team</div>
              <div>Email: <a href="mailto:w.taufiqq@gmail.com" className="text-black underline">w.taufiqq@gmail.com</a></div>
              <div>Website: <a href="https://cultlike.ahmvsystems.com" className="text-black underline">cultlike.ahmvsystems.com</a></div>
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
