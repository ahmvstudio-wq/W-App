import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { Anthropic } from '@anthropic-ai/sdk'
import { buildUserContext } from '@/lib/ai/buildContext'
import { createClient } from '@/lib/supabase/server'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { action, payload, messages, workspaceId } = body

    // AUTH CHECK
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!groq) return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 })

    if (action === 'callGroq' || !action) {
      
      // Build live context from real data using server-side client
      const context = await buildUserContext(supabase, user.id, workspaceId || payload?.workspaceId)

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: context },
          ...(messages || payload?.messages || [])
        ],
        max_tokens: 1024,
        temperature: 0.5,
      })

      return NextResponse.json({ result: response.choices[0]?.message?.content || '' })
    }

    if (action === 'challengeTask') {
      const { title, output } = payload
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a brutal scope challenger. Given a task, respond with EXACTLY this JSON structure (no markdown, no extra text):
{"priority": "p0|p1|p2|p3", "priority_reasoning": "one sentence", "time_box_minutes": number, "scope_question": "one challenging question under 20 words"}`,
          },
          {
            role: 'user',
            content: `Task: ${title}\nExpected output: ${output}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      })
      
      const text = response.choices[0]?.message?.content || ''
      try {
        // Try to find JSON in the text if the model added fluff
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const jsonText = jsonMatch ? jsonMatch[0] : text
        return NextResponse.json({ result: JSON.parse(jsonText) })
      } catch {
        return NextResponse.json({
          result: {
            priority: 'p2',
            priority_reasoning: 'Unable to determine — set manually.',
            time_box_minutes: 60,
            scope_question: 'Is this truly necessary right now?',
          }
        })
      }
    }

    if (action === 'stressTestProject') {
      const { project } = payload
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a brutal project stress tester. Ask 5 hard questions about whether this project should exist. Be specific. Be short. Under 200 words total.',
          },
          {
            role: 'user',
            content: JSON.stringify(project),
          },
        ],
        max_tokens: 300,
        temperature: 0.6,
      })
      
      return NextResponse.json({ result: response.choices[0]?.message?.content || '' })
    }

    if (action === 'generateMorningBrief') {
      const { context } = payload
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Generate a morning brief in exactly 3 bullet points. Brutal. Direct. No fluff. Under 80 words.',
          },
          {
            role: 'user',
            content: `Top priority task: ${context.topTask || 'none'}\nBiggest blocker: ${context.biggestBlocker || 'none'}\nSlowest project: ${context.slowProject || 'none'}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.5,
      })
      
      return NextResponse.json({ result: response.choices[0]?.message?.content || '' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('AI API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
