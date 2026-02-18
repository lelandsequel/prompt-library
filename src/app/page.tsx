'use client';

import { useState, useMemo } from 'react';
import { 
  Eye, Bug, Building2, Globe, AlertTriangle, 
  CheckCircle, Wand2, Shield, Zap, LayoutGrid,
  Code, FileText, Settings, Lock, Copy, Check,
  ChevronDown, Sparkles, X
} from 'lucide-react';
import { templates, llmPresets, categories, Template, LLMPreset, TemplateVariable } from '@/data/templates';

const iconMap: Record<string, React.ElementType> = {
  Eye, Bug, Building2, Globe, AlertTriangle, 
  CheckCircle, Wand2, Shield, Zap, LayoutGrid,
  Code, FileText, Settings, Lock
};

export default function PromptLibrary() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedLLM, setSelectedLLM] = useState<LLMPreset>(llmPresets[0]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [showLLMDropdown, setShowLLMDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    
    // Replace all variables in the prompt
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

  const renderVariableInput = (variable: TemplateVariable) => {
    const value = variableValues[variable.name] || '';
    
    if (variable.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="">{variable.placeholder}</option>
          {variable.options?.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (variable.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
          placeholder={variable.placeholder}
          rows={4}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
        placeholder={variable.placeholder}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Prompt Library</h1>
                <p className="text-sm text-slate-400">JourdanLabs</p>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Enterprise Prompt Engineering
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Template List */}
          <div className="lg:col-span-4 space-y-6">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full px-4 py-3 pl-10 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => {
                const Icon = iconMap[category.icon] || LayoutGrid;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>

            {/* Template Cards */}
            <div className="space-y-3">
              {filteredTemplates.map(template => {
                const Icon = iconMap[template.icon] || Code;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-600/20 border-blue-500'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedTemplate?.id === template.id
                          ? 'bg-blue-600'
                          : 'bg-slate-800'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{template.name}</h3>
                        <p className="text-sm text-slate-400 line-clamp-2 mt-1">{template.description}</p>
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-slate-800 rounded-full text-slate-400">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Form & Output */}
          <div className="lg:col-span-8">
            {selectedTemplate ? (
              <div className="space-y-6">
                {/* Template Header */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-center gap-4 mb-4">
                    {(() => {
                      const Icon = iconMap[selectedTemplate.icon] || Code;
                      return <Icon className="w-8 h-8 text-blue-400" />;
                    })()}
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedTemplate.name}</h2>
                      <p className="text-slate-400">{selectedTemplate.description}</p>
                    </div>
                  </div>
                </div>

                {/* Variable Form */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Fill in Variables</h3>
                  <div className="space-y-4">
                    {selectedTemplate.variables.map(variable => (
                      <div key={variable.name}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {variable.label}
                          {variable.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {renderVariableInput(variable)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* LLM Selection */}
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Select LLM Preset</h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowLLMDropdown(!showLLMDropdown)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white hover:border-slate-500 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold">{selectedLLM.name.charAt(0)}</span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{selectedLLM.name}</div>
                          <div className="text-xs text-slate-400">{selectedLLM.description}</div>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showLLMDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showLLMDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl overflow-hidden z-10 shadow-xl">
                        {llmPresets.map(llm => (
                          <button
                            key={llm.id}
                            onClick={() => {
                              setSelectedLLM(llm);
                              setShowLLMDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-all ${
                              selectedLLM.id === llm.id ? 'bg-slate-700' : ''
                            }`}
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-bold">{llm.name.charAt(0)}</span>
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-white">{llm.name}</div>
                              <div className="text-xs text-slate-400">{llm.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generatePrompt}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Prompt
                </button>

                {/* Generated Output */}
                {generatedPrompt && (
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-slate-700">
                      <h3 className="font-semibold text-white">Generated Prompt</h3>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-all"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-6">
                      <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono leading-relaxed">
                        {generatedPrompt}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Select a Template</h3>
                <p className="text-slate-400 max-w-md">
                  Choose a template from the list to get started. Fill in the variables and generate prompts optimized for your preferred LLM.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Search({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
