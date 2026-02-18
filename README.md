# JourdanLabs Prompt Library

A Next.js-based web application for generating optimized prompts for various Large Language Models (LLMs). The library provides pre-built templates for common development tasks and allows users to customize prompts for their preferred AI assistant.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Template Descriptions](#template-descriptions)
- [LLM Presets](#llm-presets)
- [How to Use](#how-to-use)
- [Customization](#customization)
- [Project Structure](#project-structure)

---

## Overview

JourdanLabs Prompt Library is an enterprise-grade prompt engineering tool that helps developers and technical teams generate high-quality prompts for:

- Code reviews
- Debugging and troubleshooting
- Architecture documentation
- API design
- Incident response planning
- Test case generation
- Code refactoring
- Security reviews
- Performance optimization

The app generates prompts optimized for different LLM platforms including ChatGPT, Claude, Cursor, Copilot, and Gemini.

---

## Features

- **9 Built-in Templates** - Pre-designed prompts for common development scenarios
- **5 LLM Presets** - Optimized output formats for different AI assistants
- **Real-time Preview** - See your prompt update as you fill in variables
- **One-click Copy** - Copy generated prompts to clipboard instantly
- **Category Filtering** - Browse templates by category (Development, Documentation, Operations, Security)
- **Search Functionality** - Quickly find templates by name or description
- **Responsive Design** - Works on desktop and mobile devices

---

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd prompt-library
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Environment Setup

### Required Environment Variables

This project does not require any environment variables for basic functionality. The app runs entirely client-side.

### Optional Configuration

For production deployment, you may want to configure:

- `NEXT_PUBLIC_APP_URL` - Your production URL (for analytics, sharing, etc.)
- Custom LLM API endpoints (future enhancement)

### Development Tools

- **Framework**: Next.js 16.x (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **Icons**: Lucide React
- **Runtime**: Node.js 18+

---

## Template Descriptions

### 1. Code Review
- **Category**: Development
- **Description**: Get a comprehensive code review with best practices and potential improvements
- **Variables**:
  - Programming Language (required)
  - Framework (optional)
  - Code to Review (required)
  - Focus Area (optional)
  - Additional Context (optional)
- **Use Case**: Submit code for detailed analysis covering bugs, security, performance, and best practices

### 2. Debugging/Troubleshooting
- **Category**: Development
- **Description**: Diagnose and fix bugs with step-by-step analysis
- **Variables**:
  - Programming Language (required)
  - Framework (optional)
  - Error Message (required)
  - Relevant Code (required)
  - What You Tried (optional)
- **Use Case**: Get help identifying root causes and solutions for code errors

### 3. Architecture Documentation
- **Category**: Documentation
- **Description**: Document system architecture, components, and design decisions
- **Variables**:
  - Project/System Name (required)
  - System Overview (required)
  - Key Components (required)
  - Technology Stack (required)
  - Additional Notes (optional)
- **Use Case**: Create comprehensive architecture documents for new systems or existing codebase

### 4. API Design
- **Category**: Development
- **Description**: Design RESTful or GraphQL APIs with proper patterns
- **Variables**:
  - API Type (required): REST, GraphQL, gRPC, WebSocket
  - API Purpose (required)
  - Resources/Entities (required)
  - Requirements (required)
  - Additional Context (optional)
- **Use Case**: Design new APIs with proper endpoint structure, schemas, and best practices

### 5. Incident Response
- **Category**: Operations
- **Description**: Create incident response plans and post-mortem templates
- **Variables**:
  - Incident Type (required): Service Outage, Data Breach, Performance, etc.
  - Severity Level (required): P1-P4
  - Systems Affected (required)
  - Business Impact (required)
  - Timeline Events (optional)
- **Use Case**: Develop response plans for production incidents

### 6. Writing Test Cases
- **Category**: Development
- **Description**: Generate comprehensive test cases for your code
- **Variables**:
  - Programming Language (required)
  - Testing Framework (required)
  - Code to Test (required)
  - Test Types (optional)
  - Edge Cases to Consider (optional)
- **Use Case**: Generate unit tests, integration tests, and edge case coverage

### 7. Refactoring Suggestions
- **Category**: Development
- **Description**: Get recommendations for improving code structure and quality
- **Variables**:
  - Programming Language (required)
  - Code to Refactor (required)
  - Refactoring Goals (required)
  - Constraints (optional)
- **Use Case**: Improve code readability, performance, and maintainability

### 8. Security Review
- **Category**: Security
- **Description**: Identify security vulnerabilities and best practices
- **Variables**:
  - Programming Language (required)
  - Code to Review (required)
  - Data Types Handled (required)
  - Additional Context (optional)
- **Use Case**: Identify OWASP Top 10 vulnerabilities and security improvements

### 9. Performance Optimization
- **Category**: Development
- **Description**: Optimize code for better performance and scalability
- **Variables**:
  - Programming Language (required)
  - Code to Optimize (required)
  - Known Bottlenecks (optional)
  - Constraints (optional)
  - Context (optional)
- **Use Case**: Optimize algorithms, database queries, and improve scalability

---

## LLM Presets

### 1. ChatGPT / OpenAI
- **ID**: `chatgpt`
- **Description**: Optimized for OpenAI models
- **Format Features**:
  - Clear section headers
  - Code block formatting with language tags
  - Context and task separation
  - Optional sections with conditional logic

### 2. Claude / Anthropic
- **ID**: `claude`
- **Description**: Optimized for Anthropic Claude models
- **Format Features**:
  - XML-like tag structure `<task>`, `<context>`, `<code>`, `<error>`
  - Structured input for better comprehension
  - Framework and environment details

### 3. Cursor
- **ID**: `cursor`
- **Description**: Optimized for Cursor AI code editor
- **Format Features**:
  - Markdown headers
  - Concise code sections
  - Error highlighting
  - Language specification

### 4. Copilot
- **ID**: `copilot`
- **Description**: Optimized for GitHub Copilot
- **Format Features**:
  - Single-line comment format
  - Compact inline styling
  - Minimal formatting for context filling

### 5. Gemini
- **ID**: `gemini`
- **Description**: Optimized for Google Gemini
- **Format Features**:
  - Clear instruction headers
  - Background/context separation
  - Solution-focused formatting

---

## How to Use

### Step-by-Step Guide

1. **Select a Template**
   - Browse the template list on the left sidebar
   - Use categories to filter (All, Development, Documentation, Operations, Security)
   - Use search to find specific templates

2. **Fill in Variables**
   - After selecting a template, fill in the required fields
   - Optional fields can be left blank or filled as needed
   - Required fields are marked with a red asterisk (*)

3. **Select LLM Preset**
   - Choose which LLM the prompt will be optimized for
   - Each preset formats the output differently

4. **Generate Prompt**
   - Click the "Generate Prompt" button
   - Review the generated prompt in the output area

5. **Copy and Use**
   - Click "Copy" to copy the prompt to your clipboard
   - Paste it into your preferred LLM interface

### Example Workflow

```
1. User clicks "Code Review" template
2. Fills in:
   - Language: TypeScript
   - Framework: React
   - Code: [pastes React component]
   - Focus Area: performance, security
3. Selects "Claude" preset
4. Clicks "Generate Prompt"
5. Copies the generated prompt
6. Pastes into Claude for code review
```

---

## Customization

### Adding New Templates

To add a new template, edit `/src/data/templates.ts`:

```typescript
{
  id: 'new-template',
  name: 'New Template Name',
  description: 'Description of what this template does',
  category: 'Development', // or 'Documentation', 'Operations', 'Security'
  icon: 'Code', // Icon name from lucide-react
  variables: [
    { 
      name: 'variable_name', 
      label: 'Display Label', 
      placeholder: 'Placeholder text', 
      required: true, 
      type: 'text' // or 'textarea', 'select'
    }
  ],
  prompt: `Your prompt template with {{variable_name}} placeholders`
}
```

### Adding New LLM Presets

To add a new LLM preset, edit the `llmPresets` array in `/src/data/templates.ts`:

```typescript
{
  id: 'new-llm',
  name: 'New LLM Name',
  description: 'Description',
  format: `Your format template with {{variables}}`
}
```

### Customizing Icons

The app uses Lucide React icons. Available icons include:
- Development: `Code`, `Bug`, `Wand2`, `Zap`
- Documentation: `FileText`, `Building2`
- Operations: `Settings`, `AlertTriangle`
- Security: `Lock`, `Shield`

### Styling

The app uses Tailwind CSS. Edit classes in:
- `/src/app/page.tsx` - Main component styling
- Global styles in `/src/app/globals.css` (if present)

---

## Project Structure

```
prompt-library/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Main application component
│   │   └── globals.css      # Global styles
│   └── data/
│       └── templates.ts     # Template and LLM preset definitions
├── public/                  # Static assets
├── package.json             # Dependencies
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.*        # Tailwind configuration
└── eslint.config.mjs        # ESLint configuration
```

---

## License

Private - JourdanLabs

---

## Support

For issues or questions, please contact the JourdanLabs team.
