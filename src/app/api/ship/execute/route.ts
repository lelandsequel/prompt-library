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

    // On Vercel (or any env without local ShipMachine), return cloud mode response
    if (process.env.VERCEL || !process.env.SHIPMACHINE_LOCAL) {
      return NextResponse.json({
        success: true,
        message: 'Plan approved! Use ShipMachine locally to execute builds.',
        cloudMode: true,
        plan,
      });
    }

    // Local-only: shell out to shipmachine CLI via exec
    // This avoids any static imports that Turbopack would try to resolve
    const { execSync } = await import('child_process');
    const { mkdirSync, writeFileSync, readdirSync, statSync } = await import('fs');
    const { join, resolve } = await import('path');

    const buildsDir = resolve(process.cwd(), 'builds');
    const slug = (plan.objective || prompt)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    const timestamp = Date.now();
    const projectDir = join(buildsDir, `${slug}-${timestamp}`);
    mkdirSync(projectDir, { recursive: true });

    writeFileSync(
      join(projectDir, 'PLAN.md'),
      `# Build Plan\n\n**Objective:** ${plan.objective}\n\n**Architecture:** ${plan.architecture || 'N/A'}\n\n**Tech:** ${(plan.tech || []).join(', ')}\n\n**Style:** ${plan.style || 'N/A'}\n\n## Steps\n${(plan.steps || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n\n## Files to Create\n${(plan.files_to_create || []).map((f: string) => `- ${f}`).join('\n')}\n`
    );

    writeFileSync(
      join(projectDir, 'package.json'),
      JSON.stringify({ name: slug, version: '0.1.0', private: true }, null, 2)
    );

    const objective = (plan.objective || prompt).replace(/"/g, '\\"');
    const cmd = `node "${resolve(process.cwd(), '..', 'zeroclaw-shipmachine', 'cli', 'index.js')}" run-task --objective "${objective}" --repo "${projectDir}" 2>&1`;

    let stdout = '';
    let success = false;
    try {
      stdout = execSync(cmd, {
        timeout: 300_000,
        env: { ...process.env, NO_COLOR: '1' },
        maxBuffer: 10 * 1024 * 1024,
      }).toString();
      success = true;
    } catch (err: unknown) {
      const e = err as { stdout?: Buffer; stderr?: Buffer };
      stdout = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
    }

    // Walk files
    const filesCreated: string[] = [];
    const walk = (dir: string, prefix = '') => {
      try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          if (entry.name === 'node_modules' || entry.name === '.git') continue;
          const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) walk(join(dir, entry.name), rel);
          else filesCreated.push(rel);
        }
      } catch { /* ignore */ }
    };
    walk(projectDir);

    return NextResponse.json({
      success,
      message: success
        ? `Build complete! Project at builds/${slug}-${timestamp}`
        : `Build finished. Check output for details.`,
      projectDir: `builds/${slug}-${timestamp}`,
      filesCreated,
      stdout: stdout.slice(-3000),
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
