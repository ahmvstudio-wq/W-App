'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface AppleLoadingScreenProps {
  label?: string
  sublabel?: string
  fullScreen?: boolean
  compact?: boolean
  showPhases?: boolean
}

const DEFAULT_PHASES = [
  'Initializing Zero-Latency Core',
  'Synchronizing Workspace Directives',
  'Calibrating High-Velocity Streams',
  'Preparing Executive Canvas'
]

export default function AppleLoadingScreen({
  label,
  sublabel,
  fullScreen = true,
  compact = false,
  showPhases = true,
}: AppleLoadingScreenProps) {
  const [phaseIndex, setPhaseIndex] = useState(0)

  useEffect(() => {
    if (!showPhases) return
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % DEFAULT_PHASES.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [showPhases])

  const activeLabel = label || DEFAULT_PHASES[phaseIndex]
  const activeSublabel = sublabel || 'Cultlike OS // Executive Architecture'

  const content = (
    <div className={cn(
      "relative flex flex-col items-center justify-center select-none font-body transition-all duration-300",
      compact ? "p-4" : "p-6 sm:p-8"
    )}>
      {/* ------------------------------------------------------------- */}
      {/* FROSTED GLASS CHAMBER (APPLE VISIONOS / macOS SPECULAR GLASS) */}
      {/* ------------------------------------------------------------- */}
      <div className={cn(
        "relative rounded-[32px] sm:rounded-[36px] bg-white/70 dark:bg-neutral-900/75 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03),inset_0_1px_2px_rgba(255,255,255,0.95)] flex flex-col items-center overflow-hidden",
        compact ? "p-6 max-w-xs w-full" : "p-8 sm:p-10 max-w-[340px] sm:max-w-sm w-full mx-4"
      )}>
        {/* Specular Top-Edge Glass Shimmer */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

        {/* Dynamic Inner Light Dispersion */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-fuchsia-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* ----------------------------------------------------------- */}
        {/* APPLE-STYLE MOTION GRAPHIC (ORBITAL GYROSCOPE + LOGO EMBLEM) */}
        {/* ----------------------------------------------------------- */}
        <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
          {/* Ambient Multi-Hue Breathing Glow */}
          <div 
            className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600/35 via-fuchsia-500/30 to-cyan-400/35 blur-xl animate-pulse"
            style={{ animationDuration: '3s' }}
          />

          {/* Outer Orbital Ring (Clockwise Specular Sweep) */}
          <div 
            className="absolute inset-0 rounded-full border border-black/[0.08] dark:border-white/[0.08] border-t-indigo-600 border-r-purple-500 animate-spin"
            style={{ animationDuration: '4s' }}
          />

          {/* Secondary Counter-Rotating Ring (Precision Dashed Notches) */}
          <div 
            className="absolute w-20 h-20 rounded-full border border-dashed border-black/[0.12] dark:border-white/[0.15] border-b-cyan-500 border-l-amber-500 animate-spin"
            style={{ animationDuration: '6s', animationDirection: 'reverse' }}
          />

          {/* Outer Orbiting Photon Bead */}
          <div 
            className="absolute inset-0 animate-spin pointer-events-none"
            style={{ animationDuration: '4s' }}
          >
            <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_10px_#6366f1,0_0_4px_#a855f7] -translate-x-1 translate-y-2" />
          </div>

          {/* Center Floating Glass Jewel with Cultlike Logo */}
          <div className="relative w-14 h-14 rounded-2xl bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,1)] border border-white/90 dark:border-white/10 flex items-center justify-center p-2.5 z-10 transition-transform duration-500 hover:scale-105">
            <img 
              src="/logo.png" 
              alt="Cultlike OS" 
              className="w-full h-full object-contain drop-shadow-xs" 
            />
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* APPLE TYPOGRAPHY & INTERACTIVE TELEMETRY                     */}
        {/* ----------------------------------------------------------- */}
        <div className="flex flex-col items-center text-center space-y-2 z-10 w-full">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono tracking-[0.26em] uppercase font-semibold text-neutral-800 dark:text-neutral-200">
              CULTLIKE OS
            </span>
          </div>

          {/* Animated Transition Label */}
          <div className="h-6 flex items-center justify-center">
            <span 
              key={activeLabel} 
              className="text-xs font-normal text-neutral-600 dark:text-neutral-400 tracking-tight animate-fadeIn"
            >
              {activeLabel}
            </span>
          </div>

          {/* Sublabel / Architecture Stamp */}
          <div className="text-[9px] font-mono tracking-wider uppercase text-neutral-400 font-light truncate max-w-[240px]">
            {activeSublabel}
          </div>

          {/* ----------------------------------------------------------- */}
          {/* APPLE MICRO FLUID SHIMMER BAR                              */}
          {/* ----------------------------------------------------------- */}
          <div className="w-44 h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] overflow-hidden relative mt-3 shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 animate-shimmer"
              style={{
                width: '100%',
                animation: 'stream-glow 2.5s ease-in-out infinite, shimmer-sweep 2.2s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#fbfbfd]/70 dark:bg-[#0a0a0c]/75 backdrop-blur-2xl flex items-center justify-center overflow-hidden animate-fadeIn">
        {/* Ambient Fluid Background Backlights (Apple Siri / VisionOS Atmosphere) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-ambient" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-ambient" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-ambient" style={{ animationDelay: '4s' }} />
        
        {content}
      </div>
    )
  }

  return (
    <div className="w-full min-h-[55vh] flex items-center justify-center p-4 animate-fadeIn">
      {content}
    </div>
  )
}
