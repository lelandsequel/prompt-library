import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are ShipMachine's plan architect. Given a plain-English request, produce a precise build plan as JSON.

Rules:
- Be specific to what was asked. Don't be generic.
- Pick the right tech for the job (don't default to React for everything)
- Steps should be concrete actions, not vague phases
- Estimate complexity honestly
- Flag real risks, not generic warnings
- If the request is ambiguous, make smart assumptions and note them

Respond with ONLY valid JSON matching this schema:
{
  "objective": "refined version of what they want (clearer, more specific)",
  "steps": ["step 1 description", "step 2 description", ...],
  "tech": ["technology 1", "technology 2", ...],
  "architecture": "brief architecture description (e.g., 'Next.js app with SQLite local storage')",
  "files_to_create": ["path/to/file1.ts", "path/to/file2.ts", ...],
  "style": "design style if UI is involved, or null",
  "assumptions": ["assumption 1 if any"],
  "risks": ["real risk 1 if any"],
  "estimated_complexity": "simple | medium | complex",
  "estimated_time": "rough time estimate"
}`,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Strip markdown code fences if present, then parse JSON
    const raw = content.text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    const planJson = JSON.parse(raw);

    return NextResponse.json({ plan: planJson });
  } catch (error) {
    console.error('Error in /api/ship/plan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
