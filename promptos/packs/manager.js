#!/usr/bin/env node
/**
 * PromptOS Pack Manager
 * Commands: build, install, uninstall, list
 * 
 * Usage:
 *   node manager.js build <pack-dir>
 *   node manager.js install <pack.yaml>
 *   node manager.js uninstall <pack-name>
 *   node manager.js list
 */
'use strict';

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const PROMPTS_DIR = path.join(BASE_DIR, 'prompts');
const REGISTRY_JSON = path.join(BASE_DIR, 'registry', 'index.json');
const INSTALLED_DB = path.join(BASE_DIR, '.telemetry', 'installed-packs.json');

function loadYAML(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  try { return require('js-yaml').load(content); }
  catch (_) { return require('yaml').parse(content); }
}

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_JSON, 'utf8'));
}

function saveRegistry(reg) {
  fs.writeFileSync(REGISTRY_JSON, JSON.stringify(reg, null, 2), 'utf8');
}

function loadInstalledDB() {
  if (!fs.existsSync(INSTALLED_DB)) return { packs: [] };
  try { return JSON.parse(fs.readFileSync(INSTALLED_DB, 'utf8')); }
  catch (_) { return { packs: [] }; }
}

function saveInstalledDB(db) {
  fs.mkdirSync(path.dirname(INSTALLED_DB), { recursive: true });
  fs.writeFileSync(INSTALLED_DB, JSON.stringify(db, null, 2), 'utf8');
}

/**
 * Install a pack from pack.yaml
 */
function install(packYamlPath) {
  const abs = path.resolve(packYamlPath);
  if (!fs.existsSync(abs)) throw new Error(`pack.yaml not found: ${abs}`);

  const pack = loadYAML(abs);
  const packDir = path.dirname(abs);

  console.log(`Installing pack: ${pack.name} v${pack.version}`);

  const reg = loadRegistry();
  const db = loadInstalledDB();

  const installedIds = [];

  for (const p of pack.prompts || []) {
    const srcFile = path.join(packDir, p.file);
    if (!fs.existsSync(srcFile)) {
      console.warn(`  Warning: prompt file not found: ${srcFile}`);
      continue;
    }

    // Determine destination category dir
    const cat = p.category || 'packs';
    const destDir = path.join(PROMPTS_DIR, cat);
    fs.mkdirSync(destDir, { recursive: true });

    const destFile = path.join(destDir, path.basename(p.file));
    fs.copyFileSync(srcFile, destFile);

    // Register in index.json
    const existing = reg.prompts.find(r => r.id === p.id);
    if (!existing) {
      reg.prompts.push({
        id: p.id,
        name: p.id,
        category: cat,
        version: pack.version,
        file: `prompts/${cat}/${path.basename(p.file)}`,
        pack: pack.name
      });
    }

    installedIds.push(p.id);
    console.log(`  ✓ Installed: ${p.id} → prompts/${cat}/${path.basename(p.file)}`);
  }

  saveRegistry(reg);

  // Track installation
  db.packs = db.packs.filter(p => p.name !== pack.name);
  db.packs.push({
    name: pack.name,
    version: pack.version,
    installed_at: new Date().toISOString(),
    prompt_ids: installedIds
  });
  saveInstalledDB(db);

  console.log(`\nPack '${pack.name}' installed successfully.`);
}

/**
 * Uninstall a pack by name
 */
function uninstall(packName) {
  const db = loadInstalledDB();
  const pack = db.packs.find(p => p.name === packName);
  if (!pack) throw new Error(`Pack '${packName}' is not installed`);

  const reg = loadRegistry();

  for (const pid of pack.prompt_ids || []) {
    const entry = reg.prompts.find(p => p.id === pid);
    if (entry) {
      // Remove file
      const filePath = path.join(BASE_DIR, entry.file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`  ✓ Removed: ${entry.file}`);
      }
      reg.prompts = reg.prompts.filter(p => p.id !== pid);
    }
  }

  saveRegistry(reg);
  db.packs = db.packs.filter(p => p.name !== packName);
  saveInstalledDB(db);

  console.log(`Pack '${packName}' uninstalled.`);
}

/**
 * List installed packs
 */
function list() {
  const db = loadInstalledDB();
  if (db.packs.length === 0) {
    console.log('No packs installed.');
    return;
  }
  console.log('\nInstalled Packs:');
  console.log('─'.repeat(50));
  for (const p of db.packs) {
    console.log(`  ${p.name.padEnd(25)} v${p.version}  [${p.prompt_ids.length} prompts]`);
    console.log(`  Installed: ${p.installed_at}`);
    console.log('');
  }
}

/**
 * Build / validate a pack directory and create stub tar
 */
function build(packDir) {
  const abs = path.resolve(packDir);
  const packYaml = path.join(abs, 'pack.yaml');
  if (!fs.existsSync(packYaml)) throw new Error(`pack.yaml not found in ${abs}`);

  const pack = loadYAML(packYaml);
  let errors = 0;

  console.log(`Building pack: ${pack.name} v${pack.version}`);
  console.log(`Description: ${pack.description}`);
  console.log(`Prompts: ${(pack.prompts || []).length}`);

  for (const p of pack.prompts || []) {
    const pFile = path.join(abs, p.file);
    if (!fs.existsSync(pFile)) {
      console.error(`  ✗ Missing: ${p.file}`);
      errors++;
    } else {
      console.log(`  ✓ Found: ${p.file}`);
    }
  }

  if (errors > 0) {
    throw new Error(`Pack validation failed: ${errors} file(s) missing`);
  }

  // Write stub .tar.gz manifest (real tar would need child_process)
  const outFile = path.join(path.dirname(abs), `${pack.name}-${pack.version}.tar.gz.stub`);
  fs.writeFileSync(outFile, JSON.stringify({ pack, built_at: new Date().toISOString() }, null, 2));
  console.log(`\nPack artifact: ${outFile}`);
  console.log('(Install with: node manager.js install pack.yaml)');
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === 'install') install(arg);
    else if (cmd === 'uninstall') uninstall(arg);
    else if (cmd === 'list') list();
    else if (cmd === 'build') build(arg);
    else {
      console.log('Usage: node manager.js <build|install|uninstall|list> [arg]');
      process.exit(1);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

module.exports = { install, uninstall, list, build };
