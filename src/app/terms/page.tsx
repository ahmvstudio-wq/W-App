import React from 'react'

export const metadata = {
  title: 'Terms of Service — Cultlike OS',
  description: 'Terms of Service for Cultlike OS by AHMV Systems.',
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0e1013', color: '#f0ede8', padding: '48px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.7' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>Terms of Service</h1>
        <p style={{ color: '#8c9096', fontSize: '14px', marginBottom: '32px' }}>Last updated: September 25, 2026</p>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>1. Agreement to Terms</h2>
          <p style={{ color: '#b5b8bd' }}>
            By accessing or using Cultlike OS ("the Service"), operated by AHMV Systems, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>2. Use of Third-Party Integrations</h2>
          <p style={{ color: '#b5b8bd' }}>
            When connecting third-party platforms such as Meta (Instagram / Facebook) or Google (YouTube / Calendar / Docs), you agree to comply with all applicable terms, including the Meta Platform Terms, Instagram Community Guidelines, and YouTube Terms of Service.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>3. Content Ownership and Rights</h2>
          <p style={{ color: '#b5b8bd' }}>
            You retain all intellectual property rights and full ownership of any content, media files, video scripts, and assets you create or publish through Cultlike OS. We do not claim any ownership over your content.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>4. Termination</h2>
          <p style={{ color: '#b5b8bd' }}>
            You may terminate your account at any time by disconnecting your connected services and deleting your workspace. We reserve the right to suspend accounts that violate platform policies or abuse API quotas.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>5. Contact</h2>
          <p style={{ color: '#b5b8bd' }}>
            Questions regarding these Terms can be addressed to: <span style={{ color: '#f0ede8' }}>w.taufiqq@gmail.com</span>.
          </p>
        </section>
      </div>
    </div>
  )
}
