'use client'

import React from 'react'

/** Reusable Apple / Linear style shimmer card skeleton */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl p-6 bg-white border border-black/[0.06] shadow-xs flex flex-col justify-between h-56 relative overflow-hidden"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-16 h-5 rounded-full skeleton-motion" />
              <div className="w-8 h-4 rounded-full skeleton-motion" />
            </div>
            <div className="w-3/4 h-5 rounded-lg skeleton-motion" />
            <div className="w-1/2 h-3.5 rounded-lg skeleton-motion" />
          </div>

          <div className="pt-4 border-t border-black/[0.04] flex items-center justify-between">
            <div className="w-20 h-4 rounded-md skeleton-motion" />
            <div className="w-24 h-4 rounded-md skeleton-motion" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Reusable task item skeleton */
export function TaskRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 bg-white border border-black/[0.06] flex items-center justify-between relative overflow-hidden h-16 shadow-2xs"
        >
          <div className="flex items-center gap-3.5 w-2/3">
            <div className="w-5 h-5 rounded-md skeleton-motion flex-shrink-0" />
            <div className="w-full space-y-2">
              <div className="w-3/5 h-3.5 rounded-md skeleton-motion" />
              <div className="w-1/3 h-2.5 rounded-md skeleton-motion" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-5 rounded-full skeleton-motion" />
            <div className="w-16 h-5 rounded-full skeleton-motion" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Dashboard metrics card skeleton */
export function MetricSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-5 rounded-3xl bg-white border border-black/[0.06] shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div className="w-20 h-3.5 rounded-md skeleton-motion" />
            <div className="w-6 h-6 rounded-lg skeleton-motion" />
          </div>
          <div className="w-16 h-7 rounded-lg skeleton-motion" />
          <div className="w-28 h-3 rounded-md skeleton-motion" />
        </div>
      ))}
    </div>
  )
}
