'use client'

import { useState } from 'react'
import { User, Settings as SettingsIcon, LogOut, Moon, Sun, Monitor, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'preferences'>('profile')
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans">
      <header>
        <div className="text-xs font-mono text-[#6b7280] uppercase tracking-wider mb-1 font-light">
          CALLMY_MGMT • SYSTEM
        </div>
        <h1 className="text-3xl font-light tracking-tight text-black">Settings & Preferences</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 font-body">
        {/* Settings Navigation */}
        <div className="md:col-span-4 space-y-1">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'workspace', label: 'Workspace', icon: SettingsIcon },
            { id: 'preferences', label: 'Preferences', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer font-light text-left',
                activeTab === tab.id
                  ? 'bg-black text-white font-normal shadow-sm'
                  : 'text-[#6b7280] hover:text-black hover:bg-black/[0.03]'
              )}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-black/[0.06]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left font-light"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-8 bg-white border border-black/[0.08] rounded-3xl p-8 shadow-sm min-h-[400px]">
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-light text-black">Personal Profile</h2>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">ACCOUNT NAME</label>
                <input
                  type="text"
                  defaultValue="Mohammed Rehan"
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">EMAIL ADDRESS</label>
                <input
                  type="email"
                  defaultValue="founder@company.com"
                  disabled
                  className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-black/[0.06] rounded-xl text-xs text-[#9ca3af] outline-none font-light cursor-not-allowed"
                />
              </div>
              <button
                onClick={() => toast.success('Profile preferences updated')}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-sm"
              >
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-light text-black">Workspace Configuration</h2>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">WORKSPACE NAME</label>
                <input
                  type="text"
                  defaultValue="CallMy Mgmt Main"
                  className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] focus:border-black rounded-xl text-xs text-black outline-none font-light"
                />
              </div>
              <div className="pt-4 border-t border-black/[0.06]">
                <button
                  onClick={() => toast.success('Workspace updated')}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-normal transition-all cursor-pointer shadow-sm"
                >
                  Save Workspace
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-lg font-light text-black">System Preferences</h2>
              <div>
                <label className="text-[11px] font-mono text-[#6b7280] block mb-1">AI HARSHNESS LEVEL</label>
                <select className="w-full px-4 py-2.5 bg-[#fafafa] border border-black/[0.08] rounded-xl text-xs text-black outline-none font-light">
                  <option value="direct">Direct & High Output (Recommended)</option>
                  <option value="detailed">Detailed & Exploratory</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
