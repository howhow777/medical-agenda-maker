#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';

const RELEASE_FILES = [
  'index.html',
  'styles.css',
  'src/assets/feedback-modal.css',
  'dist/interface/accordionController.js',
  'dist/interface/cancerDesignSwitcher.js',
  'dist/interface/canvasInteractions.js',
  'dist/interface/cropController-fixed.js',
  'dist/interface/feedbackController.js',
  'dist/interface/fileUploader.js',
  'dist/interface/formControls.js',
  'dist/interface/roofStyleControls.js',
  'dist/interface/templateController.js',
  'dist/interface/touchDebugController.js',
  'dist/interface/uiController.js',
  'dist/interface/updateNoticeController.js',
  'dist/logic/cancerDesignPresets.js',
  'dist/logic/canvas-utils.js',
  'dist/logic/colorSchemes.js',
  'dist/logic/dataConverter.js',
  'dist/logic/dataManager.js',
  'dist/logic/excelParser.js',
  'dist/logic/headerContours.js',
  'dist/logic/overlay-processor.js',
  'dist/logic/overlayManager.js',
  'dist/logic/posterRenderer.js',
  'dist/logic/roofColorMath.js',
  'dist/logic/roofCompositor.js',
  'dist/logic/roofMaterials.js',
  'dist/logic/roofSelection.js',
  'dist/logic/roofStyles.js',
  'dist/logic/roofTypography.js',
  'dist/logic/templateManager.js',
  'dist/logic/templates.js',
  'dist/main.js',
  'assets/cancer-motifs-v3/breast-precision-focus-ribbon.png',
  'assets/cancer-motifs-v3/breast-self-embrace.png',
  'assets/cancer-motifs-v3/breast-tissue-ribbon.png',
  'assets/cancer-motifs-v3/colorectal-restored-ecology.png',
  'assets/cancer-motifs-v3/colorectal-screening-window.png',
  'assets/cancer-motifs-v3/colorectal-treatment-atlas.png',
  'assets/cancer-motifs-v3/gyn-breaking-treatment-barrier.png',
  'assets/cancer-motifs-v3/gyn-reproductive-garden.png',
  'assets/cancer-motifs-v3/gyn-therapeutic-containment.png',
  'assets/cancer-motifs-v3/headneck-closed-lip-diagnostic.png',
  'assets/cancer-motifs-v3/headneck-cradled-care.png',
  'assets/cancer-motifs-v3/headneck-xray-diagnostic.png',
  'assets/cancer-motifs-v3/lung-alveoli-immune-constellation.png',
  'assets/cancer-motifs-v3/lung-imaging-orbit.png',
  'assets/cancer-motifs-v3/lung-tree-of-breath.png',
  'assets/cancer-motifs-v3/urinary-complete-system.png',
  'assets/cancer-motifs-v3/urinary-precision-orbit.png',
  'assets/cancer-motifs-v3/urinary-therapeutic-sanctuary.png',
  'assets/header-contour-materials-v2/breast-rose-satin-v1.png',
  'assets/header-contour-materials-v2/gyn-coral-arch-v1.png',
  'assets/header-contour-materials-v2/lung-satin-arc-v1.png',
  'assets/header-contour-materials-v2/manifest.json',
  'assets/header-contour-materials-v2/signal-mother-v4.png',
  'assets/header-contour-materials-v2/urinary-waterlight-v1.png',
  'assets/header-contour-materials-v2/warm-peach-flow-v1.png',
  'qa/approved-roofs-compositor-qa.js',
  'qa/approved-roofs-fixture.js',
  'qa/approved-roofs-maker-state-qa.js',
  'qa/approved-roofs-reference-metrics.json',
  'qa/approved-roofs-responsive-qa.js',
  'qa/approved-roofs-runtime-qa.html',
  'qa/approved-roofs-runtime-qa.js',
  'qa/approved-roofs-typography-qa.js'
];

const forbidden = [
  /(^|\/)assets\/cancer-motifs-v2(\/|$)/,
  /(^|\/)qa\/design-review-assets(\/|$)/,
  /(^|\/)\.superdesign(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)\.wrangler(\/|$)/,
  /(^|\/)test(\/|$)/,
  /(^|\/)docs(\/|$)/,
  /\.map$/,
  /(^|\/)\.env(?:\.|$)/
];

function parseArgs(argv) {
  const args = { profile: 'release', deploy: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--deploy') args.deploy = true;
    else if (value === '--source') args.source = argv[++index];
    else if (value === '--output') args.output = argv[++index];
    else if (value === '--report') args.report = argv[++index];
    else if (value === '--profile') args.profile = argv[++index];
    else if (value === '--baseline-manifest') args.baselineManifest = argv[++index];
    else if (value === '--config') args.config = argv[++index];
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!args.source || !args.output || !args.report) {
    throw new Error('Required: --source <committed-ref> --output <new-directory> --report <json-path>');
  }
  if (!['release', 'baseline'].includes(args.profile)) throw new Error(`Unknown profile: ${args.profile}`);
  if (args.profile === 'baseline' && !args.baselineManifest) {
    throw new Error('Baseline profile requires --baseline-manifest <public-baseline.json>');
  }
  return args;
}

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', chunk => { stdout.push(chunk); process.stdout.write(chunk); });
    child.stderr.on('data', chunk => { stderr.push(chunk); process.stderr.write(chunk); });
    child.on('error', reject);
    child.on('close', code => {
      const result = { code, stdout: Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString() };
      if (code === 0) resolve(result);
      else reject(Object.assign(new Error(`${command} exited ${code}`), { result }));
    });
  });
}

async function gitBytes(repo, revision, file) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', ['-C', repo, 'show', `${revision}:${file}`], { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', chunk => stdout.push(chunk));
    child.stderr.on('data', chunk => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve(Buffer.concat(stdout));
      else reject(new Error(`Committed file unavailable (${file}): ${Buffer.concat(stderr).toString().trim()}`));
    });
  });
}

async function assertNewDirectory(directory) {
  try {
    await stat(directory);
    throw new Error(`Output directory already exists: ${directory}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(directory, { recursive: true });
}

async function baselineManifest(manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) throw new Error('Baseline manifest has no files');
  return {
    files: manifest.files.map(item => item.path),
    expected: new Map(manifest.files.map(item => [item.path, { bytes: item.bytes, sha256: item.sha256 }]))
  };
}

function validateAllowlist(files) {
  const duplicates = files.filter((file, index) => files.indexOf(file) !== index);
  if (duplicates.length) throw new Error(`Duplicate allowlist paths: ${[...new Set(duplicates)].join(', ')}`);
  for (const file of files) {
    if (!file || path.isAbsolute(file) || file.includes('..') || forbidden.some(pattern => pattern.test(file))) {
      throw new Error(`Forbidden or unsafe bundle path: ${file}`);
    }
  }
}

async function parsePreviewConfig(configPath) {
  const text = await readFile(configPath, 'utf8');
  const normalized = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/,\s*([}\]])/g, '$1');
  const config = JSON.parse(normalized);
  const customDomains = (config.routes || []).filter(route => route.custom_domain).map(route => route.pattern);
  if (config.name !== 'medical-agenda-preview') throw new Error(`Unexpected Worker: ${config.name}`);
  if (customDomains.length !== 1 || customDomains[0] !== 'medical-agenda-preview.promelink.link') {
    throw new Error(`Unexpected preview custom domain set: ${customDomains.join(', ')}`);
  }
  return { name: config.name, customDomains };
}

const args = parseArgs(process.argv.slice(2));
const repo = process.cwd();
const source = (await run('git', ['-C', repo, 'rev-parse', `${args.source}^{commit}`])).stdout.trim();
const output = path.resolve(args.output);
const reportPath = path.resolve(args.report);
const configPath = path.resolve(args.config || path.join(repo, 'wrangler.preview.jsonc'));
const baseline = args.profile === 'baseline' ? await baselineManifest(path.resolve(args.baselineManifest)) : undefined;
const files = args.profile === 'release' ? RELEASE_FILES : baseline.files;
validateAllowlist(files);
await assertNewDirectory(output);

const records = [];
try {
  for (const file of files) {
    const bytes = await gitBytes(repo, source, file);
    const destination = path.join(output, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
    records.push({ path: file, bytes: bytes.length, sha256: sha256(bytes) });
  }

  records.sort((a, b) => a.path.localeCompare(b.path));
  if (baseline) {
    for (const record of records) {
      const expected = baseline.expected.get(record.path);
      if (!expected || expected.bytes !== record.bytes || expected.sha256 !== record.sha256) {
        throw new Error(`Baseline mismatch: ${record.path}`);
      }
    }
  }
  const manifestBytes = Buffer.from(JSON.stringify(records));
  const bundleManifestSHA256 = sha256(manifestBytes);
  const version = `approved-roofs-${source.slice(0, 12)}`;
  const buildInfo = args.profile === 'release' ? { version, commit: source, bundleManifestSHA256 } : undefined;
  const buildInfoBytes = buildInfo ? Buffer.from(`${JSON.stringify(buildInfo, null, 2)}\n`) : undefined;
  if (buildInfoBytes) await writeFile(path.join(output, 'build-info.json'), buildInfoBytes);

  const verification = [];
  for (const record of records) {
    const bytes = await readFile(path.join(output, record.path));
    verification.push(record.bytes === bytes.length && record.sha256 === sha256(bytes));
  }
  if (!verification.every(Boolean)) throw new Error('Post-copy byte/hash verification failed');
  const bundlePaths = [];
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else bundlePaths.push(path.relative(output, full));
    }
  }
  await walk(output);
  const expected = [...records.map(item => item.path), ...(buildInfo ? ['build-info.json'] : [])].sort();
  if (JSON.stringify(bundlePaths.sort()) !== JSON.stringify(expected)) throw new Error('Bundle contains a non-allowlisted file');

  const preview = await parsePreviewConfig(configPath);
  const report = {
    schemaVersion: 1,
    mode: args.deploy ? 'deploy' : 'dry-run',
    profile: args.profile,
    source,
    output,
    preview,
    baselineVerified: baseline ? true : undefined,
    fileCount: expected.length,
    bundleManifestSHA256,
    buildInfo: buildInfo ? { ...buildInfo, bytes: buildInfoBytes.length, sha256: sha256(buildInfoBytes) } : undefined,
    files: records
  };

  if (args.deploy) {
    if (args.profile !== 'release') throw new Error('Deployment is permitted only for the release profile');
    if (!process.env.CLOUDFLARE_API_TOKEN) throw new Error('CLOUDFLARE_API_TOKEN is required for --deploy');
    const deployed = await run('npx', ['--yes', 'wrangler@4.131.1', 'deploy', '--config', configPath, '--assets', output], {
      cwd: repo,
      env: process.env
    });
    report.deploymentOutput = deployed.stdout;
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ mode: report.mode, profile: report.profile, source, fileCount: report.fileCount, bundleManifestSHA256, report: reportPath }, null, 2)}\n`);
} catch (error) {
  await rm(output, { recursive: true, force: true });
  throw error;
}
