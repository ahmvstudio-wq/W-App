'use client'

import React from 'react'

interface LoadingRadarProps {
  label?: string
  sublabel?: string
  fullScreen?: boolean
}

export default function LoadingRadar({
  label = 'Synchronizing Workspace',
  sublabel = 'Cultlike OS // Zero Latency Engine',
  fullScreen = false
}: LoadingRadarProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center select-none font-body">
      {/* Motion Graphic Radar Ring */}
      <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
        {/* Ambient Pulsing Aura */}
        <div 
          className="absolute inset-0 rounded-full bg-black/5 dark:bg-white/5 animate-ping" 
          style={{ animationDuration: '2.5s' }} 
        />
        
        {/* Subtle Outer Ring */}
        <div className="absolute inset-0 rounded-full border border-black/10 dark:border-white/10" />
        
        {/* Rotating Radar Scanner Arc */}
        <div 
          className="absolute inset-0 rounded-full border-t-2 border-r-2 border-black dark:border-white animate-spin"
          style={{ animationDuration: '1.2s' }}
        />

        {/* Center Tech Dot */}
        <div className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white shadow-xs" />
      </div>

      {/* Modern High-End Typography */}
      <div className="text-xs font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
        {label}
      </div>
      {sublabel && (
        <div className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 mt-1 font-light">
          {sublabel}
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#fbfbfd]/90 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
