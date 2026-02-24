import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { plan, prompt } = await request.json();

    if (!plan || !prompt) {
      return NextResponse.json(
        { error: 'Plan and prompt are required' },
        { status: 400 }
      );
    }

    // On Vercel, we can't spawn ShipMachine locally.
    // Return the plan confirmation with a note to use CLI for full execution.
    if (process.env.VERCEL) {
      return NextResponse.json({
        success: true,
        message: 'Plan approved! Use `shipmachine ship` locally to execute builds.',
        cloudMode: true,
        plan,
      });
    }

    // Local execution: spawn ShipMachine CLI
    const { spawn } = await import('child_process');
    const path = await import('path');
    const fs = await import('fs');

    const BUILDS_DIR = path.resolve(process.cwd(), 'builds');
    const SHIPMACHINE_CLI = path.resolve(process.cwd(), '..', 'zeroclaw-shipmachine', 'cli', 'index.js');

    const slug = (plan.objective || prompt)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    const timestamp = Date.now();
    const projectDir = path.join(BUILDS_DIR, `${slug}-${timestamp}`);
    fs.mkdirSync(projectDir, { recursive: true });

    fs.writeFileSync(
      path.join(projectDir, 'PLAN.md'),
      `# Build Plan\n\n**Objective:** ${plan.objective}\n\n**Architecture:** ${plan.architecture || 'N/A'}\n\n**Tech:** ${(plan.tech || []).join(', ')}\n\n**Style:** ${plan.style || 'N/A'}\n\n## Steps\n${(plan.steps || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n\n## Files to Create\n${(plan.files_to_create || []).map((f: string) => `- ${f}`).join('\n')}\n`
    );

    if (!fs.existsSync(path.join(projectDir, 'package.json'))) {
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: slug, version: '0.1.0', private: true }, null, 2)
      );
    }

    const objective = plan.objective || prompt;

    const result = await new Promise<{ success: boolean; stdout: string; stderr: string; code: number | null }>((resolve) => {
      let stdout = '';
      let stderr = '';

      const proc = spawn('node', [
        SHIPMACHINE_CLI,
        'run-task',
        '--objective', objective,
        '--repo', projectDir,
      ], {
        cwd: projectDir,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
          NO_COLOR: '1',
        },
        timeout: 300_000,
      });

      proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
      proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });
      proc.on('close', (code: number | null) => resolve({ success: code === 0, stdout, stderr, code }));
      proc.on('error', (err: Error) => resolve({ success: false, stdout, stderr: err.message, code: null }));
    });

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
      stdout: result.stdout.slice(-3000),
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
