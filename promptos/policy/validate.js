#!/usr/bin/env node
/**
 * PromptOS Policy Validation CLI
 * Validates prompts against policy rules
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const PolicyEngine = require('./engine');

const PROMPTS_DIR = path.join(__dirname, '../prompts');

/**
 * Find prompt file by ID or path
 */
function findPromptFile(input) {
  // If it's a file path, check if it exists
  if (fs.existsSync(input)) {
    return input;
  }

  // If it's a prompt ID (e.g., "codegen-v1"), find it in prompts directory
  // Search in all category directories
  const categories = ['codegen', 'debugging', 'docs', 'sre', 'architecture'];
  
  for (const category of categories) {
    const dirPath = path.join(PROMPTS_DIR, category);
    if (!fs.existsSync(dirPath)) continue;
    
    const files = fs.readdirSync(dirPath);
    const match = files.find(f => f.startsWith(input.split('-')[0]));
    
    if (match) {
      return path.join(dirPath, match);
    }
  }

  // Try exact match
  for (const category of categories) {
    const filePath = path.join(PROMPTS_DIR, category, `${input}.yaml`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
PromptOS Policy Validation CLI

Usage:
  validate.js <prompt-id|file-path> [options]

Arguments:
  prompt-id          Prompt ID (e.g., codegen-v1) or file path
  --verbose, -v     Show detailed validation results
  --rules FILE      Custom rules file path
  --help, -h        Show this help message

Examples:
  validate.js codegen-v1
  validate.js /path/to/prompt.yaml
  validate.js codegen-v1 --verbose
  validate.js prompt.yaml --rules ./custom-rules.yaml

Exit codes:
  0 - Validation passed
  1 - Validation failed (errors)
`);
}

/**
 * Main validation function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Parse options
  const verbose = args.includes('--verbose') || args.includes('-v');
  let rulesPath = null;
  let promptInput = args[0];

  // Check for custom rules
  const rulesIndex = args.indexOf('--rules');
  if (rulesIndex !== -1 && args[rulesIndex + 1]) {
    rulesPath = args[rulesIndex + 1];
  }

  // Find prompt file
  const promptPath = findPromptFile(promptInput);
  
  if (!promptPath) {
    console.error(`Error: Could not find prompt: ${promptInput}`);
    console.error('Please provide a valid prompt ID or file path.');
    process.exit(1);
  }

  try {
    // Load prompt
    const content = fs.readFileSync(promptPath, 'utf8');
    const prompt = yaml.load(content);

    // Initialize engine
    const engine = new PolicyEngine(rulesPath);

    // Validate
    const result = engine.validate(prompt);

    // Print results
    console.log(`\nValidating: ${path.basename(promptPath)}`);
    console.log('─'.repeat(50));
    console.log(engine.formatErrors(result));
    console.log('─'.repeat(50));

    if (verbose) {
      console.log('\nDetailed Results:');
      for (const r of result.results) {
        const status = r.passed ? '✓' : '✗';
        console.log(`  ${status} ${r.name}`);
        if (!r.passed) {
          for (const err of r.errors) {
            console.log(`      → ${err.message}`);
          }
        }
      }
    }

    console.log('');
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
