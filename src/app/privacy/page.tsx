import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, FileText, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — Cultlike OS by AHMV Systems',
  description: 'Privacy Policy for Cultlike OS regarding Meta Platform Data, Google APIs, and user data protection.',
}

export default function PrivacyPolicyPage() {
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
            <Link href="/terms" style={{ color: '#8c9096', textDecoration: 'none' }}>Terms of Service</Link>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', fontSize: '12px', fontWeight: 500, marginBottom: '16px' }}>
            <Shield size={13} /> Official Privacy Policy
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: '#ffffff', margin: '0 0 12px' }}>Privacy Policy</h1>
          <p style={{ color: '#8c9096', fontSize: '14px', margin: 0 }}>
            Effective Date: September 25, 2026 &bull; Published by AHMV Systems for Cultlike OS
          </p>
        </div>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>1. Introduction &amp; Commitment to Privacy</h2>
          <p style={{ color: '#b5b8bd' }}>
            Cultlike OS (&ldquo;Cultlike&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), operated by AHMV Systems, provides an executive operations and multi-platform distribution operating system for creators, founders, and media agencies. 
            We are deeply committed to respecting your privacy, protecting your creative assets, and safeguarding personal data.
          </p>
          <p style={{ color: '#b5b8bd' }}>
            This Privacy Policy describes our practices concerning data collection, usage, storage, security, and disclosure when you access our web application, desktop interface, and connected APIs at <strong>cultlike.ahmvsystems.com</strong>.
          </p>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>2. Data We Collect</h2>
          <p style={{ color: '#b5b8bd' }}>
            To deliver an automated creator workflow, Cultlike OS collects the following categories of information:
          </p>
          <ul style={{ paddingLeft: '24px', color: '#b5b8bd', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Account &amp; Profile Information:</strong> Your name, email address, password hash, and workspace membership roles managed securely through Supabase Auth.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Creator Assets &amp; Vault Items:</strong> Video files, audio snippets, thumbnails, captions, scripts, task deadlines, and project whiteboards you upload or author inside Cultlike OS.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Operational Telemetry:</strong> Anonymized usage logs, error diagnostics, and session states necessary to maintain app reliability.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '36px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="#38bdf8" /> 3. Meta Platform Data Disclosures (Instagram &amp; Facebook)
          </h2>
          <p style={{ color: '#b5b8bd' }}>
            Cultlike OS integrates with Meta Platforms via the Instagram Graph API and Facebook Login for Business to facilitate automated content distribution and reach reporting.
          </p>
          
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f0ede8', margin: '16px 0 8px' }}>A. Permissions Requested &amp; Their Purpose:</h3>
          <ul style={{ paddingLeft: '20px', color: '#b5b8bd', fontSize: '14px' }}>
            <li style={{ marginBottom: '6px' }}>
              <strong>instagram_content_publish:</strong> Allows you to schedule and publish video Reels, Carousels, and image posts from your Cultlike Content Vault directly to your linked Instagram Professional account.
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>instagram_basic:</strong> Resolves your Instagram Business Account ID and username to display account verification badges in your private studio.
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>pages_show_list &amp; pages_read_engagement:</strong> Allows our system to verify the linked Facebook Page required by Meta to route API requests to your Instagram Business account.
            </li>
          </ul>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f0ede8', margin: '16px 0 8px' }}>B. Meta Data Protection Standards:</h3>
          <div style={{ background: 'rgba(224, 86, 102, 0.08)', border: '1px solid rgba(224, 86, 102, 0.25)', borderRadius: '8px', padding: '14px 18px', marginTop: '12px' }}>
            <p style={{ color: '#f87171', fontWeight: 600, margin: 0, fontSize: '14px' }}>
              Strict Non-Monetization Guarantee: We do NOT sell, rent, monetize, or transfer your Meta Platform Data to third-party data brokers, advertisers, or unauthorized third parties under any circumstances.
            </p>
          </div>
          <p style={{ color: '#8c9096', fontSize: '13px', marginTop: '12px' }}>
            Meta OAuth access tokens are stored in encrypted httpOnly session cookies or encrypted server-side databases, accessible exclusively by the authenticated workspace owner.
          </p>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>4. Google API User Data Policy Compliance</h2>
          <p style={{ color: '#b5b8bd' }}>
            Cultlike OS accesses Google APIs (Google Calendar, Google Docs, Google Drive, and YouTube Data API v3). 
            Our use and transfer of information received from Google APIs adheres strictly to the <strong>Google API Services User Data Policy</strong>, including the Limited Use requirements.
          </p>
          <ul style={{ paddingLeft: '24px', color: '#b5b8bd' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Google Calendar:</strong> Used solely to overlay your events inside Cultlike calendars and synchronize task deadlines upon your explicit request.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Google Docs &amp; Drive:</strong> Used solely to allow you to create new Google Docs from Cultlike and view your Drive files inside your private Documents Vault.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>YouTube Data API v3:</strong> Used solely to retrieve channel subscriber counts, video views, and publish approved video deliverables from your Content Studio.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>5. Data Storage, Security, &amp; Encryption</h2>
          <p style={{ color: '#b5b8bd' }}>
            We implement enterprise-level security measures to protect your information:
          </p>
          <ul style={{ paddingLeft: '24px', color: '#b5b8bd' }}>
            <li style={{ marginBottom: '6px' }}><strong>Encryption at Rest:</strong> All database records and file storage are protected with AES-256 encryption.</li>
            <li style={{ marginBottom: '6px' }}><strong>Encryption in Transit:</strong> All communications between your browser, our servers, and third-party APIs utilize TLS 1.3 / HTTPS.</li>
            <li style={{ marginBottom: '6px' }}><strong>Multi-Tenant Isolation:</strong> Data access is partitioned by workspace through strict PostgreSQL Row Level Security (RLS) policies.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>6. Data Retention &amp; User Data Deletion</h2>
          <p style={{ color: '#b5b8bd' }}>
            We retain platform data and creative assets only as long as your workspace account remains active. 
            You retain full control over your data at all times:
          </p>
          <ul style={{ paddingLeft: '24px', color: '#b5b8bd' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>Instant Disconnect:</strong> You can revoke Meta or Google access with 1 click in <strong>Settings &rarr; Integrations</strong>.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>Complete Erasure:</strong> To request permanent deletion of all stored files, database records, and logs, visit our <Link href="/data-deletion" style={{ color: '#38bdf8', textDecoration: 'underline' }}>User Data Deletion Instructions</Link> or email our privacy team.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>7. Your Privacy Rights (GDPR &amp; CCPA)</h2>
          <p style={{ color: '#b5b8bd' }}>
            Depending on your jurisdiction, you have the right to request access to your personal data, request correction of inaccuracies, request erasure of your records, and receive a portable copy of your creative deliverables without discrimination.
          </p>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>8. Contact Us</h2>
          <p style={{ color: '#b5b8bd' }}>
            If you have questions, feedback, or concerns regarding this Privacy Policy or our data handling practices, please contact us at:
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '18px 22px', marginTop: '12px' }}>
            <p style={{ margin: 0, color: '#ffffff', fontWeight: 600 }}>AHMV Systems &bull; Cultlike OS Privacy Team</p>
            <p style={{ margin: '4px 0 0', color: '#8c9096', fontSize: '14px' }}>Email: <a href="mailto:w.taufiqq@gmail.com" style={{ color: '#38bdf8', textDecoration: 'none' }}>w.taufiqq@gmail.com</a></p>
            <p style={{ margin: '4px 0 0', color: '#8c9096', fontSize: '14px' }}>Website: <a href="https://cultlike.ahmvsystems.com" style={{ color: '#38bdf8', textDecoration: 'none' }}>cultlike.ahmvsystems.com</a></p>
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
