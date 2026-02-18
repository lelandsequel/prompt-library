#!/usr/bin/env node
/**
 * PromptOS CI Evaluation Runner
 * 
 * Runs evaluation test cases against prompts using LLM calls.
 * Outputs JUnit XML format for CI integration.
 * 
 * Supports two test case formats:
 * 1. eval subdirectory cases.yaml files
 * 2. Embedded in prompt YAML under eval.test_cases
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');
const readline = require('readline');

// Configuration
const BASE_DIR = path.join(__dirname, '..');
const PROMPTS_DIR = path.join(BASE_DIR, 'prompts');
const EVAL_DIR = path.join(BASE_DIR, 'eval');

// Fuzzy matching threshold
const FUZZY_THRESHOLD = 0.6;

// LLM Configuration (from environment)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = process.env.LLM_MODEL || 'claude-sonnet-4-20250514';

/**
 * Load YAML file
 */
function loadYaml(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  } catch (err) {
    console.error(`Error loading ${filePath}: ${err.message}`);
    return null;
  }
}

/**
 * Find all prompt YAML files
 */
function findPrompts(dir) {
  const prompts = [];
  function walk(d) {
    const files = fs.readdirSync(d);
    for (const file of files) {
      const fullPath = path.join(d, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        prompts.push(fullPath);
      }
    }
  }
  walk(dir);
  return prompts;
}

/**
 * Load test cases from eval subdirectory cases.yaml files
 */
function loadExternalTestCases(evalDir) {
  const testCases = [];
  
  if (!fs.existsSync(evalDir)) {
    return testCases;
  }
  
  const dirs = fs.readdirSync(evalDir).filter(f => {
    return fs.statSync(path.join(evalDir, f)).isDirectory();
  });
  
  for (const dir of dirs) {
    const casesFile = path.join(evalDir, dir, 'cases.yaml');
    if (fs.existsSync(casesFile)) {
      const data = loadYaml(casesFile);
      if (data && data.test_cases) {
        for (const tc of data.test_cases) {
          testCases.push({
            promptId: tc.prompt_id || data.prompt_id || dir,
            name: tc.name,
            description: tc.description,
            inputs: tc.inputs || {},
            expected: tc.expected,
            validate: tc.validate || []
          });
        }
      }
    }
  }
  
  return testCases;
}

/**
 * Load test cases from embedded eval.test_cases in prompt files
 */
function loadEmbeddedTestCases(promptsDir) {
  const testCases = [];
  const promptFiles = findPrompts(promptsDir);
  
  for (const file of promptFiles) {
    const prompt = loadYaml(file);
    if (!prompt) continue;
    
    const promptId = prompt.id;
    const evalSection = prompt.eval;
    
    if (evalSection && evalSection.test_cases) {
      for (const tc of evalSection.test_cases) {
        testCases.push({
          promptId: promptId,
          promptText: prompt.prompt,
          name: tc.name,
          description: tc.description,
          inputs: tc.inputs || {},
          expected: tc.expected,
          validate: tc.validate || []
        });
      }
    }
  }
  
  return testCases;
}

/**
 * Render prompt template with inputs
 */
function renderPrompt(promptTemplate, inputs) {
  let rendered = promptTemplate;
  
  // Handle Handlebars-like {{variable}} syntax
  rendered = rendered.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const key = varName.trim();
    return inputs[key] !== undefined ? String(inputs[key]) : match;
  });
  
  // Handle conditional {{#if variable}}...{{/if}}
  rendered = rendered.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
    const key = varName.trim();
    return inputs[key] ? content.replace(/\{\{([^}]+)\}\}/g, (m, k) => inputs[k.trim()] || '') : '';
  });
  
  // Clean up any remaining template variables
  rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');
  
  return rendered.trim();
}

/**
 * Call Anthropic API
 */
async function callAnthropic(messages, model = DEFAULT_MODEL) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  
  const data = JSON.stringify({
    model: model,
    max_tokens: 4096,
    messages: messages
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.content[0].text);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Call OpenAI API
 */
async function callOpenAI(messages, model = 'gpt-4o') {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  const data = JSON.stringify({
    model: model,
    messages: messages,
    max_tokens: 4096
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.choices[0].message.content);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Call LLM (prefers Anthropic, falls back to OpenAI)
 */
async function callLLM(prompt, model = null) {
  const messages = [{ role: 'user', content: prompt }];
  const modelToUse = model || DEFAULT_MODEL;
  
  if (ANTHROPIC_API_KEY) {
    return await callAnthropic(messages, modelToUse);
  } else if (OPENAI_API_KEY) {
    return await callOpenAI(messages, modelToUse);
  } else {
    throw new Error('No LLM API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY');
  }
}

/**
 * Simple fuzzy matching for text comparison
 */
function fuzzyMatch(actual, expected) {
  const actualLower = actual.toLowerCase();
  const expectedLower = expected.toLowerCase();
  
  // Exact substring match
  if (actualLower.includes(expectedLower)) {
    return { score: 1.0, matched: true };
  }
  
  // Check key terms
  const expectedTerms = expectedLower.split(/[\s,;]+/).filter(t => t.length > 3);
  let matchedTerms = 0;
  
  for (const term of expectedTerms) {
    if (actualLower.includes(term)) {
      matchedTerms++;
    }
  }
  
  if (expectedTerms.length > 0) {
    const score = matchedTerms / expectedTerms.length;
    return { score, matched: score >= FUZZY_THRESHOLD };
  }
  
  // Levenshtein-based similarity for short strings
  if (expectedLower.length < 50) {
    const levScore = 1 - levenshtein(actualLower, expectedLower) / Math.max(actualLower.length, expectedLower.length);
    return { score: levScore, matched: levScore >= FUZZY_THRESHOLD };
  }
  
  return { score: 0, matched: false };
}

/**
 * Calculate Levenshtein distance
 */
function levenshtein(a, b) {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Run a single test case
 */
async function runTestCase(testCase) {
  const result = {
    name: testCase.name,
    promptId: testCase.promptId,
    passed: false,
    score: 0,
    expected: testCase.expected,
    actual: '',
    feedback: '',
    duration: 0
  };
  
  try {
    // Load prompt if not already loaded
    if (!testCase.promptText) {
      const promptFiles = findPrompts(PROMPTS_DIR);
      for (const file of promptFiles) {
        const prompt = loadYaml(file);
        if (prompt && prompt.id === testCase.promptId) {
          testCase.promptText = prompt.prompt;
          break;
        }
      }
    }
    
    if (!testCase.promptText) {
      throw new Error(`Prompt not found: ${testCase.promptId}`);
    }
    
    // Render prompt with inputs
    const renderedPrompt = renderPrompt(testCase.promptText, testCase.inputs);
    
    // Call LLM
    const startTime = Date.now();
    const actualOutput = await callLLM(renderedPrompt);
    result.duration = Date.now() - startTime;
    
    result.actual = actualOutput.substring(0, 500); // Truncate for display
    
    // Compare with expected
    if (testCase.expected) {
      const match = fuzzyMatch(actualOutput, testCase.expected);
      result.score = match.score;
      result.passed = match.matched;
      result.feedback = match.matched 
        ? `Matched with score ${match.score.toFixed(2)}`
        : `Failed fuzzy match. Score: ${match.score.toFixed(2)}`;
    } else if (testCase.validate && testCase.validate.length > 0) {
      // Use validation rules
      let allPassed = true;
      const validationResults = [];
      
      for (const rule of testCase.validate) {
        if (rule.type === 'contains') {
          const passes = actualOutput.toLowerCase().includes(rule.rule.toLowerCase());
          validationResults.push({ type: 'contains', rule: rule.rule, passed: passes });
          if (!passes) allPassed = false;
        } else if (rule.type === 'regex') {
          const regex = new RegExp(rule.rule);
          const passes = regex.test(actualOutput);
          validationResults.push({ type: 'regex', rule: rule.rule, passed: passes });
          if (!passes) allPassed = false;
        }
      }
      
      result.passed = allPassed;
      result.score = allPassed ? 1.0 : 0.0;
      result.feedback = JSON.stringify(validationResults);
    } else {
      result.passed = true;
      result.score = 1.0;
      result.feedback = 'No validation rules - auto-passed';
    }
    
  } catch (err) {
    result.feedback = `Error: ${err.message}`;
    result.passed = false;
    result.score = 0;
  }
  
  return result;
}

/**
 * Generate JUnit XML output
 */
function generateJUnitXML(results) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<testsuite name="PromptOS Eval" tests="' + results.length + '" ';
  xml += 'failures="' + results.filter(r => !r.passed).length + '" ';
  xml += 'errors="0" time="' + (results.reduce((a, r) => a + r.duration, 0) / 1000).toFixed(3) + '">\n';
  
  for (const result of results) {
    xml += '  <testcase name="' + escapeXML(result.promptId + ' - ' + result.name) + '" ';
    xml += 'classname="PromptOS" time="' + (result.duration / 1000).toFixed(3) + '">\n';
    
    if (!result.passed) {
      xml += '    <failure message="' + escapeXML(result.feedback) + '" type="AssertionError">\n';
      xml += '      <![CDATA[Expected: ' + escapeXML(result.expected || 'N/A') + ']]>\n';
      xml += '      <![CDATA[Actual: ' + escapeXML(result.actual || result.feedback) + ']]>\n';
      xml += '    </failure>\n';
    }
    
    xml += '  </testcase>\n';
  }
  
  xml += '</testsuite>';
  
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Print human-readable summary
 */
function printSummary(results) {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log('\n' + '='.repeat(60));
  console.log('PromptOS CI Evaluation Results');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`\n${status} - ${result.promptId} / ${result.name}`);
    console.log(`  Score: ${result.score.toFixed(2)}`);
    if (!result.passed) {
      console.log(`  Feedback: ${result.feedback.substring(0, 100)}`);
    }
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const outputFile = args.find(a => a.startsWith('--output='))?.split('=')[1];
  const junitOnly = args.includes('--junit-only');
  const verbose = args.includes('--verbose');
  const dryRun = args.includes('--dry-run');
  
  console.log('Loading test cases...');
  
  // Load test cases from both sources
  const externalCases = loadExternalTestCases(EVAL_DIR);
  const embeddedCases = loadEmbeddedTestCases(PROMPTS_DIR);
  const allTestCases = [...externalCases, ...embeddedCases];
  
  if (allTestCases.length === 0) {
    console.log('No test cases found.');
    process.exit(0);
  }
  
  console.log(`Found ${allTestCases.length} test cases`);
  
  // Dry run - just show what would be tested
  if (dryRun) {
    console.log('\nDry run - test cases that would be executed:');
    for (const tc of allTestCases) {
      console.log(`  - ${tc.promptId} / ${tc.name}`);
      console.log(`    Inputs: ${JSON.stringify(tc.inputs)}`);
      console.log(`    Expected: ${tc.expected}`);
    }
    process.exit(0);
  }
  
  // Check for API key
  if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY) {
    console.error('ERROR: No LLM API key configured.');
    console.error('Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable.');
    process.exit(1);
  }
  
  // Run all test cases
  console.log('Running evaluations...\n');
  const results = [];
  
  for (const tc of allTestCases) {
    if (verbose) {
      console.log(`Running: ${tc.promptId} / ${tc.name}`);
    }
    const result = await runTestCase(tc);
    results.push(result);
  }
  
  // Output results
  if (junitOnly) {
    console.log(generateJUnitXML(results));
  } else {
    printSummary(results);
    console.log('\nJUnit XML Output:');
    console.log(generateJUnitXML(results));
  }
  
  // Write to file if requested
  if (outputFile) {
    fs.writeFileSync(outputFile, generateJUnitXML(results));
    console.log(`\nJUnit XML written to: ${outputFile}`);
  }
  
  // Exit with appropriate code
  const failed = results.filter(r => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { runTestCase, fuzzyMatch, renderPrompt, loadExternalTestCases, loadEmbeddedTestCases };
