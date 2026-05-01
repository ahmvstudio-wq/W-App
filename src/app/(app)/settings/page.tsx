'use client'

import { useState } from 'react'
import { User, Settings as SettingsIcon, LogOut, Moon, Sun, Monitor, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'preferences'>('profile')
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: '#6b6e75', fontFamily: 'DM Mono, monospace', fontSize: '12px', textTransform: 'uppercase' }}>
          Configure your operating environment
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }}>
        {/* Settings Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'workspace', label: 'Workspace', icon: SettingsIcon },
            { id: 'preferences', label: 'Preferences', icon: Bell },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', background: activeTab === tab.id ? '#1c1e22' : 'transparent',
                border: 'none', borderRadius: '6px', color: activeTab === tab.id ? '#f0ede8' : '#6b6e75',
                cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: activeTab === tab.id ? 500 : 400,
                transition: 'all 150ms'
              }}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}

          <div style={{ height: '1px', background: '#252729', margin: '16px 0' }} />
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', background: 'transparent',
              border: 'none', borderRadius: '6px', color: '#ff4444',
              cursor: 'pointer', textAlign: 'left', fontSize: '14px'
            }}
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>

        {/* Settings Content */}
        <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '12px', padding: '32px', minHeight: '500px' }}>
          
          {activeTab === 'profile' && (
            <div className="page-enter-active">
              <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>Personal Profile</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Full Name</label>
                  <input type="text" defaultValue="W" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Email Address</label>
                  <input type="email" defaultValue="w@focus.os" disabled style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#6b6e75', fontSize: '14px', outline: 'none', cursor: 'not-allowed' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Daily Shipped Target</label>
                  <input type="number" defaultValue="5" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
                </div>
                <button className="btn-accent" style={{ padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="page-enter-active">
              <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>Workspace Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Workspace Name</label>
                  <input type="text" defaultValue="W's Workspace" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Delete Workspace</label>
                  <button style={{ padding: '12px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)', color: '#ff4444', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                    Danger: Delete Everything
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="page-enter-active">
              <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>System Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Theme</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ flex: 1, padding: '16px', background: '#1c1e22', border: '1px solid #c8f135', borderRadius: '8px', color: '#f0ede8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Moon size={24} color="#c8f135" /> Dark (Default)
                    </button>
                    <button disabled style={{ flex: 1, padding: '16px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '8px', color: '#6b6e75', cursor: 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
                      <Sun size={24} /> Light (Disabled)
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>AI Harshness</label>
                  <select style={{ width: '100%', maxWidth: '400px', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }}>
                    <option value="brutal">Brutal (Default) - Cuts all fluff</option>
                    <option value="standard">Standard - Still direct</option>
                  </select>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
