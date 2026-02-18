"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const yaml = __importStar(require("js-yaml"));
const crypto = __importStar(require("crypto"));
// ============================================
// Output Channel
// ============================================
let outputChannel;
function getOutputChannel() {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('PromptOS');
    }
    return outputChannel;
}
function log(msg) {
    getOutputChannel().appendLine(`[${new Date().toISOString()}] ${msg}`);
}
// ============================================
// Configuration
// ============================================
function getConfig() {
    const config = vscode.workspace.getConfiguration('promptos');
    return {
        registryPath: config.get('registryPath', './promptos/registry/index.json'),
        insertMode: config.get('insertMode', 'insert'),
        model: config.get('model', 'claude-sonnet-4-20250514'),
        user: config.get('user', ''),
        role: config.get('role', ''),
    };
}
function getWorkspaceRoot() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0)
        return null;
    return folders[0].uri.fsPath;
}
// ============================================
// Registry Loading
// ============================================
let _registryCache = null;
let _promptCache = new Map();
function clearCache() {
    _registryCache = null;
    _promptCache.clear();
}
function loadRegistry() {
    if (_registryCache)
        return _registryCache;
    const wsRoot = getWorkspaceRoot();
    if (!wsRoot)
        return [];
    const cfg = getConfig();
    const registryPath = path.isAbsolute(cfg.registryPath)
        ? cfg.registryPath
        : path.join(wsRoot, cfg.registryPath);
    try {
        const content = fs.readFileSync(registryPath, 'utf-8');
        const reg = JSON.parse(content);
        _registryCache = reg.prompts || [];
        log(`Registry loaded: ${_registryCache.length} prompts from ${registryPath}`);
        return _registryCache;
    }
    catch (e) {
        log(`Failed to load registry from ${registryPath}: ${e}`);
        return [];
    }
}
function loadPromptSpec(regEntry) {
    const cached = _promptCache.get(regEntry.id);
    if (cached)
        return cached;
    const wsRoot = getWorkspaceRoot();
    if (!wsRoot)
        return null;
    // Registry path is relative to promptos base dir (one level up from registry/)
    const baseDir = path.dirname(path.dirname(path.join(wsRoot, getConfig().registryPath)));
    const filePath = path.join(baseDir, regEntry.file);
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const spec = yaml.load(content);
        const meta = {
            id: spec.id || regEntry.id,
            name: spec.name || regEntry.name,
            description: spec.description || '',
            category: spec.category || regEntry.category,
            version: spec.version || regEntry.version,
            author: spec.author,
            tags: spec.tags,
            inputs: spec.inputs,
            outputs: spec.outputs,
            role: spec.role,
            file: regEntry.file,
            prompt: spec.prompt
        };
        _promptCache.set(regEntry.id, meta);
        return meta;
    }
    catch (e) {
        log(`Failed to load prompt ${regEntry.id}: ${e}`);
        return null;
    }
}
function loadAllPrompts() {
    const registry = loadRegistry();
    const prompts = [];
    for (const entry of registry) {
        const spec = loadPromptSpec(entry);
        if (spec)
            prompts.push(spec);
    }
    return prompts;
}
// ============================================
// Template Rendering
// ============================================
function renderPrompt(template, inputs) {
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
async function collectInputs(prompt) {
    const inputs = prompt.inputs || [];
    const values = {};
    for (const inp of inputs) {
        if (!inp.required && !inp.name)
            continue;
        let value;
        if (inp.type === 'select' && inp.options && inp.options.length > 0) {
            value = await vscode.window.showQuickPick(inp.options, {
                placeHolder: inp.placeholder || `Select ${inp.label}`,
                title: `PromptOS: ${prompt.name} — ${inp.label}`
            });
        }
        else {
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
async function deliverOutput(text, mode) {
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
        }
        else {
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
function hashStr(s) {
    return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
}
async function executeInline(prompt, inputs, cfg) {
    if (!prompt.prompt)
        throw new Error('Prompt has no template');
    const rendered = renderPrompt(prompt.prompt, inputs);
    // Log analytics (fire-and-forget)
    const logUsage = () => {
        try {
            const wsRoot = getWorkspaceRoot();
            if (!wsRoot)
                return;
            const baseDir = path.dirname(path.dirname(path.join(wsRoot, cfg.registryPath)));
            const telDir = path.join(baseDir, '.telemetry');
            if (!fs.existsSync(telDir))
                fs.mkdirSync(telDir, { recursive: true });
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
        }
        catch (_) { /* non-fatal */ }
    };
    logUsage();
    return rendered; // IDE extension returns rendered prompt (dry-run by default)
}
// ============================================
// Commands
// ============================================
async function cmdInsertPrompt() {
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
    if (!selected)
        return;
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
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        vscode.window.showErrorMessage(`PromptOS Error: ${msg}`);
        log(`Error: ${msg}`);
    }
}
async function cmdListPrompts() {
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
    if (!selected)
        return;
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
    await vscode.window.showInformationMessage(details, { modal: true }, 'Insert').then(async (action) => {
        if (action === 'Insert') {
            await cmdInsertPrompt();
        }
    });
}
function cmdRefreshCache() {
    clearCache();
    vscode.window.showInformationMessage('PromptOS: Cache refreshed.');
    log('Cache cleared');
}
// ============================================
// Hover Provider
// ============================================
class PromptHoverProvider {
    provideHover(document, position) {
        const line = document.lineAt(position.line).text;
        const match = line.match(/@([a-z0-9-]+)/i);
        if (!match)
            return null;
        const prompts = loadAllPrompts();
        const prompt = prompts.find(p => p.id === match[1]);
        if (!prompt)
            return null;
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**${prompt.name}** \`${prompt.id}\`\n\n`);
        md.appendMarkdown(`${prompt.description}\n\n`);
        md.appendMarkdown(`*v${prompt.version} · ${prompt.category}*`);
        if (prompt.role)
            md.appendMarkdown(`\n\n**Role:** ${prompt.role}`);
        return new vscode.Hover(md);
    }
}
// ============================================
// Completion Provider
// ============================================
class PromptCompletionProvider {
    provideCompletionItems(document, position) {
        const line = document.lineAt(position.line).text.slice(0, position.character);
        if (!line.includes('@') && !line.toLowerCase().includes('prompt'))
            return [];
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
function activate(context) {
    log('PromptOS extension activating...');
    // Update package.json settings contribution if needed
    const cfg = getConfig();
    // Commands
    context.subscriptions.push(vscode.commands.registerCommand('promptos.insertPrompt', cmdInsertPrompt), vscode.commands.registerCommand('promptos.listPrompts', cmdListPrompts), vscode.commands.registerCommand('promptos.refreshPrompts', cmdRefreshCache), vscode.commands.registerCommand('promptos.loadPrompt', async () => {
        const id = await vscode.window.showInputBox({ prompt: 'Enter prompt ID', placeHolder: 'e.g., codegen-v1' });
        if (!id)
            return;
        const wsRoot = getWorkspaceRoot();
        if (!wsRoot)
            return;
        const regPath = cfg.registryPath;
        const baseDir = path.dirname(path.dirname(path.join(wsRoot, regPath)));
        const registry = loadRegistry();
        const entry = registry.find(p => p.id === id);
        if (!entry) {
            vscode.window.showErrorMessage(`Prompt '${id}' not found`);
            return;
        }
        const filePath = path.join(baseDir, entry.file);
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc);
    }));
    // Providers
    const langs = ['markdown', 'yaml', 'plaintext', 'javascript', 'typescript'];
    context.subscriptions.push(vscode.languages.registerHoverProvider(langs, new PromptHoverProvider()), vscode.languages.registerCompletionItemProvider(langs, new PromptCompletionProvider(), '@'));
    log('PromptOS extension activated.');
    vscode.window.setStatusBarMessage('PromptOS ready', 2000);
}
function deactivate() {
    log('PromptOS deactivated');
    if (outputChannel)
        outputChannel.dispose();
}
//# sourceMappingURL=extension.js.map