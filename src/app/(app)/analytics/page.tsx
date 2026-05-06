'use client'

import React, { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts'
import { Download, TrendingUp, Clock, AlertTriangle, Target, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

class ChartErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1e22', borderRadius: '8px', color: '#6b6e75', fontSize: '13px' }}>Chart unavailable</div>
    return this.props.children
  }
}

const velocityData = [
  { date: 'Mon', shipped: 3, target: 5 }, { date: 'Tue', shipped: 5, target: 5 }, { date: 'Wed', shipped: 8, target: 5 },
  { date: 'Thu', shipped: 4, target: 5 }, { date: 'Fri', shipped: 6, target: 5 }, { date: 'Sat', shipped: 2, target: 2 }, { date: 'Sun', shipped: 1, target: 2 }
]
const priorityData = [{ name: 'P0', value: 4, color: '#ff4444' }, { name: 'P1', value: 12, color: '#f5a623' }, { name: 'P2', value: 8, color: '#6b6e75' }, { name: 'P3', value: 2, color: '#252729' }]
const completionData = [{ week: 'W1', opened: 20, closed: 18 }, { week: 'W2', opened: 15, closed: 16 }, { week: 'W3', opened: 25, closed: 20 }, { week: 'W4', opened: 18, closed: 22 }]
const blockerData = [{ name: 'API Team', count: 8 }, { name: 'Design', count: 5 }, { name: 'Legal', count: 3 }, { name: 'DevOps', count: 2 }]
const healthMatrixData = [{ x: 1, y: 5, name: 'V1 Launch' }, { x: 5, y: 15, name: 'Mobile App' }, { x: 12, y: 2, name: 'SEO Revamp' }, { x: 2, y: 20, name: 'Backend Rewrite' }]
const timeBoxData = [{ category: 'Engineering', estimated: 120, actual: 150 }, { category: 'Design', estimated: 60, actual: 55 }, { category: 'Copy', estimated: 30, actual: 45 }]
const meetingData = [{ name: 'Decided', value: 15, color: '#00c853' }, { name: 'Failed', value: 4, color: '#ff4444' }]
const docData = [{ month: 'Jan', live: 10, ref: 5, arch: 2 }, { month: 'Feb', live: 12, ref: 8, arch: 3 }, { month: 'Mar', live: 8, ref: 12, arch: 5 }]

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  
  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // This is where real data fetching will go
    // For now, initializing with real structures but will wire as features are built
    setLoading(false)
  }
  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Analytics & Telemetry</h1>
          <p style={{ color: '#6b6e75', fontFamily: 'DM Mono, monospace', fontSize: '12px', textTransform: 'uppercase' }}>
            Data does not lie. Emotion does.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select style={{ background: '#141618', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8', padding: '8px 12px', fontSize: '13px', outline: 'none' }}>
            <option>Last 30 Days</option>
            <option>This Quarter</option>
            <option>All Time</option>
          </select>
          <button style={{ padding: '8px 12px', background: '#141618', border: '1px solid #252729', borderRadius: '6px', color: '#6b6e75', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Download size={14} /> Export Report
          </button>
        </div>
      </header>

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard title="Tasks Shipped" value="142" icon={TrendingUp} color="#00c853" sub="This month" />
        <StatCard title="Avg Time to Ship" value="4.2h" icon={Clock} color="#f0ede8" sub="From creation to done" />
        <StatCard title="Scope Reduced" value="18%" icon={Target} color="#c8f135" sub="Tasks challenged by AI" />
        <StatCard title="Best Day" value="Wednesday" icon={TrendingUp} color="#f0ede8" sub="Highest velocity" />
        <StatCard title="Top Blocker" value="API Team" icon={AlertTriangle} color="#ff4444" sub="8 tasks blocked" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        
        {/* 1. Velocity */}
        <ChartCard title="1. Velocity Chart" desc="Tasks shipped vs target pace. Are we moving fast enough?">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px', color: '#f0ede8' }} itemStyle={{ color: '#f0ede8' }} />
              <Line type="monotone" dataKey="shipped" stroke="#c8f135" strokeWidth={3} dot={{ r: 4, fill: '#c8f135', strokeWidth: 0 }} />
              <Line type="step" dataKey="target" stroke="#6b6e75" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Priority Distribution */}
        <ChartCard title="2. Priority Distribution" desc="What are we actually working on? P3s should be minimal.">
          <div style={{ display: 'flex', alignItems: 'center', height: '250px' }}>
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {priorityData.map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: d.color }} />
                    <span style={{ color: '#f0ede8', fontSize: '13px', fontWeight: 600 }}>{d.name}</span>
                  </div>
                  <span style={{ color: '#6b6e75', fontFamily: 'DM Mono, monospace', fontSize: '13px' }}>{d.value} tasks</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* 3. Completion Rate */}
        <ChartCard title="3. Completion Rate" desc="Are we opening more tasks than we close? (Debt accumulation)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={completionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#1c1e22' }} contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px' }} />
              <Bar dataKey="opened" fill="#252729" radius={[4, 4, 0, 0]} />
              <Bar dataKey="closed" fill="#c8f135" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Blocker Frequency */}
        <ChartCard title="4. Blocker Frequency" desc="Who or what is slowing down the system the most?">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={blockerData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#f0ede8', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip cursor={{ fill: '#1c1e22' }} contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px' }} />
              <Bar dataKey="count" fill="#ff4444" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. Project Health Matrix */}
        <ChartCard title="5. Project Health Matrix" desc="Top right is dangerous. High tasks remaining + high days inactive.">
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" name="Days Inactive" tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="y" type="number" name="Tasks Remaining" tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px' }} />
              <Scatter name="Projects" data={healthMatrixData} fill="#f5a623">
                {healthMatrixData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.x > 7 && entry.y > 10 ? '#ff4444' : entry.x < 3 ? '#00c853' : '#f5a623'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6. Time Box Accuracy */}
        <ChartCard title="6. Time Box Accuracy" desc="Are we underestimating our work?">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeBoxData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#1c1e22' }} contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px' }} />
              <Bar dataKey="estimated" fill="#252729" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#f5a623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 7. Meeting Efficiency */}
        <ChartCard title="7. Meeting Efficiency" desc="Did the meeting reach the specific required decision?">
          <div style={{ display: 'flex', alignItems: 'center', height: '250px' }}>
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={meetingData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {meetingData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#00c853' }}>79%</div>
              <div style={{ color: '#6b6e75', fontSize: '13px', lineHeight: 1.5 }}>of synchronous meetings reached a conclusive decision within the 25-minute limit.</div>
            </div>
          </div>
        </ChartCard>

        {/* 8. Document Lifecycle */}
        <ChartCard title="8. Document Lifecycle" desc="Are we archiving old knowledge or letting it rot?">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={docData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#1c1e22' }} contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px' }} />
              <Bar dataKey="live" stackId="a" fill="#00c853" />
              <Bar dataKey="ref" stackId="a" fill="#6b6e75" />
              <Bar dataKey="arch" stackId="a" fill="#f5a623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        
        {/* 9. Focus Depth */}
        <ChartCard title="9. Focus Velocity" desc="Minutes spent in deep focus sessions per day.">
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b6e75', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px' }} />
                <Line type="monotone" dataKey="shipped" stroke="#c8f135" strokeWidth={4} dot={{ r: 6, fill: '#c8f135' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartErrorBoundary>
        </ChartCard>

        {/* 10. Focus Consistency */}
        <ChartCard title="10. Focus Distribution" desc="Breakdown of session lengths. Long blocks are better.">
          <ChartErrorBoundary>
            <div style={{ display: 'flex', alignItems: 'center', height: '250px' }}>
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={[{name: 'Deep (50m+)', value: 45}, {name: 'Sprint (25m)', value: 40}, {name: 'Short (<15m)', value: 15}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    <Cell fill="#c8f135" /><Cell fill="#6b6e75" /><Cell fill="#252729" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ color: '#c8f135', fontSize: '24px', fontWeight: 800 }}>82.4%</div>
                <div style={{ color: '#f0ede8', fontSize: '13px', fontWeight: 600 }}>Productivity Score</div>
                <div style={{ color: '#6b6e75', fontSize: '12px' }}>Your focus quality is 12% higher than last week. Keep the sessions over 25m.</div>
              </div>
            </div>
          </ChartErrorBoundary>
        </ChartCard>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, sub }: any) {
  return (
    <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '10px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '12px', color: '#6b6e75', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', margin: 0 }}>{title}</h3>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#f0ede8', marginBottom: '8px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#6b6e75' }}>{sub}</div>
    </div>
  )
}

function ChartCard({ title, desc, children }: any) {
  return (
    <div style={{ background: '#141618', border: '1px solid #252729', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>{title}</h3>
        <p style={{ fontSize: '12px', color: '#6b6e75' }}>{desc}</p>
      </div>
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}
