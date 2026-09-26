'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Check, Menu, X, ArrowRight, Play, FileText, Folder, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatGPTLogo, ClaudeLogo, GoogleDriveLogo, FathomLogo } from '@/components/IntegrationLogos'

const NoiseFilter = () => (
  <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.04] mix-blend-overlay">
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
)

const BackgroundWaves = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#f3f4f6]">
    {/* Blue dust wave on the left */}
    <div className="absolute -left-[10%] top-[40%] w-[60vw] h-[40vh] bg-blue-500/15 blur-[120px] rounded-[100%] rotate-[-20deg]" />
    {/* Orange/Gold dust wave on the right */}
    <div className="absolute right-[-10%] top-[10%] w-[50vw] h-[40vh] bg-orange-500/15 blur-[120px] rounded-[100%] rotate-[-20deg]" />
    <div className="absolute right-[10%] top-[40%] w-[40vw] h-[30vh] bg-amber-600/10 blur-[100px] rounded-[100%] rotate-[-20deg]" />
  </div>
)

export default function LandingPage() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [router])

  return (
    <div className="min-h-screen bg-transparent text-[#111] font-sans selection:bg-black selection:text-white relative overflow-x-hidden">
      <NoiseFilter />
      <BackgroundWaves />

      {/* ─── STICKY HEADER ─── */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 sm:px-10 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/[0.04]">
            <img src="/logo-cultlike.png" alt="Cultlike" className="w-6 h-6 object-contain" />
          </div>
        </Link>

        {/* Center Pill */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <button onClick={() => setIsMenuOpen(true)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-black/5 shadow-sm text-sm font-medium hover:bg-neutral-50 transition-colors">
            <Menu size={16} />
            Menu
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:block px-5 py-2 rounded-full bg-white border border-black/5 shadow-sm text-sm font-medium hover:bg-neutral-50 transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="px-5 py-2 rounded-full bg-black text-white text-sm font-medium shadow-md hover:bg-neutral-800 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─── FULLSCREEN MENU MODAL ─── */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#f3f4f6] flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-center mb-12">
             <button onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-black/5 shadow-sm text-sm font-medium hover:bg-neutral-50 transition-colors">
              <X size={16} />
              Close
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-8 text-3xl font-semibold tracking-tight">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="hover:text-neutral-500 transition-colors">Home</Link>
            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="hover:text-neutral-500 transition-colors">Sign In</Link>
            <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="hover:text-neutral-500 transition-colors">Get Started</Link>
          </div>
        </div>
      )}

      {/* ─── HERO SECTION ─── */}
      <main className="relative z-10 pt-32 pb-24 px-6 flex flex-col items-center text-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-1.5 rounded-full bg-white border border-black/[0.06] text-xs font-semibold tracking-wide text-neutral-600 shadow-sm mb-12 flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-black block" />
          THE ANTI-PRODUCTIVITY APP
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[clamp(3.5rem,8vw,6.5rem)] font-bold tracking-tight leading-[0.95] mb-6"
        >
          <span className="text-[#111]">The persistent</span><br/>
          <span className="text-[#888]">AI-native workspace</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg sm:text-xl text-[#555] max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
        >
          Instant access to your team's projects, content, and data. One unified environment for you, your team, and your AI agents.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4"
        >
          <Link href="/signup" className="px-8 py-3.5 rounded-full bg-black text-white text-[15px] font-medium shadow-lg hover:bg-neutral-800 hover:shadow-xl transition-all">
            Get Started
          </Link>
          <Link href="/login" className="px-8 py-3.5 rounded-full bg-white text-black border border-black/[0.05] text-[15px] font-medium shadow-sm hover:bg-neutral-50 transition-all">
            Sign In
          </Link>
        </motion.div>

        {/* ─── FANNED CARDS VISUAL ─── */}
        <div className="mt-32 relative h-[350px] w-full max-w-4xl mx-auto perspective-[1200px] flex justify-center items-end hidden sm:flex">
          {/* Far Left Card (Blue Folder) */}
          <motion.div 
            initial={{ opacity: 0, rotate: -20, x: -250, y: 80 }}
            animate={{ opacity: 1, rotate: -15, x: -220, y: 40 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
            className="absolute origin-bottom bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-black/[0.04] p-4 w-52 h-64 flex flex-col"
          >
            <div className="flex-1 bg-sky-50 rounded-xl flex items-center justify-center mb-3">
              <Folder className="w-16 h-16 text-sky-400 fill-sky-400" />
            </div>
            <div className="text-sm font-semibold">Q3 Launch Assets</div>
            <div className="text-xs text-neutral-400">1.2 GB</div>
          </motion.div>

          {/* Left Mid Card (Video) */}
          <motion.div 
            initial={{ opacity: 0, rotate: -10, x: -120, y: 40 }}
            animate={{ opacity: 1, rotate: -7, x: -110, y: 15 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
            className="absolute origin-bottom bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-black/[0.04] p-4 w-52 h-64 flex flex-col z-10"
          >
            <div className="flex-1 bg-neutral-900 rounded-xl relative overflow-hidden mb-3">
              <img src="https://images.unsplash.com/photo-1572048572872-2394404cf1f3?w=400&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Video" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center"><Play className="w-4 h-4 text-white fill-white" /></div>
              </div>
            </div>
            <div className="text-sm font-semibold">Campaign_Final.mov</div>
            <div className="text-xs text-neutral-400">4.2 GB</div>
          </motion.div>

          {/* Center Card (Scorecard/Main) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 100 }}
            className="absolute origin-bottom bg-white rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-black/[0.04] p-5 w-64 h-72 flex flex-col z-30"
          >
            <div className="text-xs font-bold text-neutral-400 tracking-widest uppercase mb-4">Cultlike Scorecard</div>
            <div className="flex-1">
              <div className="text-4xl font-light tracking-tight mb-1">14<span className="text-lg text-neutral-400"> Days</span></div>
              <div className="text-xs font-medium text-black mb-6">Current Shipping Streak</div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2">
                  <span className="text-neutral-500">Peak Velocity</span>
                  <span className="font-semibold">8 /day</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2">
                  <span className="text-neutral-500">Total Shipped</span>
                  <span className="font-semibold">142</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="text-[10px] uppercase tracking-wider text-neutral-500">System Online</div>
            </div>
          </motion.div>

          {/* Right Mid Card (Claude Chat) */}
          <motion.div 
            initial={{ opacity: 0, rotate: 10, x: 120, y: 40 }}
            animate={{ opacity: 1, rotate: 7, x: 110, y: 15 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 100 }}
            className="absolute origin-bottom bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-black/[0.04] p-4 w-52 h-64 flex flex-col z-20"
          >
            <div className="flex-1 bg-[#f9f8f6] rounded-xl mb-3 p-3 flex flex-col gap-3">
              <div className="text-[10px] font-medium text-neutral-500 flex items-center gap-1"><ClaudeLogo className="w-3 h-3"/> Claude</div>
              <div className="bg-white p-2 rounded-lg text-[10px] shadow-sm border border-black/5 text-neutral-700">"Schedule the Q3 assets for next Tuesday."</div>
              <div className="bg-orange-50 p-2 rounded-lg text-[10px] text-orange-800 border border-orange-100">Done. The pipeline is updated.</div>
            </div>
            <div className="text-sm font-semibold">AI Assistant</div>
            <div className="text-xs text-neutral-400">Active session</div>
          </motion.div>

          {/* Far Right Card (Document) */}
          <motion.div 
            initial={{ opacity: 0, rotate: 20, x: 250, y: 80 }}
            animate={{ opacity: 1, rotate: 15, x: 220, y: 40 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
            className="absolute origin-bottom bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-black/[0.04] p-4 w-52 h-64 flex flex-col z-10"
          >
            <div className="flex-1 bg-neutral-50 rounded-xl mb-3 p-3 overflow-hidden">
              <div className="w-full h-2 bg-neutral-200 rounded-full mb-2" />
              <div className="w-3/4 h-2 bg-neutral-200 rounded-full mb-4" />
              <div className="w-full h-16 bg-white border border-neutral-100 rounded flex items-center justify-center">
                <FileText className="w-6 h-6 text-neutral-300" />
              </div>
            </div>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center text-[8px] text-white font-bold">W</div>
              Board Memo.docx
            </div>
            <div className="text-xs text-neutral-400 pl-5">Edited by agent</div>
          </motion.div>
        </div>
      </main>

      {/* ─── TALL CARDS SECTION (Like Pricing Image) ─── */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-[1200px] mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-white/60 backdrop-blur-md border border-black/5 shadow-sm mb-6">
            <Menu className="w-4 h-4" />
            <span className="text-sm font-medium">Built for execution</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tight text-[#111] mb-4">Simple operation</h2>
          <p className="text-lg text-[#666]">Designed for people who actually ship. No endless ticket grooming.</p>
        </div>

        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white/80 backdrop-blur-xl border border-white p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Creator</h3>
            <p className="text-sm text-neutral-500 mb-8">For individuals scaling a personal brand.</p>
            
            <div className="text-5xl font-semibold tracking-tight mb-2">Content Vault</div>
            <p className="text-xs text-neutral-400 mb-8 pb-8 border-b border-neutral-100">Stop losing drafts in scattered folders.</p>

            <ul className="space-y-4 text-sm text-neutral-700 flex-1">
              <li className="flex items-center gap-3"><Check size={16} className="text-black" /> Auto-publish to YouTube</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-black" /> Instagram scheduling</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-black" /> AI-generated hooks</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-black" /> Proof-of-work heatmap</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="bg-white/80 backdrop-blur-xl border border-white p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Founder</h3>
            <p className="text-sm text-neutral-500 mb-8">For teams collaborating on core missions.</p>
            
            <div className="text-5xl font-semibold tracking-tight mb-2">Command</div>
            <p className="text-xs text-neutral-400 mb-8 pb-8 border-b border-neutral-100">The persistent layer underneath your team.</p>

            <ul className="space-y-4 text-sm text-neutral-700 flex-1">
              <li className="flex items-center gap-3"><Check size={16} className="text-blue-500" /> Everything in Creator</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-blue-500" /> Fathom meeting transcripts</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-blue-500" /> Auto-task extraction</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-blue-500" /> Centralized project state</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="bg-white/80 backdrop-blur-xl border border-white p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Agency</h3>
            <p className="text-sm text-neutral-500 mb-8">For organizations managing heavy client load.</p>
            
            <div className="text-5xl font-semibold tracking-tight mb-2">Custom</div>
            <p className="text-xs text-neutral-400 mb-8 pb-8 border-b border-neutral-100">Tailored to your specific pipeline.</p>

            <ul className="space-y-4 text-sm text-neutral-700 flex-1">
              <li className="flex items-center gap-3"><Check size={16} className="text-black" /> Custom AI agent routing</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-black" /> Dedicated client spaces</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-black" /> External approval flows</li>
              <li className="flex items-center gap-3"><Check size={16} className="text-black" /> Unlimited vault scaling</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── READY CTA SECTION ─── */}
      <section className="relative z-10 py-32 px-6 text-center">
        <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-tight text-[#111] mb-6">Ready to journey into <br/>Cultlike?</h2>
        <p className="text-lg sm:text-xl text-[#666] mb-12 max-w-xl mx-auto">
          Start building to see how Cultlike handles terabytes of context, assets, and tasks with absolute ease.
        </p>
        <div className="flex justify-center items-center gap-4">
          <Link href="/signup" className="px-8 py-3.5 rounded-full bg-black text-white text-[15px] font-medium shadow-lg hover:bg-neutral-800 transition-all">
            Get Started
          </Link>
          <Link href="/login" className="px-8 py-3.5 rounded-full bg-white text-black border border-black/[0.05] text-[15px] font-medium shadow-sm hover:bg-neutral-50 transition-all">
            Sign In
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-black/[0.05] pt-16 pb-8 px-6 sm:px-12 bg-[#f3f4f6]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start mb-32">
          
          <div className="mb-12 md:mb-0">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/[0.04] mb-4">
              <img src="/logo-cultlike.png" alt="Cultlike" className="w-6 h-6 object-contain" />
            </div>
            <p className="text-neutral-500 font-medium text-sm">The infinite AI-native workspace.</p>
            
            <div className="flex gap-3 mt-6">
              <Link href="/signup" className="px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium shadow-sm hover:bg-neutral-800 transition-colors">
                Get Started
              </Link>
              <Link href="/login" className="px-6 py-2.5 rounded-full bg-white text-black border border-black/5 text-sm font-medium shadow-sm hover:bg-neutral-50 transition-colors">
                Sign In
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 text-sm">
            <div>
              <h4 className="font-semibold text-black mb-4">Product</h4>
              <ul className="space-y-3 text-neutral-500">
                <li><Link href="#" className="hover:text-black">Overview</Link></li>
                <li><Link href="#" className="hover:text-black">Use cases</Link></li>
                <li><Link href="#" className="hover:text-black">Pricing</Link></li>
                <li><Link href="#" className="hover:text-black">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Company</h4>
              <ul className="space-y-3 text-neutral-500">
                <li><Link href="#" className="hover:text-black">Blog</Link></li>
                <li><Link href="#" className="hover:text-black">Team</Link></li>
                <li><Link href="#" className="hover:text-black">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Legal</h4>
              <ul className="space-y-3 text-neutral-500">
                <li><Link href="#" className="hover:text-black">Privacy</Link></li>
                <li><Link href="#" className="hover:text-black">Terms of Use</Link></li>
                <li><Link href="#" className="hover:text-black">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4">Social</h4>
              <ul className="space-y-3 text-neutral-500">
                <li><Link href="#" className="hover:text-black">GitHub</Link></li>
                <li><Link href="#" className="hover:text-black">LinkedIn</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Giant Watermark & Copyright */}
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 relative">
          <p>© 2026 Cultlike Systems, Inc.</p>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full overflow-hidden flex justify-center pointer-events-none opacity-20">
            <span className="text-[20vw] font-bold tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-neutral-300 to-transparent select-none" style={{ backgroundImage: 'radial-gradient(circle, #a3a3a3 1px, transparent 1px)', backgroundSize: '4px 4px', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              Cultlike
            </span>
          </div>
          <p className="relative z-10">Designed for builders.</p>
        </div>
      </footer>
    </div>
  )
}
