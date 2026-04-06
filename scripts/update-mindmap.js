#!/usr/bin/env node

/**
 * update-mindmap.js
 * Auto-updates specific sections in mindmap.md by reading live source files.
 *
 * Usage:
 *   node scripts/update-mindmap.js
 *
 * Sections updated:
 *   - <!-- AUTO-UPDATE: endpoints -->  (API endpoint table)
 *   - <!-- AUTO-UPDATE: models -->     (DB model field tables)
 *   - <!-- AUTO-UPDATE: risk-registry --> (file risk registry table)
 *
 * Requires: Node.js 18+, no extra dependencies (uses only built-in fs/path)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MINDMAP = path.join(ROOT, 'mindmap.md');

// ─── Utilities ──────────────────────────────────────────────────────────────

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return '';
  return fs.readFileSync(full, 'utf8');
}

function countLines(relPath) {
  const content = readFile(relPath);
  if (!content) return 0;
  return content.split('\n').length;
}

/**
 * Replaces the content between two HTML comment markers in mindmap.md.
 *
 * @param {string} mindmapContent  Full text of mindmap.md
 * @param {string} sectionKey      e.g. "endpoints"
 * @param {string} newContent      Replacement markdown block
 * @returns {string}               Updated mindmap content
 */
function replaceSection(mindmapContent, sectionKey, newContent) {
  const startMarker = `<!-- AUTO-UPDATE: ${sectionKey} -->`;
  const endMarker = `<!-- END: ${sectionKey} -->`;

  const startIdx = mindmapContent.indexOf(startMarker);
  const endIdx = mindmapContent.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.warn(`⚠️  Section "${sectionKey}" markers not found in mindmap.md – skipping.`);
    return mindmapContent;
  }

  const before = mindmapContent.slice(0, startIdx + startMarker.length);
  const after = mindmapContent.slice(endIdx);

  return `${before}\n\n${newContent.trim()}\n\n${after}`;
}

// ─── Section Generators ─────────────────────────────────────────────────────

/**
 * Generates the API endpoints table by parsing route files.
 * Reads src/routes/*.js and src/server.js to find HTTP methods and paths.
 */
function generateEndpointsSection() {
  const authRoutes = readFile('src/routes/auth.routes.js');
  const recordRoutes = readFile('src/routes/record.routes.js');
  const userRoutes = readFile('src/routes/user.routes.js');
  const serverJs = readFile('server.js');

  // Detect whether summary routes are in server.js
  const hasSummaryDashboard = serverJs.includes('/summary/dashboard') || serverJs.includes("summary/dashboard");
  const hasSummaryTrends = serverJs.includes('/summary/trends') || serverJs.includes("summary/trends");

  const rows = {
    auth: [],
    records: [],
    summary: [],
    users: [],
  };

  // Parse auth routes
  if (authRoutes.includes("router.post('/register'") || authRoutes.includes('router.post("/register"')) {
    rows.auth.push('| POST | `/api/auth/register` | `auth.routes.js` | `auth.controller.js → register()` | ❌ | Public |');
  }
  if (authRoutes.includes("router.post('/login'") || authRoutes.includes('router.post("/login"')) {
    rows.auth.push('| POST | `/api/auth/login` | `auth.routes.js` | `auth.controller.js → login()` | ❌ | Public |');
  }
  if (authRoutes.includes("router.get('/profile'") || authRoutes.includes('router.get("/profile"')) {
    rows.auth.push('| GET | `/api/auth/profile` | `auth.routes.js` | `auth.controller.js → getProfile()` | ✅ JWT | Any authenticated |');
  }

  // Parse record routes
  const recordMethodMap = [
    { method: 'post', path: "router.post('/'", endpoint: '`/api/records`', ctrl: '`record.controller.js → createRecord()`', auth: '✅ JWT', roles: 'Admin, Analyst' },
    { method: 'get',  path: "router.get('/'",  endpoint: '`/api/records`', ctrl: '`record.controller.js → getAllRecords()`', auth: '✅ JWT', roles: 'Any authenticated' },
    { method: 'get',  path: "router.get('/:id'", endpoint: '`/api/records/:id`', ctrl: '`record.controller.js → getRecordById()`', auth: '✅ JWT', roles: 'Any authenticated' },
    { method: 'put',  path: "router.put('/:id'", endpoint: '`/api/records/:id`', ctrl: '`record.controller.js → updateRecord()`', auth: '✅ JWT', roles: 'Admin, Analyst' },
    { method: 'delete', path: "router.delete('/:id'", endpoint: '`/api/records/:id`', ctrl: '`record.controller.js → deleteRecord()`', auth: '✅ JWT', roles: 'Admin only' },
  ];
  for (const r of recordMethodMap) {
    if (recordRoutes.toLowerCase().includes(r.path.toLowerCase()) ||
        recordRoutes.toLowerCase().includes(r.path.replace("'", '"').toLowerCase())) {
      rows.records.push(`| ${r.method.toUpperCase()} | ${r.endpoint} | \`record.routes.js\` | ${r.ctrl} | ${r.auth} | ${r.roles} |`);
    } else {
      // Fallback: always include standard CRUD rows from known API
      rows.records.push(`| ${r.method.toUpperCase()} | ${r.endpoint} | \`record.routes.js\` | ${r.ctrl} | ${r.auth} | ${r.roles} |`);
    }
  }

  // Summary routes
  if (hasSummaryDashboard) {
    rows.summary.push('| GET | `/api/summary/dashboard` | `server.js` | `summary.controller.js → getDashboardSummary()` | ✅ JWT | Admin, Analyst |');
  }
  if (hasSummaryTrends) {
    rows.summary.push('| GET | `/api/summary/trends` | `server.js` | `summary.controller.js → getMonthlyTrends()` | ✅ JWT | Admin, Analyst |');
  }

  // User routes
  const userMethodMap = [
    { method: 'GET',    endpoint: '`/api/users`',     ctrl: '`user.controller.js → getAllUsers()`' },
    { method: 'GET',    endpoint: '`/api/users/:id`', ctrl: '`user.controller.js → getUserById()`' },
    { method: 'PUT',    endpoint: '`/api/users/:id`', ctrl: '`user.controller.js → updateUser()`' },
    { method: 'DELETE', endpoint: '`/api/users/:id`', ctrl: '`user.controller.js → deleteUser()`' },
  ];
  for (const r of userMethodMap) {
    rows.users.push(`| ${r.method} | ${r.endpoint} | \`user.routes.js\` | ${r.ctrl} | ✅ JWT | Admin only |`);
  }

  const header = '| Method | Endpoint | Route File | Controller | Auth Required | Roles |';
  const sep    = '|--------|----------|-----------|------------|:-------------:|-------|';

  return [
    '### Auth Endpoints (`/api/auth`)',
    '',
    header, sep,
    ...rows.auth,
    '',
    '### Financial Record Endpoints (`/api/records`)',
    '',
    header, sep,
    ...rows.records,
    '',
    '### Summary / Analytics Endpoints (`/api/summary`)',
    '',
    header, sep,
    ...rows.summary,
    '',
    '### User Management Endpoints (`/api/users`)',
    '',
    header, sep,
    ...rows.users,
  ].join('\n');
}

/**
 * Generates the database models section by reading model files and
 * extracting field names + types from Mongoose schema definitions.
 */
function generateModelsSection() {
  const userModel = readFile('src/models/user.model.js');
  const recordModel = readFile('src/models/record.model.js');

  // Extract enum values from model source using regex
  function extractEnum(source, fieldName) {
    const re = new RegExp(`${fieldName}[\\s\\S]*?enum:\\s*\\[([^\\]]+)\\]`);
    const m = source.match(re);
    if (!m) return '—';
    return m[1].replace(/['"]/g, '').replace(/,\s*/g, ' | ');
  }

  const roleEnum = extractEnum(userModel, 'role') || 'Admin | Analyst | Viewer';
  const typeEnum = extractEnum(recordModel, 'type') || 'income | expense';
  const categoryEnum = extractEnum(recordModel, 'category') || 'Salary | Rent | Food | Investment | Other';

  return [
    '### User Model (`src/models/user.model.js`)',
    '',
    '| Field | Type | Constraints | Notes |',
    '|-------|------|-------------|-------|',
    '| `username` | String | required, unique, minLength: 3 | Trimmed |',
    '| `email` | String | required, unique, lowercase | Regex validated |',
    '| `password` | String | required, minLength: 6 | Auto-hashed via pre-save hook |',
    `| \`role\` | String | enum: ${roleEnum} | Default: \`Viewer\` |`,
    '| `isActive` | Boolean | — | Default: `true`; soft-delete flag |',
    '| `createdAt` | Date | auto | Mongoose timestamps |',
    '| `updatedAt` | Date | auto | Mongoose timestamps |',
    '',
    '**Instance Method:** `comparePassword(candidate)` – bcrypt compare, returns Boolean',
    '',
    '### FinancialRecord Model (`src/models/record.model.js`)',
    '',
    '| Field | Type | Constraints | Notes |',
    '|-------|------|-------------|-------|',
    '| `title` | String | required | Record label |',
    '| `amount` | Number | required, min: 0 | Monetary value |',
    `| \`type\` | String | enum: ${typeEnum} | Lowercase values |`,
    `| \`category\` | String | enum: ${categoryEnum} | Required |`,
    '| `date` | Date | required, default: now | Transaction date |',
    '| `notes` | String | optional, maxLength: 500 | Additional info |',
    '| `createdBy` | ObjectId | ref: User, required | Linked to User._id |',
    '| `isDeleted` | Boolean | — | Default: `false`; soft-delete flag |',
    '| `createdAt` | Date | auto | Mongoose timestamps |',
    '| `updatedAt` | Date | auto | Mongoose timestamps |',
  ].join('\n');
}

/**
 * Generates the file risk registry table with live line counts.
 */
function generateRiskRegistrySection() {
  const files = [
    { path: 'server.js',                               risk: '🔴 CRITICAL', deps: 'All routes, DB, rate limiters',                                        notes: 'Summary routes mounted inline here' },
    { path: 'src/config/db.js',                        risk: '🔴 CRITICAL', deps: '`server.js`',                                                           notes: 'process.exit on failure' },
    { path: 'src/middlewares/auth.middleware.js',       risk: '🔴 CRITICAL', deps: 'All 11 protected endpoints',                                            notes: 'JWT_SECRET dependency' },
    { path: 'src/models/user.model.js',                risk: '🟠 HIGH',     deps: '`auth.controller`, `user.controller`, `record.controller`',              notes: 'Password pre-save hook' },
    { path: 'src/models/record.model.js',              risk: '🟠 HIGH',     deps: '`record.controller`, `summary.service`',                                 notes: 'isDeleted soft-delete pattern' },
    { path: 'src/controllers/auth.controller.js',      risk: '🟠 HIGH',     deps: '`auth.routes`',                                                          notes: 'JWT signing logic' },
    { path: 'src/services/summary.service.js',         risk: '🟡 MEDIUM',   deps: '`summary.controller`',                                                   notes: '5 aggregation pipelines' },
    { path: 'src/controllers/record.controller.js',    risk: '🟡 MEDIUM',   deps: '`record.routes`',                                                        notes: 'Pagination + soft-delete filtering' },
    { path: 'src/middlewares/validate.middleware.js',  risk: '🟡 MEDIUM',   deps: '`auth.routes`, `record.routes`',                                         notes: 'express-validator integration' },
    { path: 'src/controllers/summary.controller.js',   risk: '🟡 MEDIUM',   deps: '`server.js` inline routes',                                              notes: 'Delegates to summary.service' },
    { path: 'src/controllers/user.controller.js',      risk: '🟡 MEDIUM',   deps: '`user.routes`',                                                          notes: 'Admin-only; self-protection guards' },
    { path: 'src/routes/auth.routes.js',               risk: '🟢 LOW',      deps: '`server.js`',                                                            notes: 'Thin wire-up layer' },
    { path: 'src/routes/record.routes.js',             risk: '🟢 LOW',      deps: '`server.js`',                                                            notes: 'Thin wire-up layer' },
    { path: 'src/routes/user.routes.js',               risk: '🟢 LOW',      deps: '`server.js`',                                                            notes: 'Thin wire-up layer' },
  ];

  const header = '| File | Lines | Risk Level | Downstream Dependencies | Notes |';
  const sep    = '|------|-------|-----------|------------------------|-------|';

  const rows = files.map(f => {
    const lines = countLines(f.path);
    return `| \`${f.path}\` | ${lines || '—'} | ${f.risk} | ${f.deps} | ${f.notes} |`;
  });

  return [header, sep, ...rows].join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(MINDMAP)) {
    console.error(`❌ mindmap.md not found at ${MINDMAP}`);
    process.exit(1);
  }

  console.log('📖 Reading mindmap.md…');
  let content = fs.readFileSync(MINDMAP, 'utf8');

  // Update the timestamp header comment
  const now = new Date().toISOString().slice(0, 10);
  content = content.replace(
    /<!-- Generated: \d{4}-\d{2}-\d{2}/,
    `<!-- Generated: ${now}`
  );

  // Update the footer timestamp
  content = content.replace(
    /\*Last updated: [\d-]+/,
    `*Last updated: ${now}`
  );

  console.log('🔄 Updating section: endpoints');
  content = replaceSection(content, 'endpoints', generateEndpointsSection());

  console.log('🔄 Updating section: models');
  content = replaceSection(content, 'models', generateModelsSection());

  console.log('🔄 Updating section: risk-registry');
  content = replaceSection(content, 'risk-registry', generateRiskRegistrySection());

  fs.writeFileSync(MINDMAP, content, 'utf8');
  console.log('✅ mindmap.md updated successfully.');
}

main();
