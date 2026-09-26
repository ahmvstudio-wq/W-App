'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, Menu, X, ArrowRight, Play, Folder, 
  Terminal, Video, Sparkles, FileText, ChevronRight, Layers,
  Compass, Shield, Cpu, Share2, ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatGPTLogo, ClaudeLogo, GoogleDriveLogo, YouTubeLogo, InstagramLogo, FathomLogo } from '@/components/IntegrationLogos'

// ─── POINTILLISM & DUST PARTICLE WAVE BACKGROUND ───
function StippledParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#f4f4f6]">
      {/* SVG Canvas for pointillism / stippled wave */}
      <svg className="absolute inset-0 w-full h-full opacity-75" preserveAspectRatio="none" viewBox="0 0 1440 900">
        <defs>
          <radialGradient id="blueGlow" cx="20%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="copperGlow" cx="85%" cy="30%" r="55%">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.20" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <pattern id="stipplePatternBlue" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="3" r="0.9" fill="#1e40af" opacity="0.45" />
            <circle cx="7" cy="8" r="0.75" fill="#3b82f6" opacity="0.35" />
            <circle cx="10" cy="2" r="0.6" fill="#60a5fa" opacity="0.5" />
            <circle cx="4" cy="10" r="0.8" fill="#1d4ed8" opacity="0.3" />
          </pattern>
          <pattern id="stipplePatternCopper" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="4" r="0.85" fill="#c2410c" opacity="0.4" />
            <circle cx="9" cy="2" r="0.7" fill="#d97706" opacity="0.45" />
            <circle cx="12" cy="10" r="0.95" fill="#ea580c" opacity="0.35" />
            <circle cx="5" cy="11" r="0.65" fill="#b45309" opacity="0.5" />
          </pattern>
        </defs>

        {/* Ambient base color washes */}
        <rect width="100%" height="100%" fill="url(#blueGlow)" />
        <rect width="100%" height="100%" fill="url(#copperGlow)" />

        {/* Dynamic sweeping wave paths filled with particle stipple */}
        <path
          d="M -100 650 Q 200 450 550 580 T 1100 480 Q 1300 420 1600 250 L 1600 900 L -100 900 Z"
          fill="url(#stipplePatternBlue)"
          className="opacity-90"
        />
        <path
          d="M 400 100 Q 800 250 1150 180 T 1600 120 L 1600 -100 L 400 -100 Z"
          fill="url(#stipplePatternCopper)"
          className="opacity-90"
        />
        <path
          d="M 850 150 C 1050 220, 1350 160, 1600 350 L 1600 0 L 850 0 Z"
          fill="url(#stipplePatternCopper)"
          className="opacity-70"
        />
      </svg>

      {/* Subtle fine noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035] mix-blend-color-burn" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} 
      />
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [pricingCycle, setPricingCycle] = useState<'annual' | 'monthly'>('annual')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [router])

  return (
    <div className="min-h-screen bg-transparent text-[#090a0c] selection:bg-neutral-900 selection:text-white relative font-sans antialiased">
      <StippledParticleBackground />

      {/* ─── FLOATING ENTERPRISE HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-5 flex items-center justify-between pointer-events-none">
        {/* Brand Icon Button */}
        <div className="pointer-events-auto">
          <Link 
            href="/" 
            className="w-11 h-11 bg-white hover:bg-neutral-50 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/[0.06] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          >
            <img src="/logo-cultlike.png" alt="Cultlike" className="w-6 h-6 object-contain rounded-full" />
          </Link>
        </div>

        {/* Central Floating Menu Button */}
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white hover:bg-neutral-50 active:scale-95 text-neutral-800 text-[13px] font-medium shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-black/[0.06] transition-all cursor-pointer"
          >
            <span className="flex flex-col gap-[3px] w-3.5">
              <span className="h-[1.5px] w-full bg-neutral-800 rounded-full" />
              <span className="h-[1.5px] w-full bg-neutral-800 rounded-full" />
            </span>
            <span>Menu</span>
          </button>
        </div>

        {/* Right CTAs */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          <Link 
            href="/login" 
            className="px-4 sm:px-5 py-2 rounded-full bg-white hover:bg-neutral-50 text-neutral-900 text-[13px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/[0.06] transition-all"
          >
            Book a demo
          </Link>
          <Link 
            href="/signup" 
            className="px-4 sm:px-5 py-2 rounded-full bg-[#0a0b0d] hover:bg-neutral-800 text-white text-[13px] font-medium shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all active:scale-95"
          >
            Download
          </Link>
        </div>
      </header>

      {/* ─── FULLSCREEN NAVIGATION MODAL ─── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-[#f4f4f6]/95 backdrop-blur-2xl p-6 sm:p-12 flex flex-col justify-between"
          >
            <div className="flex justify-center">
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-black/[0.08] shadow-sm text-[13px] font-medium text-neutral-800 hover:bg-neutral-50 transition-all cursor-pointer"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>

            <div className="max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-12 my-auto text-left">
              <div>
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-neutral-400 block mb-6">Product</span>
                <ul className="space-y-4 text-2xl font-semibold text-neutral-900">
                  <li><Link href="/" onClick={() => setIsMenuOpen(false)} className="hover:text-neutral-500 transition-colors">Overview</Link></li>
                  <li><Link href="#features" onClick={() => setIsMenuOpen(false)} className="hover:text-neutral-500 transition-colors">Workspaces</Link></li>
                  <li><Link href="#use-cases" onClick={() => setIsMenuOpen(false)} className="hover:text-neutral-500 transition-colors">Use Cases</Link></li>
                  <li><Link href="#pricing" onClick={() => setIsMenuOpen(false)} className="hover:text-neutral-500 transition-colors">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-neutral-400 block mb-6">Company</span>
                <ul className="space-y-4 text-2xl font-semibold text-neutral-900">
                  <li><Link href="/about" onClick={() => setIsMenuOpen(false)} className="hover:text-neutral-500 transition-colors">About Us</Link></li>
                  <li><Link href="/changelog" onClick={() => setIsMenuOpen(false)} className="hover:text-neutral-500 transition-colors">Changelog</Link></li>
                  <li><Link href="/contact" onClick={() => setIsMenuOpen(false)} className="hover:text-neutral-500 transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-neutral-400 block mb-6">Account</span>
                <div className="space-y-4 pt-2">
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="block w-full py-3 text-center rounded-full bg-black text-white font-medium text-sm shadow-md">
                    Launch Cultlike
                  </Link>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block w-full py-3 text-center rounded-full bg-white border border-black/10 text-neutral-900 font-medium text-sm shadow-sm">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-neutral-400">
              © 2026 Cultlike Systems, Inc. All rights reserved.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────── 1. HERO SECTION ─────────────────── */}
      <section className="relative z-10 pt-36 sm:pt-44 pb-20 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        
        {/* Backed Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-8"
        >
          <span className="text-[13px] text-neutral-500 font-medium">Backed by</span>
          <span className="text-[13px] font-bold tracking-tight text-neutral-900">a16z / SPEEDRUN</span>
        </motion.div>

        {/* Master Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-[clamp(3.2rem,8.5vw,6.5rem)] font-bold tracking-[-0.04em] leading-[0.98] text-[#0d0e11] mb-8 max-w-4xl"
        >
          The infinite<br />
          <span className="text-[#888b94] font-semibold">AI-native workspace</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-[21px] text-[#555861] font-normal leading-relaxed max-w-2xl mx-auto mb-10"
        >
          Instant access to terabytes of creative assets, sprint context, and execution data. One persistent layer for you, your team, and your agents.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3.5 mb-6"
        >
          <Link 
            href="/signup" 
            className="px-8 py-3.5 rounded-full bg-[#0a0b0d] hover:bg-neutral-800 text-white text-[15px] font-medium shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            Download
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-3.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-900 text-[15px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/[0.08] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            Book a demo
          </Link>
        </motion.div>

        {/* Platform Subtext */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-xs text-neutral-400 font-medium"
        >
          macOS · Linux · Windows coming soon
        </motion.div>
      </section>

      {/* ─────────────────── 2. "BUILT FOR EVERY KIND OF WORK" 2X2 GRID ─────────────────── */}
      <section id="features" className="relative z-10 py-24 sm:py-32 px-4 sm:px-8 max-w-[1340px] mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-[#0d0e11] mb-4">
            Built for every kind of work
          </h2>
          <p className="text-lg sm:text-xl text-[#6b6e79] font-normal">
            One persistent operating system for your team, your tools, and your agents.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          
          {/* CARD 1: Knowledge work (Claude Code & Markdown Document) */}
          <div className="bg-white rounded-[36px] p-6 sm:p-10 border border-black/[0.05] shadow-[0_10px_35px_rgba(0,0,0,0.03)] flex flex-col justify-between group hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all">
            {/* macOS Chrome UI Mockup */}
            <div className="bg-[#f7f7f9] rounded-2xl p-6 sm:p-8 mb-10 relative min-h-[360px] flex items-center justify-center overflow-hidden border border-black/[0.04]">
              
              {/* Back window: Client proposal markdown */}
              <div className="w-[85%] bg-white rounded-xl shadow-lg border border-black/10 overflow-hidden text-left text-xs font-mono">
                <div className="bg-[#f0f0f3] px-3 py-2 border-b border-black/5 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  <span className="text-[11px] text-neutral-400 font-sans ml-2">Client proposal.md</span>
                </div>
                <div className="p-4 text-neutral-600 space-y-2">
                  <p className="font-bold text-neutral-900"># Harbor Clinic — Proposal</p>
                  <p className="text-[11px]">Prepared for Harbor Clinic Board</p>
                  <p className="text-[10px] text-neutral-400">## Budget</p>
                  <p className="text-[11px]">$3.9M after value engineering, with a 12% contingency release.</p>
                </div>
              </div>

              {/* Front Floating window: Claude Code Terminal */}
              <div className="absolute top-8 right-6 w-[82%] bg-[#1a1b1e] rounded-xl shadow-2xl border border-white/10 overflow-hidden text-left text-xs font-mono">
                <div className="bg-[#26272b] px-3 py-2 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    <span className="text-[11px] text-neutral-300 font-sans ml-2">Clients — claude — 80×24</span>
                  </div>
                </div>
                <div className="p-4 space-y-2 text-[11px] leading-relaxed">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <ClaudeLogo className="w-3.5 h-3.5 text-[#ea580c]" />
                    <span className="text-white font-semibold">Claude Code</span>
                    <span className="text-neutral-500">v2.0.14 · Sonnet 4.5</span>
                  </div>
                  <div className="text-neutral-300 pt-1">&gt; tighten the budget section in Client proposal.md</div>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Read(Client proposal.md) — 18 lines</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded border border-white/5 text-[10px] space-y-0.5">
                    <div className="bg-rose-950/60 text-rose-300 px-1 line-through">- $4.2M including a 10% contingency</div>
                    <div className="bg-emerald-950/60 text-emerald-300 px-1">+ $3.9M after value engineering, with 12% reserve</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-neutral-400 tracking-wide block mb-2">Knowledge work</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-4">
                Keep agents in sync on one persistent drive.
              </h3>
              <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 group-hover:text-black">
                <span>Learn more</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* CARD 2: Architecture & Project Engineering (CAD / Plan Window) */}
          <div className="bg-white rounded-[36px] p-6 sm:p-10 border border-black/[0.05] shadow-[0_10px_35px_rgba(0,0,0,0.03)] flex flex-col justify-between group hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all">
            <div className="bg-[#f7f7f9] rounded-2xl p-4 sm:p-6 mb-10 relative min-h-[360px] flex items-center justify-center overflow-hidden border border-black/[0.04]">
              {/* Dark CAD Studio Window */}
              <div className="w-full bg-[#18191c] rounded-xl shadow-xl border border-white/10 overflow-hidden text-left text-xs">
                <div className="bg-[#222327] px-3 py-2 border-b border-white/5 flex items-center justify-between text-neutral-400 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    <span className="ml-2 text-neutral-200 font-mono">Tower_B_L12.dwg</span>
                  </div>
                  <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">A-WALL · ByLayer</span>
                </div>
                {/* CAD Grid Simulation */}
                <div className="h-56 bg-[#121316] relative flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2128_1px,transparent_1px),linear-gradient(to_bottom,#1f2128_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />
                  <div className="relative z-10 w-48 h-32 border-2 border-sky-400/80 rounded flex items-center justify-center">
                    <div className="w-24 h-16 border border-amber-400/80 grid grid-cols-2 gap-1 p-1">
                      <div className="bg-sky-500/20 border border-sky-400/40" />
                      <div className="bg-sky-500/20 border border-sky-400/40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-neutral-400 tracking-wide block mb-2">Architecture, engineering & construction</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-4">
                Keep every team on the latest plans.
              </h3>
              <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 group-hover:text-black">
                <span>Learn more</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* CARD 3: 3D & Creative Assets (Blender Viewport) */}
          <div className="bg-white rounded-[36px] p-6 sm:p-10 border border-black/[0.05] shadow-[0_10px_35px_rgba(0,0,0,0.03)] flex flex-col justify-between group hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all">
            <div className="bg-[#f7f7f9] rounded-2xl p-4 sm:p-6 mb-10 relative min-h-[360px] flex items-center justify-center overflow-hidden border border-black/[0.04]">
              {/* Blender Dark Window */}
              <div className="w-full bg-[#202124] rounded-xl shadow-xl border border-white/10 overflow-hidden text-left text-xs">
                <div className="bg-[#2c2d31] px-3 py-2 border-b border-white/5 flex items-center justify-between text-neutral-300 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    <span className="ml-2 font-medium">Canyon_Rock.blend — Blender 4.5</span>
                  </div>
                </div>
                <div className="h-56 bg-[#161719] relative flex items-center justify-center overflow-hidden">
                  <div className="w-36 h-28 bg-gradient-to-tr from-neutral-600 to-neutral-400 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center text-[10px] text-white font-mono">
                    Rock_PolyMesh
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-neutral-400 tracking-wide block mb-2">Games & 3D</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-4">
                Build bigger worlds without filling your disk.
              </h3>
              <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 group-hover:text-black">
                <span>Learn more</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* CARD 4: Film, Video & Audio Timeline */}
          <div className="bg-white rounded-[36px] p-6 sm:p-10 border border-black/[0.05] shadow-[0_10px_35px_rgba(0,0,0,0.03)] flex flex-col justify-between group hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all">
            <div className="bg-[#f7f7f9] rounded-2xl p-4 sm:p-6 mb-10 relative min-h-[360px] flex items-center justify-center overflow-hidden border border-black/[0.04]">
              {/* Video Timeline Window */}
              <div className="w-full bg-[#1b1c20] rounded-xl shadow-xl border border-white/10 overflow-hidden text-left text-xs">
                <div className="bg-[#24252a] px-3 py-2 border-b border-white/5 flex items-center justify-between text-neutral-300 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    <span className="ml-2 font-medium">Harbor Film — 00:28:00</span>
                  </div>
                </div>
                <div className="p-3 bg-[#131417] space-y-2">
                  <div className="h-28 bg-neutral-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  {/* Audio Waveform Track */}
                  <div className="bg-emerald-950/70 border border-emerald-500/30 rounded p-1.5 flex items-center gap-1">
                    <span className="text-[9px] font-mono text-emerald-400">Harbor_Theme.wav</span>
                    <div className="flex-1 h-3 flex items-center gap-0.5 overflow-hidden">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className="w-1 bg-emerald-400 rounded-full" style={{ height: `${(i % 5 + 2) * 20}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-neutral-400 tracking-wide block mb-2">Film, video & audio</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-4">
                Edit from anywhere. Leave the SSDs behind.
              </h3>
              <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-900 group-hover:text-black">
                <span>Learn more</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────── 3. SIMPLE PRICING ─────────────────── */}
      <section id="pricing" className="relative z-10 py-24 sm:py-32 px-4 sm:px-8 max-w-[1340px] mx-auto text-center">
        
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-[#0d0e11] mb-4">
            Simple pricing
          </h2>
          <p className="text-base sm:text-lg text-[#6b6e79] font-normal leading-relaxed mb-8">
            Individual includes 1 TB for one person. Teams pools 1 TB per member for collaborative workspaces.
          </p>

          {/* Monthly / Annual Pill Toggle */}
          <div className="inline-flex p-1 rounded-full bg-white border border-black/[0.08] shadow-sm">
            <button 
              onClick={() => setPricingCycle('monthly')}
              className={cn(
                "px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                pricingCycle === 'monthly' ? "bg-neutral-100 text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              Monthly
            </button>
            <button 
              onClick={() => setPricingCycle('annual')}
              className={cn(
                "px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                pricingCycle === 'annual' ? "bg-[#0a0b0d] text-white shadow-xs" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              Annual
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left max-w-[1200px] mx-auto">
          
          {/* Individual */}
          <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-black/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Individual</h3>
              <p className="text-xs text-neutral-500 leading-relaxed mb-8">
                For individuals working across multiple computers.
              </p>
              
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-extrabold tracking-tight text-neutral-900">$15</span>
                <span className="text-sm font-medium text-neutral-400">/ month</span>
              </div>
              <p className="text-xs text-neutral-400 pb-8 border-b border-neutral-100 mb-8">
                {pricingCycle === 'annual' ? '$180 billed yearly · save 25%' : 'Billed monthly'}
              </p>

              <ul className="space-y-4 text-xs font-medium text-neutral-700">
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-neutral-900 shrink-0 mt-0.5" />
                  <span>1 TB included storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-neutral-900 shrink-0 mt-0.5" />
                  <span>Standard streaming performance</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-neutral-900 shrink-0 mt-0.5" />
                  <span>One seat, all your computers</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-neutral-900 shrink-0 mt-0.5" />
                  <span>Public file links and upload requests</span>
                </li>
              </ul>
            </div>

            <Link href="/signup" className="mt-10 block w-full py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-center text-xs font-semibold transition-all">
              Get started
            </Link>
          </div>

          {/* Teams */}
          <div className="bg-white rounded-[32px] p-8 sm:p-10 border-2 border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex flex-col justify-between relative">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Teams</h3>
              <p className="text-xs text-neutral-500 leading-relaxed mb-8">
                For teams collaborating in shared workspaces.
              </p>
              
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-extrabold tracking-tight text-neutral-900">$30</span>
                <span className="text-sm font-medium text-neutral-400">/ member / month</span>
              </div>
              <p className="text-xs text-neutral-400 pb-8 border-b border-neutral-100 mb-8">
                {pricingCycle === 'annual' ? '$360 per member billed yearly · save 40%' : 'Billed monthly per member'}
              </p>

              <ul className="space-y-4 text-xs font-medium text-neutral-700">
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>Everything in Individual</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>1 TB pooled storage per member</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>High-performance throughput</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>Shared workspaces and member access controls</span>
                </li>
              </ul>
            </div>

            <Link href="/signup" className="mt-10 block w-full py-3 rounded-full bg-[#0a0b0d] hover:bg-neutral-800 text-white text-center text-xs font-semibold shadow-md transition-all">
              Start team trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-black/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Enterprise</h3>
              <p className="text-xs text-neutral-500 leading-relaxed mb-8">
                For organizations with custom requirements.
              </p>
              
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-extrabold tracking-tight text-neutral-900">Custom</span>
              </div>
              <p className="text-xs text-neutral-400 pb-8 border-b border-neutral-100 mb-8">
                tailored to your organization
              </p>

              <ul className="space-y-4 text-xs font-medium text-neutral-700">
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-neutral-900 shrink-0 mt-0.5" />
                  <span>Highest throughput, dedicated infrastructure</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-neutral-900 shrink-0 mt-0.5" />
                  <span>Custom pricing, seats, and storage terms</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-neutral-900 shrink-0 mt-0.5" />
                  <span>Granular version controls and retention</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={14} className="text-neutral-900 shrink-0 mt-0.5" />
                  <span>Custom auditing and compliance reporting</span>
                </li>
              </ul>
            </div>

            <Link href="/contact" className="mt-10 block w-full py-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-center text-xs font-semibold transition-all">
              Contact sales
            </Link>
          </div>

        </div>
      </section>

      {/* ─────────────────── 4. "READY TO JOURNEY" + 5 FANNED CARDS ─────────────────── */}
      <section className="relative z-10 pt-20 pb-36 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        
        {/* 5 Fanned Out macOS Style Cards */}
        <div className="relative h-[220px] w-full max-w-3xl mx-auto mb-16 flex justify-center items-end">
          
          {/* Card 1: Q3 Launch Folder */}
          <motion.div 
            initial={{ rotate: -16, x: -220, y: 15 }}
            whileHover={{ y: 0, scale: 1.05 }}
            className="absolute origin-bottom bg-white rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.07)] border border-black/[0.06] p-4 w-40 h-52 flex flex-col justify-between text-left"
          >
            <div className="h-28 bg-sky-50 rounded-xl flex items-center justify-center">
              <Folder className="w-12 h-12 text-sky-400 fill-sky-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                <Folder className="w-3 h-3 text-sky-500 fill-sky-500" />
                <span>Q3 Launch</span>
              </div>
              <span className="text-[10px] text-neutral-400">1.2 TB</span>
            </div>
          </motion.div>

          {/* Card 2: Video Asset */}
          <motion.div 
            initial={{ rotate: -8, x: -110, y: 5 }}
            whileHover={{ y: -5, scale: 1.05 }}
            className="absolute origin-bottom bg-white rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.08)] border border-black/[0.06] p-4 w-40 h-52 flex flex-col justify-between text-left z-10"
          >
            <div className="h-28 bg-neutral-900 rounded-xl relative overflow-hidden flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Video" />
              <div className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900 truncate">Brownstones.mov</div>
              <span className="text-[10px] text-neutral-400">4.2 GB</span>
            </div>
          </motion.div>

          {/* Card 3: CAD Architectural DWG (Center) */}
          <motion.div 
            initial={{ rotate: 0, x: 0, y: -5 }}
            whileHover={{ y: -15, scale: 1.05 }}
            className="absolute origin-bottom bg-white rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.12)] border border-black/[0.06] p-4 w-40 h-52 flex flex-col justify-between text-left z-20"
          >
            <div className="h-28 bg-[#18191c] rounded-xl p-2 flex flex-col justify-between">
              <div className="w-full h-full border border-sky-400/40 rounded flex items-center justify-center">
                <div className="w-10 h-10 border border-amber-400/60 grid grid-cols-2 gap-0.5 p-0.5" />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900 truncate">Tower_L12.dwg</div>
              <span className="text-[10px] text-neutral-400">1.2 GB</span>
            </div>
          </motion.div>

          {/* Card 4: 3D Model */}
          <motion.div 
            initial={{ rotate: 8, x: 110, y: 5 }}
            whileHover={{ y: -5, scale: 1.05 }}
            className="absolute origin-bottom bg-white rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.08)] border border-black/[0.06] p-4 w-40 h-52 flex flex-col justify-between text-left z-10"
          >
            <div className="h-28 bg-[#202124] rounded-xl flex items-center justify-center">
              <div className="w-12 h-10 bg-neutral-400 rounded-full border border-amber-500 opacity-90 shadow-sm" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900 truncate">Canyon.blend</div>
              <span className="text-[10px] text-neutral-400">486 MB</span>
            </div>
          </motion.div>

          {/* Card 5: Board Memo Doc */}
          <motion.div 
            initial={{ rotate: 16, x: 220, y: 15 }}
            whileHover={{ y: 0, scale: 1.05 }}
            className="absolute origin-bottom bg-white rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.07)] border border-black/[0.06] p-4 w-40 h-52 flex flex-col justify-between text-left"
          >
            <div className="h-28 bg-[#fafafc] border border-neutral-100 rounded-xl p-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="h-1.5 w-16 bg-neutral-300 rounded-full" />
                <div className="h-1 w-full bg-neutral-200 rounded-full" />
                <div className="h-1 w-4/5 bg-neutral-200 rounded-full" />
              </div>
              <div className="h-6 w-full bg-white rounded border border-neutral-100 flex items-center px-1 text-[8px] font-mono text-neutral-400">
                Metric | Q2 | Q3
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900 truncate">Board memo.docx</div>
              <span className="text-[10px] text-neutral-400">Edited by agent</span>
            </div>
          </motion.div>

        </div>

        {/* Heading */}
        <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.03em] text-[#0d0e11] mb-6">
          Ready to journey into<br />Cultlike?
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#6b6e79] font-normal leading-relaxed max-w-xl mx-auto mb-10">
          Book a demo to see how Cultlike handles terabytes of files, creative pipelines, and sprint context with ease.
        </p>

        {/* Dual Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <Link 
            href="/signup" 
            className="px-8 py-3.5 rounded-full bg-[#0a0b0d] hover:bg-neutral-800 text-white text-[15px] font-medium shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all hover:scale-[1.02] active:scale-95"
          >
            Download
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-3.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-900 text-[15px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-black/[0.08] transition-all hover:scale-[1.02] active:scale-95"
          >
            Book a demo
          </Link>
        </div>
      </section>

      {/* ─────────────────── 5. ENTERPRISE FOOTER WITH HALFTONE WATERMARK ─────────────────── */}
      <footer className="relative z-10 border-t border-black/[0.06] pt-16 pb-12 px-6 sm:px-12 bg-[#f4f4f6]/60">
        <div className="max-w-[1340px] mx-auto flex flex-col md:flex-row justify-between items-start mb-24">
          
          {/* Left info & actions */}
          <div className="mb-12 md:mb-0 max-w-sm">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/[0.06] mb-4">
              <img src="/logo-cultlike.png" alt="Cultlike" className="w-6 h-6 object-contain rounded-full" />
            </div>
            <p className="text-neutral-600 font-medium text-sm mb-6">
              The infinite AI-native workspace.
            </p>
            
            <div className="flex items-center gap-3">
              <Link href="/signup" className="px-5 py-2.5 rounded-full bg-[#0a0b0d] hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition-all">
                Download
              </Link>
              <Link href="/login" className="px-5 py-2.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-900 border border-black/[0.08] text-xs font-semibold shadow-sm transition-all">
                Book a demo
              </Link>
            </div>
          </div>

          {/* Right link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 sm:gap-16 text-xs">
            <div>
              <h4 className="font-semibold text-neutral-400 tracking-wider uppercase text-[11px] mb-4">Product</h4>
              <ul className="space-y-3 text-neutral-700 font-medium">
                <li><Link href="#" className="hover:text-black transition-colors">Overview</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Space Search</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Use cases</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">FAQ</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Industries</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Developers</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Enterprise</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-400 tracking-wider uppercase text-[11px] mb-4">Company</h4>
              <ul className="space-y-3 text-neutral-700 font-medium">
                <li><Link href="#" className="hover:text-black transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Changelog</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Team</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-400 tracking-wider uppercase text-[11px] mb-4">Legal</h4>
              <ul className="space-y-3 text-neutral-700 font-medium">
                <li><Link href="#" className="hover:text-black transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Terms of Use</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-400 tracking-wider uppercase text-[11px] mb-4">Social</h4>
              <ul className="space-y-3 text-neutral-700 font-medium">
                <li><Link href="#" className="hover:text-black transition-colors">GitHub</Link></li>
                <li><Link href="#" className="hover:text-black transition-colors">LinkedIn</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Giant Watermark Background */}
        <div className="max-w-[1340px] mx-auto pt-8 border-t border-black/[0.04] flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 font-medium relative">
          <p>© 2026 Cultlike Systems, Inc.</p>
          
          {/* Halftone Dotted Watermark */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-full overflow-hidden flex justify-center pointer-events-none opacity-[0.14] select-none">
            <span 
              className="text-[18vw] font-black tracking-[-0.05em] leading-none text-neutral-900"
              style={{
                backgroundImage: 'radial-gradient(circle, #333 1.2px, transparent 1.2px)',
                backgroundSize: '4.5px 4.5px',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}
            >
              Cultlike
            </span>
          </div>

          <p className="relative z-10">Designed for people who ship.</p>
        </div>
      </footer>

    </div>
  )
}
