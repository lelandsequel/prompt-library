'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Eye, Bug, Building2, Globe, AlertTriangle, 
  CheckCircle, Wand2, Shield, Zap, LayoutGrid,
  Code, FileText, Settings, Lock, Copy, Check,
  ChevronDown, Sparkles, X, PenLine, Search,
  PanelLeft, Layers, Terminal as TerminalIcon, Rocket, Package
} from 'lucide-react';
import { templates, llmPresets, categories, Template, LLMPreset, TemplateVariable } from '@/data/templates';
import { useTheme, Theme } from '@/context/ThemeContext';
import UserGuide from '@/components/UserGuide';

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
function BrutalistHeader({ activeMode, setActiveMode, theme, setTheme, onHelp }: any) {
  return (
    <header className="brutalist-header">
      <div className="brutalist-title">
        <div className="brutalist-logo">OS</div>
        <div>
          <h1>PROMPT_OS</h1>
          <p>JOURDANLABS_×_C&L_STRATEGY</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <button
          onClick={onHelp}
          title="Open user guide"
          style={{
            background: 'none',
            border: '2px solid currentColor',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ?
        </button>
      </div>
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
        <button
          onClick={() => setActiveMode('ship')}
          className={activeMode === 'ship' ? 'active' : ''}
        >
          [SHIP]
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
function MinimalHeader({ activeMode, setActiveMode, theme, setTheme, onHelp }: any) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <button
          onClick={onHelp}
          title="Open user guide"
          style={{
            background: 'none',
            border: '1.5px solid #d1d5db',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ?
        </button>
      </div>
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
        <button
          onClick={() => setActiveMode('ship')}
          className={activeMode === 'ship' ? 'active' : ''}
        >
          <Rocket className="w-4 h-4" />
          Ship
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
function TerminalHeader({ activeMode, setActiveMode, theme, setTheme, onHelp }: any) {
  return (
    <header className="terminal-header">
      <div className="terminal-title">
        <TerminalIcon className="w-5 h-5" />
        <span>Prompt OS — JourdanLabs × C&L Strategy — ~</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <button
          onClick={onHelp}
          title="Open user guide"
          style={{
            background: 'none',
            border: '1px solid #4ade80',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            color: '#4ade80',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontFamily: 'monospace',
          }}
        >
          ?
        </button>
      </div>
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
        <button
          onClick={() => setActiveMode('ship')}
          className={activeMode === 'ship' ? 'active' : ''}
        >
          ▶ ship/
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
  const [showGuide, setShowGuide] = useState(false);
  const [activeMode, setActiveMode] = useState<'templates' | 'custom' | 'ship'>('templates');
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

  // Ship mode state
  const [shipPrompt, setShipPrompt] = useState('');
  const [shipPlan, setShipPlan] = useState<any>(null);
  const [isPlanningShip, setIsPlanningShip] = useState(false);
  const [isExecutingShip, setIsExecutingShip] = useState(false);
  const [shipError, setShipError] = useState('');
  const [shipResult, setShipResult] = useState<any>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');

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

  // Ship mode functions
  const planShip = async () => {
    const promptToUse = isEditingPlan ? editedPrompt : shipPrompt;
    if (!promptToUse.trim()) return;
    
    setIsPlanningShip(true);
    setShipError('');
    setShipPlan(null);
    setShipResult(null);
    
    try {
      const response = await fetch('/api/ship/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToUse })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate plan');
      setShipPlan(data.plan);
      setIsEditingPlan(false);
    } catch (err) {
      setShipError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsPlanningShip(false);
    }
  };

  const executeShip = async () => {
    if (!shipPlan) return;
    
    setIsExecutingShip(true);
    setShipError('');
    
    try {
      const response = await fetch('/api/ship/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: shipPlan, prompt: shipPrompt })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to execute plan');
      setShipResult(data);
    } catch (err) {
      setShipError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsExecutingShip(false);
    }
  };

  const startEditPlan = () => {
    setIsEditingPlan(true);
    setEditedPrompt(shipPrompt);
  };

  const cancelShip = () => {
    setShipPlan(null);
    setShipResult(null);
    setIsEditingPlan(false);
    setEditedPrompt('');
  };

  // Render appropriate header based on theme
  const renderHeader = () => {
    const props = { activeMode, setActiveMode, theme, setTheme, onHelp: () => setShowGuide(true) };
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

  // Render ship mode
  const renderShipMode = () => {
    return (
      <div className={`custom-panel ${theme}`}>
        <div className={`custom-header ${theme}`}>
          <Rocket className="w-6 h-6" />
          <div>
            <h2>Ship Mode</h2>
            <p>Describe what you want to build in plain English</p>
          </div>
        </div>

        <div className={`custom-form ${theme}`}>
          {!shipPlan && !isEditingPlan && (
            <>
              <div className="form-field">
                <label>What do you want to build?</label>
                <textarea
                  value={shipPrompt}
                  onChange={(e) => setShipPrompt(e.target.value)}
                  placeholder="E.g., A simple todo app with local storage, a markdown editor with live preview, etc..."
                  rows={8}
                  className={`prompt-input ${theme}`}
                  style={{ fontSize: '16px' }}
                />
              </div>

              <button
                onClick={planShip}
                disabled={!shipPrompt.trim() || isPlanningShip}
                className={`optimize-btn ${theme}`}
              >
                {isPlanningShip ? (
                  <><div className="spinner" /> Planning...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Plan it ✨</>
                )}
              </button>
            </>
          )}

          {isEditingPlan && (
            <>
              <div className="form-field">
                <label>Edit your request</label>
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  placeholder="Refine what you want to build..."
                  rows={6}
                  className={`prompt-input ${theme}`}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={planShip}
                  disabled={!editedPrompt.trim() || isPlanningShip}
                  className={`optimize-btn ${theme}`}
                  style={{ flex: 1 }}
                >
                  {isPlanningShip ? (
                    <><div className="spinner" /> Re-planning...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Re-plan</>
                  )}
                </button>
                <button
                  onClick={() => setIsEditingPlan(false)}
                  className={`optimize-btn ${theme}`}
                  style={{ flex: 0, opacity: 0.7 }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {shipError && <div className={`error-msg ${theme}`}>{shipError}</div>}

          {shipPlan && !isEditingPlan && (
            <div className={`optimized-result ${theme}`}>
              <div className={`result-header ${theme}`}>
                <Package className="w-5 h-5" />
                <h3>Build Plan</h3>
              </div>
              
              <div className="ship-plan-content" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', opacity: 0.7 }}>Objective</h4>
                  <p style={{ margin: 0 }}>{shipPlan.objective}</p>
                </div>

                {shipPlan.architecture && (
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', opacity: 0.7 }}>Architecture</h4>
                    <p style={{ margin: 0 }}>{shipPlan.architecture}</p>
                  </div>
                )}

                {shipPlan.tech && shipPlan.tech.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', opacity: 0.7 }}>Tech Stack</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {shipPlan.tech.map((tech: string, i: number) => (
                        <span key={i} className={`minimal-tag`} style={{ margin: 0 }}>{tech}</span>
                      ))}
                    </div>
                  </div>
                )}

                {shipPlan.steps && shipPlan.steps.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', opacity: 0.7 }}>Steps</h4>
                    <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {shipPlan.steps.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {shipPlan.files_to_create && shipPlan.files_to_create.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', opacity: 0.7 }}>Files to Create</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontFamily: 'monospace' }}>
                      {shipPlan.files_to_create.map((file: string, i: number) => (
                        <li key={i}>{file}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                  {shipPlan.estimated_complexity && (
                    <div>
                      <span style={{ opacity: 0.7 }}>Complexity: </span>
                      <strong>{shipPlan.estimated_complexity}</strong>
                    </div>
                  )}
                  {shipPlan.estimated_time && (
                    <div>
                      <span style={{ opacity: 0.7 }}>Time: </span>
                      <strong>{shipPlan.estimated_time}</strong>
                    </div>
                  )}
                </div>

                {shipPlan.assumptions && shipPlan.assumptions.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', opacity: 0.7 }}>Assumptions</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
                      {shipPlan.assumptions.map((assumption: string, i: number) => (
                        <li key={i}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {shipPlan.risks && shipPlan.risks.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', opacity: 0.7, color: '#f59e0b' }}>Risks</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
                      {shipPlan.risks.map((risk: string, i: number) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={executeShip}
                  disabled={isExecutingShip}
                  className={`optimize-btn ${theme}`}
                  style={{ flex: 1 }}
                >
                  {isExecutingShip ? (
                    <><div className="spinner" /> Shipping...</>
                  ) : (
                    <><Rocket className="w-5 h-5" /> Ship it! 🚀</>
                  )}
                </button>
                <button
                  onClick={startEditPlan}
                  className={`optimize-btn ${theme}`}
                  style={{ flex: 0, opacity: 0.8 }}
                >
                  <PenLine className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={cancelShip}
                  className={`optimize-btn ${theme}`}
                  style={{ flex: 0, opacity: 0.7 }}
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          )}

          {shipResult && (
            <div className={`optimized-result ${theme}`} style={{ marginTop: '16px' }}>
              <div className={`result-header ${theme}`}>
                <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                <h3>Execution Result</h3>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ margin: 0, marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>{shipResult.message}</p>
                {shipResult.cloudMode && (
                  <div style={{ marginTop: '12px', padding: '12px 16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>⚡ Build execution requires local install</p>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', opacity: 0.8 }}>
                      The web version generates your build plan with AI. To execute builds and generate actual code, install ShipMachine locally:
                    </p>
                    <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', padding: '10px 12px', whiteSpace: 'pre-wrap' }}>{`npx shipmachine ship "your prompt here"`}</pre>
                    <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.6 }}>
                      <a href="https://github.com/lelandsequel/shipmachine#quick-start" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>View install guide →</a>
                    </p>
                  </div>
                )}
                {shipResult.projectDir && (
                  <p style={{ margin: '8px 0', fontSize: '13px', fontFamily: 'monospace', opacity: 0.8 }}>
                    📁 {shipResult.projectDir}
                  </p>
                )}
                {shipResult.filesCreated?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600 }}>Files created:</p>
                    <div style={{ fontSize: '12px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', padding: '8px 12px', maxHeight: '150px', overflow: 'auto' }}>
                      {shipResult.filesCreated.map((f: string, i: number) => <div key={i}>{f}</div>)}
                    </div>
                  </div>
                )}
                {shipResult.stdout && (
                  <details style={{ marginTop: '12px' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Build output</summary>
                    <pre style={{ fontSize: '11px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', padding: '8px 12px', maxHeight: '200px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>{shipResult.stdout}</pre>
                  </details>
                )}
              </div>
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
        ) : activeMode === 'custom' ? (
          renderCustomMode()
        ) : (
          renderShipMode()
        )}
      </main>
      <Footer theme={theme} />
      <UserGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
