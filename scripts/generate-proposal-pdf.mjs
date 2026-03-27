import fs from 'node:fs';
import path from 'node:path';

const outputPath = path.resolve('docs/client-proposal.pdf');

const pages = [
  [
    'HORSE SHOW JUMPING TIMER SOFTWARE PROPOSAL',
    'ALGE + vMix Integrated Real-Time Competition Timing, Broadcast, and Spectator Platform',
    '',
    '--------------------------------------------------------------------------',
    'FIELD                     | VALUE',
    '--------------------------------------------------------------------------',
    'Prepared For              | [Client Name / Organization]',
    'Prepared By               | [Your Company Name]',
    'Proposal Date             | March 28, 2026',
    'Version                   | v1.0',
    'Project Duration          | 30 days development + 15 days testing buffer',
    'Confidentiality           | Confidential and proprietary proposal',
    '--------------------------------------------------------------------------',
    '',
    'EXECUTIVE SUMMARY',
    '--------------------------------------------------------------------------',
    'TOPIC                     | DETAILS',
    '--------------------------------------------------------------------------',
    'Project Objective         | Build a production-grade horse show jumping',
    '                          | timing platform integrated with ALGE hardware,',
    '                          | vMix broadcast workflows, spectator live views,',
    '                          | widgets, overlays, and operational dashboards.',
    'Primary Outcome          | Reliable server-authoritative competition timing',
    '                          | with judge controls, hardware diagnostics, live',
    '                          | scoreboards, QR access, and reporting.',
    'Delivery Window          | 45 calendar days total.',
  ],
  [
    'CLIENT REQUIREMENT UNDERSTANDING',
    '--------------------------------------------------------------------------',
    'AREA                      | CLIENT NEED              | PROPOSED RESPONSE',
    '--------------------------------------------------------------------------',
    'Live Timing               | Accurate round timing    | Deterministic server-',
    '                          | during competitions      | authoritative timer engine',
    'Hardware                  | Support ALGE equipment   | Serial / USB / TCP',
    '                          | and varying setup        | adapters + parser rules',
    'Manual Control            | Judges must override     | Full manual arm/start/',
    '                          | hardware when required   | stop/pause/reset/abort',
    'Broadcast                 | Realtime display for     | Overlay routes + desktop',
    '                          | vMix and production      | widget windows',
    'Spectator Access          | Public live scoreboards  | QR-enabled live pages',
    'Reliability               | Operations must continue | Diagnostics + logs +',
    '                          | despite temporary issues | manual fallback',
    '',
    'PROPOSED SOLUTION OVERVIEW',
    '--------------------------------------------------------------------------',
    'LAYER                     | DESCRIPTION',
    '--------------------------------------------------------------------------',
    'Admin Platform            | Event, class, competitor, queue, reports,',
    '                          | branding, settings, user workflows',
    'Judge Panel               | Large-button live timing interface',
    'Timing Engine             | Authoritative reducer-based timing state machine',
    'Hardware Console          | Connection state, logs, parser tests, tutorials',
    'Spectator Layer           | Mobile-friendly live scoreboard with history',
    'Broadcast Layer           | Browser overlay, desktop widget, sponsor widgets',
  ],
  [
    'CORE MODULES',
    '--------------------------------------------------------------------------',
    'MODULE                    | DESCRIPTION                    | PRIMARY USERS',
    '--------------------------------------------------------------------------',
    'Authentication & Roles    | Access and permission control  | All users',
    'Events & Classes          | Competition structure setup    | Admin',
    'Riders / Horses / Entries | Competitor data management     | Admin',
    'Queue & Run Control       | Start order and progression    | Admin, Judge',
    'Timing Engine             | Warm-up and round timing       | System',
    'Hardware Adapter          | ALGE integration pathways      | System, Operator',
    'Realtime Gateway          | Live state sync                | System',
    'Overlay & Widgets         | Broadcast display surfaces     | Broadcast',
    'Reports & Logs            | Run and audit visibility       | Admin',
    'Settings & Integrations   | App, ALGE, spectator, vMix     | Super Admin',
    '',
    'FEATURE SCOPE',
    '--------------------------------------------------------------------------',
    'CATEGORY                  | FEATURE                        | INCLUDED',
    '--------------------------------------------------------------------------',
    'Competition               | Events, classes, riders,       | Yes',
    '                          | horses, competitors, queue     |',
    'Timing                    | Warm-up, main timer, manual    | Yes',
    '                          | stop, pause, reset, abort      |',
    'History                   | Full run timestamps and trails | Yes',
    'Hardware                  | Mock, serial, TCP, telemetry   | Yes',
    'Broadcast                 | Overlay, widget, vMix-ready    | Yes',
    'Spectator                 | QR scoreboard, history, queue  | Yes',
    'Reports                   | Exports and summaries          | Yes',
  ],
  [
    'SYSTEM ARCHITECTURE',
    '--------------------------------------------------------------------------',
    'LAYER                     | COMPONENT                      | RESPONSIBILITY',
    '--------------------------------------------------------------------------',
    'Presentation              | Admin Panel                    | Operations control',
    'Presentation              | Judge Panel                    | Live timing control',
    'Presentation              | Spectator Pages                | Public scoreboard',
    'Presentation              | Overlay / Widget               | Broadcast output',
    'Application               | NestJS Backend API             | Business logic',
    'Realtime                  | WebSocket / Socket.IO          | Low-latency updates',
    'Timing                    | Timer Engine Package           | Authoritative timing',
    'Integration               | Hardware Adapter Layer         | ALGE connectivity',
    'Integration               | vMix Service                   | Broadcast integration',
    'Persistence               | PostgreSQL / Redis             | Records and live state',
    'Deployment                | Docker                         | Local/prod deployment',
    '',
    'HARDWARE & BROADCAST INTEGRATION PLAN',
    '--------------------------------------------------------------------------',
    'AREA                      | METHOD                         | STATUS',
    '--------------------------------------------------------------------------',
    'ALGE Sensors              | Via ALGE timing master         | Supported',
    'ALGE TIMY / TIMY3         | Serial / USB / RS232           | Supported',
    'TCP Bridge                | Configurable TCP adapter       | Supported',
    'Simulator                 | Mock adapter and inject flow   | Supported',
    'vMix Overlay              | Browser route                  | Supported',
    'Desktop Widget            | Native frameless window        | Supported',
    'QR Spectator Pages        | Public share links             | Supported',
  ],
  [
    'DEVELOPMENT TIMELINE',
    '--------------------------------------------------------------------------',
    'PHASE                     | DURATION     | TIMELINE       | DELIVERABLES',
    '--------------------------------------------------------------------------',
    'Phase 1: Foundation       | 4 days       | Day 1-4        | Repo, schema, env',
    'Phase 2: Timer Engine     | 4 days       | Day 5-8        | Core timing logic',
    'Phase 3: Admin & Data     | 5 days       | Day 9-13       | Events, queue, CSV',
    'Phase 4: Judge & Realtime | 4 days       | Day 14-17      | Judge panel, sync',
    'Phase 5: Hardware         | 5 days       | Day 18-22      | ALGE adapters/logs',
    'Phase 6: Overlay/Widget   | 4 days       | Day 23-26      | Overlay, widgets',
    'Phase 7: Final UX         | 4 days       | Day 27-30      | Super admin polish',
    'Testing & Deployment      | 15 days      | Day 31-45      | QA, UAT, rollout',
    '',
    'TESTING AND PRODUCTION ROLLOUT PLAN',
    '--------------------------------------------------------------------------',
    'STAGE                     | TIMELINE       | ACTIVITIES',
    '--------------------------------------------------------------------------',
    'Functional QA             | Day 31-35      | Workflow and UI validation',
    'Integration QA            | Day 36-39      | ALGE, parser, vMix, LAN',
    'Stabilization             | Day 40-42      | Fixes and hardening',
    'Deployment & UAT          | Day 43-45      | Production rollout, sign-off',
  ],
  [
    'DELIVERABLES',
    '--------------------------------------------------------------------------',
    'ITEM                      | DESCRIPTION',
    '--------------------------------------------------------------------------',
    'Application Source Code   | Full monorepo and shared packages',
    'Backend API               | Timing, hardware, overlay, settings modules',
    'Web Frontend              | Admin, judge, spectator, overlay, hardware UI',
    'Hardware Layer            | Mock, serial, and TCP ALGE-ready adapters',
    'Broadcast Assets          | Overlay routes and desktop widgets',
    'Documentation Pack        | Operator, hardware, architecture, vMix guides',
    'Deployment Package        | Docker setup and env templates',
    'Testing Summary           | Verification and readiness notes',
    '',
    'ASSUMPTIONS, RISKS, AND MITIGATION',
    '--------------------------------------------------------------------------',
    'ITEM                      | TYPE         | DETAILS / MITIGATION',
    '--------------------------------------------------------------------------',
    'ALGE Output Format        | Assumption   | Validate parser rules during',
    '                          |              | commissioning against real output',
    'Production Infrastructure | Assumption   | Client-approved host, DB, Redis',
    'Hardware Disconnect       | Risk         | Diagnostics and manual fallback',
    'vMix Scene Mismatch       | Risk         | Configurable settings and checks',
    'Venue Network Quality     | Risk         | Local-first design and reconnects',
    '',
    'ACCEPTANCE CRITERIA',
    '--------------------------------------------------------------------------',
    '1. Admin can manage event structure and competitor data',
    '2. Judge can arm and control live runs',
    '3. Hardware triggers correctly start warm-up and main timer',
    '4. History, logs, overlays, widgets, and spectator pages update live',
    '5. Diagnostics and reports are available for operators and admins',
  ],
  [
    'COMMERCIAL STRUCTURE',
    '--------------------------------------------------------------------------',
    'COMMERCIAL ITEM           | DETAILS',
    '--------------------------------------------------------------------------',
    'Commercial Model          | Fixed project cost or milestone-based contract',
    'Delivery Window           | 45 days including testing and deployment buffer',
    'Change Requests           | Managed through formal approval process',
    '',
    'SUGGESTED BILLING PLAN',
    '--------------------------------------------------------------------------',
    'MILESTONE                 | PERCENTAGE   | DESCRIPTION',
    '--------------------------------------------------------------------------',
    'Milestone 1               | 30%          | Kickoff and architecture setup',
    'Milestone 2               | 40%          | Feature-complete delivery',
    'Milestone 3               | 30%          | Testing, UAT, production rollout',
    '',
    'WARRANTY AND SUPPORT',
    '--------------------------------------------------------------------------',
    'ITEM                      | DETAILS',
    '--------------------------------------------------------------------------',
    'Warranty Period           | To be defined in final commercial agreement',
    'Bug Fix Support           | Included during agreed post-delivery window',
    'Operational Support       | Go-live assistance can be included or quoted',
    'Exclusions                | Third-party hardware/network faults or',
    '                          | unapproved scope changes',
    '',
    'SIGN-OFF',
    '--------------------------------------------------------------------------',
    'PARTY                     | NAME                | SIGNATURE | DATE',
    '--------------------------------------------------------------------------',
    'Client Representative     |                     |           |',
    'Vendor Representative     |                     |           |',
  ],
];

function escapePdfText(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function buildContentStream(lines, pageNumber, pageCount) {
  const left = 42;
  let y = 800;
  const lineHeight = 12;
  const parts = ['BT', '/F1 9 Tf', `1 0 0 1 ${left} ${y} Tm`, '0 g'];

  lines.forEach((line, index) => {
    if (index > 0) {
      parts.push(`0 -${lineHeight} Td`);
    }
    if (line.trim().length > 0) {
      parts.push(`(${escapePdfText(line)}) Tj`);
    } else {
      parts.push('() Tj');
    }
  });

  parts.push(`0 -${lineHeight * 3} Td`);
  parts.push(`(${escapePdfText(`Page ${pageNumber} of ${pageCount}`)}) Tj`);
  parts.push('ET');
  return parts.join('\n');
}

let objectIndex = 1;
const objects = [];

function addObject(content) {
  const id = objectIndex++;
  objects.push({ id, content });
  return id;
}

const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
const pageIds = [];
const contentIds = [];

pages.forEach((lines, index) => {
  const stream = buildContentStream(lines, index + 1, pages.length);
  const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
  contentIds.push(contentId);
  const pageId = addObject(
    `<< /Type /Page /Parent PAGES_REF /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
  );
  pageIds.push(pageId);
});

const pagesId = addObject(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

objects.forEach((object) => {
  if (object.content.includes('PAGES_REF')) {
    object.content = object.content.replace('PAGES_REF', `${pagesId} 0 R`);
  }
});

let pdf = '%PDF-1.4\n';
const offsets = [0];

for (const object of objects) {
  offsets[object.id] = Buffer.byteLength(pdf, 'utf8');
  pdf += `${object.id} 0 obj\n${object.content}\nendobj\n`;
}

const xrefStart = Buffer.byteLength(pdf, 'utf8');
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += '0000000000 65535 f \n';

for (let id = 1; id <= objects.length; id += 1) {
  pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
}

pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

fs.writeFileSync(outputPath, pdf, 'binary');
console.log(`PDF written to ${outputPath}`);
