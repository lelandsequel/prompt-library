import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const BUILDS_DIR = path.resolve(process.cwd(), 'builds');
const SHIPMACHINE_DIR = path.resolve(process.cwd(), '..', 'zeroclaw-shipmachine');
const SHIPMACHINE_CLI = path.join(SHIPMACHINE_DIR, 'cli', 'index.js');

export async function POST(request: Request) {
  try {
    const { plan, prompt } = await request.json();

    if (!plan || !prompt) {
      return NextResponse.json(
        { error: 'Plan and prompt are required' },
        { status: 400 }
      );
    }

    // Create a project directory based on the objective
    const slug = (plan.objective || prompt)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    const timestamp = Date.now();
    const projectDir = path.join(BUILDS_DIR, `${slug}-${timestamp}`);
    fs.mkdirSync(projectDir, { recursive: true });

    // Write the plan as a seed file so ShipMachine has context
    fs.writeFileSync(
      path.join(projectDir, 'PLAN.md'),
      `# Build Plan\n\n**Objective:** ${plan.objective}\n\n**Architecture:** ${plan.architecture || 'N/A'}\n\n**Tech:** ${(plan.tech || []).join(', ')}\n\n**Style:** ${plan.style || 'N/A'}\n\n## Steps\n${(plan.steps || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n\n## Files to Create\n${(plan.files_to_create || []).map((f: string) => `- ${f}`).join('\n')}\n`
    );

    // Initialize a basic package.json so it's a valid project
    if (!fs.existsSync(path.join(projectDir, 'package.json'))) {
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: slug, version: '0.1.0', private: true }, null, 2)
      );
    }

    // Run ShipMachine via CLI
    const objective = plan.objective || prompt;
    const cliPath = SHIPMACHINE_CLI;

    const result = await new Promise<{ success: boolean; stdout: string; stderr: string; code: number | null }>((resolve) => {
      let stdout = '';
      let stderr = '';

      const proc = spawn('node', [
        cliPath,
        'run-task',
        '--objective', objective,
        '--repo', projectDir,
        // '--dry-run', // Removed — actually execute
      ], {
        cwd: projectDir,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
          NO_COLOR: '1',
        },
        timeout: 300_000, // 5 min
      });

      proc.stdout?.on('data', (d) => { stdout += d.toString(); });
      proc.stderr?.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        resolve({ success: code === 0, stdout, stderr, code });
      });

      proc.on('error', (err) => {
        resolve({ success: false, stdout, stderr: err.message, code: null });
      });
    });

    // List files created
    const filesCreated: string[] = [];
    const walk = (dir: string, prefix = '') => {
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.name === 'node_modules' || entry.name === '.git') continue;
          const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) walk(path.join(dir, entry.name), rel);
          else filesCreated.push(rel);
        }
      } catch { /* ignore */ }
    };
    walk(projectDir);

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Build complete! Project at builds/${slug}-${timestamp}`
        : `Build finished with code ${result.code}`,
      projectDir: `builds/${slug}-${timestamp}`,
      filesCreated,
      stdout: result.stdout.slice(-3000), // last 3K chars
      stderr: result.stderr.slice(-1000),
      plan,
    });
  } catch (error) {
    console.error('Error in /api/ship/execute:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute build' },
      { status: 500 }
    );
  }
}
