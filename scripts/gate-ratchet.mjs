#!/usr/bin/env node
// Decrease-only ratchet for the lint and typecheck gates.
//
// WHY A RATCHET AND NOT A WALL. Both gates were inert for months (see PR #24), so
// arming them reveals a backlog nobody can clear in one change. A gate that fails on
// arrival is switched off within a day; a ratchet set at the measured baseline binds
// immediately and can only ever fall.
//
// THE TRAP THIS SCRIPT EXISTS TO AVOID, and it is this repository's own original bug.
// When ESLint could not load its config it examined ZERO files and reported ZERO
// problems. A naive ratchet reads 0 <= 226 and reports success — recreating the exact
// failure the ratchet was added to catch, this time wearing a green tick.
//
// So green must carry a count, and the count is asserted against the FILESYSTEM rather
// than against the tool that produced it. If the tool sees fewer files than exist on
// disk, that is a failure whatever the problem count says.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const BASELINE = 'gate-baseline.json';
const SRC = 'src';
const mode = process.argv[2];
const write = process.argv.includes('--write-baseline');

function sourceFilesOnDisk(dir = SRC, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sourceFilesOnDisk(p, acc);
    else if (/\.tsx?$/.test(p)) acc.push(relative('.', p));
  }
  return acc;
}

function run(cmd, args) {
  try {
    return {
      out: execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }),
      code: 0,
    };
  } catch (e) {
    return { out: `${e.stdout ?? ''}${e.stderr ?? ''}`, code: e.status ?? 1 };
  }
}

function measureLint() {
  const disk = sourceFilesOnDisk();
  const { out } = run('bunx', ['eslint', SRC, '-f', 'json']);
  let report;
  try {
    report = JSON.parse(out.slice(out.indexOf('[')));
  } catch {
    return {
      fatal: `eslint produced no parseable JSON report. First 400 chars:\n${out.slice(0, 400)}`,
    };
  }
  const examined = report.length;
  if (examined < disk.length) {
    return {
      fatal:
        `eslint examined ${examined} file(s) but ${disk.length} exist under ${SRC}/.\n` +
        `A short denominator is a failure, never a clean result: a config error makes eslint\n` +
        `report zero problems over zero files, which is what this check exists to catch.`,
    };
  }
  const errors = report.reduce((n, f) => n + f.errorCount, 0);
  const warnings = report.reduce((n, f) => n + f.warningCount, 0);
  return { errors, warnings, examined, onDisk: disk.length };
}

function measureTypecheck() {
  const disk = sourceFilesOnDisk();
  const { out } = run('bunx', ['tsc', '--noEmit']);
  if (/error TS(5\d{3}|6\d{3})\b/.test(out) || /Cannot find type definition file/.test(out)) {
    return {
      fatal: `tsc reported a CONFIGURATION error, so it checked nothing:\n${out.slice(0, 600)}`,
    };
  }
  const errors = (out.match(/error TS/g) ?? []).length;
  return { errors, warnings: 0, examined: disk.length, onDisk: disk.length };
}

const measured = mode === 'lint' ? measureLint() : mode === 'typecheck' ? measureTypecheck() : null;
if (!measured) {
  console.error('usage: gate-ratchet.mjs <lint|typecheck> [--write-baseline]');
  process.exit(2);
}
if (measured.fatal) {
  console.error(
    `RATCHET FAILED (${mode}): the gate could not run over the whole source tree.\n${measured.fatal}`,
  );
  process.exit(1);
}

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {};
if (write) {
  baseline[mode] = { errors: measured.errors, warnings: measured.warnings };
  writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`baseline written: ${mode} errors=${measured.errors} warnings=${measured.warnings}`);
  process.exit(0);
}

const base = baseline[mode];
if (!base) {
  console.error(`RATCHET FAILED (${mode}): no baseline in ${BASELINE}. Run with --write-baseline.`);
  process.exit(1);
}

const line = `${mode}: ${measured.errors} error(s), ${measured.warnings} warning(s) across ${measured.examined} of ${measured.onDisk} source file(s) — baseline ${base.errors}/${base.warnings}`;
if (measured.errors > base.errors || measured.warnings > base.warnings) {
  console.error(`RATCHET FAILED — ${line}. This gate is decrease-only.`);
  process.exit(1);
}
if (measured.errors < base.errors || measured.warnings < base.warnings) {
  console.log(
    `RATCHET IMPROVED — ${line}. Lower the baseline: bun run gate:${mode} --write-baseline`,
  );
  process.exit(0);
}
console.log(`RATCHET HELD — ${line}`);
process.exit(0);
