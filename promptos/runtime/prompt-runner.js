#!/usr/bin/env node

/**
 * PromptOS Runtime Sandbox
 * 
 * A Node.js CLI for testing prompts from the JourdanLabs Prompt Library.
 * 
 * Usage:
 *   prompt-run --id <prompt_id> [options]
 *   prompt-run --category <category> [options]
 *   cat input.json | prompt-run --id <prompt_id>
 */

import { readFileSync, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import YAML from 'yaml';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Constants
const BASE_DIR = resolve(__dirname, '..');
const REGISTRY_PATH = join(BASE_DIR, 'registry', 'index.yaml');

/**
 * Load the prompt registry
 */
function loadRegistry() {
  if (!existsSync(REGISTRY_PATH)) {
    throw new Error(`Registry not found at ${REGISTRY_PATH}`);
  }
  const content = readFileSync(REGISTRY_PATH, 'utf8');
  return YAML.parse(content);
}

/**
 * Load a prompt file by its path
 */
function loadPromptFile(filepath) {
  const fullPath = resolve(BASE_DIR, filepath);
  if (!existsSync(fullPath)) {
    throw new Error(`Prompt file not found: ${fullPath}`);
  }
  const content = readFileSync(fullPath, 'utf8');
  return YAML.parse(content);
}

/**
 * Load a prompt by its ID
 */
function loadPromptById(promptId) {
  const registry = loadRegistry();
  for (const prompt of registry.prompts || []) {
    if (prompt.id === promptId) {
      return loadPromptFile(prompt.file);
    }
  }
  return null;
}

/**
 * Load all prompts in a category
 */
function loadPromptsByCategory(category) {
  const registry = loadRegistry();
  const prompts = [];
  for (const prompt of registry.prompts || []) {
    if (prompt.category === category) {
      try {
        prompts.push(loadPromptFile(prompt.file));
      } catch (e) {
        console.error(`Warning: Could not load prompt ${prompt.id}: ${e.message}`);
      }
    }
  }
  return prompts;
}

/**
 * Inject variables into a prompt template
 * Supports {{variable}} and {{#if variable}}...{{/if}} syntax
 */
function injectVariables(promptTemplate, variables) {
  let result = promptTemplate;
  
  // Handle conditional blocks {{#if variable}}...{{/if}}
  const conditionalPattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  
  result = result.replace(conditionalPattern, (match, varName, content) => {
    if (variables[varName] && variables[varName] !== '') {
      return content;
    }
    return '';
  });
  
  // Handle simple variable substitution {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(String(value));
  }
  
  return result;
}

/**
 * Format prompt for different models
 */
function formatPromptForModel(promptData, model) {
  const prompt = promptData.prompt || '';
  
  if (model === 'claude' || model.startsWith('claude-')) {
    return formatForClaude(promptData);
  } else if (model === 'openai' || model.startsWith('gpt-')) {
    return formatForOpenAI(promptData);
  } else if (model === 'cursor') {
    return formatForCursor(promptData);
  }
  
  return prompt;
}

function formatForClaude(promptData) {
  const prompt = promptData.prompt || '';
  const role = promptData.role || '';
  
  return `<task>
You are ${role}. Help with the following task.
</task>

<context>
{{context}}
</context>

<task_description>
${prompt}
</task_description>`;
}

function formatForOpenAI(promptData) {
  const prompt = promptData.prompt || '';
  const role = promptData.role || '';
  
  return `You are ${role}. Please help with the following task.

Context: {{context}}

Task: ${prompt}`;
}

function formatForCursor(promptData) {
  const prompt = promptData.prompt || '';
  
  return `# Task
${prompt}

## Context
{{context}}`;
}

/**
 * List available prompts
 */
function listPrompts() {
  const registry = loadRegistry();
  return (registry.prompts || []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    version: p.version
  }));
}

/**
 * List available categories
 */
function listCategories() {
  const registry = loadRegistry();
  return (registry.categories || []).map(c => c.id);
}

/**
 * Parse CLI arguments
 */
function parseArgs(args) {
  const parsed = {
    id: null,
    category: null,
    inject: {},
    format: 'raw',
    dryRun: false,
    output: 'text',
    model: null,
    stream: false,
    list: false,
    listCategories: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--id':
      case '-i':
        parsed.id = args[++i];
        break;
      case '--category':
      case '-c':
        parsed.category = args[++i];
        break;
      case '--inject':
      case '-v':
        const varStr = args[++i];
        if (varStr) {
          varStr.split(',').forEach(pair => {
            const [key, ...valueParts] = pair.split('=');
            parsed.inject[key] = valueParts.join('=');
          });
        }
        break;
      case '--format':
      case '-f':
        parsed.format = args[++i];
        break;
      case '--dry-run':
        parsed.dryRun = true;
        break;
      case '--output':
      case '-o':
        parsed.output = args[++i];
        break;
      case '--model':
      case '-m':
        parsed.model = args[++i];
        break;
      case '--stream':
        parsed.stream = true;
        break;
      case '--list':
      case '-l':
        parsed.list = true;
        break;
      case '--list-categories':
        parsed.listCategories = true;
        break;
      case '--json':
        parsed.output = 'json';
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
    }
  }
  
  return parsed;
}

/**
 * Read stdin as JSON (non-blocking)
 */
async function readStdin() {
  // Check if stdin is a TTY - if so, no piped input expected
  if (process.stdin.isTTY) {
    return {};
  }
  
  // Read from stdin using fd
  return new Promise((resolve) => {
    const chunks = [];
    
    const onData = (chunk) => {
      chunks.push(chunk);
    };
    
    const onEnd = () => {
      process.stdin.removeListener('data', onData);
      try {
        const input = chunks.join('');
        if (input.trim()) {
          resolve(JSON.parse(input));
        } else {
          resolve({});
        }
      } catch (e) {
        resolve({});
      }
    };
    
    process.stdin.on('data', onData);
    process.stdin.once('end', onEnd);
    
    // Timeout if no data
    setTimeout(() => {
      process.stdin.removeListener('data', onData);
      process.stdin.removeListener('end', onEnd);
      if (chunks.length === 0) {
        resolve({});
      }
    }, 50);
  });
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set in environment');
  }
  
  const client = new Anthropic({ apiKey });
  
  const messages = [{ role: 'user', content: prompt }];
  
  const response = await client.messages.create({
    model: options.model || 'claude-sonnet-4-20250514',
    max_tokens: options.maxTokens || 4096,
    messages,
    ...(options.stream ? { stream: true } : {})
  });
  
  return response;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set in environment');
  }
  
  const client = new OpenAI({ apiKey });
  
  const messages = [{ role: 'user', content: prompt }];
  
  if (options.stream) {
    const stream = await client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages,
      stream: true
    });
    
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
      fullResponse += content;
    }
    return fullResponse;
  }
  
  const response = await client.chat.completions.create({
    model: options.model || 'gpt-4o',
    messages,
    max_tokens: options.maxTokens || 4096
  });
  
  return response.choices[0].message.content;
}

/**
 * Call LLM based on provider
 */
async function callLLM(prompt, provider, options = {}) {
  if (provider === 'anthropic' || provider?.startsWith('claude-')) {
    return callAnthropic(prompt, options);
  } else if (provider === 'openai' || provider?.startsWith('gpt-')) {
    return callOpenAI(prompt, options);
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Print help text
 */
function printHelp() {
  console.log(`
PromptOS Runtime Sandbox v1.0.0

Usage:
  prompt-run [options]

Options:
  -i, --id <id>              Load prompt by ID
  -c, --category <cat>        Load prompts by category
  -v, --inject <vars>        Variables to inject (key=value,key2=value2)
  -f, --format <format>      Output format: claude, openai, cursor, raw (default: raw)
  -o, --output <format>      Output type: text, json (default: text)
  -m, --model <model>        LLM model to use (e.g., claude-sonnet-4-20250514, gpt-4o)
  --dry-run                  Just show rendered prompt, don't call LLM
  --stream                   Stream LLM response
  -l, --list                 List all available prompts
  --list-categories          List all categories
  --json                     Output as JSON
  -h, --help                 Show this help

Examples:
  # Dry run - just show rendered prompt
  prompt-run --id codegen-v1 --inject language=Python,requirements="Hello world"

  # Call LLM with rendered prompt
  prompt-run --id debugging-v1 --inject language=JavaScript,error_message="TypeError",code_snippet="const x = undefined; x.map()"

  # Use different format
  prompt-run --id codegen-v1 --format claude --inject language=Go,requirements="HTTP server"

  # List prompts
  prompt-run --list

  # Use with stdin (JSON)
  echo '{"language": "Python", "requirements": "test"}' | prompt-run --id codegen-v1

Environment Variables:
  ANTHROPIC_API_KEY    Your Anthropic API key
  OPENAI_API_KEY       Your OpenAI API key
`);
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  // Show help
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  
  try {
    // Handle list commands
    if (args.list) {
      const prompts = listPrompts();
      if (args.output === 'json') {
        console.log(JSON.stringify(prompts, null, 2));
      } else {
        for (const p of prompts) {
          console.log(`${p.id.padEnd(25)} ${p.name.padEnd(30)} [${p.category}]`);
        }
      }
      return;
    }
    
    if (args.listCategories) {
      const categories = listCategories();
      if (args.output === 'json') {
        console.log(JSON.stringify(categories, null, 2));
      } else {
        console.log('Available categories:');
        for (const cat of categories) {
          console.log(`  - ${cat}`);
        }
      }
      return;
    }
    
    // Load prompts
    let prompts = [];
    
    if (args.id) {
      const prompt = loadPromptById(args.id);
      if (prompt) {
        prompts = [prompt];
      } else {
        console.error(`Prompt not found: ${args.id}`);
        process.exit(1);
      }
    } else if (args.category) {
      prompts = loadPromptsByCategory(args.category);
    } else {
      console.error('Error: Must specify --id or --category');
      printHelp();
      process.exit(1);
    }
    
    if (prompts.length === 0) {
      console.error('No prompts found');
      process.exit(1);
    }
    
    // Try to read stdin for additional inputs (only if not a TTY)
    let stdinData = {};
    if (!process.stdin.isTTY) {
      try {
        stdinData = await readStdin();
      } catch (e) {
        // Ignore stdin errors
      }
    }
    
    // Merge inject vars with stdin data
    const variables = { ...stdinData, ...args.inject };
    
    // Process prompts
    for (const promptData of prompts) {
      // Inject variables
      let renderedPrompt = injectVariables(promptData.prompt || '', variables);
      
      // Format for model if requested
      if (args.format !== 'raw') {
        promptData.prompt = renderedPrompt;
        renderedPrompt = formatPromptForModel(promptData, args.format);
      }
      
      // Dry run - just show rendered prompt
      if (args.dryRun) {
        if (args.output === 'json') {
          console.log(JSON.stringify({
            id: promptData.id,
            name: promptData.name,
            renderedPrompt,
            variables
          }, null, 2));
        } else {
          console.log('\n' + '='.repeat(60));
          console.log(`ID: ${promptData.id}`);
          console.log(`Name: ${promptData.name}`);
          console.log(`Category: ${promptData.category}`);
          console.log(`Role: ${promptData.role}`);
          console.log('='.repeat(60));
          console.log('\nRendered Prompt:');
          console.log('-'.repeat(40));
          console.log(renderedPrompt);
          console.log('-'.repeat(40));
          
          // Show inputs if any
          const inputs = promptData.inputs || [];
          if (inputs.length > 0) {
            console.log('\nExpected Inputs:');
            for (const inp of inputs) {
              const required = inp.required ? '(required)' : '(optional)';
              console.log(`  - ${inp.name}: ${inp.label} ${required}`);
            }
          }
        }
        continue;
      }
      
      // Call LLM if not dry-run
      if (args.model || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) {
        // Determine provider
        let provider = 'anthropic'; // default
        if (args.model?.startsWith('gpt-')) {
          provider = 'openai';
        }
        
        console.log('\nCalling LLM...\n');
        
        try {
          const response = await callLLM(renderedPrompt, provider, {
            model: args.model,
            stream: args.stream,
            maxTokens: 4096
          });
          
          if (!args.stream) {
            if (args.output === 'json') {
              console.log(JSON.stringify({
                prompt: promptData.id,
                response,
                variables
              }, null, 2));
            } else {
              console.log('\n--- LLM Response ---\n');
              console.log(response);
            }
          }
        } catch (llmError) {
          console.error(`LLM Error: ${llmError.message}`);
          console.log('\nFalling back to dry-run mode...\n');
          console.log(renderedPrompt);
        }
      } else {
        // No LLM configured, just show the prompt
        console.log(renderedPrompt);
      }
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
