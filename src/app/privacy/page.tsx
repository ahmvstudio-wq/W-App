import React from 'react'

export const metadata = {
  title: 'Privacy Policy — Cultlike OS',
  description: 'Cultlike OS Privacy Policy regarding Meta Platform Data, Google APIs, and user data privacy.',
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0e1013', color: '#f0ede8', padding: '48px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.7' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>Privacy Policy</h1>
        <p style={{ color: '#8c9096', fontSize: '14px', marginBottom: '32px' }}>Last updated: September 25, 2026</p>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>1. Overview</h2>
          <p style={{ color: '#b5b8bd' }}>
            Cultlike OS (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), provided by AHMV Systems, respects your privacy and is committed to protecting your personal data. 
            This Privacy Policy explains how our application collects, uses, stores, and protects information when you connect external platforms including Meta (Facebook &amp; Instagram), Google (Calendar, Drive, YouTube), and other third-party services.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>2. Data We Collect via Meta APIs (Platform Data)</h2>
          <p style={{ color: '#b5b8bd', marginBottom: '10px' }}>
            When you connect your Facebook or Instagram account, we request only the minimal permissions required to provide scheduled publishing and performance analytics:
          </p>
          <ul style={{ paddingLeft: '20px', color: '#b5b8bd' }}>
            <li><strong>Account Identifiers:</strong> Instagram Business Account ID and connected Facebook Page ID for routing publish requests.</li>
            <li><strong>OAuth Access Tokens:</strong> Encrypted tokens used strictly to authenticate API requests on your behalf.</li>
            <li><strong>Content Metadata:</strong> Post captions, media URLs, scheduled timestamps, and publish statuses created within your Cultlike workspace.</li>
            <li><strong>Engagement Metrics:</strong> View counts, likes, and comment counts to populate your internal analytics dashboard.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>3. How We Use Your Data</h2>
          <p style={{ color: '#b5b8bd' }}>
            We only use Meta Platform Data to:
          </p>
          <ul style={{ paddingLeft: '20px', color: '#b5b8bd' }}>
            <li>Allow you to schedule and publish Reels, Carousels, and Posts directly to your Instagram account.</li>
            <li>Display performance analytics and reach metrics inside your private workspace.</li>
          </ul>
          <p style={{ color: '#e05666', fontWeight: 600, marginTop: '12px' }}>
            We do NOT sell, rent, monetize, or transfer your Meta Platform Data to third-party data brokers, advertising networks, or unauthorized entities under any circumstances.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>4. Data Storage and Security</h2>
          <p style={{ color: '#b5b8bd' }}>
            All OAuth tokens and user data are encrypted at rest using AES-256 and transmitted exclusively over TLS 1.3 encryption. Access is strictly scoped to authenticated workspace members via Row Level Security (RLS).
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>5. Data Retention and Deletion</h2>
          <p style={{ color: '#b5b8bd' }}>
            We retain platform data only for as long as your workspace remains active. You can disconnect your Meta account at any time in Settings, or request complete data deletion by visiting our <a href="/data-deletion" style={{ color: '#4daafc', textDecoration: 'underline' }}>User Data Deletion page</a>.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>6. Contact Us</h2>
          <p style={{ color: '#b5b8bd' }}>
            If you have questions about this policy or your data, please contact us at: <span style={{ color: '#f0ede8' }}>security@cultlike.os</span> or <span style={{ color: '#f0ede8' }}>w.taufiqq@gmail.com</span>.
          </p>
        </section>
      </div>
    </div>
  )
}
