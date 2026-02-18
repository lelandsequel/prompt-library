#!/usr/bin/env node
/**
 * PromptOS Analytics Report
 * Reads .telemetry/promptos-usage.jsonl and prints summary
 */
'use strict';

const { readAll } = require('./logger.js');

function report() {
  const entries = readAll();

  if (entries.length === 0) {
    console.log('No telemetry data found. Run some prompts first.');
    return;
  }

  const total = entries.length;
  const successes = entries.filter(e => e.success).length;
  const failures = total - successes;
  const successRate = ((successes / total) * 100).toFixed(1);

  const latencies = entries.filter(e => e.latency_ms > 0).map(e => e.latency_ms);
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;

  // Top prompts by run count
  const promptCounts = {};
  for (const e of entries) {
    promptCounts[e.prompt_id] = (promptCounts[e.prompt_id] || 0) + 1;
  }
  const topPrompts = Object.entries(promptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // By model
  const modelCounts = {};
  for (const e of entries) {
    if (e.model) modelCounts[e.model] = (modelCounts[e.model] || 0) + 1;
  }

  console.log('\n' + '='.repeat(60));
  console.log('PromptOS Analytics Report');
  console.log('='.repeat(60));
  console.log(`Total Runs:        ${total}`);
  console.log(`Successes:         ${successes}`);
  console.log(`Failures:          ${failures}`);
  console.log(`Success Rate:      ${successRate}%`);
  console.log(`Avg Latency:       ${avgLatency}ms`);
  console.log('');
  console.log('Top Prompts:');
  for (const [id, count] of topPrompts) {
    console.log(`  ${id.padEnd(30)} ${count} runs`);
  }
  console.log('');
  if (Object.keys(modelCounts).length > 0) {
    console.log('By Model:');
    for (const [model, count] of Object.entries(modelCounts).sort((a,b) => b[1]-a[1])) {
      console.log(`  ${(model || 'unknown').padEnd(30)} ${count} runs`);
    }
  }
  console.log('='.repeat(60));
}

function exportData(outputFile) {
  const entries = readAll();
  const json = JSON.stringify(entries, null, 2);
  if (outputFile) {
    require('fs').writeFileSync(outputFile, json, 'utf8');
    console.log(`Exported ${entries.length} entries to ${outputFile}`);
  } else {
    console.log(json);
  }
}

module.exports = { report, exportData };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === 'export') {
    exportData(args[1]);
  } else {
    report();
  }
}
