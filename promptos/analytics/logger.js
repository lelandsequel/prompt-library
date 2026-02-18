/**
 * PromptOS Analytics Logger
 * Writes JSONL run events to .telemetry/promptos-usage.jsonl
 */
'use strict';

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');  // analytics/ → promptos/
const TELEMETRY_DIR = path.join(BASE_DIR, '.telemetry');
const LOG_FILE = path.join(TELEMETRY_DIR, 'promptos-usage.jsonl');

function ensureDir() {
  if (!fs.existsSync(TELEMETRY_DIR)) {
    fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
  }
}

/**
 * Log a single run event.
 * @param {Object} entry
 * @param {string} entry.ts        - ISO timestamp
 * @param {string} entry.prompt_id
 * @param {string} entry.version
 * @param {string} entry.user
 * @param {string} entry.role
 * @param {string} entry.model
 * @param {string} entry.channel
 * @param {string} entry.input_hash
 * @param {string} entry.output_hash
 * @param {boolean} entry.success
 * @param {number} entry.latency_ms
 */
function logRun(entry) {
  try {
    ensureDir();
    const line = JSON.stringify({
      ts: entry.ts || new Date().toISOString(),
      prompt_id: entry.prompt_id || 'unknown',
      version: entry.version || null,
      user: entry.user || 'anonymous',
      role: entry.role || null,
      model: entry.model || null,
      channel: entry.channel || 'cli',
      input_hash: entry.input_hash || null,
      output_hash: entry.output_hash || null,
      success: entry.success !== undefined ? entry.success : true,
      latency_ms: entry.latency_ms || 0,
      error: entry.error || null
    }) + '\n';
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {
    // Non-fatal — never crash the main flow
    console.warn(`[analytics] Failed to write log: ${e.message}`);
  }
}

/**
 * Read all logged entries
 */
function readAll() {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf8')
    .split('\n')
    .filter(l => l.trim());
  return lines.map(l => {
    try { return JSON.parse(l); } catch (_) { return null; }
  }).filter(Boolean);
}

module.exports = { logRun, readAll, LOG_FILE };
