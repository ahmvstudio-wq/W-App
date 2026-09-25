import React from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — Cultlike OS by AHMV Systems',
  description: 'Terms of Service for Cultlike OS by AHMV Systems.',
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#090a0c', color: '#f0ede8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Navigation */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(9,10,12,0.8)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000', fontWeight: 800, fontSize: '14px' }}>
              C
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em', color: '#ffffff' }}>Cultlike OS</span>
            <span style={{ fontSize: '11px', color: '#71767b', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)' }}>by AHMV Systems</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
            <Link href="/privacy" style={{ color: '#8c9096', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/data-deletion" style={{ color: '#8c9096', textDecoration: 'none' }}>Data Deletion</Link>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', background: '#ffffff', color: '#000000', fontWeight: 500, textDecoration: 'none' }}>
              <ArrowLeft size={14} /> Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '840px', margin: '0 auto', padding: '56px 24px 96px', lineHeight: '1.75' }}>
        <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '12px', fontWeight: 500, marginBottom: '16px' }}>
            <FileText size={13} /> Legal Agreement
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: '#ffffff', margin: '0 0 12px' }}>Terms of Service</h1>
          <p style={{ color: '#8c9096', fontSize: '14px', margin: 0 }}>
            Effective Date: September 25, 2026 &bull; Published by AHMV Systems for Cultlike OS
          </p>
        </div>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>1. Agreement to Terms</h2>
          <p style={{ color: '#b5b8bd' }}>
            These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;Creator&rdquo;, or &ldquo;You&rdquo;) and AHMV Systems (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) concerning your access to and use of Cultlike OS, accessible at <strong>cultlike.ahmvsystems.com</strong>.
          </p>
          <p style={{ color: '#b5b8bd' }}>
            By registering an account, connecting third-party platforms, or using our software services, you signify that you have read, understood, and agree to be bound by all of these Terms. If you do not agree with all of these Terms, you are expressly prohibited from using Cultlike OS.
          </p>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>2. Description of the Service</h2>
          <p style={{ color: '#b5b8bd' }}>
            Cultlike OS is an executive operating system designed for media agencies, founders, and creators. The service includes task execution management, interactive whiteboard planning, a visual Content Vault, Google Workspace and Calendar synchronization, and automated multi-platform distribution across YouTube, Instagram, and connected channels.
          </p>
        </section>

        <section style={{ marginBottom: '36px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>3. Creator Content Ownership &amp; Intellectual Property</h2>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
            <CheckCircle2 size={20} color="#4ade80" style={{ flexShrink: 0, marginTop: '4px' }} />
            <p style={{ color: '#f0ede8', margin: 0, fontWeight: 500 }}>
              You retain 100% full, exclusive intellectual property ownership of any video files, scripts, images, audio, captions, and creative deliverables you upload or create within Cultlike OS.
            </p>
          </div>
          <p style={{ color: '#8c9096', fontSize: '13px', margin: 0 }}>
            AHMV Systems claims no intellectual property rights over the materials you provide to the service. By connecting accounts, you grant us solely the limited license required to perform technical processing, encoding, scheduling, and API dispatch at your direction.
          </p>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>4. Third-Party Integrations &amp; Platform Rules</h2>
          <p style={{ color: '#b5b8bd' }}>
            When you connect third-party platforms through Cultlike OS, you agree to comply with the terms and policies of those respective services:
          </p>
          <ul style={{ paddingLeft: '24px', color: '#b5b8bd' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Meta Platforms:</strong> You agree to comply with Meta Platform Terms, Instagram Community Guidelines, and Facebook Terms of Service.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>YouTube:</strong> By utilizing YouTube features in Cultlike OS, you agree to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>YouTube Terms of Service</a> and Google Privacy Policy.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Google Workspace &amp; Drive:</strong> You agree to Google API Terms of Service.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>5. Acceptable Use &amp; Prohibited Conduct</h2>
          <p style={{ color: '#b5b8bd' }}>
            You agree not to use Cultlike OS to:
          </p>
          <ul style={{ paddingLeft: '24px', color: '#b5b8bd' }}>
            <li style={{ marginBottom: '6px' }}>Publish spam, deceptive media, malware, or unlawful content.</li>
            <li style={{ marginBottom: '6px' }}>Abuse, flood, or bypass API rate limits on connected platforms.</li>
            <li style={{ marginBottom: '6px' }}>Attempt to gain unauthorized access to other workspaces or reverse-engineer the service engine.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>6. Termination &amp; Account Cancellation</h2>
          <p style={{ color: '#b5b8bd' }}>
            You may terminate your account at any time by navigating to Settings and deleting your workspace. We reserve the right to suspend or terminate accounts that violate these Terms or threaten system integrity with immediate notice.
          </p>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>7. Disclaimer of Warranties &amp; Limitation of Liability</h2>
          <p style={{ color: '#8c9096', fontSize: '13px' }}>
            CULTLIKE OS IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS. AHMV SYSTEMS MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, REGARDING UNINTERRUPTED AVAILABILITY OR THIRD-PARTY API UPTIME. IN NO EVENT SHALL AHMV SYSTEMS BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>8. Governing Law &amp; Contact</h2>
          <p style={{ color: '#b5b8bd' }}>
            These Terms shall be governed by and construed in accordance with the laws applicable to AHMV Systems operations. For questions regarding these Terms, contact us at:
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '18px 22px', marginTop: '12px' }}>
            <p style={{ margin: 0, color: '#ffffff', fontWeight: 600 }}>AHMV Systems &bull; Legal Department</p>
            <p style={{ margin: '4px 0 0', color: '#8c9096', fontSize: '14px' }}>Email: <a href="mailto:w.taufiqq@gmail.com" style={{ color: '#38bdf8', textDecoration: 'none' }}>w.taufiqq@gmail.com</a></p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '24px', textAlign: 'center', color: '#71767b', fontSize: '13px' }}>
        <p style={{ margin: 0 }}>&copy; 2026 Cultlike OS by AHMV Systems. All rights reserved.</p>
      </footer>
    </div>
  )
}
