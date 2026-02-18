'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'webapp' | 'cli' | 'ide' | 'platform';

const TABS: { id: Tab; label: string }[] = [
  { id: 'webapp', label: '🌐 Web App' },
  { id: 'cli', label: '🖥️ CLI' },
  { id: 'ide', label: '🧩 IDE Extension' },
  { id: 'platform', label: '🏗️ Platform' },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      style={{
        background: '#0d1117',
        color: '#e6edf3',
        borderRadius: '6px',
        padding: '12px 16px',
        fontSize: '12px',
        lineHeight: '1.6',
        overflowX: 'auto',
        margin: '8px 0',
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        border: '1px solid #30363d',
      }}
    >
      <code>{children}</code>
    </pre>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code
      style={{
        background: '#1e2a3a',
        color: '#79c0ff',
        borderRadius: '4px',
        padding: '1px 6px',
        fontSize: '12px',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      }}
    >
      {children}
    </code>
  );
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
      <div
        style={{
          flexShrink: 0,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: '#238636',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 700,
          marginTop: '1px',
        }}
      >
        {num}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: '#e6edf3', marginBottom: '4px' }}>{title}</div>
        <div style={{ color: '#8b949e', fontSize: '13px', lineHeight: '1.6' }}>{children}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#7d8590',
          textTransform: 'uppercase',
          marginBottom: '10px',
          paddingBottom: '6px',
          borderBottom: '1px solid #21262d',
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function PlatformItem({ name, description }: { name: string; description: string }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 12px',
        background: '#161b22',
        borderRadius: '6px',
        marginBottom: '8px',
        border: '1px solid #21262d',
      }}
    >
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 600, color: '#e6edf3', fontSize: '13px' }}>{name}</span>
        <span style={{ color: '#7d8590', fontSize: '13px' }}> — {description}</span>
      </div>
    </div>
  );
}

function WebAppTab() {
  return (
    <div>
      <Section title="How to use the web app">
        <Step num={1} title="Pick a Template">
          Browse 9 prompt templates by category or use the search bar. Click any card to select it.
          Categories: Engineering, Architecture, SRE, Security, QA.
        </Step>
        <Step num={2} title="Fill in Variables">
          Each template has input fields. Required fields are marked with <span style={{ color: '#f85149' }}>*</span>.
          Optional fields add more context and improve output quality.
        </Step>
        <Step num={3} title="Choose Your LLM">
          Select from 5 presets: <strong style={{ color: '#e6edf3' }}>ChatGPT</strong>, <strong style={{ color: '#e6edf3' }}>Claude</strong>,{' '}
          <strong style={{ color: '#e6edf3' }}>Cursor</strong>, <strong style={{ color: '#e6edf3' }}>Copilot</strong>, or{' '}
          <strong style={{ color: '#e6edf3' }}>Gemini</strong>. Each preset formats the prompt optimally for that model.
        </Step>
        <Step num={4} title="Generate">
          Click <strong style={{ color: '#e6edf3' }}>"Generate Prompt"</strong> to build your fully-rendered prompt with your inputs substituted in.
        </Step>
        <Step num={5} title="Copy & Use">
          Click <strong style={{ color: '#e6edf3' }}>Copy</strong> to copy to clipboard, then paste directly into your LLM of choice.
        </Step>
      </Section>

      <Section title="Themes">
        <div style={{ display: 'grid', gap: '8px' }}>
          {[
            { name: '⬛ Brutalist', desc: 'Bold, high-contrast, monochrome. Maximum focus.' },
            { name: '✨ Minimal', desc: 'Clean, spacious, elegant. The default experience.' },
            { name: '💻 Terminal', desc: 'Dark mode with a file-tree sidebar. Hacker aesthetic.' },
          ].map((t) => (
            <div
              key={t.name}
              style={{
                padding: '10px 12px',
                background: '#161b22',
                borderRadius: '6px',
                border: '1px solid #21262d',
              }}
            >
              <div style={{ fontWeight: 600, color: '#e6edf3', fontSize: '13px', marginBottom: '2px' }}>{t.name}</div>
              <div style={{ color: '#7d8590', fontSize: '12px' }}>{t.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ color: '#7d8590', fontSize: '12px', marginTop: '10px' }}>
          Switch themes anytime using the toggle in the header.
        </p>
      </Section>

      <Section title="Custom Prompt Optimizer">
        <p style={{ color: '#8b949e', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
          Switch to <strong style={{ color: '#e6edf3' }}>Custom Prompt</strong> mode to paste any prompt and have AI
          optimize it for your target LLM. Powered by the <InlineCode>/api/optimize</InlineCode> endpoint.
        </p>
      </Section>
    </div>
  );
}

function CLITab() {
  return (
    <div>
      <Section title="Getting started">
        <p style={{ color: '#8b949e', fontSize: '13px', lineHeight: '1.6', marginTop: 0, marginBottom: '12px' }}>
          The PromptOS CLI runs from the repo root. No global install needed — just use <InlineCode>node promptos/cli/index.js</InlineCode>.
        </p>
      </Section>

      <Section title="List & discover prompts">
        <CodeBlock>{`# List all available prompts
node promptos/cli/index.js list

# Filter by tag
node promptos/cli/index.js list --tag codegen`}</CodeBlock>
      </Section>

      <Section title="Run a prompt">
        <CodeBlock>{`# Dry run — renders template, no API call
node promptos/cli/index.js run python-function --dry-run

# Run with RBAC + policy enforcement
node promptos/cli/index.js run python-function \\
  --user alice --role engineer --model claude-sonnet`}</CodeBlock>
      </Section>

      <Section title="Validate prompts">
        <CodeBlock>{`# Validate all prompts in registry
node promptos/cli/index.js validate

# Validate a specific prompt
node promptos/cli/index.js validate code-review`}</CodeBlock>
      </Section>

      <Section title="Analytics">
        <CodeBlock>{`# View summary report
node promptos/cli/index.js analytics report

# Export full telemetry as JSON
node promptos/cli/index.js analytics export --output usage.json`}</CodeBlock>
      </Section>

      <Section title="Prompt packs">
        <CodeBlock>{`# List installed packs
node promptos/cli/index.js pack list

# Install a pack
node promptos/cli/index.js pack install ./my-pack/pack.yaml

# Build a distributable pack
node promptos/cli/index.js pack build ./my-pack/`}</CodeBlock>
      </Section>

      <Section title="Semantic diff & server">
        <CodeBlock>{`# Compare two prompt versions
node promptos/cli/index.js diff v1.yaml v2.yaml
# → Returns MAJOR / MINOR / PATCH recommendation

# Start local registry server
node promptos/cli/index.js server --port 3001`}</CodeBlock>
      </Section>
    </div>
  );
}

function IDETab() {
  return (
    <div>
      <Section title="Installation">
        <CodeBlock>{`# Option A — install via CLI
code --install-extension promptos/ide/extension/promptos-1.0.0.vsix`}</CodeBlock>
        <p style={{ color: '#8b949e', fontSize: '13px', lineHeight: '1.6', margin: '8px 0' }}>
          <strong style={{ color: '#e6edf3' }}>Option B</strong> — Open the Extensions panel in VSCode or Cursor and
          drag the <InlineCode>.vsix</InlineCode> file onto it.
        </p>
      </Section>

      <Section title="Usage">
        <Step num={1} title="Open Command Palette">
          Press <InlineCode>Cmd+Shift+P</InlineCode> (Mac) or <InlineCode>Ctrl+Shift+P</InlineCode> (Windows/Linux).
        </Step>
        <Step num={2} title='Type "PromptOS"'>
          Select <strong style={{ color: '#e6edf3' }}>"PromptOS: Run Prompt…"</strong> from the list.
        </Step>
        <Step num={3} title="Pick a prompt">
          A QuickPick dropdown shows all prompts from your configured registry. Search and select.
        </Step>
        <Step num={4} title="Fill in inputs">
          A form appears for each required input field. Fill them in and confirm.
        </Step>
        <Step num={5} title="Get your output">
          The rendered prompt is inserted into your editor at the cursor position, copied to clipboard, or both
          — depending on your <InlineCode>insertMode</InlineCode> setting.
        </Step>
      </Section>

      <Section title="VSCode settings.json">
        <CodeBlock>{`{
  "promptos.registryPath": "promptos/registry/index.json",
  "promptos.insertMode": "both",
  "promptos.model": "claude-sonnet",
  "promptos.user": "your-username",
  "promptos.role": "engineer"
}`}</CodeBlock>
        <div style={{ display: 'grid', gap: '6px', marginTop: '10px' }}>
          {[
            { key: 'registryPath', desc: 'Path or URL to the registry index' },
            { key: 'insertMode', desc: 'clipboard | insert | both' },
            { key: 'model', desc: 'Default model ID for execution' },
            { key: 'user', desc: 'Your username for RBAC checks' },
            { key: 'role', desc: 'Your role (engineer, admin, etc.)' },
          ].map((s) => (
            <div key={s.key} style={{ fontSize: '12px', color: '#8b949e' }}>
              <InlineCode>{`promptos.${s.key}`}</InlineCode> — {s.desc}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function PlatformTab() {
  return (
    <div>
      <Section title="Core components">
        <PlatformItem
          name="Runtime"
          description="All prompts run through execute(): RBAC → Policy → Redact → Render → Model → Validate → Log"
        />
        <PlatformItem
          name="Policy Engine"
          description="Configure rules.yaml: model allowlists, data classification, approval requirements"
        />
        <PlatformItem
          name="RBAC"
          description="Role-based access: admin, prompt-author, engineer, auditor — enforced at every execution"
        />
        <PlatformItem
          name="Packs"
          description="Bundle + distribute prompt collections across teams. Install merges into the registry."
        />
        <PlatformItem
          name="Registry Server"
          description="Local/private registry — run node promptos/server/server.js --port 3001"
        />
        <PlatformItem
          name="Analytics"
          description="Every run logged to .telemetry/promptos-usage.jsonl. View with promptos analytics report"
        />
        <PlatformItem
          name="Semantic Diff"
          description="Version bump enforcement: MAJOR/MINOR/PATCH based on what changed in the PromptSpec"
        />
        <PlatformItem
          name="Learning Loop"
          description="Auto-proposes improvements for prompts with >20% failure rate from telemetry + eval data"
        />
        <PlatformItem
          name="CI Eval"
          description="GitHub Actions runs eval on every PR touching /promptos — exit code 1 on failures"
        />
      </Section>

      <Section title="Documentation">
        <p style={{ color: '#8b949e', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
          Full documentation for every component lives in{' '}
          <InlineCode>promptos/docs/</InlineCode>:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '10px' }}>
          {['POLICY.md', 'RBAC.md', 'RUNTIME.md', 'PACKS.md', 'ANALYTICS.md', 'IDE.md', 'SERVER.md', 'VERSIONING.md'].map((doc) => (
            <div key={doc} style={{ fontSize: '12px' }}>
              <InlineCode>{doc}</InlineCode>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export default function UserGuide({ isOpen, onClose }: UserGuideProps) {
  const [activeTab, setActiveTab] = useState<Tab>('webapp');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(700px, 95vw)',
          maxHeight: '85vh',
          background: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: '12px',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #21262d',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: '#e6edf3', fontSize: '16px' }}>PromptOS Guide</div>
            <div style={{ color: '#7d8590', fontSize: '12px', marginTop: '2px' }}>
              JourdanLabs × C&L Strategy
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #30363d',
              borderRadius: '6px',
              color: '#7d8590',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#e6edf3';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#58a6ff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#7d8590';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#30363d';
            }}
            aria-label="Close guide"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #21262d',
            padding: '0 20px',
            flexShrink: 0,
            overflowX: 'auto',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #58a6ff' : '2px solid transparent',
                color: activeTab === tab.id ? '#58a6ff' : '#7d8590',
                cursor: 'pointer',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                whiteSpace: 'nowrap',
                transition: 'color 0.15s',
                marginBottom: '-1px',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#c9d1d9';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#7d8590';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
          }}
        >
          {activeTab === 'webapp' && <WebAppTab />}
          {activeTab === 'cli' && <CLITab />}
          {activeTab === 'ide' && <IDETab />}
          {activeTab === 'platform' && <PlatformTab />}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #21262d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#7d8590', fontSize: '11px' }}>
            📖 Full docs in <InlineCode>promptos/docs/</InlineCode>
          </span>
          <button
            onClick={onClose}
            style={{
              background: '#21262d',
              border: '1px solid #30363d',
              borderRadius: '6px',
              color: '#c9d1d9',
              cursor: 'pointer',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#30363d';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#21262d';
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}
