#!/usr/bin/env node
/**
 * PromptOS Semantic Diff
 * 
 * Compares two PromptSpec YAML files and returns MAJOR | MINOR | PATCH recommendation.
 * 
 * Rules:
 *   MAJOR: role changed, outputs.schema changed, breaking input changes (required input removed/type changed)
 *   MINOR: new examples, new optional inputs, instructions changed, prompt text changed
 *   PATCH: metadata only (description, tags, version bump, author, last_updated)
 * 
 * Usage: node promptdiff.js <file1.yaml> <file2.yaml>
 */
'use strict';

const fs = require('fs');
const path = require('path');

function loadYAML(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    const YAML = require('js-yaml');
    return YAML.load(content);
  } catch (_) {
    const YAML = require('yaml');
    return YAML.parse(content);
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Compare two PromptSpecs and return bump level + reasons.
 */
function diffSpecs(a, b) {
  const reasons = [];
  let level = 'PATCH'; // start at lowest

  const bump = (newLevel, reason) => {
    reasons.push(`[${newLevel}] ${reason}`);
    if (newLevel === 'MAJOR') level = 'MAJOR';
    else if (newLevel === 'MINOR' && level !== 'MAJOR') level = 'MINOR';
  };

  // ── MAJOR checks ──────────────────────────────────────────────────────────

  // Role changed
  if ((a.role || '') !== (b.role || '')) {
    bump('MAJOR', `role changed: "${a.role}" → "${b.role}"`);
  }

  // outputs.schema changed
  if (!deepEqual(a.outputs, b.outputs)) {
    bump('MAJOR', 'outputs changed (could break consumers)');
  }

  // Breaking input changes: required input removed or type changed
  const aInputs = (a.inputs || []).filter(i => i.required);
  const bInputs = (b.inputs || []).filter(i => i.required);

  for (const aIn of aInputs) {
    const bIn = bInputs.find(i => i.name === aIn.name);
    if (!bIn) {
      bump('MAJOR', `required input removed: '${aIn.name}'`);
    } else if (bIn.type && aIn.type && bIn.type !== aIn.type) {
      bump('MAJOR', `required input '${aIn.name}' type changed: ${aIn.type} → ${bIn.type}`);
    }
  }

  // ── MINOR checks ──────────────────────────────────────────────────────────

  // Prompt text changed
  if ((a.prompt || '') !== (b.prompt || '')) {
    bump('MINOR', 'prompt template changed');
  }

  // Instructions changed
  if (!deepEqual(a.instructions, b.instructions)) {
    bump('MINOR', 'instructions changed');
  }

  // New examples added
  const aExLen = (a.examples || []).length;
  const bExLen = (b.examples || []).length;
  if (bExLen > aExLen) {
    bump('MINOR', `${bExLen - aExLen} new example(s) added`);
  }

  // New optional inputs
  const aOptional = (a.inputs || []).filter(i => !i.required).map(i => i.name);
  const bOptional = (b.inputs || []).filter(i => !i.required).map(i => i.name);
  const newOptional = bOptional.filter(n => !aOptional.includes(n));
  if (newOptional.length > 0) {
    bump('MINOR', `new optional input(s): ${newOptional.join(', ')}`);
  }

  // ── PATCH checks ──────────────────────────────────────────────────────────

  const metadataFields = ['description', 'tags', 'author', 'last_updated', 'version', 'usage'];
  for (const f of metadataFields) {
    if (!deepEqual(a[f], b[f])) {
      reasons.push(`[PATCH] ${f} changed`);
    }
  }

  return { level, reasons };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node promptdiff.js <file1.yaml> <file2.yaml>');
    process.exit(1);
  }

  const [f1, f2] = args;

  if (!fs.existsSync(f1)) { console.error(`File not found: ${f1}`); process.exit(1); }
  if (!fs.existsSync(f2)) { console.error(`File not found: ${f2}`); process.exit(1); }

  const a = loadYAML(f1);
  const b = loadYAML(f2);

  const { level, reasons } = diffSpecs(a, b);

  console.log('\nPromptOS Semantic Diff');
  console.log('='.repeat(50));
  console.log(`  ${path.basename(f1)}  →  ${path.basename(f2)}`);
  console.log('='.repeat(50));
  console.log(`\nRecommended bump: ${level}\n`);
  if (reasons.length === 0) {
    console.log('  No significant changes detected.');
  } else {
    for (const r of reasons) {
      console.log('  ' + r);
    }
  }
  console.log('');
}

module.exports = { diffSpecs };

if (require.main === module) {
  main();
}
