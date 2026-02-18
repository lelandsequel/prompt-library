/**
 * PromptOS — Local model stub adapter
 */
'use strict';

async function generate(prompt, model, params = {}) {
  return `[LOCAL MODEL] (${model}) — ${prompt.substring(0, 200)}...`;
}

module.exports = { generate };
