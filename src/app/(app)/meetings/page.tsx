'use client'

import { useState } from 'react'
import { Users, Clock, CheckCircle2, XCircle, AlertTriangle, ChevronRight, X } from 'lucide-react'
import { formatDateTime, getInitials } from '@/lib/utils'

export default function MeetingsPage() {
  const [gatePassed, setGatePassed] = useState(false)
  const [showGate, setShowGate] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const mockMeetings = [
    { id: '1', title: 'Q3 Goal Alignment', decision_to_make: 'Do we delay the mobile app launch to Q4?', scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), duration_minutes: 25, decision_reached: null, attendees: [{name: 'W'}, {name: 'Dev'}] },
    { id: '2', title: 'Pricing Strategy', decision_to_make: 'Are we introducing a $99 tier?', scheduled_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), duration_minutes: 18, decision_reached: true, decision_text: 'Yes. $99 tier added for teams >10.', attendees: [{name: 'W'}, {name: 'Sales'}] },
    { id: '3', title: 'Design Review', decision_to_make: 'Approve new dashboard layout?', scheduled_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), duration_minutes: 25, decision_reached: false, cancelled_reason: 'Needed more async feedback first.', attendees: [{name: 'W'}, {name: 'Design'}] },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '4px' }}>Meetings</h1>
        <p style={{ color: '#6b6e75', fontFamily: 'DM Mono, monospace', fontSize: '12px', textTransform: 'uppercase' }}>
          Strictly bounded synchronous time.
        </p>
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
              onClick={() => { setGatePassed(true); setShowGate(false); setIsCreateOpen(true); }}
              style={{ flex: 1, padding: '16px', background: 'rgba(200, 241, 53, 0.1)', border: '1px solid rgba(200, 241, 53, 0.3)', color: '#c8f135', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(200, 241, 53, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(200, 241, 53, 0.1)'}
            >
              YES. We are blocked.
            </button>
            <button 
              onClick={() => { alert('Opening blank document...'); setShowGate(false); }}
              style={{ flex: 1, padding: '16px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)', color: '#ff4444', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'}
            >
              NO. I will write a document.
            </button>
          </div>
        </div>
      )}

      {!showGate && !isCreateOpen && (
        <button onClick={() => setShowGate(true)} style={{ marginBottom: '32px', padding: '10px 20px', background: 'transparent', border: '1px dashed #252729', color: '#6b6e75', borderRadius: '6px', cursor: 'pointer', width: '100%' }}>
          + Request Synchronous Time
        </button>
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
              <input type="text" placeholder="e.g. Q3 Goal Alignment" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#c8f135', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>The Single Decision to be Made (Required)</label>
              <textarea placeholder="e.g. Are we delaying the launch by 2 weeks?" rows={2} style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none', resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Date & Time</label>
                <input type="datetime-local" style={{ width: '100%', padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>Duration</label>
                <div style={{ width: '100%', padding: '12px', background: '#252729', border: '1px solid #252729', borderRadius: '6px', color: '#6b6e75', fontSize: '14px', cursor: 'not-allowed', fontFamily: 'DM Mono, monospace' }}>
                  25 MINUTES (MAX)
                </div>
              </div>
            </div>
            <button className="btn-accent" style={{ padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
              Schedule & Enforce
            </button>
          </div>
        </div>
      )}

      {/* Meeting List */}
      <div>
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Meeting Log</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mockMeetings.map(meeting => (
            <div key={meeting.id} style={{ background: '#141618', border: '1px solid #252729', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '16px', margin: 0 }}>{meeting.title}</h4>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', background: '#1c1e22', padding: '2px 8px', borderRadius: '100px' }}>
                      <Clock size={12} /> {meeting.duration_minutes}m
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', marginBottom: '4px' }}>Decision to make:</div>
                    <div style={{ fontSize: '14px', color: '#f0ede8' }}>{meeting.decision_to_make}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#6b6e75', fontSize: '12px' }}>
                    <span>{formatDateTime(meeting.scheduled_at)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {meeting.attendees.length} Attendees</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '150px' }}>
                  {meeting.decision_reached === null ? (
                    <button className="btn-accent" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                      Start Timer
                    </button>
                  ) : meeting.decision_reached === true ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00c853', fontSize: '12px', fontWeight: 600, fontFamily: 'DM Mono, monospace', marginBottom: '8px' }}>
                        <CheckCircle2 size={14} /> DECISION REACHED
                      </span>
                      <div style={{ background: '#1c1e22', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#f0ede8', textAlign: 'left', maxWidth: '250px' }}>
                        {meeting.decision_text}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4444', fontSize: '12px', fontWeight: 600, fontFamily: 'DM Mono, monospace', marginBottom: '8px' }}>
                        <XCircle size={14} /> FAILED
                      </span>
                      <div style={{ background: 'rgba(255, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#ff4444', textAlign: 'left', maxWidth: '250px' }}>
                        {meeting.cancelled_reason}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
