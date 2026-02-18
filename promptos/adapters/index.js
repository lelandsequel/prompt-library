/**
 * PromptOS — Model adapter router
 * generate(prompt, model, params) → string
 */
'use strict';

const claude = require('./claude.js');
const openai = require('./openai.js');
const local = require('./local.js');

/**
 * Route to correct adapter based on model name.
 * Falls back to local stub if no API key is set.
 */
async function generate(prompt, model = 'claude-sonnet-4-20250514', params = {}) {
  const m = (model || '').toLowerCase();

  if (m.startsWith('claude') || m.startsWith('anthropic')) {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[adapters] ANTHROPIC_API_KEY not set — using local stub');
      return local.generate(prompt, model, params);
    }
    return claude.generate(prompt, model, params);
  }

  if (m.startsWith('gpt') || m.startsWith('openai') || m.startsWith('o1') || m.startsWith('o3')) {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[adapters] OPENAI_API_KEY not set — using local stub');
      return local.generate(prompt, model, params);
    }
    return openai.generate(prompt, model, params);
  }

  if (m.startsWith('local')) {
    return local.generate(prompt, model, params);
  }

  // Default: try Anthropic first, then OpenAI, then local
  if (process.env.ANTHROPIC_API_KEY) return claude.generate(prompt, model, params);
  if (process.env.OPENAI_API_KEY) return openai.generate(prompt, model, params);
  return local.generate(prompt, model, params);
}

module.exports = { generate, claude, openai, local };
