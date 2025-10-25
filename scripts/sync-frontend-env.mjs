#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

const envFile = findEnvFile(frontendDir);
if (!envFile) {
  console.error('No frontend .env or .env.example file found. Nothing to sync.');
  process.exit(1);
}

const envValues = parseEnv(fs.readFileSync(envFile, 'utf8'));
const devApiBase = envValues.API_BASE_URL || 'http://localhost:4000';
const prodApiBase = envValues.API_BASE_URL_PROD || envValues.API_BASE_URL || 'https://api.yourdomain.com';
const authPath = normalisePath(envValues.AUTH_PATH || '/auth');

const targets = [
  {
    file: path.join(frontendDir, 'src/environments/environment.ts'),
    apiBaseUrl: devApiBase,
    label: 'development'
  },
  {
    file: path.join(frontendDir, 'src/environments/environment.prod.ts'),
    apiBaseUrl: prodApiBase,
    label: 'production'
  }
];

let updates = 0;
for (const target of targets) {
  if (!fs.existsSync(target.file)) {
    console.warn(`Skipping ${target.label} environment – file not found: ${path.relative(rootDir, target.file)}`);
    continue;
  }
  const original = fs.readFileSync(target.file, 'utf8');
  let next = original;
  next = upsertProperty(next, 'apiBaseUrl', target.apiBaseUrl);
  next = upsertProperty(next, 'authPath', authPath);

  if (next !== original) {
    fs.writeFileSync(target.file, next);
    updates += 1;
    console.log(`Updated ${path.relative(rootDir, target.file)} (${target.label})`);
  } else {
    console.log(`No changes needed for ${path.relative(rootDir, target.file)} (${target.label})`);
  }
}

if (updates === 0) {
  console.log('Environment files already in sync.');
}

function findEnvFile(dir) {
  const candidates = ['.env', '.env.local', '.env.example'];
  for (const candidate of candidates) {
    const candidatePath = path.join(dir, candidate);
    if (fs.existsSync(candidatePath)) return candidatePath;
  }
  return null;
}

function parseEnv(content) {
  const values = {};
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  });
  return values;
}

function normalisePath(segment) {
  if (!segment) return '/auth';
  return segment.startsWith('/') ? segment : `/${segment}`;
}

function upsertProperty(source, key, value) {
  const escaped = escapeSingleQuotes(value);
  const pattern = new RegExp(`${key}\\s*:\\s*['\"].*?['\"]`);
  if (pattern.test(source)) {
    return source.replace(pattern, `${key}: '${escaped}'`);
  }
  const insertPattern = /(export const environment = \{)/;
  if (insertPattern.test(source)) {
    return source.replace(insertPattern, `$1\n  ${key}: '${escaped}',`);
  }
  return source;
}

function escapeSingleQuotes(value) {
  return value.replace(/'/g, "\\'");
}
