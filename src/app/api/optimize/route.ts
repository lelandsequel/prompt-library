import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const llmSystemPrompts: Record<string, string> = {
  chatgpt: `You are an expert at optimizing prompts for OpenAI's ChatGPT models. 
Your task is to rewrite the user's prompt to get the best possible response from ChatGPT.
Focus on:
- Clear and specific instructions
- Proper context and background
- Structured format when needed
- Explicit output format expectations
Return ONLY the optimized prompt, no explanations.`,

  claude: `You are an expert at optimizing prompts for Anthropic's Claude models.
Your task is to rewrite the user's prompt to get the best possible response from Claude.
Claude responds well to:
- XML-tagged sections (<context>, <task>, <requirements>)
- Step-by-step instructions
- Clear role definitions
- Explicit constraints
Return ONLY the optimized prompt, no explanations.`,

  cursor: `You are an expert at optimizing prompts for Cursor AI code editor.
Your task is to rewrite the user's prompt to get the best code completion results from Cursor.
Focus on:
- Clear code context
- Specific file/target specifications
- Explicit coding tasks
- Proper code formatting in prompts
Return ONLY the optimized prompt, no explanations.`,

  copilot: `You are an expert at optimizing prompts for GitHub Copilot.
Your task is to rewrite the user's prompt to get the best code completion from Copilot.
Focus on:
- Concise, clear comments
- Context about what the code should do
- Proper language specifications
- Minimal but sufficient context
Return ONLY the optimized prompt, no explanations.`,

  gemini: `You are an expert at optimizing prompts for Google Gemini.
Your task is to rewrite the user's prompt to get the best possible response from Gemini.
Focus on:
- Clear instructions
- Structured format
- Explicit output expectations
- Reasoning requests when helpful
Return ONLY the optimized prompt, no explanations.`
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, targetLlm } = body;

    if (!prompt || !targetLlm) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and targetLlm' },
        { status: 400 }
      );
    }

    const systemPrompt = llmSystemPrompts[targetLlm];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: `Unsupported target LLM: ${targetLlm}` },
        { status: 400 }
      );
    }

    // Call Anthropic API with Claude Haiku
    const response = await anthropic.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { 
          role: 'user', 
          content: `Please optimize this prompt for ${targetLlm}:\n\n${prompt}` 
        }
      ]
    });

    const optimizedPrompt = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    if (!optimizedPrompt) {
      return NextResponse.json(
        { error: 'No response from API' },
        { status: 500 }
      );
    }

    return NextResponse.json({ optimizedPrompt });
  } catch (error) {
    console.error('Optimization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
