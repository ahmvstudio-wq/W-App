'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface AppleLoadingScreenProps {
  label?: string
  sublabel?: string
  fullScreen?: boolean
  compact?: boolean
}

export default function AppleLoadingScreen({
  label,
  fullScreen = true,
  compact = false,
}: AppleLoadingScreenProps) {
  const content = (
    <div className={cn(
      "relative flex flex-col items-center justify-center select-none font-body transition-all duration-300",
      compact ? "p-3" : "p-6"
    )}>
      {/* ------------------------------------------------------------- */}
      {/* APPLE FROSTED GLASS CHAMBER (VISIONOS SPECULAR GLASS)         */}
      {/* ------------------------------------------------------------- */}
      <div className={cn(
        "relative rounded-[32px] sm:rounded-[36px] bg-white/75 dark:bg-neutral-900/80 backdrop-blur-2xl border border-white/90 dark:border-white/10 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02),inset_0_1px_2px_rgba(255,255,255,0.95)] flex flex-col items-center justify-center overflow-hidden",
        compact ? "p-6 max-w-xs w-full" : "p-8 sm:p-12 max-w-[280px] sm:max-w-[320px] w-full mx-4"
      )}>
        {/* Specular Top-Edge Glass Shimmer */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/95 to-transparent pointer-events-none" />

        {/* Dynamic Subtle Ambient Atmosphere */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-violet-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* ----------------------------------------------------------- */}
        {/* HERO LOGO EMBLEM WITH APPLE BREATHING MOTION GRAPHIC        */}
        {/* ----------------------------------------------------------- */}
        <div className="relative mb-6 sm:mb-8 flex items-center justify-center">
          {/* Ambient Breathing Backlight Aura */}
          <div 
            className="absolute -inset-2 rounded-full bg-gradient-to-tr from-violet-500/15 via-indigo-500/15 to-neutral-400/10 blur-xl scale-125 animate-apple-breathe" 
          />

          {/* Centered Cultlike Logo */}
          <div className="relative flex items-center justify-center animate-apple-breathe">
            <img 
              src="/logo.png" 
              alt="Cultlike" 
              className={cn(
                "object-contain dark:invert drop-shadow-[0_4px_16px_rgba(0,0,0,0.06)] select-none",
                compact ? "w-12 h-12" : "w-16 h-16 sm:w-20 sm:h-20"
              )}
              draggable={false}
            />
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* APPLE MINIMALIST PROGRESS INDICATOR                         */}
        {/* ----------------------------------------------------------- */}
        <div className="w-28 sm:w-36 h-1 rounded-full bg-black/[0.06] dark:bg-white/[0.1] overflow-hidden relative shadow-inner">
          <div 
            className="h-full w-2/5 rounded-full bg-gradient-to-r from-neutral-400 via-neutral-900 to-neutral-400 dark:from-neutral-500 dark:via-white dark:to-neutral-500 animate-apple-bar" 
          />
        </div>

        {/* Optional Clean Human Label (Only shown if explicitly provided) */}
        {label && (
          <div className="mt-4 text-xs font-light text-neutral-500 dark:text-neutral-400 tracking-tight text-center animate-fadeIn">
            {label}
          </div>
        )}
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#fbfbfd]/80 dark:bg-[#0a0a0c]/85 backdrop-blur-2xl flex items-center justify-center overflow-hidden animate-fadeIn">
        {/* Ambient Fluid Background Atmospheric Backlights */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl pointer-events-none animate-ambient" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none animate-ambient" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-neutral-400/10 rounded-full blur-3xl pointer-events-none animate-ambient" style={{ animationDelay: '4s' }} />
        
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
