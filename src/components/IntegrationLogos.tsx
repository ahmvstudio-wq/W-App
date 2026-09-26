import React from 'react'

export function ChatGPTLogo({ className = "w-8 h-8", fill = "#10A37F" }: { className?: string; fill?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.0557 6.0557 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.65a4.475 4.475 0 0 1 2.365-1.993v5.688a.784.784 0 0 0 .392.68l5.82 3.36-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 8.65zm16.597 3.855l-5.833-3.37L15.124 8a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.688zm2.01-4.733l-.143-.086-4.767-2.758a.771.771 0 0 0-.78 0L9.414 8.297V5.965a.08.08 0 0 1 .033-.062L14.28 3.11a4.5 4.5 0 0 1 6.666 4.662zm-8.86-5.875a4.47 4.47 0 0 1 2.876 1.04l-.141.08-4.779 2.758a.795.795 0 0 0-.392.682v6.736L8.64 12.2a.071.071 0 0 1-.038-.052V6.565A4.504 4.504 0 0 1 12.087 1.897zm-1.04 7.643l2.87-1.656 2.87 1.656v3.313l-2.87 1.657-2.87-1.657V9.54z"
        fill={fill}
      />
    </svg>
  )
}

export function ClaudeLogo({ className = "w-8 h-8", fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill={fill}>
      <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
    </svg>
  )
}

export function GoogleDriveLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M8.2 3.5L1.5 15.2l3.4 6 6.7-11.7L8.2 3.5z" fill="#0066DA" />
      <path d="M15.8 3.5H8.2l6.7 11.7h7.6L15.8 3.5z" fill="#00AC47" />
      <path d="M22.5 15.2H7.4l-3.5 6h15.2l3.4-6z" fill="#EA4335" />
      <path d="M14.9 15.2l-3.3-5.8-3.4 5.8h6.7z" fill="#FFBA00" />
    </svg>
  )
}

export function YouTubeLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#FF0000" />
      <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#FFFFFF" />
    </svg>
  )
}

export function InstagramLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="30%" stopColor="#F77737" />
          <stop offset="50%" stopColor="#F56040" />
          <stop offset="70%" stopColor="#FD1D1D" />
          <stop offset="100%" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#igGradient)" />
      <rect x="5" y="5" width="14" height="14" rx="4" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.2" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="15.8" cy="8.2" r="0.9" fill="#FFFFFF" />
    </svg>
  )
}

export function FathomLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#2563EB" />
      <path d="M7 8h10M7 12h7M7 16h5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="15" r="2" fill="#38BDF8" />
    </svg>
  )
}

export function FigmaLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M8 3.5h4v5H8a2.5 2.5 0 0 1 0-5z" fill="#F24E1E" />
      <path d="M12 3.5h4a2.5 2.5 0 0 1 0 5h-4V3.5z" fill="#FF7262" />
      <path d="M12 8.5h4a2.5 2.5 0 0 1 0 5h-4V8.5z" fill="#1ABCFE" />
      <path d="M8 8.5h4v5H8a2.5 2.5 0 0 1 0-5z" fill="#A259FF" />
      <path d="M8 13.5h4v2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 1-2.5z" fill="#0ACF83" />
    </svg>
  )
}

export function LinearLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#5E6AD2" />
      <path d="M5.5 5.5l13 13m-9-13l9 9" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function SlackLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#4A154B" />
      <path d="M7 11a1.5 1.5 0 0 1-1.5 1.5H4v-1.5A1.5 1.5 0 0 1 5.5 9.5H7v1.5zm1 0a1.5 1.5 0 0 1 1.5-1.5h4v1.5a1.5 1.5 0 0 1-1.5 1.5h-4V11zm4-4a1.5 1.5 0 0 1 1.5-1.5V4h1.5A1.5 1.5 0 0 1 15 5.5V7h-3zm0 1a1.5 1.5 0 0 1-1.5 1.5V13.5H12V8z" fill="#36C5F0" />
      <circle cx="16.5" cy="15.5" r="1.5" fill="#2EB67D" />
      <circle cx="8.5" cy="15.5" r="1.5" fill="#ECB22E" />
      <circle cx="16.5" cy="8.5" r="1.5" fill="#E01E5A" />
    </svg>
  )
}

export function NotionLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#000000" />
      <path
        d="M7 6.5l8-.5v11.5l-8 .5V6.5zm2 2.5v6.5l4-.25V8.75l-4 .25z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

export function GitHubLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#181717" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4.5a7.5 7.5 0 0 0-2.37 14.62c.38.07.51-.16.51-.36v-1.39c-2.09.45-2.53-1-2.53-1-.34-.87-.83-1.1-.83-1.1-.68-.47.05-.46.05-.46.75.05 1.15.77 1.15.77.67 1.15 1.76.82 2.19.63.07-.49.26-.82.48-1.01-1.67-.19-3.42-.83-3.42-3.71 0-.82.29-1.49.77-2.02-.08-.19-.33-.96.07-1.99 0 0 .63-.2 2.07.77a7.2 7.2 0 0 1 3.76 0c1.44-.97 2.07-.77 2.07-.77.4 1.03.15 1.8.07 1.99.48.53.77 1.2.77 2.02 0 2.89-1.75 3.52-3.43 3.71.27.23.51.69.51 1.39v2.06c0 .2.13.44.52.36A7.5 7.5 0 0 0 12 4.5z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

export function AppleLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#000000" />
      <path
        d="M16.5 16.7c-.5.8-1.1 1.6-2 1.6-.9 0-1.2-.5-2.2-.5s-1.3.5-2.2.5c-.9 0-1.6-.9-2.1-1.7-1.1-1.7-1.9-4.7-.8-6.7.6-1 1.6-1.7 2.7-1.7.9 0 1.7.6 2.2.6.5 0 1.5-.7 2.6-.6.4 0 1.7.2 2.4 1.3-.1.1-1.5.9-1.5 2.6 0 2.1 1.8 2.8 1.9 2.8-.1.5-.4 1.5-1 2.2zM14.7 7.7c.4-.5.7-1.2.6-1.9-.6 0-1.4.4-1.8.9-.4.4-.7 1.2-.6 1.9.7.1 1.4-.4 1.8-.9z"
        fill="#FFFFFF"
      />
    </svg>
  )
}
