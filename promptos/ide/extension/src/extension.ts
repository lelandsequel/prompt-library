import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as crypto from 'crypto';

// ============================================
// Types
// ============================================

interface PromptMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author?: string;
  tags?: string[];
  inputs?: InputDefinition[];
  outputs?: OutputDefinition[];
  role?: string;
  file: string;
  prompt?: string;
}

interface InputDefinition {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface OutputDefinition {
  name: string;
  type: string;
  description?: string;
}

interface RegistryPrompt {
  id: string;
  name: string;
  category: string;
  version: string;
  file: string;
}

// ============================================
// Output Channel
// ============================================

let outputChannel: vscode.OutputChannel;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('PromptOS');
  }
  return outputChannel;
}

function log(msg: string): void {
  getOutputChannel().appendLine(`[${new Date().toISOString()}] ${msg}`);
}

// ============================================
// Configuration
// ============================================

function getConfig() {
  const config = vscode.workspace.getConfiguration('promptos');
  return {
    registryPath: config.get<string>('registryPath', './promptos/registry/index.json'),
    insertMode: config.get<string>('insertMode', 'insert') as 'clipboard' | 'insert' | 'both',
    model: config.get<string>('model', 'claude-sonnet-4-20250514'),
    user: config.get<string>('user', ''),
    role: config.get<string>('role', ''),
  };
}

function getWorkspaceRoot(): string | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;
  return folders[0].uri.fsPath;
}

// ============================================
// Registry Loading
// ============================================

let _registryCache: RegistryPrompt[] | null = null;
let _promptCache: Map<string, PromptMetadata> = new Map();

function clearCache(): void {
  _registryCache = null;
  _promptCache.clear();
}

function loadRegistry(): RegistryPrompt[] {
  if (_registryCache) return _registryCache;

  const wsRoot = getWorkspaceRoot();
  if (!wsRoot) return [];

  const cfg = getConfig();
  const registryPath = path.isAbsolute(cfg.registryPath)
    ? cfg.registryPath
    : path.join(wsRoot, cfg.registryPath);

  try {
    const content = fs.readFileSync(registryPath, 'utf-8');
    const reg = JSON.parse(content);
    _registryCache = reg.prompts || [];
    log(`Registry loaded: ${_registryCache!.length} prompts from ${registryPath}`);
    return _registryCache!;
  } catch (e) {
    log(`Failed to load registry from ${registryPath}: ${e}`);
    return [];
  }
}

function loadPromptSpec(regEntry: RegistryPrompt): PromptMetadata | null {
  const cached = _promptCache.get(regEntry.id);
  if (cached) return cached;

  const wsRoot = getWorkspaceRoot();
  if (!wsRoot) return null;

  // Registry path is relative to promptos base dir (one level up from registry/)
  const baseDir = path.dirname(path.dirname(path.join(wsRoot, getConfig().registryPath)));
  const filePath = path.join(baseDir, regEntry.file);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const spec = yaml.load(content) as Record<string, unknown>;

    const meta: PromptMetadata = {
      id: spec.id as string || regEntry.id,
      name: spec.name as string || regEntry.name,
      description: spec.description as string || '',
      category: spec.category as string || regEntry.category,
      version: spec.version as string || regEntry.version,
      author: spec.author as string | undefined,
      tags: spec.tags as string[] | undefined,
      inputs: spec.inputs as InputDefinition[] | undefined,
      outputs: spec.outputs as OutputDefinition[] | undefined,
      role: spec.role as string | undefined,
      file: regEntry.file,
      prompt: spec.prompt as string | undefined
    };

    _promptCache.set(regEntry.id, meta);
    return meta;
  } catch (e) {
    log(`Failed to load prompt ${regEntry.id}: ${e}`);
    return null;
  }
}

function loadAllPrompts(): PromptMetadata[] {
  const registry = loadRegistry();
  const prompts: PromptMetadata[] = [];
  for (const entry of registry) {
    const spec = loadPromptSpec(entry);
    if (spec) prompts.push(spec);
  }
  return prompts;
}

// ============================================
// Template Rendering
// ============================================

function renderPrompt(template: string, inputs: Record<string, string>): string {
  let result = template;

  // {{#if var}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
    return inputs[varName] ? content : '';
  });

  // {{var}}
  for (const [k, v] of Object.entries(inputs)) {
    result = result.split(`{{${k}}}`).join(v);
  }

  return result;
}

// ============================================
// Input Collection
// ============================================

async function collectInputs(prompt: PromptMetadata): Promise<Record<string, string> | null> {
  const inputs = prompt.inputs || [];
  const values: Record<string, string> = {};

  for (const inp of inputs) {
    if (!inp.required && !inp.name) continue;

    let value: string | undefined;

    if (inp.type === 'select' && inp.options && inp.options.length > 0) {
      value = await vscode.window.showQuickPick(inp.options, {
        placeHolder: inp.placeholder || `Select ${inp.label}`,
        title: `PromptOS: ${prompt.name} — ${inp.label}`
      });
    } else {
      value = await vscode.window.showInputBox({
        prompt: `${inp.label}${inp.required ? ' *' : ' (optional)'}`,
        placeHolder: inp.placeholder || '',
        title: `PromptOS: ${prompt.name}`
      });
    }

    if (value === undefined) {
      // User cancelled
      return null;
    }

    if (value !== '') {
      values[inp.name] = value;
    }
  }

  return values;
}

// ============================================
// Output Delivery
// ============================================

async function deliverOutput(text: string, mode: 'clipboard' | 'insert' | 'both'): Promise<void> {
  if (mode === 'clipboard' || mode === 'both') {
    await vscode.env.clipboard.writeText(text);
    log('Copied to clipboard');
  }

  if (mode === 'insert' || mode === 'both') {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.start, text);
      });
      log('Inserted into editor');
    } else {
      // Open new document
      const doc = await vscode.workspace.openTextDocument({ content: text, language: 'markdown' });
      await vscode.window.showTextDocument(doc);
      log('Opened in new document');
    }
  }
}

// ============================================
// Inline execute() logic (no Python, no child_process)
// ============================================

function hashStr(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
}

async function executeInline(
  prompt: PromptMetadata,
  inputs: Record<string, string>,
  cfg: ReturnType<typeof getConfig>
): Promise<string> {
  if (!prompt.prompt) throw new Error('Prompt has no template');

  const rendered = renderPrompt(prompt.prompt, inputs);

  // Log analytics (fire-and-forget)
  const logUsage = () => {
    try {
      const wsRoot = getWorkspaceRoot();
      if (!wsRoot) return;
      const baseDir = path.dirname(path.dirname(path.join(wsRoot, cfg.registryPath)));
      const telDir = path.join(baseDir, '.telemetry');
      if (!fs.existsSync(telDir)) fs.mkdirSync(telDir, { recursive: true });
      const logFile = path.join(telDir, 'promptos-usage.jsonl');
      const entry = JSON.stringify({
        ts: new Date().toISOString(),
        prompt_id: prompt.id,
        version: prompt.version,
        user: cfg.user || 'vscode-user',
        role: cfg.role || null,
        model: cfg.model,
        channel: 'ide',
        input_hash: hashStr(JSON.stringify(inputs)),
        output_hash: null,
        success: true,
        latency_ms: 0
      });
      fs.appendFileSync(logFile, entry + '\n', 'utf-8');
    } catch (_) { /* non-fatal */ }
  };

  logUsage();
  return rendered; // IDE extension returns rendered prompt (dry-run by default)
}

// ============================================
// Commands
// ============================================

async function cmdInsertPrompt(): Promise<void> {
  const prompts = loadAllPrompts();
  const cfg = getConfig();

  if (prompts.length === 0) {
    vscode.window.showWarningMessage('PromptOS: No prompts found. Check your registryPath setting.');
    return;
  }

  // QuickPick
  const items = prompts.map(p => ({
    label: p.name,
    description: `${p.id} • ${p.category}`,
    detail: p.description,
    prompt: p
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Search prompts...',
    matchOnDescription: true,
    matchOnDetail: true,
    title: 'PromptOS: Select a Prompt'
  });

  if (!selected) return;

  const prompt = selected.prompt;
  log(`Selected: ${prompt.id}`);

  // Collect inputs
  const inputs = await collectInputs(prompt);
  if (inputs === null) {
    log('User cancelled input collection');
    return;
  }

  // Execute (inline)
  try {
    const output = await executeInline(prompt, inputs, cfg);
    await deliverOutput(output, cfg.insertMode);
    vscode.window.setStatusBarMessage(`PromptOS: ${prompt.name} inserted`, 3000);
    log(`Prompt ${prompt.id} executed and delivered (mode: ${cfg.insertMode})`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    vscode.window.showErrorMessage(`PromptOS Error: ${msg}`);
    log(`Error: ${msg}`);
  }
}

async function cmdListPrompts(): Promise<void> {
  const prompts = loadAllPrompts();

  if (prompts.length === 0) {
    vscode.window.showWarningMessage('PromptOS: No prompts found.');
    return;
  }

  const items = prompts.map(p => ({
    label: p.name,
    description: p.id,
    detail: `${p.description} | v${p.version} | ${p.category}`,
    prompt: p
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Browse available prompts',
    matchOnDescription: true,
    matchOnDetail: true,
    title: 'PromptOS: All Prompts'
  });

  if (!selected) return;

  const p = selected.prompt;
  const details = [
    `**${p.name}** (\`${p.id}\`)`,
    `v${p.version} · ${p.category}`,
    ``,
    p.description,
    p.role ? `\n**Role:** ${p.role}` : '',
    p.tags ? `\n**Tags:** ${p.tags.join(', ')}` : '',
    p.inputs ? `\n**Inputs:** ${p.inputs.map(i => `${i.name}${i.required ? '*' : ''}`).join(', ')}` : ''
  ].filter(s => s !== undefined).join('\n');

  await vscode.window.showInformationMessage(details, { modal: true }, 'Insert').then(async action => {
    if (action === 'Insert') {
      await cmdInsertPrompt();
    }
  });
}

function cmdRefreshCache(): void {
  clearCache();
  vscode.window.showInformationMessage('PromptOS: Cache refreshed.');
  log('Cache cleared');
}

// ============================================
// Hover Provider
// ============================================

class PromptHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
    const line = document.lineAt(position.line).text;
    const match = line.match(/@([a-z0-9-]+)/i);
    if (!match) return null;

    const prompts = loadAllPrompts();
    const prompt = prompts.find(p => p.id === match[1]);
    if (!prompt) return null;

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${prompt.name}** \`${prompt.id}\`\n\n`);
    md.appendMarkdown(`${prompt.description}\n\n`);
    md.appendMarkdown(`*v${prompt.version} · ${prompt.category}*`);
    if (prompt.role) md.appendMarkdown(`\n\n**Role:** ${prompt.role}`);

    return new vscode.Hover(md);
  }
}

// ============================================
// Completion Provider
// ============================================

class PromptCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
    const line = document.lineAt(position.line).text.slice(0, position.character);
    if (!line.includes('@') && !line.toLowerCase().includes('prompt')) return [];

    const prompts = loadAllPrompts();
    return prompts.map(p => {
      const item = new vscode.CompletionItem(p.id, vscode.CompletionItemKind.Reference);
      item.detail = p.name;
      item.documentation = new vscode.MarkdownString(`**${p.name}**\n\n${p.description}`);
      item.insertText = p.id;
      return item;
    });
  }
}

// ============================================
// Extension Lifecycle
// ============================================

export function activate(context: vscode.ExtensionContext): void {
  log('PromptOS extension activating...');

  // Update package.json settings contribution if needed
  const cfg = getConfig();

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('promptos.insertPrompt', cmdInsertPrompt),
    vscode.commands.registerCommand('promptos.listPrompts', cmdListPrompts),
    vscode.commands.registerCommand('promptos.refreshPrompts', cmdRefreshCache),
    vscode.commands.registerCommand('promptos.loadPrompt', async () => {
      const id = await vscode.window.showInputBox({ prompt: 'Enter prompt ID', placeHolder: 'e.g., codegen-v1' });
      if (!id) return;
      const wsRoot = getWorkspaceRoot();
      if (!wsRoot) return;
      const regPath = cfg.registryPath;
      const baseDir = path.dirname(path.dirname(path.join(wsRoot, regPath)));
      const registry = loadRegistry();
      const entry = registry.find(p => p.id === id);
      if (!entry) { vscode.window.showErrorMessage(`Prompt '${id}' not found`); return; }
      const filePath = path.join(baseDir, entry.file);
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    })
  );

  // Providers
  const langs = ['markdown', 'yaml', 'plaintext', 'javascript', 'typescript'];
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(langs, new PromptHoverProvider()),
    vscode.languages.registerCompletionItemProvider(langs, new PromptCompletionProvider(), '@')
  );

  log('PromptOS extension activated.');
  vscode.window.setStatusBarMessage('PromptOS ready', 2000);
}

export function deactivate(): void {
  log('PromptOS deactivated');
  if (outputChannel) outputChannel.dispose();
}
