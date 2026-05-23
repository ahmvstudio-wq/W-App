'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays, startOfDay, endOfDay
} from 'date-fns'
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Plus, Filter, MoreHorizontal, X,
  MapPin, Users, Star, Diamond
} from 'lucide-react'
import { PRIORITY_CONFIG, cn } from '@/lib/utils'
import type { Task, CalendarEvent } from '@/types'
import CreateTaskModal from '@/components/CreateTaskModal'

interface ProjectCalendarProps {
  projectId: string
  workspaceId: string
}

type CalendarView = 'month' | 'week' | 'day'

export default function ProjectCalendar({ projectId, workspaceId }: ProjectCalendarProps) {
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchData(false)
    
    const channel = supabase.channel(`project-calendar-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, () => {
        fetchData(true)
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, currentDate, view])

  async function fetchData(silent = false) {
    if (!silent) setLoading(true)
    
    // Fetch all tasks and calendar events (which are now tasks) for this project
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)

    if (tasksData) setTasks(tasksData as Task[])
    setLoading(false)
  }

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'month') setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    else setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>{format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}</h2>
          <div style={{ display: 'flex', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', padding: '2px' }}>
            <button onClick={() => navigate('prev')} style={navButtonStyle}><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrentDate(new Date())} style={{ ...navButtonStyle, fontSize: '11px', fontWeight: 600, padding: '0 8px' }}>TODAY</button>
            <button onClick={() => navigate('next')} style={navButtonStyle}><ChevronRight size={16} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', padding: '2px' }}>
            {(['month', 'week', 'day'] as CalendarView[]).map(v => (
              <button 
                key={v}
                onClick={() => setView(v)}
                style={{ 
                  padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 500, textTransform: 'capitalize',
                  background: view === v ? '#252729' : 'transparent',
                  color: view === v ? '#f0ede8' : '#6b6e75'
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-accent" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <Plus size={16} /> New Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ flex: 1, minHeight: 0, background: '#141618', border: '1px solid #252729', borderRadius: '12px', overflow: 'hidden' }}>
        {view === 'month' && (
          <MonthView 
            currentDate={currentDate} 
            tasks={tasks.filter(t => t.due_date && !t.start_time)} 
            events={tasks.filter(t => t.start_time) as any} 
            onDateClick={(date: Date) => { setSelectedDate(date); setIsModalOpen(true); }} 
          />
        )}
        {view === 'week' && (
          <WeekView 
            currentDate={currentDate} 
            tasks={tasks.filter(t => t.due_date && !t.start_time)} 
            events={tasks.filter(t => t.start_time) as any} 
          />
        )}
        {view === 'day' && (
          <DayView 
            currentDate={currentDate} 
            tasks={tasks.filter(t => t.due_date && !t.start_time)} 
            events={tasks.filter(t => t.start_time) as any} 
          />
        )}
      </div>

      {isModalOpen && (
        <CreateTaskModal 
          initialProjectId={projectId} 
          initialDate={selectedDate || currentDate}
          onClose={() => { setIsModalOpen(false); setSelectedDate(null); }}
          onSuccess={() => { fetchData(); setIsModalOpen(false); }}
        />
      )}
    </div>
  )
}

interface MonthViewProps {
  currentDate: Date
  tasks: Task[]
  events: CalendarEvent[]
  onDateClick: (date: Date) => void
}

function MonthView({ currentDate, tasks, events, onDateClick }: MonthViewProps) {
  const start = startOfWeek(startOfMonth(currentDate))
  const end = endOfWeek(endOfMonth(currentDate))
  const days = eachDayOfInterval({ start, end })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: '100%', gridAutoRows: '1fr' }}>
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} style={{ padding: '12px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#6b6e75', textTransform: 'uppercase', borderBottom: '1px solid #252729', background: '#1c1e22' }}>
          {day}
        </div>
      ))}
      {days.map((day, i) => {
        const dayTasks = tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), day))
        const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), day))
        const isToday = isSameDay(day, new Date())
        const isCurrentMonth = isSameMonth(day, currentDate)

        return (
          <div 
            key={i} 
            onClick={() => onDateClick(day)}
            style={{ 
              padding: '8px', borderRight: '1px solid #252729', borderBottom: '1px solid #252729',
              background: isCurrentMonth ? 'transparent' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px',
              minHeight: '120px'
            }}
          >
            <div style={{ 
              fontSize: '12px', fontWeight: 600, color: isToday ? '#c8f135' : (isCurrentMonth ? '#f0ede8' : '#3a3c42'),
              marginBottom: '4px', display: 'flex', justifyContent: 'space-between'
            }}>
              {format(day, 'd')}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
              {dayTasks.map(t => (
                <div key={t.id} style={{ 
                  fontSize: '10px', background: `${PRIORITY_CONFIG[t.priority].color}22`, 
                  color: PRIORITY_CONFIG[t.priority].color, 
                  padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  border: `1px solid ${PRIORITY_CONFIG[t.priority].color}33`
                }}>
                  {t.title}
                </div>
              ))}
              {dayEvents.map(e => (
                <div key={e.id} style={{ 
                  fontSize: '10px', background: `${e.color}33`, color: e.color, 
                  padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  {e.event_type === 'deadline' && <Diamond size={8} />}
                  {e.event_type === 'milestone' && <Star size={8} />}
                  {e.title}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ViewProps {
  currentDate: Date
  tasks: Task[]
  events: CalendarEvent[]
}

function WeekView({ currentDate, tasks, events }: ViewProps) {
  const start = startOfWeek(currentDate)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: '100%', minHeight: '600px' }}>
      {days.map((day, i) => {
        const dayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day))
        const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), day))
        const isToday = isSameDay(day, new Date())

        return (
          <div key={i} style={{ borderRight: '1px solid #252729', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
            <div style={{ 
              padding: '12px', borderBottom: '1px solid #252729', textAlign: 'center',
              background: isToday ? 'rgba(200, 241, 53, 0.05)' : '#1c1e22'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b6e75', textTransform: 'uppercase', marginBottom: '4px' }}>
                {format(day, 'EEE')}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: isToday ? '#c8f135' : '#f0ede8' }}>
                {format(day, 'd')}
              </div>
            </div>
            
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dayEvents.map(e => (
                <div key={e.id} style={{ 
                  padding: '8px', borderRadius: '6px', background: `${e.color}11`, borderLeft: `3px solid ${e.color}`
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: e.color, marginBottom: '2px' }}>
                    {format(new Date(e.start_time), 'HH:mm')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#f0ede8', fontWeight: 500 }}>{e.title}</div>
                </div>
              ))}
              {dayTasks.map(t => (
                <div key={t.id} style={{ 
                  padding: '8px', borderRadius: '6px', background: 'rgba(107, 110, 117, 0.05)', 
                  borderLeft: `3px solid ${PRIORITY_CONFIG[t.priority].color}`
                }}>
                  <div style={{ fontSize: '10px', color: '#6b6e75', marginBottom: '2px' }}>TASK</div>
                  <div style={{ fontSize: '12px', color: '#f0ede8' }}>{t.title}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DayView({ currentDate, tasks, events }: ViewProps) {
  const dayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), currentDate))
  const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), currentDate))
  
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingTop: '12px' }}>
          {hours.map(h => (
            <div key={h} style={{ fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace', textAlign: 'right' }}>
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
        
        <div style={{ position: 'relative', borderLeft: '1px solid #252729', minHeight: '1200px' }}>
          {dayEvents.map((e) => {
            const start = new Date(e.start_time)
            const top = (start.getHours() * 60 + start.getMinutes()) * (1200 / 1440)
            return (
              <div key={e.id} style={{ 
                position: 'absolute', top: `${top}px`, left: '12px', right: '12px',
                padding: '12px', borderRadius: '8px', background: `${e.color}15`, 
                border: `1px solid ${e.color}33`, borderLeft: `4px solid ${e.color}`
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: e.color, marginBottom: '4px' }}>
                  {format(new Date(e.start_time), 'HH:mm')} — {format(new Date(e.end_time), 'HH:mm')}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0ede8' }}>{e.title}</div>
                {e.description && <div style={{ fontSize: '12px', color: '#6b6e75', marginTop: '4px' }}>{e.description}</div>}
              </div>
            )
          })}
          
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <h4 style={{ fontSize: '12px', color: '#6b6e75', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Deadlines & Tasks</h4>
             {dayTasks.map(t => (
               <div key={t.id} style={{ padding: '12px', background: '#1c1e22', border: '1px solid #252729', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: t.priority ? PRIORITY_CONFIG[t.priority].color : PRIORITY_CONFIG.p2.color }} />
                 <div style={{ flex: 1 }}>
                   <div style={{ fontSize: '14px', fontWeight: 500 }}>{t.title}</div>
                   <div style={{ fontSize: '11px', color: '#6b6e75' }}>Due at {t.due_date ? format(new Date(t.due_date), 'HH:mm') : '--'}</div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}



const navButtonStyle: React.CSSProperties = {
  padding: '6px',
  background: 'transparent',
  border: 'none',
  color: '#6b6e75',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: '#6b6e75',
  textTransform: 'uppercase',
  marginBottom: '6px',
  fontFamily: 'DM Mono, monospace'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  background: '#1c1e22',
  border: '1px solid #252729',
  borderRadius: '6px',
  color: '#f0ede8',
  fontSize: '14px',
  outline: 'none'
}
