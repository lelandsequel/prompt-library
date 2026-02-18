'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Eye, Bug, Building2, Globe, AlertTriangle, 
  CheckCircle, Wand2, Shield, Zap, LayoutGrid,
  Code, FileText, Settings, Lock, Copy, Check,
  ChevronDown, Sparkles, X, PenLine, Search,
  PanelLeft, Layers, Terminal as TerminalIcon
} from 'lucide-react';
import { templates, llmPresets, categories, Template, LLMPreset, TemplateVariable } from '@/data/templates';
import { useTheme, Theme } from '@/context/ThemeContext';

const iconMap: Record<string, React.ElementType> = {
  Eye, Bug, Building2, Globe, AlertTriangle, 
  CheckCircle, Wand2, Shield, Zap, LayoutGrid,
  Code, FileText, Settings, Lock
};

// Theme toggle component
function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const themes: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: 'brutalist', label: 'BRUTAL', icon: Layers },
    { id: 'minimal', label: 'MINIMAL', icon: Sparkles },
    { id: 'terminal', label: 'TERMINAL', icon: TerminalIcon },
  ];

  return (
    <div className="theme-toggle">
      {themes.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`theme-btn ${theme === t.id ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Footer component with branding
function Footer({ theme }: { theme: Theme }) {
  const footerStyles: Record<Theme, string> = {
    brutalist: 'brutalist-footer',
    minimal: 'minimal-footer',
    terminal: 'terminal-footer-bar'
  };

  return (
    <footer className={footerStyles[theme]}>
      <div className="footer-content">
        <span className="footer-brand">Prompt OS</span>
        <span className="footer-sep">|</span>
        <a href="https://jourdanlabs.com" target="_blank" rel="noopener noreferrer" className="footer-link">JourdanLabs</a>
        <span className="footer-sep">×</span>
        <a href="https://cl-strategy.com" target="_blank" rel="noopener noreferrer" className="footer-link">C&L Strategy</a>
      </div>
    </footer>
  );
}

// ============================================
// BRUTALIST THEME COMPONENTS
// ============================================
function BrutalistHeader({ activeMode, setActiveMode, theme, setTheme }: any) {
  return (
    <header className="brutalist-header">
      <div className="brutalist-title">
        <div className="brutalist-logo">OS</div>
        <div>
          <h1>PROMPT_OS</h1>
          <p>JOURDANLABS_×_C&L_STRATEGY</p>
        </div>
      </div>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <div className="brutalist-tabs">
        <button
          onClick={() => setActiveMode('templates')}
          className={activeMode === 'templates' ? 'active' : ''}
        >
          [TEMPLATES]
        </button>
        <button
          onClick={() => setActiveMode('custom')}
          className={activeMode === 'custom' ? 'active' : ''}
        >
          [CUSTOM_PROMPT]
        </button>
      </div>
    </header>
  );
}

function BrutalistTemplateCard({ template, selected, onClick }: any) {
  const Icon = iconMap[template.icon] || Code;
  return (
    <button
      onClick={onClick}
      className={`brutalist-card ${selected ? 'selected' : ''}`}
    >
      <div className="brutalist-card-icon">
        <Icon className="w-6 h-6" />
      </div>
      <div className="brutalist-card-content">
        <h3>{template.name}</h3>
        <p>{template.description}</p>
        <span className="brutalist-tag">[{template.category.toUpperCase()}]</span>
      </div>
    </button>
  );
}

function BrutalistVariableInput({ variable, value, onChange }: any) {
  if (variable.type === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(variable.name, e.target.value)}
        className="brutalist-input"
      >
        <option value="">[{variable.placeholder.toUpperCase()}]</option>
        {variable.options?.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }
  if (variable.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(variable.name, e.target.value)}
        placeholder={variable.placeholder}
        rows={4}
        className="brutalist-input brutalist-textarea"
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(variable.name, e.target.value)}
      placeholder={variable.placeholder}
      className="brutalist-input"
    />
  );
}

// ============================================
// MINIMAL THEME COMPONENTS  
// ============================================
function MinimalHeader({ activeMode, setActiveMode, theme, setTheme }: any) {
  return (
    <header className="minimal-header">
      <div className="minimal-title">
        <div className="minimal-logo">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1>Prompt OS</h1>
          <p>JourdanLabs × C&amp;L Strategy</p>
        </div>
      </div>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <div className="minimal-tabs">
        <button
          onClick={() => setActiveMode('templates')}
          className={activeMode === 'templates' ? 'active' : ''}
        >
          <LayoutGrid className="w-4 h-4" />
          Templates
        </button>
        <button
          onClick={() => setActiveMode('custom')}
          className={activeMode === 'custom' ? 'active' : ''}
        >
          <PenLine className="w-4 h-4" />
          Custom Prompt
        </button>
      </div>
    </header>
  );
}

function MinimalTemplateCard({ template, selected, onClick }: any) {
  const Icon = iconMap[template.icon] || Code;
  return (
    <button
      onClick={onClick}
      className={`minimal-card ${selected ? 'selected' : ''}`}
    >
      <div className={`minimal-card-icon ${selected ? 'active' : ''}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="minimal-card-content">
        <h3>{template.name}</h3>
        <p>{template.description}</p>
        <span className="minimal-tag">{template.category}</span>
      </div>
    </button>
  );
}

function MinimalVariableInput({ variable, value, onChange }: any) {
  if (variable.type === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(variable.name, e.target.value)}
        className="minimal-input"
      >
        <option value="">{variable.placeholder}</option>
        {variable.options?.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }
  if (variable.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(variable.name, e.target.value)}
        placeholder={variable.placeholder}
        rows={4}
        className="minimal-input minimal-textarea"
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(variable.name, e.target.value)}
      placeholder={variable.placeholder}
      className="minimal-input"
    />
  );
}

// ============================================
// TERMINAL THEME COMPONENTS
// ============================================
function TerminalHeader({ activeMode, setActiveMode, theme, setTheme }: any) {
  return (
    <header className="terminal-header">
      <div className="terminal-title">
        <TerminalIcon className="w-5 h-5" />
        <span>Prompt OS — JourdanLabs × C&L Strategy — ~</span>
      </div>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <div className="terminal-tabs">
        <button
          onClick={() => setActiveMode('templates')}
          className={activeMode === 'templates' ? 'active' : ''}
        >
          ▶ templates/
        </button>
        <button
          onClick={() => setActiveMode('custom')}
          className={activeMode === 'custom' ? 'active' : ''}
        >
          ▶ optimize/
        </button>
      </div>
    </header>
  );
}

function TerminalSidebar({ categories, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery }: any) {
  return (
    <div className="terminal-sidebar">
      <div className="terminal-search">
        <Search className="w-4 h-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
        />
      </div>
      <div className="terminal-tree">
        <div className="tree-header">
          <ChevronDown className="w-3 h-3" />
          <span>EXPLORER</span>
        </div>
        <div className="tree-item root">
          <PanelLeft className="w-3 h-3" />
          <span>PROMPTS</span>
        </div>
        {categories.filter((c: any) => c.id !== 'all').map((category: any) => (
          <div key={category.id} className="tree-item">
            <span className={`tree-arrow ${selectedCategory === category.id ? 'active' : ''}`}>▶</span>
            <span 
              className={selectedCategory === category.id ? 'active' : ''}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name.toUpperCase()}/
            </span>
          </div>
        ))}
        <div 
          className={`tree-item ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          <span className="tree-arrow">{selectedCategory === 'all' ? '▼' : '▶'}</span>
          <span>ALL_TEMPLATES</span>
        </div>
      </div>
      <div className="terminal-footer">
        <span>main*</span>
      </div>
    </div>
  );
}

function TerminalTemplateCard({ template, selected, onClick }: any) {
  const Icon = iconMap[template.icon] || Code;
  return (
    <button
      onClick={onClick}
      className={`terminal-card ${selected ? 'selected' : ''}`}
    >
      <span className="terminal-card-icon">
        <Icon className="w-4 h-4" />
      </span>
      <span className="terminal-card-name">{template.name}</span>
      <span className="terminal-card-category">{template.category}</span>
    </button>
  );
}

function TerminalVariableInput({ variable, value, onChange }: any) {
  if (variable.type === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(variable.name, e.target.value)}
        className="terminal-input"
      >
        <option value="">{variable.placeholder}</option>
        {variable.options?.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }
  if (variable.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(variable.name, e.target.value)}
        placeholder={variable.placeholder}
        rows={4}
        className="terminal-input terminal-textarea"
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(variable.name, e.target.value)}
      placeholder={variable.placeholder}
      className="terminal-input"
    />
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function PromptLibrary() {
  const { theme, setTheme } = useTheme();
  const [activeMode, setActiveMode] = useState<'templates' | 'custom'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedLLM, setSelectedLLM] = useState<LLMPreset>(llmPresets[0]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [showLLMDropdown, setShowLLMDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customPrompt, setCustomPrompt] = useState('');
  const [customTargetLlm, setCustomTargetLlm] = useState<string>('chatgpt');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState('');
  const [copiedOptimized, setCopiedOptimized] = useState(false);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setGeneratedPrompt('');
    setVariableValues({});
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [name]: value }));
  };

  const generatePrompt = () => {
    if (!selectedTemplate) return;
    let prompt = selectedTemplate.prompt;
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(regex, value || `[${key}]`);
    });
    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const optimizePrompt = async () => {
    if (!customPrompt.trim()) return;
    setIsOptimizing(true);
    setOptimizeError('');
    setOptimizedPrompt('');
    
    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt, targetLlm: customTargetLlm })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to optimize');
      setOptimizedPrompt(data.optimizedPrompt);
    } catch (err) {
      setOptimizeError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyOptimizedPrompt = async () => {
    if (!optimizedPrompt) return;
    await navigator.clipboard.writeText(optimizedPrompt);
    setCopiedOptimized(true);
    setTimeout(() => setCopiedOptimized(false), 2000);
  };

  // Render appropriate header based on theme
  const renderHeader = () => {
    const props = { activeMode, setActiveMode, theme, setTheme };
    switch (theme) {
      case 'brutalist': return <BrutalistHeader {...props} />;
      case 'minimal': return <MinimalHeader {...props} />;
      case 'terminal': return <TerminalHeader {...props} />;
    }
  };

  // Render appropriate template card based on theme
  const renderTemplateCard = (template: Template) => {
    const props = { template, selected: selectedTemplate?.id === template.id, onClick: () => handleTemplateSelect(template) };
    switch (theme) {
      case 'brutalist': return <BrutalistTemplateCard {...props} />;
      case 'minimal': return <MinimalTemplateCard {...props} />;
      case 'terminal': return <TerminalTemplateCard {...props} />;
    }
  };

  // Render appropriate variable input based on theme
  const renderVariableInput = (variable: TemplateVariable) => {
    const value = variableValues[variable.name] || '';
    const props = { variable, value, onChange: handleVariableChange };
    switch (theme) {
      case 'brutalist': return <BrutalistVariableInput {...props} />;
      case 'minimal': return <MinimalVariableInput {...props} />;
      case 'terminal': return <TerminalVariableInput {...props} />;
    }
  };

  // Render templates panel
  const renderTemplatesPanel = () => {
    const props = { categories, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery };
    
    return (
      <div className={`templates-panel ${theme}`}>
        {theme === 'terminal' && <TerminalSidebar {...props} />}
        <div className="templates-list">
          {theme !== 'terminal' && (
            <>
              <div className={`search-box ${theme}`}>
                <Search className="w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                />
              </div>
              <div className={`categories ${theme}`}>
                {categories.map(category => {
                  const Icon = iconMap[category.icon] || LayoutGrid;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`category-btn ${selectedCategory === category.id ? 'active' : ''} ${theme}`}
                    >
                      <Icon className="w-4 h-4" />
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div className="template-cards">
            {filteredTemplates.map(template => renderTemplateCard(template))}
          </div>
        </div>
      </div>
    );
  };

  // Render form panel
  const renderFormPanel = () => {
    if (!selectedTemplate) {
      return (
        <div className={`empty-state ${theme}`}>
          <Sparkles className="w-16 h-16" />
          <h3>Select a Template</h3>
          <p>Choose a template from the list to get started.</p>
        </div>
      );
    }

    const Icon = iconMap[selectedTemplate.icon] || Code;

    return (
      <div className={`form-panel ${theme}`}>
        <div className={`template-header ${theme}`}>
          <Icon className="w-8 h-8" />
          <div>
            <h2>{selectedTemplate.name}</h2>
            <p>{selectedTemplate.description}</p>
          </div>
        </div>

        <div className={`variables-section ${theme}`}>
          <h3>Fill in Variables</h3>
          <div className="variables-grid">
            {selectedTemplate.variables.map(variable => (
              <div key={variable.name} className="variable-field">
                <label>
                  {variable.label}
                  {variable.required && <span className="required">*</span>}
                </label>
                {renderVariableInput(variable)}
              </div>
            ))}
          </div>
        </div>

        <div className={`llm-section ${theme}`}>
          <h3>Select LLM Preset</h3>
          <div className="llm-dropdown">
            <button
              onClick={() => setShowLLMDropdown(!showLLMDropdown)}
              className={`llm-selector ${theme}`}
            >
              <div className="llm-info">
                <div className="llm-avatar">{selectedLLM.name.charAt(0)}</div>
                <div>
                  <div className="llm-name">{selectedLLM.name}</div>
                  <div className="llm-desc">{selectedLLM.description}</div>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 ${showLLMDropdown ? 'rotate' : ''}`} />
            </button>
            {showLLMDropdown && (
              <div className={`llm-menu ${theme}`}>
                {llmPresets.map(llm => (
                  <button
                    key={llm.id}
                    onClick={() => { setSelectedLLM(llm); setShowLLMDropdown(false); }}
                    className={`llm-option ${selectedLLM.id === llm.id ? 'active' : ''}`}
                  >
                    <div className="llm-avatar">{llm.name.charAt(0)}</div>
                    <div>
                      <div className="llm-name">{llm.name}</div>
                      <div className="llm-desc">{llm.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={generatePrompt} className={`generate-btn ${theme}`}>
          <Sparkles className="w-5 h-5" />
          Generate Prompt
        </button>

        {generatedPrompt && (
          <div className={`output-panel ${theme}`}>
            <div className={`output-header ${theme}`}>
              <h3>Generated Prompt</h3>
              <button onClick={copyToClipboard} className={`copy-btn ${theme}`}>
                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
            <pre className="output-content">{generatedPrompt}</pre>
          </div>
        )}
      </div>
    );
  };

  // Render custom prompt mode
  const renderCustomMode = () => {
    return (
      <div className={`custom-panel ${theme}`}>
        <div className={`custom-header ${theme}`}>
          <Wand2 className="w-6 h-6" />
          <div>
            <h2>Optimize Your Prompt</h2>
            <p>Get your prompt optimized for your target LLM</p>
          </div>
        </div>

        <div className={`custom-form ${theme}`}>
          <div className="form-field">
            <label>Target LLM</label>
            <select
              value={customTargetLlm}
              onChange={(e) => setCustomTargetLlm(e.target.value)}
              className={`llm-select ${theme}`}
            >
              {llmPresets.map(llm => (
                <option key={llm.id} value={llm.id}>{llm.name} - {llm.description}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Your Prompt</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Paste your prompt here that you want to optimize..."
              rows={6}
              className={`prompt-input ${theme}`}
            />
          </div>

          <button
            onClick={optimizePrompt}
            disabled={!customPrompt.trim() || isOptimizing}
            className={`optimize-btn ${theme}`}
          >
            {isOptimizing ? (
              <><div className="spinner" /> Optimizing...</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Optimize with AI</>
            )}
          </button>

          {optimizeError && <div className={`error-msg ${theme}`}>{optimizeError}</div>}

          {optimizedPrompt && (
            <div className={`optimized-result ${theme}`}>
              <div className={`result-header ${theme}`}>
                <Sparkles className="w-5 h-5" />
                <h3>Optimized Prompt</h3>
                <button onClick={copyOptimizedPrompt} className={`copy-btn ${theme}`}>
                  {copiedOptimized ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                </button>
              </div>
              <pre className="result-content">{optimizedPrompt}</pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`app-container ${theme}`}>
      {renderHeader()}
      <main className={`main-content ${theme}`}>
        {activeMode === 'templates' ? (
          <div className={`templates-layout ${theme}`}>
            {renderTemplatesPanel()}
            {renderFormPanel()}
          </div>
        ) : (
          renderCustomMode()
        )}
      </main>
      <Footer theme={theme} />
    </div>
  );
}
