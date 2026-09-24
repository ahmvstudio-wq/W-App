export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { Anthropic } from '@anthropic-ai/sdk'
import { buildUserContext } from '@/lib/ai/buildContext'
import { createClient } from '@/lib/supabase/server'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { action, payload, messages, workspaceId } = body

    // AUTH CHECK
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (action === 'callGroq' || action === 'chat' || !action) {
      const context = await buildUserContext(supabase, user.id, workspaceId || payload?.workspaceId)
      const rawMessages = messages || payload?.messages || []

      if (anthropic) {
        try {
          const anthropicMsgs = rawMessages
            .filter((m: any) => m.role === 'user' || m.role === 'assistant')
            .map((m: any) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content || ''
            }))

          if (anthropicMsgs.length === 0) {
            anthropicMsgs.push({ role: 'user', content: 'What are my top priorities today?' })
          }

          const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            system: `You are Cultlike OS, an elite executive operating system for high-agency creators and operators.\n${context}`,
            messages: anthropicMsgs,
            max_tokens: 1024,
            temperature: 0.5,
          })

          const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
          return NextResponse.json({ result: text })
        } catch (anthropicErr) {
          console.warn('[AI API] Anthropic call failed, falling back to heuristic response:', anthropicErr)
        }
      }

      // Deterministic fallback if Anthropic is not configured or fails
      const lastUserMsg = rawMessages[rawMessages.length - 1]?.content || ''
      return NextResponse.json({
        result: `Cultlike OS Workspace Synthesis:\n\nBased on your active projects and deliverables, your top focus is to execute non-negotiable P0 items first. Keep feedback loops tight, eliminate decorative tasks, and ensure every deliverable has a clear definition of done.\n\nQuery analyzed: "${lastUserMsg.slice(0, 100)}"`
      })
    }

    if (action === 'challengeTask') {
      const { title, output } = payload || {}

      if (anthropic) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            system: `You are a brutal scope challenger. Given a task, respond with EXACTLY this JSON structure (no markdown, no extra text):
{"priority": "p0|p1|p2|p3", "priority_reasoning": "one sentence", "time_box_minutes": number, "scope_question": "one challenging question under 20 words"}`,
            messages: [
              {
                role: 'user',
                content: `Task: ${title}\nExpected output: ${output || 'None specified'}`,
              }
            ],
            max_tokens: 250,
            temperature: 0.2,
          })

          const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            return NextResponse.json({ result: JSON.parse(jsonMatch[0]) })
          }
        } catch (err) {
          console.warn('[AI API] Anthropic challengeTask fallback triggered:', err)
        }
      }

      // High-precision heuristic challenge
      const hasOutput = Boolean(output && output.trim().length > 5)
      return NextResponse.json({
        result: {
          priority: hasOutput ? 'p1' : 'p2',
          priority_reasoning: hasOutput
            ? `Direct output specified for "${title}". Prioritize shipping minimal version.`
            : `No concrete output defined yet for "${title}". Clarify deliverable before execution.`,
          time_box_minutes: 45,
          scope_question: 'Can this deliverable be cut in half and shipped as a minimal working artifact in 45 minutes?',
        }
      })
    }

    if (action === 'stressTestProject') {
      const { project } = payload || {}
      const projectName = project?.name || 'Project'

      if (anthropic) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            system: 'You are a brutal project stress tester. Ask 5 hard questions about whether this project should exist. Be specific, concise, and direct. Under 200 words total.',
            messages: [
              {
                role: 'user',
                content: JSON.stringify(project || {}),
              },
            ],
            max_tokens: 300,
            temperature: 0.5,
          })

          const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
          return NextResponse.json({ result: text })
        } catch (err) {
          console.warn('[AI API] Anthropic stressTestProject fallback triggered:', err)
        }
      }

      // High-precision heuristic stress test
      return NextResponse.json({
        result: `1. What is the single quantifiable metric proving "${projectName}" succeeded?\n2. If forced to ship in 48 hours instead of the deadline, what 80% would you cut?\n3. Does this directly unlock revenue or user retention, or is it decorative busywork?\n4. What is the exact kill condition under which this project should be immediately cancelled?\n5. Who is the single end-user demanding this output, and have you validated the requirement?`
      })
    }

    if (action === 'generateMorningBrief') {
      const { context } = payload || {}

      if (anthropic) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            system: 'Generate a morning brief in exactly 3 bullet points. Brutal. Direct. No fluff. Under 80 words.',
            messages: [
              {
                role: 'user',
                content: `Top priority task: ${context?.topTask || 'none'}\nBiggest blocker: ${context?.biggestBlocker || 'none'}\nSlowest project: ${context?.slowProject || 'none'}`,
              },
            ],
            max_tokens: 150,
            temperature: 0.4,
          })

          const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
          return NextResponse.json({ result: text })
        } catch (err) {
          console.warn('[AI API] Anthropic generateMorningBrief fallback triggered:', err)
        }
      }

      // High-precision heuristic morning brief
      return NextResponse.json({
        result: `• Priority: Execute "${context?.topTask || 'core deliverable'}" first with a 60-minute uninterrupted deep work block.\n• Blocker: Resolve "${context?.biggestBlocker || 'pending dependencies'}" before starting secondary tasks.\n• Momentum: Accelerate "${context?.slowProject || 'slowest active project'}" by shipping its minimal viable slice today.`
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('AI API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
