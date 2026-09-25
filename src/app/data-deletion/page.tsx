import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'User Data Deletion Instructions — Cultlike OS by AHMV Systems',
  description: 'Step-by-step instructions on how users can request complete deletion of their account and Meta Platform Data.',
}

export default function DataDeletionPage() {
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
            <Link href="/terms" style={{ color: '#8c9096', textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', background: '#ffffff', color: '#000000', fontWeight: 500, textDecoration: 'none' }}>
              <ArrowLeft size={14} /> Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '840px', margin: '0 auto', padding: '56px 24px 96px', lineHeight: '1.75' }}>
        <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '12px', fontWeight: 500, marginBottom: '16px' }}>
            <Trash2 size={13} /> Data Erasure Protocol
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: '#ffffff', margin: '0 0 12px' }}>User Data Deletion Instructions</h1>
          <p style={{ color: '#8c9096', fontSize: '14px', margin: 0 }}>
            Compliant with Meta Platform Terms &amp; GDPR / CCPA Regulations
          </p>
        </div>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>Overview</h2>
          <p style={{ color: '#b5b8bd' }}>
            In accordance with Meta Platform policies, Google API policies, and international privacy standards, Cultlike OS provides transparent, automated, and manual mechanisms for users to delete their account data and any Platform Data retrieved through external services.
          </p>
        </section>

        {/* Option 1 */}
        <section style={{ marginBottom: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4ade80', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>1</span>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Option 1: 1-Click Disconnect via Cultlike Settings (Instant)</h3>
          </div>
          <p style={{ color: '#b5b8bd', marginBottom: '14px' }}>
            If you wish to remove Cultlike OS access to your Instagram account or Google Workspace while retaining your workspace drafts:
          </p>
          <ol style={{ paddingLeft: '22px', color: '#8c9096', fontSize: '14px', margin: 0 }}>
            <li style={{ marginBottom: '6px' }}>Log into your account at <a href="https://cultlike.ahmvsystems.com" style={{ color: '#38bdf8' }}>cultlike.ahmvsystems.com</a>.</li>
            <li style={{ marginBottom: '6px' }}>Navigate to <strong>Settings &rarr; Integrations</strong>.</li>
            <li style={{ marginBottom: '6px' }}>Locate the <strong>Meta &amp; Instagram Graph API</strong> (or Google) card and click <strong>Disconnect</strong>.</li>
            <li>All cached tokens, page links, and platform session metadata are permanently purged immediately.</li>
          </ol>
        </section>

        {/* Option 2 */}
        <section style={{ marginBottom: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#38bdf8', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>2</span>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Option 2: Revoke Access via Meta / Facebook Settings</h3>
          </div>
          <p style={{ color: '#b5b8bd', marginBottom: '14px' }}>
            You can revoke access directly through Meta without logging into Cultlike:
          </p>
          <ol style={{ paddingLeft: '22px', color: '#8c9096', fontSize: '14px', margin: 0 }}>
            <li style={{ marginBottom: '6px' }}>Open your Facebook account and go to <strong>Settings &amp; Privacy &rarr; Settings</strong>.</li>
            <li style={{ marginBottom: '6px' }}>Click on <strong>Apps and Websites</strong> in the left sidebar menu.</li>
            <li style={{ marginBottom: '6px' }}>Find <strong>Cultlike OS</strong> in the list of authorized apps.</li>
            <li>Click <strong>Remove</strong> to instantly terminate all API access and token validity.</li>
          </ol>
        </section>

        {/* Option 3 */}
        <section style={{ marginBottom: '36px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f87171', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>3</span>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Option 3: Complete Account &amp; Vault Erasure Request</h3>
          </div>
          <p style={{ color: '#b5b8bd' }}>
            If you want our engineering team to completely wipe all database records, video uploads, scripts, account credentials, and backups permanently:
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px 20px', marginTop: '12px' }}>
            <p style={{ margin: 0, color: '#ffffff', fontWeight: 600 }}>Send an email to: <a href="mailto:w.taufiqq@gmail.com" style={{ color: '#38bdf8', textDecoration: 'none' }}>w.taufiqq@gmail.com</a></p>
            <p style={{ margin: '4px 0 0', color: '#8c9096', fontSize: '13px' }}>Subject: Data Deletion Request - [Your Workspace Name]</p>
          </div>
          <p style={{ color: '#8c9096', fontSize: '13px', marginTop: '12px', margin: '12px 0 0' }}>
            Our compliance team will execute the deletion across all production databases and provide an official confirmation receipt within 48 business hours.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '24px', textAlign: 'center', color: '#71767b', fontSize: '13px' }}>
        <p style={{ margin: 0 }}>&copy; 2026 Cultlike OS by AHMV Systems. All rights reserved.</p>
      </footer>
    </div>
  )
}
