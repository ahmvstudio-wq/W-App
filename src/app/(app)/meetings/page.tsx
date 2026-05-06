'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Users, Clock, CheckCircle2, XCircle, 
  AlertTriangle, ChevronRight, X, Play, 
  RefreshCw, StopCircle 
} from 'lucide-react'
import { formatDateTime, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import type { Meeting } from '@/types'

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showGate, setShowGate] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [decisionToMake, setDecisionToMake] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  useEffect(() => {
    fetchMeetings()
  }, [])

  async function fetchMeetings() {
    setLoading(true)
    const { data, error } = await supabase
      .from('meetings')
      .select('*, owner:profiles(id, name)')
      .order('scheduled_at', { ascending: false })
    
    if (error) toast.error('Failed to fetch meetings')
    else setMeetings(data || [])
    setLoading(false)
  }

  async function handleScheduleMeeting() {
    if (!title || !decisionToMake) {
      toast.error('Title and Decision are required')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: workspace } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1).single()
    if (!workspace) {
      toast.error('No workspace found')
      return
    }

    const { data, error } = await supabase.from('meetings').insert({
      workspace_id: workspace.id,
      owner_id: user.id,
      title,
      decision_to_make: decisionToMake,
      scheduled_at: scheduledAt || new Date().toISOString(),
      duration_minutes: 25,
      passed_gate: true
    }).select().single()

    if (error) {
      toast.error(`Schedule failed: ${error.message}`)
    } else {
      toast.success('Meeting scheduled and enforced')
      setIsCreateOpen(false)
      setShowGate(false)
      setTitle('')
      setDecisionToMake('')
      fetchMeetings()
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Meetings</h1>
          <p style={{ color: '#6b6e75', fontFamily: 'DM Mono, monospace', fontSize: '12px', textTransform: 'uppercase' }}>
            Strictly bounded synchronous time.
          </p>
        </div>
        {!showGate && (
          <button onClick={() => setShowGate(true)} className="btn-accent" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <PlusIcon /> New Request
          </button>
        )}
      </header>

      {/* The Gate */}
      {showGate && (
        <div style={{ background: 'linear-gradient(145deg, #1c1e22, #141618)', border: '1px solid #c8f135', borderRadius: '12px', padding: '32px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#c8f135' }} />
          <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle color="#c8f135" /> The Synchronous Gate
          </h2>
          <p style={{ color: '#f0ede8', fontSize: '16px', marginBottom: '24px', lineHeight: 1.5 }}>
            Is this a decision that absolutely requires a real-time, synchronous conversation to resolve?
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => { setShowGate(false); setIsCreateOpen(true); }}
              style={{ flex: 1, padding: '16px', background: 'rgba(200, 241, 53, 0.1)', border: '1px solid rgba(200, 241, 53, 0.3)', color: '#c8f135', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              YES. We are blocked.
            </button>
            <button 
              onClick={() => { toast.info('Redirecting to Documents...'); setShowGate(false); }}
              style={{ flex: 1, padding: '16px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)', color: '#ff4444', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
            >
              NO. I will write a document.
            </button>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px' }}>Schedule 25-Minute Block</h2>
            <button onClick={() => setIsCreateOpen(false)} style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Meeting Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="e.g. Q3 Goal Alignment" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#c8f135', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>The Single Decision to be Made (Required)</label>
              <textarea value={decisionToMake} onChange={e => setDecisionToMake(e.target.value)} placeholder="e.g. Are we delaying the launch by 2 weeks?" rows={2} style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none', resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Date & Time</label>
                <input value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} type="datetime-local" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Duration</label>
                <div style={{ width: '100%', padding: '12px', background: '#252729', border: '1px solid #252729', borderRadius: '6px', color: '#6b6e75', fontSize: '14px', cursor: 'not-allowed', fontFamily: 'DM Mono, monospace' }}>
                  25 MINUTES (MAX)
                </div>
              </div>
            </div>
            <button onClick={handleScheduleMeeting} className="btn-accent" style={{ padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
              Schedule & Enforce
            </button>
          </div>
        </div>
      )}

      {/* Meeting List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {meetings.length === 0 && !loading && (
          <div style={{ padding: '60px', textAlign: 'center', background: '#141618', borderRadius: '12px', border: '1px solid #252729', color: '#6b6e75' }}>
            No meetings logged. Speed is maintained.
          </div>
        )}
        {meetings.map(meeting => (
          <div key={meeting.id} style={{ background: '#141618', border: '1px solid #252729', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '18px', margin: 0 }}>{meeting.title}</h4>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', background: '#1c1e22', padding: '2px 8px', borderRadius: '100px' }}>
                    <Clock size={12} /> {meeting.duration_minutes}m
                  </span>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', marginBottom: '6px' }}>Decision to make:</div>
                  <div style={{ fontSize: '15px', color: '#f0ede8', lineHeight: 1.4 }}>{meeting.decision_to_make}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#6b6e75', fontSize: '12px' }}>
                  <span>{formatDateTime(meeting.scheduled_at)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {(meeting as any).owner?.name || 'Owner'}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '200px', marginLeft: '32px' }}>
                {activeMeetingId === meeting.id ? (
                  <MeetingTimer 
                    meetingId={meeting.id} 
                    onComplete={() => { setActiveMeetingId(null); fetchMeetings(); }} 
                    onCancel={() => setActiveMeetingId(null)}
                  />
                ) : meeting.decision_text ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00c853', fontSize: '12px', fontWeight: 600, fontFamily: 'DM Mono, monospace', marginBottom: '8px' }}>
                      <CheckCircle2 size={14} /> DECISION REACHED
                    </span>
                    <div style={{ background: '#1c1e22', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#f0ede8', textAlign: 'left', border: '1px solid #252729' }}>
                      {meeting.decision_text}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setActiveMeetingId(meeting.id)}
                    className="btn-accent" 
                    style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Play size={16} /> Start Timer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MeetingTimer({ meetingId, onComplete, onCancel }: { meetingId: string, onComplete: () => void, onCancel: () => void }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [decision, setDecision] = useState('')
  const [isFinishing, setIsFinishing] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isDanger = timeLeft < 5 * 60

  async function handleFinish(reached: boolean) {
    if (reached && !decision.trim()) {
      toast.error('Record the decision first')
      return
    }

    setIsFinishing(true)
    const { error } = await supabase.from('meetings').update({
      decision_reached: reached,
      decision_text: reached ? decision : 'TIME EXPIRED / NO DECISION',
    }).eq('id', meetingId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(reached ? 'Decision logged' : 'Meeting failed')
      onComplete()
    }
    setIsFinishing(false)
  }

  return (
    <div style={{ background: '#1c1e22', border: `1px solid ${isDanger ? '#ff4444' : '#252729'}`, borderRadius: '12px', padding: '20px', textAlign: 'left', width: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'DM Mono, monospace', color: isDanger ? '#ff4444' : '#c8f135' }}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: '#6b6e75', cursor: 'pointer' }}><X size={16} /></button>
      </div>

      <textarea 
        value={decision}
        onChange={e => setDecision(e.target.value)}
        placeholder="Enter specific decision reached..."
        rows={3}
        style={{ width: '100%', padding: '10px', background: '#141618', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '13px', marginBottom: '16px', outline: 'none', resize: 'none' }}
      />

      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => handleFinish(true)}
          disabled={isFinishing}
          style={{ flex: 1, padding: '10px', background: '#00c853', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
        >
          {isFinishing ? '...' : 'SHIP DECISION'}
        </button>
        <button 
          onClick={() => handleFinish(false)}
          disabled={isFinishing}
          style={{ padding: '10px', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '6px', cursor: 'pointer' }}
        >
          <StopCircle size={16} />
        </button>
      </div>
    </div>
  )
}

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
