import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

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
  role?: string;
  file: string;
}

interface InputDefinition {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface RegistryPrompt {
  id: string;
  name: string;
  category: string;
  version: string;
  file: string;
}

interface PromptOSManifest {
  name: string;
  description: string;
  version: string;
  publisher: string;
  prompts: Record<string, {
    id: string;
    name: string;
    description: string;
    icon?: string;
  }>;
  configuration?: {
    prompt_directory?: string;
    registry_file?: string;
    default_format?: string;
  };
}

// ============================================
// Global State
// ============================================

// Reserved for future caching
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _promptCache: PromptMetadata[] = [];
let manifestCache: PromptOSManifest | null = null;
let hoverProvider: vscode.Disposable | null = null;
let completionProvider: vscode.Disposable | null = null;

// ============================================
// Utility Functions
// ============================================

function getWorkspaceRoot(): vscode.Uri | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return null;
  }
  return workspaceFolders[0].uri;
}

function getConfig() {
  const config = vscode.workspace.getConfiguration('promptos');
  return {
    promptDirectory: config.get<string>('promptDirectory', './promptos/prompts'),
    registryFile: config.get<string>('registryFile', './promptos/registry/index.json'),
    manifestFile: config.get<string>('manifestFile', './promptos/ide/promptos.json'),
    includeVariables: config.get<boolean>('includeVariables', true),
    showMetadataOnHover: config.get<boolean>('showMetadataOnHover', true)
  };
}

async function loadManifest(): Promise<PromptOSManifest | null> {
  if (manifestCache) {
    return manifestCache;
  }

  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return null;
  }

  const config = getConfig();
  const manifestPath = path.join(workspaceRoot.fsPath, config.manifestFile);

  try {
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf-8');
      manifestCache = JSON.parse(content);
      return manifestCache;
    }
  } catch (error) {
    console.error('Failed to load manifest:', error);
  }

  return null;
}

async function loadRegistryPrompts(): Promise<RegistryPrompt[]> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return [];
  }

  const config = getConfig();
  const registryPath = path.join(workspaceRoot.fsPath, config.registryFile);

  try {
    if (fs.existsSync(registryPath)) {
      const content = fs.readFileSync(registryPath, 'utf-8');
      const registry = JSON.parse(content);
      return registry.prompts || [];
    }
  } catch (error) {
    console.error('Failed to load registry:', error);
  }

  return [];
}

async function loadPromptFromFile(filePath: string): Promise<PromptMetadata | null> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return null;
  }

  const fullPath = path.join(workspaceRoot.fsPath, filePath);

  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const promptData = yaml.load(content) as Record<string, unknown>;
      
      return {
        id: promptData.id as string,
        name: promptData.name as string,
        description: promptData.description as string,
        category: promptData.category as string,
        version: promptData.version as string,
        author: promptData.author as string | undefined,
        tags: promptData.tags as string[] | undefined,
        inputs: promptData.inputs as InputDefinition[] | undefined,
        role: promptData.role as string | undefined,
        file: filePath
      };
    }
  } catch (error) {
    console.error(`Failed to load prompt from ${filePath}:`, error);
  }

  return null;
}

async function loadAllPrompts(): Promise<PromptMetadata[]> {
  const registryPrompts = await loadRegistryPrompts();
  const prompts: PromptMetadata[] = [];

  for (const regPrompt of registryPrompts) {
    const prompt = await loadPromptFromFile(regPrompt.file);
    if (prompt) {
      prompts.push(prompt);
    }
  }

  return prompts;
}

function refreshCache(): void {
  _promptCache = [];
  manifestCache = null;
}

// ============================================
// Command Handlers
// ============================================

async function insertPromptCommand(): Promise<void> {
  const prompts = await loadAllPrompts();
  
  if (prompts.length === 0) {
    vscode.window.showInformationMessage('No prompts found in the library.');
    return;
  }

  const config = getConfig();

  // Create quick pick items
  const items = prompts.map(prompt => ({
    label: prompt.name,
    description: `${prompt.category} • ${prompt.id}`,
    detail: prompt.description,
    prompt: prompt
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a prompt to insert',
    matchOnDescription: true,
    matchOnDetail: true
  });

  if (!selected) {
    return;
  }

  const prompt = selected.prompt;

  // If variable injection is enabled and prompt has inputs
  if (config.includeVariables && prompt.inputs && prompt.inputs.length > 0) {
    const variables = await collectPromptVariables(prompt);
    if (!variables) {
      return; // User cancelled
    }

    const renderedPrompt = renderPromptWithVariables(prompt, variables);
    await insertTextAtCursor(renderedPrompt);
  } else {
    // Insert raw prompt text
    const workspaceRoot = getWorkspaceRoot();
    if (workspaceRoot) {
      const promptPath = path.join(workspaceRoot.fsPath, prompt.file);
      try {
        const content = fs.readFileSync(promptPath, 'utf-8');
        const promptData = yaml.load(content) as Record<string, unknown>;
        const promptText = promptData.prompt as string;
        await insertTextAtCursor(promptText);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to load prompt: ${error}`);
      }
    }
  }
}

async function collectPromptVariables(prompt: PromptMetadata): Promise<Record<string, string> | null> {
  const variables: Record<string, string> = {};
  const requiredInputs = prompt.inputs?.filter(input => input.required) || [];

  for (const input of requiredInputs) {
    let value: string | undefined;

    if (input.type === 'select' && input.options) {
      const selected = await vscode.window.showQuickPick(input.options, {
        placeHolder: input.placeholder || `Select ${input.label}`
      });
      value = selected;
    } else if (input.type === 'textarea') {
      value = await vscode.window.showInputBox({
        prompt: input.label,
        placeHolder: input.placeholder,
        value: ''
      });
    } else {
      value = await vscode.window.showInputBox({
        prompt: input.label,
        placeHolder: input.placeholder,
        value: ''
      });
    }

    if (value === undefined) {
      return null; // User cancelled
    }

    variables[input.name] = value;
  }

  return variables;
}

function renderPromptWithVariables(prompt: PromptMetadata, variables: Record<string, string>): string {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return '';
  }

  const promptPath = path.join(workspaceRoot.fsPath, prompt.file);
  try {
    const content = fs.readFileSync(promptPath, 'utf-8');
    const promptData = yaml.load(content) as Record<string, unknown>;
    let promptText = promptData.prompt as string;

    // Simple variable replacement (Handlebars-like syntax)
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      promptText = promptText.replace(regex, value);
    }

    return promptText;
  } catch (error) {
    return '';
  }
}

async function insertTextAtCursor(text: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    // Create a new untitled document
    const doc = await vscode.workspace.openTextDocument({
      content: text,
      language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);
    return;
  }

  const selection = editor.selection;
  await editor.edit(editBuilder => {
    editBuilder.insert(selection.start, text);
  });
}

async function listPromptsCommand(): Promise<void> {
  const prompts = await loadAllPrompts();

  if (prompts.length === 0) {
    vscode.window.showInformationMessage('No prompts found in the library.');
    return;
  }

  const manifest = await loadManifest();

  const items = prompts.map(prompt => {
    const icon = manifest?.prompts[prompt.category]?.icon || 'file';
    return {
      label: `${icon} ${prompt.name}`,
      description: prompt.id,
      detail: `${prompt.description}\n\nCategory: ${prompt.category} | Version: ${prompt.version}`,
      prompt: prompt
    };
  });

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Available prompts in the library',
    matchOnDescription: true,
    matchOnDetail: true
  });

  if (selected) {
    // Show detailed information about the selected prompt
    const prompt = selected.prompt;
    const details = [
      `**ID:** ${prompt.id}`,
      `**Name:** ${prompt.name}`,
      `**Category:** ${prompt.category}`,
      `**Version:** ${prompt.version}`,
      `**Description:** ${prompt.description}`,
      prompt.role ? `**Role:** ${prompt.role}` : null,
      prompt.author ? `**Author:** ${prompt.author}` : null,
      prompt.tags ? `**Tags:** ${prompt.tags?.join(', ')}` : null,
      prompt.inputs?.length ? `**Inputs:** ${prompt.inputs.map(i => i.name).join(', ')}` : null
    ].filter(Boolean).join('\n');

    await vscode.window.showInformationMessage(details, { modal: true });
  }
}

async function loadPromptCommand(): Promise<void> {
  const prompts = await loadAllPrompts();

  if (prompts.length === 0) {
    vscode.window.showInformationMessage('No prompts found in the library.');
    return;
  }

  // Show input box to enter prompt ID
  const promptId = await vscode.window.showInputBox({
    prompt: 'Enter prompt ID',
    placeHolder: 'e.g., codegen-v1'
  });

  if (!promptId) {
    return;
  }

  const prompt = prompts.find(p => p.id === promptId);

  if (!prompt) {
    vscode.window.showErrorMessage(`Prompt with ID '${promptId}' not found.`);
    return;
  }

  const workspaceRoot = getWorkspaceRoot();
  if (workspaceRoot) {
    const promptPath = path.join(workspaceRoot.fsPath, prompt.file);
    const doc = await vscode.workspace.openTextDocument(promptPath);
    await vscode.window.showTextDocument(doc);
  }
}

function refreshPromptsCommand(): void {
  refreshCache();
  vscode.window.showInformationMessage('PromptOS: Prompt cache refreshed.');
}

// ============================================
// Hover Provider
// ============================================

class PromptHoverProvider implements vscode.HoverProvider {
  async provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | null> {
    const config = getConfig();
    if (!config.showMetadataOnHover) {
      return null;
    }

    const line = document.lineAt(position.line).text;
    
    // Check if line contains a prompt ID reference (e.g., @codegen-v1)
    const promptIdMatch = line.match(/@([a-z0-9-]+)/i);
    
    if (!promptIdMatch) {
      return null;
    }

    const promptId = promptIdMatch[1];
    const prompts = await loadAllPrompts();
    const prompt = prompts.find(p => p.id === promptId);

    if (!prompt) {
      return null;
    }

    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`**${prompt.name}** (${prompt.id})\n\n`);
    markdown.appendMarkdown(`${prompt.description}\n\n`);
    markdown.appendMarkdown(`*Category: ${prompt.category} | Version: ${prompt.version}*\n`);

    if (prompt.role) {
      markdown.appendMarkdown(`\n**Role:** ${prompt.role}`);
    }

    if (prompt.tags && prompt.tags.length > 0) {
      markdown.appendMarkdown(`\n**Tags:** ${prompt.tags.join(', ')}`);
    }

    if (prompt.inputs && prompt.inputs.length > 0) {
      markdown.appendMarkdown(`\n\n**Inputs:**\n`);
      for (const input of prompt.inputs) {
        const required = input.required ? ' (required)' : ' (optional)';
        markdown.appendMarkdown(`- ${input.label}${required}\n`);
      }
    }

    return new vscode.Hover(markdown, new vscode.Range(position, position));
  }
}

// ============================================
// Completion Provider
// ============================================

class PromptCompletionProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.CompletionItem[]> {
    const prompts = await loadAllPrompts();
    const line = document.lineAt(position.line).text;
    
    // Check if we're in a context where we might want prompt completions
    // (after @ symbol or in specific contexts)
    const beforeCursor = line.substring(0, position.character);
    const shouldProvide = beforeCursor.includes('@') || beforeCursor.includes('prompt');

    if (!shouldProvide) {
      return [];
    }

    const completionItems: vscode.CompletionItem[] = [];

    for (const prompt of prompts) {
      const item = new vscode.CompletionItem({
        label: prompt.id,
        detail: prompt.name,
        description: prompt.description
      }, vscode.CompletionItemKind.Reference);

      item.detail = `${prompt.category} • ${prompt.name}`;
      item.documentation = new vscode.MarkdownString(`
**${prompt.name}** (${prompt.id})

${prompt.description}

*Category:* ${prompt.category}
*Version:* ${prompt.version}
${prompt.role ? `*Role:* ${prompt.role}` : ''}
      `);

      item.insertText = `@${prompt.id}`;
      
      completionItems.push(item);
    }

    return completionItems;
  }
}

// ============================================
// Extension Activation
// ============================================

export function activate(context: vscode.ExtensionContext): void {
  console.log('PromptOS extension activated.');

  // Register commands
  const insertPromptCmd = vscode.commands.registerCommand('promptos.insertPrompt', insertPromptCommand);
  const listPromptsCmd = vscode.commands.registerCommand('promptos.listPrompts', listPromptsCommand);
  const loadPromptCmd = vscode.commands.registerCommand('promptos.loadPrompt', loadPromptCommand);
  const refreshPromptsCmd = vscode.commands.registerCommand('promptos.refreshPrompts', refreshPromptsCommand);

  context.subscriptions.push(
    insertPromptCmd,
    listPromptsCmd,
    loadPromptCmd,
    refreshPromptsCmd
  );

  // Register hover provider for markdown, yaml, and plaintext
  hoverProvider = vscode.languages.registerHoverProvider(
    ['markdown', 'yaml', 'plaintext', 'javascript', 'typescript'],
    new PromptHoverProvider()
  );
  context.subscriptions.push(hoverProvider);

  // Register completion provider
  completionProvider = vscode.languages.registerCompletionItemProvider(
    ['markdown', 'yaml', 'plaintext', 'javascript', 'typescript'],
    new PromptCompletionProvider(),
    '@'
  );
  context.subscriptions.push(completionProvider);

  // Show welcome message on first activation
  loadManifest().then(manifest => {
    if (manifest) {
      vscode.window.showInformationMessage(
        `PromptOS v${manifest.version} loaded. Use Cmd+Alt+P to insert a prompt.`,
        'Open Settings'
      ).then(selection => {
        if (selection === 'Open Settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'promptos');
        }
      });
    }
  });
}

export function deactivate(): void {
  console.log('PromptOS extension deactivated.');
  
  if (hoverProvider) {
    hoverProvider.dispose();
  }
  
  if (completionProvider) {
    completionProvider.dispose();
  }
}
