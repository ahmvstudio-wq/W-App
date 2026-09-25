export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      title,
      transcript = '',
      notes = '',
      platform = 'instagram',
      content_type = 'reel',
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const groqApiKey = process.env.GROQ_API_KEY
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY

    const userPrompt = `
Analyze this video content asset and produce viral hooks, distribution angle, platform-optimized captions, CTA, and posting schedule recommendation.

Deliverable Title: "${title}"
Platform: ${platform} (${content_type})
${transcript ? `Transcript excerpt:\n"""\n${transcript.slice(0, 3000)}\n"""` : ''}
${notes ? `Creator Concept / Script Notes:\n"""\n${notes.slice(0, 1500)}\n"""` : ''}

Respond with valid JSON matching EXACTLY this structure:
{
  "hooks": [
    {
      "type": "Pattern Interrupt",
      "hook": "Direct, punchy 3-second hook text here",
      "rationale": "Why this stops the scroll"
    },
    {
      "type": "Curiosity Gap",
      "hook": "Direct curiosity-provoking hook text here",
      "rationale": "The open loop created"
    },
    {
      "type": "Contrarian Truth",
      "hook": "Direct contrarian challenge hook text here",
      "rationale": "Why conventional advice is wrong"
    }
  ],
  "angle": "1-sentence narrative angle",
  "caption_instagram": "High-converting Instagram Reel caption with linebreaks and comment trigger",
  "caption_youtube": "Algorithmic YouTube Shorts description with keywords and hashtags",
  "cta": "1-sentence direct Call to Action",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "best_posting_slot": "Recommended optimal time window (e.g. 18:30 - 20:30 UTC)"
}
`

    // 1. Try Groq (openai/gpt-oss-120b or qwen/qwen3.8-27b)
    if (groqApiKey) {
      const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b']
      for (const groqModel of groqModels) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: groqModel,
              messages: [
                {
                  role: 'system',
                  content:
                    'You are Cultlike OS Viral Content Strategist. You specialize in short-form video retention (Instagram Reels, YouTube Shorts, TikTok) for high-agency entrepreneurs, founders, and creators. Always return valid JSON matching the schema without commentary or code fences.',
                },
                {
                  role: 'user',
                  content: userPrompt,
                },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.6,
              max_tokens: 1500,
            }),
          })

          if (groqRes.ok) {
            const groqData = await groqRes.json()
            const rawText = groqData.choices?.[0]?.message?.content
            if (rawText) {
              const parsed = JSON.parse(rawText)
              return NextResponse.json({
                success: true,
                engine: `groq-${groqModel}`,
                analysis: parsed,
              })
            }
          }
        } catch (groqErr) {
          console.warn(`[AI Analyze Asset] Groq error on ${groqModel}, trying next:`, groqErr)
        }
      }
    }

    // 2. Try Anthropic fallback
    if (anthropicApiKey) {
      try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1500,
            system:
              'You are Cultlike OS Viral Content Strategist. Always respond with raw valid JSON only.',
            messages: [{ role: 'user', content: userPrompt }],
          }),
        })

        if (anthropicRes.ok) {
          const data = await anthropicRes.json()
          const rawText = data.content?.[0]?.text || ''
          const match = rawText.match(/\{[\s\S]*\}/)
          if (match) {
            const parsed = JSON.parse(match[0])
            return NextResponse.json({
              success: true,
              engine: 'claude-3-haiku',
              analysis: parsed,
            })
          }
        }
      } catch (anthropicErr) {
        console.warn('[AI Analyze Asset] Anthropic error, falling back:', anthropicErr)
      }
    }

    // 3. High-Quality Heuristic Engine (Guaranteed zero-failure fallback)
    const cleanWord = title.replace(/[^a-zA-Z0-9 ]/g, '').trim()
    return NextResponse.json({
      success: true,
      engine: 'cultlike-heuristic-engine',
      analysis: {
        hooks: [
          {
            type: 'Pattern Interrupt',
            hook: `Most creators get "${cleanWord}" completely backwards. Here is what actually happens:`,
            rationale: 'Instantly shatters default assumptions within the first 1.5 seconds.',
          },
          {
            type: 'Curiosity Gap',
            hook: `If you only change ONE thing about ${cleanWord}, make it this...`,
            rationale: 'Creates an irresistible open loop requiring the viewer to watch till the reveal.',
          },
          {
            type: 'Contrarian Truth',
            hook: `Stop wasting hours on ${cleanWord}. Use this 3-step protocol instead.`,
            rationale: 'Positions the creator as the high-agency shortcut to the outcome.',
          },
        ],
        angle: `Framing "${cleanWord}" as an unfair operational advantage that separates amateurs from top 1% operators.`,
        caption_instagram: `Stop overcomplicating ${cleanWord}.\n\nHere's the raw framework we use to eliminate friction and scale results:\n\n1. Focus on the single lever that moves the needle.\n2. Cut decorative work in half.\n3. Automate the distribution pipeline.\n\nDrop "CULT" in the comments and I'll send you our complete operating blueprint.\n\n#creatoros #entrepreneur #buildinpublic #productivity #scaling`,
        caption_youtube: `${cleanWord} — Complete step-by-step breakdown. Watch till the end to implement the full framework.\n\n#Shorts #Productivity #Business #Entrepreneurship`,
        cta: `Save this post and comment "OS" to get the exact SOP template sent to your DMs.`,
        tags: ['productivity', 'entrepreneurship', 'creatoreconomy', 'growth', 'automation', 'systems'],
        best_posting_slot: '18:00 - 20:00 (Peak Reels & Shorts cross-platform engagement)',
      },
    })
  } catch (error: any) {
    console.error('[API /api/content/ai/analyze-asset POST] Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}
