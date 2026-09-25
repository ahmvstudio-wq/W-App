import React from 'react'

export const metadata = {
  title: 'User Data Deletion Instructions — Cultlike OS',
  description: 'Instructions on how users can request deletion of their data and Meta Platform Data.',
}

export default function DataDeletionPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0e1013', color: '#f0ede8', padding: '48px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.7' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>User Data Deletion Instructions</h1>
        <p style={{ color: '#8c9096', fontSize: '14px', marginBottom: '32px' }}>Compliant with Meta Platform Terms & GDPR/CCPA</p>

        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f0ede8', marginBottom: '12px' }}>How to Remove Cultlike OS Access & Delete Your Data</h2>
          <p style={{ color: '#b5b8bd', marginBottom: '16px' }}>
            In accordance with Meta Platform policies, Cultlike OS provides clear steps for users to request the complete deletion of their account data and any Platform Data retrieved through Facebook or Instagram APIs.
          </p>

          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f0ede8', marginBottom: '8px' }}>Option 1: Disconnect via Cultlike OS Settings (Instant)</h3>
          <ol style={{ paddingLeft: '20px', color: '#b5b8bd', marginBottom: '16px' }}>
            <li>Log into your Cultlike OS dashboard.</li>
            <li>Navigate to <strong>Settings &rarr; Integrations</strong>.</li>
            <li>Locate the <strong>Meta / Instagram</strong> card and click <strong>Disconnect</strong>.</li>
            <li>All cached tokens, page links, and platform session metadata will be permanently purged immediately.</li>
          </ol>

          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f0ede8', marginBottom: '8px' }}>Option 2: Revoke Access via Facebook App Settings</h3>
          <ol style={{ paddingLeft: '20px', color: '#b5b8bd', marginBottom: '16px' }}>
            <li>Go to your Facebook account's <strong>Settings &amp; Privacy &rarr; Settings</strong>.</li>
            <li>Click on <strong>Apps and Websites</strong> in the left menu.</li>
            <li>Find <strong>Cultlike OS</strong> in the list.</li>
            <li>Click <strong>Remove</strong>. This immediately revokes all permissions granted to our app.</li>
          </ol>

          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f0ede8', marginBottom: '8px' }}>Option 3: Submit a Manual Data Erasure Request</h3>
          <p style={{ color: '#b5b8bd' }}>
            If you wish to have all stored records, uploaded media drafts, analytics history, and account credentials permanently expunged from our database backups, email our Data Protection team at:
          </p>
          <div style={{ background: '#1c1e22', border: '1px solid #252729', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
            <p style={{ margin: 0, color: '#f0ede8' }}><strong>Email:</strong> w.taufiqq@gmail.com</p>
            <p style={{ margin: '4px 0 0', color: '#8c9096', fontSize: '13px' }}>Subject: Data Deletion Request - [Your Workspace Name]</p>
          </div>
          <p style={{ color: '#8c9096', fontSize: '13px', marginTop: '12px' }}>
            Requests are processed within 48 business hours with an official confirmation receipt sent to your email.
          </p>
        </section>
      </div>
    </div>
  )
}
