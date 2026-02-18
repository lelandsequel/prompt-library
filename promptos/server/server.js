#!/usr/bin/env node
/**
 * PromptOS Registry Server
 * 
 * GET  /registry/index.json  → serve registry
 * GET  /prompts/:id          → serve prompt YAML
 * POST /eval                 → run eval (calls execute())
 * POST /usage               → log usage event
 * 
 * Start: node server.js [--port 3001]
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const BASE_DIR = path.resolve(__dirname, '..');
const REGISTRY_JSON = path.join(BASE_DIR, 'registry', 'index.json');

// ─── Route handler ─────────────────────────────────────────────────────────────
async function handleRequest(req, res) {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method.toUpperCase();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // GET /registry/index.json
    if (method === 'GET' && pathname === '/registry/index.json') {
      const content = fs.readFileSync(REGISTRY_JSON, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(content);
      return;
    }

    // GET /prompts/:id
    const promptMatch = pathname.match(/^\/prompts\/([^/]+)$/);
    if (method === 'GET' && promptMatch) {
      const promptId = promptMatch[1];
      const registry = JSON.parse(fs.readFileSync(REGISTRY_JSON, 'utf8'));
      const entry = (registry.prompts || []).find(p => p.id === promptId);

      if (!entry) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Prompt '${promptId}' not found` }));
        return;
      }

      const yamlPath = path.join(BASE_DIR, entry.file);
      if (!fs.existsSync(yamlPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Prompt file not found` }));
        return;
      }

      const content = fs.readFileSync(yamlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/yaml' });
      res.end(content);
      return;
    }

    // POST /eval
    if (method === 'POST' && pathname === '/eval') {
      const body = await readBody(req);
      const { prompt_id, inputs, options } = JSON.parse(body);

      if (!prompt_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'prompt_id required' }));
        return;
      }

      const { execute } = require('../execute.js');
      const result = await execute(prompt_id, inputs || {}, options || { dry_run: true });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
      return;
    }

    // POST /usage
    if (method === 'POST' && pathname === '/usage') {
      const body = await readBody(req);
      const event = JSON.parse(body);

      const { logRun } = require('../analytics/logger.js');
      logRun(event);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // GET /health
    if (method === 'GET' && pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', ts: new Date().toISOString() }));
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', path: pathname }));

  } catch (err) {
    console.error('[server]', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ─── Start server ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const portArg = args.find(a => a.startsWith('--port'));
const PORT = portArg ? parseInt(portArg.split('=')[1] || args[args.indexOf(portArg) + 1]) : 3001;

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`PromptOS Registry Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  http://localhost:${PORT}/registry/index.json`);
  console.log(`  GET  http://localhost:${PORT}/prompts/:id`);
  console.log(`  POST http://localhost:${PORT}/eval          { prompt_id, inputs, options }`);
  console.log(`  POST http://localhost:${PORT}/usage         { ts, prompt_id, ... }`);
  console.log(`  GET  http://localhost:${PORT}/health`);
});

module.exports = { server };
