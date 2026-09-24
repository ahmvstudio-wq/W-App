'use client'

import React from 'react'
import AppleLoadingScreen from './AppleLoadingScreen'

interface LoadingRadarProps {
  label?: string
  sublabel?: string
  fullScreen?: boolean
  compact?: boolean
}

export default function LoadingRadar({
  label,
  sublabel,
  fullScreen = false,
  compact = false
}: LoadingRadarProps) {
  return (
    <AppleLoadingScreen
      label={label}
      sublabel={sublabel}
      fullScreen={fullScreen}
      compact={compact}
    />
  )
}

