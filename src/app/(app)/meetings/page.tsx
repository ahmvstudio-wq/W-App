'use client'

import { useState, useEffect } from 'react'
import { 
  Video, Play, Sparkles, Clock, Calendar, Users, 
  CheckSquare, ArrowRight, RefreshCw, Search, 
  ExternalLink, FileText, Check, Plus, MessageSquare, ChevronRight, X,
  Radio, ListFilter, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn, getInitials } from '@/lib/utils'
import type { FathomMeeting, FathomActionItem } from '@/lib/fathom/client'

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<FathomMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMeeting, setSelectedMeeting] = useState<FathomMeeting | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<'summary' | 'transcript' | 'actions'>('summary')
  const [convertedActionIds, setConvertedActionIds] = useState<Record<string, boolean>>({})

  async function fetchMeetings(silent = false) {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/fathom/meetings')
      const data = await res.json()
      if (data.success && Array.isArray(data.meetings)) {
        setMeetings(data.meetings)
      } else {
        toast.error('Could not load meetings from Fathom API')
      }
    } catch (err: any) {
      toast.error('Failed to connect to Fathom AI API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings(false)
  }, [])

  async function handleOpenMeeting(meeting: FathomMeeting) {
    setSelectedMeeting(meeting)
    setActiveModalTab('summary')
    
    if (meeting.recording_id) {
      setLoadingDetail(true)
      try {
        const res = await fetch(`/api/fathom/recording/${meeting.recording_id}`)
        const data = await res.json()
        if (data.success && data.detail) {
          setSelectedMeeting(prev => {
            if (!prev) return null
            return {
              ...prev,
              summary: data.detail.summary || prev.summary,
              transcript: data.detail.transcript?.length > 0 ? data.detail.transcript : prev.transcript,
              action_items: data.detail.action_items?.length > 0 ? data.detail.action_items : prev.action_items
            }
          })
        }
      } catch (e) {
        console.warn('Could not fetch additional recording details:', e)
      } finally {
        setLoadingDetail(false)
      }
    }
  }

  async function handleSyncFathom() {
    setSyncing(true)
    try {
      await fetchMeetings(true)
      toast.success('Live synced all calls from Fathom AI!')
    } finally {
      setSyncing(false)
    }
  }

  async function convertActionToTask(item: FathomActionItem, meetingTitle: string) {
    try {
      const res = await fetch('/api/fathom/convert-to-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.text,
          description: `Extracted from Fathom meeting: "${meetingTitle}" (Assignee: ${item.assignee || 'Unassigned'})`,
          priority: 'p1'
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Task added to sprint: "${item.text.slice(0, 30)}..."`)
        setConvertedActionIds(prev => ({ ...prev, [item.id]: true }))
      } else {
        toast.error(data.error || 'Failed to create task')
      }
    } catch (err: any) {
      toast.error(`Error converting to task: ${err.message}`)
    }
  }

  // Analytics
  const totalMinutes = meetings.reduce((acc, m) => acc + m.duration_minutes, 0)
  const totalAttendees = new Set(meetings.flatMap(m => m.attendees.map(a => a.name))).size

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.attendees.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#6b7280] uppercase tracking-wider mb-1 font-light">
            <span>CALLMY_MGMT</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE FATHOM AI INTEGRATION
            </span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-black flex items-center gap-3">
            <span>Meetings & Video Calls</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/[0.05] text-black font-mono font-normal">
              {meetings.length} Recorded
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3 font-body">
          <button
            onClick={handleSyncFathom}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white font-normal text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Fetching from Fathom...' : 'Refresh Fathom Calls'}</span>
          </button>
        </div>
      </div>

      {/* Top Metrics with Ambient Soft Glows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-body">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-indigo-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Total Recorded</span>
            <div className="text-2xl font-light text-black tracking-tight">{Math.round(totalMinutes / 60 * 10) / 10} hrs</div>
            <div className="text-[11px] text-[#9ca3af] font-mono">{totalMinutes} Minutes Logged</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <Video size={22} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Synced Recordings</span>
            <div className="text-2xl font-light text-emerald-600 tracking-tight">{meetings.length} Calls</div>
            <div className="text-[11px] text-[#9ca3af] font-mono">100% Real API Data</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckSquare size={22} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-purple-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">Total Participants</span>
            <div className="text-2xl font-light text-purple-700 tracking-tight">{totalAttendees}</div>
            <div className="text-[11px] text-[#9ca3af] font-mono">Verified Speakers</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-amber-50/50 border border-black/[0.06] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider font-light">API Status</span>
            <div className="text-2xl font-light text-black tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
              <span>Connected</span>
            </div>
            <div className="text-[11px] text-[#9ca3af] font-mono">Fathom External API v1</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 font-body">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings, topics, or attendees..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-black/[0.08] focus:border-black rounded-xl text-xs text-black placeholder:text-[#9ca3af] outline-none shadow-sm font-light"
          />
        </div>
      </div>

      {/* Meetings List / Cards */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#9ca3af] font-body font-light">
          Loading live Fathom AI recordings...
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white border border-dashed border-black/[0.1] text-[#6b7280] text-xs font-body font-light">
          No meeting recordings found. When you record calls with Fathom, they will automatically populate here.
        </div>
      ) : (
        <div className="space-y-4 font-body">
          {filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              onClick={() => handleOpenMeeting(meeting)}
              className="p-6 rounded-3xl bg-white hover:bg-[#fafbff] border border-black/[0.08] hover:border-black/[0.18] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left Column: Meeting Title, Date, AI Summary */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-50 text-indigo-700 font-medium">
                    FATHOM RECORDING
                  </span>
                  <span className="text-xs text-[#9ca3af] font-mono">
                    {format(new Date(meeting.recorded_at), 'dd MMM yyyy • HH:mm')}
                  </span>
                  <span className="text-xs text-[#9ca3af] font-mono">
                    • {meeting.duration_minutes}m duration
                  </span>
                </div>

                <h3 className="text-base font-normal text-black tracking-tight group-hover:underline">
                  {meeting.title}
                </h3>

                <p className="text-xs text-[#6b7280] font-light leading-relaxed line-clamp-2">
                  {meeting.summary}
                </p>

                {/* Attendee Avatars */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {meeting.attendees.map((attendee, idx) => (
                      <div
                        key={idx}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-black text-white text-[9px] font-mono flex items-center justify-center"
                        title={attendee.name}
                      >
                        {getInitials(attendee.name)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#9ca3af] font-mono">
                    {meeting.attendees.map(a => a.name).join(', ')}
                  </span>
                </div>
              </div>

              {/* Right Column: Links & Open */}
              <div className="flex md:flex-col items-end justify-between gap-3 flex-shrink-0">
                {meeting.share_url && (
                  <a
                    href={meeting.share_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1 bg-[#fafafa] hover:bg-[#f3f4f6] border border-black/[0.06] rounded-xl text-xs font-mono text-[#4b5563] flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink size={12} />
                    <span>Open on Fathom</span>
                  </a>
                )}

                <div className="flex items-center gap-2 text-xs font-normal text-black group-hover:translate-x-1 transition-transform">
                  <span>View Transcript & AI Notes</span>
                  <ChevronRight size={15} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meeting Detail Modal / Full Screen Viewer */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-fadeIn font-sans">
          <div className="bg-white border border-black/[0.08] rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden font-body">
            {/* Modal Header */}
            <div className="p-6 border-b border-black/[0.06] flex items-start justify-between flex-shrink-0 bg-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-50 text-indigo-700 font-medium">
                    FATHOM CALL
                  </span>
                  <span className="text-xs text-[#9ca3af] font-mono">
                    {format(new Date(selectedMeeting.recorded_at), 'dd MMM yyyy • HH:mm')}
                  </span>
                  <span className="text-xs text-[#9ca3af] font-mono">
                    • {selectedMeeting.duration_minutes}m
                  </span>
                </div>
                <h2 className="text-xl font-normal text-black tracking-tight">{selectedMeeting.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                {selectedMeeting.share_url && (
                  <a
                    href={selectedMeeting.share_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-[#9ca3af] hover:text-black hover:bg-black/[0.04] rounded-xl transition-colors flex items-center gap-1.5 text-xs font-light"
                    title="Open on Fathom.video"
                  >
                    <ExternalLink size={15} />
                    <span className="hidden sm:inline">Fathom Link</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="p-2 text-[#9ca3af] hover:text-black hover:bg-black/[0.04] rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 border-b border-black/[0.06] flex gap-6 text-xs flex-shrink-0 bg-white">
              {[
                { id: 'summary', label: 'AI Summary & Notes', icon: Sparkles },
                { id: 'transcript', label: `Transcript (${selectedMeeting.transcript.length || 'Live'})`, icon: FileText },
                { id: 'actions', label: `Action Items (${selectedMeeting.action_items.length})`, icon: CheckSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModalTab(tab.id as any)}
                  className={cn(
                    'py-3.5 flex items-center gap-1.5 transition-all cursor-pointer font-light relative',
                    activeModalTab === tab.id
                      ? 'text-black font-normal border-b-2 border-black'
                      : 'text-[#9ca3af] hover:text-black'
                  )}
                >
                  <tab.icon size={13} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fbfbfd]">
              {loadingDetail && (
                <div className="p-3 text-center text-xs font-mono text-[#9ca3af] bg-white rounded-xl border border-black/[0.04]">
                  Fetching full AI transcript & markdown from Fathom API...
                </div>
              )}

              {activeModalTab === 'summary' && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">FATHOM AI SUMMARY & NOTES</span>
                      {selectedMeeting.share_url && (
                        <a
                          href={selectedMeeting.share_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-mono"
                        >
                          <span>Watch Video</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-[#374151] leading-relaxed font-light whitespace-pre-wrap">
                      {selectedMeeting.summary}
                    </div>
                  </div>

                  {/* Attendees Breakdown */}
                  <div className="p-6 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-3">
                    <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block">CALL PARTICIPANTS</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedMeeting.attendees.map((attendee, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#fafafa] flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-black text-white font-medium text-xs flex items-center justify-center">
                            {getInitials(attendee.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-normal text-black truncate">{attendee.name}</div>
                            <div className="text-[10px] text-[#9ca3af] font-mono truncate">{attendee.email || 'Participant'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'transcript' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-2">
                    FULL RECORDED TRANSCRIPT & SPEAKER TIMELINE
                  </span>

                  {selectedMeeting.transcript.length === 0 ? (
                    <div className="p-12 text-center text-xs text-[#9ca3af] bg-white rounded-2xl border border-dashed border-black/[0.08]">
                      {loadingDetail ? 'Fetching transcript...' : 'Transcript not available for this recording or still generating on Fathom.'}
                    </div>
                  ) : (
                    selectedMeeting.transcript.map((t, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-sm space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-black font-semibold">{t.speaker}</span>
                          <span className="text-[#9ca3af]">{t.timestamp}</span>
                        </div>
                        <p className="text-xs text-[#4b5563] font-light leading-relaxed">{t.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeModalTab === 'actions' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-wider block mb-2">
                    EXTRACTED DELIVERABLES • CLICK TO CONVERT TO SPRINT TASK
                  </span>

                  {selectedMeeting.action_items.length === 0 ? (
                    <div className="p-12 text-center text-xs text-[#9ca3af] bg-white rounded-2xl border border-dashed border-black/[0.08]">
                      No action items extracted from this call.
                    </div>
                  ) : (
                    selectedMeeting.action_items.map((item) => {
                      const isConverted = convertedActionIds[item.id] || item.converted_to_task
                      return (
                        <div
                          key={item.id}
                          className="p-4 px-5 rounded-2xl bg-white border border-black/[0.06] shadow-sm flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="text-xs font-normal text-black">{item.text}</div>
                            <div className="text-[10px] text-[#9ca3af] font-mono font-light">
                              Assignee: {item.assignee || 'Participant'}
                            </div>
                          </div>

                          <button
                            onClick={() => convertActionToTask(item, selectedMeeting.title)}
                            disabled={isConverted}
                            className={cn(
                              'px-3.5 py-1.5 rounded-xl text-xs font-normal transition-all flex items-center gap-1.5 cursor-pointer shadow-sm',
                              isConverted
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                : 'bg-black hover:bg-neutral-800 text-white'
                          )}
                        >
                          {isConverted ? (
                            <>
                              <Check size={13} />
                              <span>Added to Tasks</span>
                            </>
                          ) : (
                            <>
                              <Plus size={13} />
                              <span>Create Task</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
