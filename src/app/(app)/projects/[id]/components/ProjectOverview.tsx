'use client'

import React, { useMemo } from 'react'
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts'
import { 
  CheckSquare, Clock, TrendingUp, 
  AlertTriangle, Gauge
} from 'lucide-react'
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG, daysUntil } from '@/lib/utils'
import type { Project, Task } from '@/types'

interface ProjectOverviewProps {
  project: Project
  tasks: Task[]
}

export default function ProjectOverview({ project, tasks }: ProjectOverviewProps) {
  
  const stats = useMemo(() => {
    const total = tasks.length
    const shipped = tasks.filter(t => t.status === 'shipped').length
    const activeBlockers = tasks.filter(t => t.status === 'blocked').length
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'shipped').length
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const shippedLast7 = tasks.filter(t => t.status === 'shipped' && t.completed_at && new Date(t.completed_at) >= sevenDaysAgo).length
    const velocity = shippedLast7 / 7

    const shipScore = total > 0 ? (shipped / total) * 40 : 0
    const velocityScore = Math.min(velocity * 10, 30)
    const overdueScore = overdue === 0 ? 20 : Math.max(0, 20 - overdue * 5)
    const blockerScore = activeBlockers === 0 ? 10 : 0
    const healthScore = Math.round(shipScore + velocityScore + overdueScore + blockerScore)

    return { total, shipped, activeBlockers, overdue, velocity, healthScore }
  }, [tasks])

  const statusData = useMemo(() => {
    return Object.keys(TASK_STATUS_CONFIG).map(key => ({
      name: TASK_STATUS_CONFIG[key as keyof typeof TASK_STATUS_CONFIG].label,
      value: tasks.filter(t => t.status === key).length,
      color: TASK_STATUS_CONFIG[key as keyof typeof TASK_STATUS_CONFIG].color
    })).filter(d => d.value > 0)
  }, [tasks])

  const priorityData = useMemo(() => {
    return ['p0', 'p1', 'p2', 'p3'].map(p => ({
      name: p.toUpperCase(),
      total: tasks.filter(t => t.priority === p).length,
      shipped: tasks.filter(t => t.priority === p && t.status === 'shipped').length,
      color: PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG].color
    }))
  }, [tasks])

  const accuracyData = useMemo(() => {
    return tasks
      .filter(t => t.status === 'shipped' && t.started_at && t.completed_at)
      .map(t => {
        const actual = Math.abs(new Date(t.completed_at!).getTime() - new Date(t.started_at!).getTime()) / (1000 * 60)
        return {
          name: t.title,
          estimated: t.time_box_minutes || 60,
          actual: Math.round(actual)
        }
      })
  }, [tasks])

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard 
          icon={<CheckSquare size={20} />} 
          label="Progress" 
          value={`${stats.shipped}/${stats.total}`} 
          subValue={`${Math.round((stats.shipped / stats.total) * 100 || 0)}% Completed`} 
        />
        <StatCard 
          icon={<Clock size={20} />} 
          label="Deadline" 
          value={project.deadline ? `${daysUntil(project.deadline)}d` : '--'} 
          subValue="Time Remaining"
          color={project.deadline && daysUntil(project.deadline) < 7 ? '#ff4444' : undefined}
        />
        <StatCard 
          icon={<TrendingUp size={20} />} 
          label="Velocity" 
          value={stats.velocity.toFixed(1)} 
          subValue="Tasks / Day" 
        />
        <StatCard 
          icon={<AlertTriangle size={20} />} 
          label="Blockers" 
          value={stats.activeBlockers.toString()} 
          subValue="Active Blocks" 
          color={stats.activeBlockers > 0 ? '#ff4444' : undefined}
        />
        <StatCard 
          icon={<Gauge size={20} />} 
          label="Health Score" 
          value={`${stats.healthScore}/100`} 
          subValue={stats.healthScore > 80 ? 'CRITICAL PATH CLEAR' : 'ATTENTION REQUIRED'}
          color={stats.healthScore < 50 ? '#ff4444' : (stats.healthScore < 80 ? '#f5a623' : '#c8f135')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
         <div style={chartBoxStyle}>
            <h3 style={chartTitleStyle}>Status Breakdown</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '8px' }}
                    itemStyle={{ color: '#f0ede8', fontSize: '12px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div style={chartBoxStyle}>
            <h3 style={chartTitleStyle}>Priority Load</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252729" />
                  <XAxis dataKey="name" stroke="#6b6e75" fontSize={12} />
                  <YAxis stroke="#6b6e75" fontSize={12} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#6b6e75" name="Total Tasks" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="shipped" fill="#c8f135" name="Shipped" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
         <div style={chartBoxStyle}>
            <h3 style={chartTitleStyle}>Time Box Accuracy (Estimated vs Actual)</h3>
            <div style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="#252729" />
                  <XAxis type="number" dataKey="estimated" name="Estimated" unit="m" stroke="#6b6e75" fontSize={12} />
                  <YAxis type="number" dataKey="actual" name="Actual" unit="m" stroke="#6b6e75" fontSize={12} />
                  <ZAxis type="number" range={[50, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ background: '#1c1e22', border: '1px solid #252729', borderRadius: '8px' }}
                  />
                  <Scatter name="Tasks" data={accuracyData} fill="#c8f135" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, subValue, color }: any) {
  return (
    <div style={{ 
      background: '#141618', border: '1px solid #252729', borderRadius: '12px', 
      padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b6e75' }}>
        <div style={{ color: color || '#6b6e75' }}>{icon}</div>
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: color || '#f0ede8', marginBottom: '2px' }}>{value}</div>
        <div style={{ fontSize: '11px', color: '#6b6e75', fontFamily: 'DM Mono, monospace' }}>{subValue}</div>
      </div>
    </div>
  )
}

const chartBoxStyle: React.CSSProperties = {
  background: '#141618',
  border: '1px solid #252729',
  borderRadius: '12px',
  padding: '24px'
}

const chartTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b6e75',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '24px',
  fontFamily: 'DM Mono, monospace'
}
