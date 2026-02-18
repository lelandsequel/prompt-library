#!/usr/bin/env node
/**
 * PromptOS CLI
 * 
 * Usage:
 *   promptos run <prompt_id> [--model x] [--user x] [--role x] [--dry-run] [key=value ...]
 *   promptos list [--tag x]
 *   promptos validate [prompt_id]
 *   promptos analytics report
 *   promptos analytics export [--output file.json]
 *   promptos pack list
 *   promptos pack install <pack.yaml>
 *   promptos pack uninstall <pack-name>
 *   promptos pack build <dir>
 *   promptos diff <file1.yaml> <file2.yaml>
 *   promptos server [--port 3001]
 */
'use strict';

const path = require('path');
const fs = require('fs');

const BASE_DIR = path.resolve(__dirname, '..');

// ─── Argument parsing ──────────────────────────────────────────────────────────
// Boolean flags that don't consume the next argument
const BOOL_FLAGS = new Set(['dry-run', 'dry_run', 'help', 'h', 'verbose', 'junit-only', 'changed-only', 'json']);

function parseArgs(argv) {
  const flags = {};
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      // Check for --key=value syntax
      if (key.includes('=')) {
        const [k, ...rest] = key.split('=');
        flags[k] = rest.join('=');
      } else if (BOOL_FLAGS.has(key)) {
        flags[key] = true;
      } else {
        const next = argv[i + 1];
        if (!next || next.startsWith('--') || next.includes('=')) {
          flags[key] = true;
        } else {
          flags[key] = next;
          i++;
        }
      }
    } else if (a.includes('=') && !a.startsWith('-')) {
      // key=value inputs
      const eqIdx = a.indexOf('=');
      const k = a.slice(0, eqIdx);
      const v = a.slice(eqIdx + 1);
      flags._inputs = flags._inputs || {};
      flags._inputs[k] = v;
    } else {
      positional.push(a);
    }
  }

  return { flags, positional };
}

// ─── Help ─────────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
PromptOS CLI v1.0.0

Usage:
  promptos <command> [args] [options]

Commands:
  run <prompt_id> [key=value ...]       Execute a prompt
    --model <model>                     Model to use (default: claude-sonnet-4-20250514)
    --user <username>                   Username for RBAC
    --role <role>                       Role for RBAC
    --dry-run                           Render prompt without calling model

  list [--tag <tag>]                    List all prompts (filter by tag)

  validate [prompt_id]                  Validate prompt(s) against policy

  analytics report                      Show analytics summary
  analytics export [--output file.json] Export analytics data

  pack list                             List installed packs
  pack install <pack.yaml>              Install a pack
  pack uninstall <pack-name>            Uninstall a pack
  pack build <dir>                      Build/validate a pack

  diff <file1.yaml> <file2.yaml>        Semantic diff between two prompts

  server [--port 3001]                  Start the registry server

Examples:
  promptos run codegen-v1 --dry-run language=Python requirements="hello world"
  promptos list --tag code-generation
  promptos validate codegen-v1
  promptos analytics report
  promptos pack install packs/example-pack/pack.yaml
  promptos diff prompts/codegen/codegen-v1.yaml prompts/codegen/codegen-v2.yaml
  promptos server --port 3001
`);
}

// ─── Commands ──────────────────────────────────────────────────────────────────

async function cmdRun(positional, flags) {
  const prompt_id = positional[0];
  if (!prompt_id) {
    console.error('Error: prompt_id required\nUsage: promptos run <prompt_id> [key=value ...] [options]');
    process.exit(1);
  }

  const inputs = flags._inputs || {};
  const options = {
    model: flags.model || null,
    user: flags.user || null,
    role: flags.role || null,
    dry_run: !!(flags['dry-run'] || flags['dry_run']),
    channel: 'cli'
  };

  const { execute } = require('../execute.js');

  try {
    const result = await execute(prompt_id, inputs, options);

    if (options.dry_run) {
      console.log('\n--- Rendered Prompt ---');
      console.log(result.rendered_prompt);
      console.log('\n--- Spec ---');
      console.log(JSON.stringify(result.spec, null, 2));
    } else {
      console.log('\n--- Output ---');
      console.log(result.output);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

function cmdList(positional, flags) {
  const regPath = path.join(BASE_DIR, 'registry', 'index.json');
  const registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  let prompts = registry.prompts || [];

  const tagFilter = flags.tag;

  if (tagFilter) {
    // Load each prompt YAML to check tags
    prompts = prompts.filter(p => {
      try {
        const yamlPath = path.join(BASE_DIR, p.file);
        const YAML = (() => { try { return require('js-yaml'); } catch (_) { return require('yaml'); } })();
        const spec = YAML.load ? YAML.load(fs.readFileSync(yamlPath, 'utf8')) : YAML.parse(fs.readFileSync(yamlPath, 'utf8'));
        return (spec.tags || []).includes(tagFilter);
      } catch (_) { return false; }
    });
  }

  if (prompts.length === 0) {
    console.log('No prompts found.');
    return;
  }

  console.log('\nAvailable Prompts:');
  console.log('─'.repeat(70));
  for (const p of prompts) {
    console.log(`  ${p.id.padEnd(28)} ${p.name.padEnd(28)} [${p.category}]`);
  }
  console.log(`\nTotal: ${prompts.length}`);
}

function cmdValidate(positional, flags) {
  const PolicyEngine = require('../policy/engine.js');
  const engine = new PolicyEngine(path.join(BASE_DIR, 'policy', 'rules.yaml'));

  const loadYAML = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    try { return require('js-yaml').load(content); }
    catch (_) { return require('yaml').parse(content); }
  };

  const prompt_id = positional[0];

  let filesToValidate = [];

  if (prompt_id) {
    const regPath = path.join(BASE_DIR, 'registry', 'index.json');
    const registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
    const entry = registry.prompts.find(p => p.id === prompt_id);
    if (!entry) {
      console.error(`Prompt not found: ${prompt_id}`);
      process.exit(1);
    }
    filesToValidate = [path.join(BASE_DIR, entry.file)];
  } else {
    // Validate all prompts
    const regPath = path.join(BASE_DIR, 'registry', 'index.json');
    const registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
    filesToValidate = registry.prompts.map(p => path.join(BASE_DIR, p.file));
  }

  let hasError = false;
  for (const f of filesToValidate) {
    const spec = loadYAML(f);
    const result = engine.validate(spec);
    const label = path.relative(BASE_DIR, f);
    if (result.passed && !result.hasWarnings) {
      console.log(`✓ ${label}`);
    } else {
      const formatted = engine.formatErrors(result);
      console.log(`${label}:\n${formatted}`);
      if (!result.passed) hasError = true;
    }
  }

  if (hasError) process.exit(1);
}

function cmdAnalytics(subcmd, positional, flags) {
  const { report, exportData } = require('../analytics/report.js');
  if (subcmd === 'report') {
    report();
  } else if (subcmd === 'export') {
    exportData(flags.output || null);
  } else {
    console.error(`Unknown analytics subcommand: ${subcmd}`);
    process.exit(1);
  }
}

function cmdPack(subcmd, positional, flags) {
  const manager = require('../packs/manager.js');
  if (subcmd === 'list') {
    manager.list();
  } else if (subcmd === 'install') {
    const packFile = positional[0];
    if (!packFile) { console.error('Usage: promptos pack install <pack.yaml>'); process.exit(1); }
    manager.install(packFile);
  } else if (subcmd === 'uninstall') {
    const name = positional[0];
    if (!name) { console.error('Usage: promptos pack uninstall <pack-name>'); process.exit(1); }
    manager.uninstall(name);
  } else if (subcmd === 'build') {
    const dir = positional[0];
    if (!dir) { console.error('Usage: promptos pack build <dir>'); process.exit(1); }
    manager.build(dir);
  } else {
    console.error(`Unknown pack subcommand: ${subcmd}`);
    process.exit(1);
  }
}

function cmdDiff(positional) {
  const [f1, f2] = positional;
  if (!f1 || !f2) {
    console.error('Usage: promptos diff <file1.yaml> <file2.yaml>');
    process.exit(1);
  }
  const { diffSpecs } = require('../diff/promptdiff.js');
  const loadYAML = (f) => {
    const content = fs.readFileSync(f, 'utf8');
    try { return require('js-yaml').load(content); }
    catch (_) { return require('yaml').parse(content); }
  };
  const a = loadYAML(f1), b = loadYAML(f2);
  const { level, reasons } = diffSpecs(a, b);
  console.log(`\nRecommended bump: ${level}`);
  for (const r of reasons) console.log('  ' + r);
}

function cmdServer(flags) {
  const portArg = flags.port ? `--port=${flags.port}` : '--port=3001';
  process.argv.push(portArg);
  require('../server/server.js');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { flags, positional } = parseArgs(process.argv.slice(2));

  if (positional.length === 0 || flags.help || flags.h) {
    printHelp();
    process.exit(0);
  }

  const cmd = positional[0];
  const rest = positional.slice(1);

  try {
    switch (cmd) {
      case 'run':
        await cmdRun(rest, flags);
        break;
      case 'list':
        cmdList(rest, flags);
        break;
      case 'validate':
        cmdValidate(rest, flags);
        break;
      case 'analytics': {
        const sub = rest[0];
        cmdAnalytics(sub, rest.slice(1), flags);
        break;
      }
      case 'pack': {
        const sub = rest[0];
        cmdPack(sub, rest.slice(1), flags);
        break;
      }
      case 'diff':
        cmdDiff(rest);
        break;
      case 'server':
        cmdServer(flags);
        break;
      default:
        console.error(`Unknown command: ${cmd}`);
        printHelp();
        process.exit(1);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
