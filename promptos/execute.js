#!/usr/bin/env node
/**
 * PromptOS Unified Execution Engine
 * 
 * execute(prompt_id, inputs, options) — the single point of truth for all prompt runs.
 * Options: { model, user, role, dry_run, channel }
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Paths ───────────────────────────────────────────────────────────────────
const BASE_DIR = path.resolve(__dirname);
const REGISTRY_JSON = path.join(BASE_DIR, 'registry', 'index.json');

// ─── Lazy-load engines (CommonJS) ────────────────────────────────────────────
function getRbacEngine() {
  return require('./rbac/engine.js');
}

function getPolicyEngine() {
  const PolicyEngine = require('./policy/engine.js');
  return new PolicyEngine(path.join(BASE_DIR, 'policy', 'rules.yaml'));
}

// ─── Registry ─────────────────────────────────────────────────────────────────
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_JSON)) {
    throw new Error(`Registry not found at ${REGISTRY_JSON}`);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_JSON, 'utf8'));
}

function loadPromptSpec(prompt_id) {
  const registry = loadRegistry();
  const entry = (registry.prompts || []).find(p => p.id === prompt_id);
  if (!entry) throw new Error(`Prompt '${prompt_id}' not found in registry`);

  const yamlPath = path.join(BASE_DIR, entry.file);
  if (!fs.existsSync(yamlPath)) throw new Error(`Prompt file not found: ${yamlPath}`);

  // Use js-yaml if available, else fallback to manual parse
  try {
    const YAML = require('js-yaml');
    return YAML.load(fs.readFileSync(yamlPath, 'utf8'));
  } catch (_) {
    // Try yaml package
    const YAML = require('yaml');
    return YAML.parse(fs.readFileSync(yamlPath, 'utf8'));
  }
}

// ─── Redaction ────────────────────────────────────────────────────────────────
function redactInputs(inputs) {
  const redacted = {};
  for (const [k, v] of Object.entries(inputs)) {
    if (/pii|secret|password/i.test(k)) {
      redacted[k] = '[REDACTED]';
    } else if (typeof v === 'string' && /pii|secret|password/i.test(v)) {
      redacted[k] = '[REDACTED]';
    } else {
      redacted[k] = v;
    }
  }
  return redacted;
}

// ─── Template rendering ───────────────────────────────────────────────────────
function renderPrompt(template, inputs) {
  let result = template;

  // {{#if var}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
    return inputs[varName] ? content : '';
  });

  // {{var}}
  for (const [k, v] of Object.entries(inputs)) {
    result = result.split(`{{${k}}}`).join(String(v ?? ''));
  }

  return result;
}

// ─── Output schema validation ─────────────────────────────────────────────────
function validateOutputSchema(output, schema) {
  // schema format: { properties: { field: { type: "string", required: true }, ... } }
  if (!schema || !schema.properties) return { valid: true };

  const errors = [];
  let parsed;

  // Try parsing output as JSON if it's a string
  if (typeof output === 'string') {
    try {
      parsed = JSON.parse(output);
    } catch (_) {
      // Output is plain text, extract JSON if embedded
      const jsonMatch = output.match(/\{[\s\S]+\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (_2) {
          // Can't parse, skip schema validation
          return { valid: true };
        }
      } else {
        return { valid: true }; // plain text output, no JSON to validate
      }
    }
  } else {
    parsed = output;
  }

  for (const [field, def] of Object.entries(schema.properties)) {
    if (def.required && (parsed[field] === undefined || parsed[field] === null)) {
      errors.push(`Missing required output field: '${field}'`);
      continue;
    }
    if (parsed[field] !== undefined && def.type) {
      const actualType = Array.isArray(parsed[field]) ? 'array' : typeof parsed[field];
      if (actualType !== def.type) {
        errors.push(`Output field '${field}' expected type '${def.type}' but got '${actualType}'`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── RBAC check ───────────────────────────────────────────────────────────────
function checkRbac(user, role) {
  if (!user && !role) return; // anonymous allowed (dev mode)

  const rbac = getRbacEngine();

  if (user) {
    const res = rbac.checkUserPermission(user, 'eval');
    if (!res.allowed) {
      throw new Error(`RBAC denied: ${res.reason}`);
    }
  } else if (role) {
    const res = rbac.hasPermission(role, 'eval');
    if (!res.allowed) {
      throw new Error(`RBAC denied: ${res.reason}`);
    }
  }
}

// ─── Policy check ─────────────────────────────────────────────────────────────
function checkPolicy(spec, model) {
  const engine = getPolicyEngine();
  const result = engine.validate(spec);

  if (!result.passed) {
    const msgs = result.errors
      .filter(e => e.severity === 'error')
      .map(e => e.message)
      .join('; ');
    throw new Error(`Policy violation: ${msgs}`);
  }

  // Model allowlist (from spec metadata if present)
  const allowedModels = spec.model_compatibility || [];
  if (model && allowedModels.length > 0) {
    const modelOk = allowedModels.some(m =>
      model.toLowerCase().includes(m.toLowerCase()) ||
      m.toLowerCase().includes(model.toLowerCase())
    );
    if (!modelOk) {
      console.warn(`[PromptOS] Warning: model '${model}' not in allowed_models list for ${spec.id}`);
    }
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function logAnalytics(entry) {
  try {
    const loggerPath = path.join(BASE_DIR, 'analytics', 'logger.js');
    if (fs.existsSync(loggerPath)) {
      const { logRun } = require('./analytics/logger.js');
      logRun(entry);
    }
  } catch (e) {
    // Non-fatal
  }
}

// ─── Core execute function ────────────────────────────────────────────────────
async function execute(prompt_id, inputs = {}, options = {}) {
  const {
    model = null,
    user = null,
    role = null,
    dry_run = false,
    channel = 'api'
  } = options;

  const startTs = Date.now();
  let success = false;
  let outputText = null;

  try {
    // 1. Load PromptSpec from registry
    const spec = loadPromptSpec(prompt_id);

    // 2. RBAC check
    checkRbac(user, role);

    // 3. Policy check
    checkPolicy(spec, model);

    // 4. Redact inputs
    const safeInputs = redactInputs(inputs);

    // 5. Render prompt
    const template = spec.prompt || '';
    const rendered = renderPrompt(template, safeInputs);

    // 6. Dry run — return rendered prompt, skip model call
    if (dry_run) {
      success = true;
      const result = {
        prompt_id,
        dry_run: true,
        rendered_prompt: rendered,
        spec: {
          id: spec.id,
          name: spec.name,
          version: spec.version,
          role: spec.role
        }
      };
      logAnalytics({
        ts: new Date().toISOString(),
        prompt_id,
        version: spec.version,
        user,
        role,
        model,
        channel,
        input_hash: hashObject(safeInputs),
        output_hash: null,
        success: true,
        latency_ms: Date.now() - startTs
      });
      return result;
    }

    // 7. Call model adapter
    const adapters = require('./adapters/index.js');
    const effectiveModel = model || 'claude-sonnet-4-20250514';
    outputText = await adapters.generate(rendered, effectiveModel, {});

    // 8. Output schema validation
    const outputSchema = spec.outputs && Array.isArray(spec.outputs)
      ? null  // array format doesn't define schema
      : (spec.outputs && spec.outputs.schema ? spec.outputs.schema : null);

    if (outputSchema) {
      const valResult = validateOutputSchema(outputText, outputSchema);
      if (!valResult.valid) {
        throw new Error(`Output validation failed: ${valResult.errors.join('; ')}`);
      }
    }

    success = true;

    // 9. Log to analytics
    logAnalytics({
      ts: new Date().toISOString(),
      prompt_id,
      version: spec.version,
      user,
      role,
      model: effectiveModel,
      channel,
      input_hash: hashObject(safeInputs),
      output_hash: hashObject(outputText),
      success: true,
      latency_ms: Date.now() - startTs
    });

    return {
      prompt_id,
      dry_run: false,
      rendered_prompt: rendered,
      output: outputText,
      model: effectiveModel,
      spec: {
        id: spec.id,
        name: spec.name,
        version: spec.version
      }
    };

  } catch (err) {
    logAnalytics({
      ts: new Date().toISOString(),
      prompt_id,
      version: null,
      user,
      role,
      model,
      channel,
      input_hash: hashObject(inputs),
      output_hash: null,
      success: false,
      latency_ms: Date.now() - startTs,
      error: err.message
    });
    throw err;
  }
}

function hashObject(obj) {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

module.exports = { execute, renderPrompt, redactInputs, validateOutputSchema, loadPromptSpec, loadRegistry };
