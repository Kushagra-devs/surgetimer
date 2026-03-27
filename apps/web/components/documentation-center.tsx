'use client';

import { useMemo, useState } from 'react';

type DocSection = {
  title: string;
  body: string;
};

type DocStep = {
  title: string;
  detail: string;
};

type FeatureDoc = {
  id: string;
  label: string;
  summary: string;
  audience: string;
  prerequisites: string[];
  steps: DocStep[];
  verification: string[];
  issues: string[];
  sections: DocSection[];
};

const docs: FeatureDoc[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    summary: 'Read live system health, timing posture, hardware readiness, and operational alerts from one place.',
    audience: 'Event director, admin, technical operator',
    prerequisites: [
      'API and web application are running.',
      'At least one event or class is loaded into the system.',
      'Judge panel or simulator has been used at least once if you want to see live timing movement.',
    ],
    steps: [
      {
        title: 'Open the dashboard',
        detail: 'Go to the Dashboard from the left sidebar. This is the main overview screen for live operations.',
      },
      {
        title: 'Read the readiness banner first',
        detail: 'Check whether the platform shows live hardware ready, simulator mode, or degraded. If it is degraded, resolve that before trusting the round flow.',
      },
      {
        title: 'Confirm active timer state',
        detail: 'Look for the current timer state, active rider, horse, class, and queue posture. This is the quickest way to confirm the arena is aligned with the system.',
      },
      {
        title: 'Watch dependency health',
        detail: 'Review hardware connection, persistence, and broadcast status. If any dependency is offline, escalate before the class begins.',
      },
    ],
    verification: [
      'Current timer state matches what the Judge panel shows.',
      'Hardware state reads ALGE connected only when a real device is connected.',
      'Queue count and completed runs are updating after each round.',
    ],
    issues: [
      'If the dashboard looks stale, refresh once and check API health in the Hardware Console or browser.',
      'If hardware shows offline, do not assume the beam is working until raw logs confirm incoming data.',
    ],
    sections: [
      {
        title: 'What it does',
        body: 'The dashboard is the command center for live status. It summarizes timing, hardware, integrations, readiness, and active operational risk.',
      },
      {
        title: 'Best practice',
        body: 'Use the dashboard to observe and confirm. Run live timing from the Judge panel and perform integration changes from the admin workspaces.',
      },
    ],
  },
  {
    id: 'judge',
    label: 'Judge Panel',
    summary: 'Control the live round with simple, high-trust actions and manual fallback when hardware is unavailable.',
    audience: 'Judge, arena timing operator',
    prerequisites: [
      'An event, class, and competitor entry exist.',
      'The next competitor is known and the queue is correct.',
      'Hardware is connected or the team has agreed to use manual timing.',
    ],
    steps: [
      {
        title: 'Arm the correct competitor',
        detail: 'Before the horse enters the timing path, arm the selected competitor. The state should move from IDLE to READY.',
      },
      {
        title: 'Start timing from hardware or manual action',
        detail: 'If ALGE is connected, the first valid trigger starts warm-up and the second valid trigger starts the main timer. If hardware is unavailable, use the manual warm-up and manual main start controls.',
      },
      {
        title: 'Use pause or hold only when necessary',
        detail: 'Pause or hold should be used for real interruptions such as arena reset, obstacle issue, or official stoppage. Avoid unnecessary state changes during a clean run.',
      },
      {
        title: 'Finish the run safely',
        detail: 'Let the finish trigger complete the run or use manual stop if hardware did not capture the end correctly.',
      },
      {
        title: 'Advance only after completion is confirmed',
        detail: 'Check the saved result, then move to the next competitor so the queue and scoreboard stay aligned.',
      },
    ],
    verification: [
      'The active competitor on the Judge panel matches the start order.',
      'Warm-up begins on the first valid trigger and the main timer begins on the second.',
      'The run moves to completed and appears in history when finish or manual stop is used.',
    ],
    issues: [
      'If the timer does not move, check whether the competitor was armed first.',
      'If hardware is offline, the Judge panel should still work through manual controls.',
    ],
    sections: [
      {
        title: 'What it does',
        body: 'The Judge panel is the live execution surface for arm, warm-up start, main start, pause, resume, stop, reset, and abort.',
      },
      {
        title: 'Safety rule',
        body: 'One operator should own live timing actions during the class to avoid double actions or conflicting decisions.',
      },
    ],
  },
  {
    id: 'queue',
    label: 'Queue Management',
    summary: 'Keep start order clean, prevent wrong-rider activation, and maintain a predictable arena workflow.',
    audience: 'Admin, gate operator, judge assistant',
    prerequisites: [
      'Competitor entries have been created or imported.',
      'Start order has been reviewed before the class begins.',
    ],
    steps: [
      {
        title: 'Review the order before the class',
        detail: 'Open the queue page and confirm rider, horse, bib, and class order. Correct mistakes before the first competitor is armed.',
      },
      {
        title: 'Keep one competitor active at a time',
        detail: 'Only arm the competitor who is about to start. Do not pre-arm multiple competitors.',
      },
      {
        title: 'Advance the queue after a saved result',
        detail: 'Once the run is completed or aborted and confirmed in history, move the queue to the next entry.',
      },
    ],
    verification: [
      'The queue preview on the Judge panel matches the queue page.',
      'The active competitor changes only when an intentional queue action is performed.',
    ],
    issues: [
      'If the wrong rider appears live, stop and correct the queue before continuing the class.',
    ],
    sections: [
      {
        title: 'Operational note',
        body: 'Queue accuracy is critical because the overlay, spectator scoreboard, and history all depend on the active competitor entry.',
      },
    ],
  },
  {
    id: 'hardware',
    label: 'ALGE Hardware',
    summary: 'Register the ALGE timing hardware with the software, test the connection, and confirm real live status before going operational.',
    audience: 'Technical operator, installation engineer, super admin',
    prerequisites: [
      'The ALGE timing master is powered on and should remain powered on during the session.',
      'Your ALGE timing master is physically connected to the computer by USB-serial, serial, or a TCP bridge.',
      'You know the connection type: Serial / USB Serial or TCP Bridge.',
      'The software is running and you can open both Settings and Hardware Console.',
      'You have at least one real beam or test trigger available so you can verify incoming data.',
    ],
    steps: [
      {
        title: 'Physically connect the ALGE timing master to the computer',
        detail: 'Connect the ALGE timing master, not just the photocell, to the laptop or venue machine. For most setups this is a USB-to-serial or direct USB serial connection. Wait for the operating system to detect the device before opening the software settings.',
      },
      {
        title: 'Open the integrations settings',
        detail: 'In the software, go to Super Admin or Settings, then open the Integrations section. This is where hardware mode and connection values are registered.',
      },
      {
        title: 'Choose the correct adapter mode',
        detail: 'Set the adapter mode to Serial if the timing master is connected by USB / serial cable. Set it to TCP only if the venue uses a TCP bridge or serial-to-network device. Do not leave the system in Mock if you expect real ALGE status.',
      },
      {
        title: 'Enter the connection details',
        detail: 'For Serial mode, enter the detected device port such as `/dev/tty.usbserial-...`, `/dev/ttyUSB0`, or the actual COM/tty path used by the operating system. For TCP mode, enter the bridge host and port exactly as provided by the venue. Save the settings after entering them.',
      },
      {
        title: 'Review parser rules before connecting',
        detail: 'Open the parser rules area and confirm the rules expected for your ALGE output. If the venue has sample output lines, copy those into the parser test box and confirm that the software recognizes the signal type and channel before going live.',
      },
      {
        title: 'Open the Hardware Console and connect',
        detail: 'Now open the Hardware Console from the sidebar and press the connect action. Watch the status line carefully. A true live path should move toward ALGE connected or connected with physical source, not simulator.',
      },
      {
        title: 'Run a connection test',
        detail: 'Use the Test Connection action in the Hardware Console. This confirms whether the software can open the configured serial or TCP path. If it fails, do not continue until the connection details are corrected.',
      },
      {
        title: 'Trigger a real signal from the beam or timing path',
        detail: 'Break the beam or trigger the ALGE input in the same way it will happen in the arena. Watch the raw hardware log and the parsed signal panel. You should see a new payload arrive with a timestamp, parsed type, and channel if the parser is correct.',
      },
      {
        title: 'Confirm live readiness in the dashboard and judge panel',
        detail: 'After successful connection and real input, open the Dashboard and Judge panel. The platform should now show live ALGE status rather than simulator or degraded. This is the final confirmation that the software is registered to the hardware correctly.',
      },
      {
        title: 'Perform a full dry run before the event starts',
        detail: 'Arm a competitor, pass two valid triggers, and complete a finish trigger. Confirm warm-up, round timer, history, and overlay updates all work from the real hardware path before the class opens.',
      },
    ],
    verification: [
      'Hardware Console shows a physical source, not simulated.',
      'The connection test returns success.',
      'Raw logs receive a real payload when the beam is triggered.',
      'The parser identifies the payload instead of leaving it unknown.',
      'Dashboard readiness changes from degraded to ready only after the real link is active.',
      'Judge panel shows ALGE connected.',
    ],
    issues: [
      'If no port is detected, reconnect the cable, confirm the adapter driver is installed, and re-check the port name on the operating system.',
      'If the connection test passes but no signals arrive, the ALGE timing master may be connected but not outputting the expected data format.',
      'If raw logs show data but parsing fails, update parser rules using the exact payload sample from the venue device.',
      'If the system still says simulator, re-open Integrations and ensure the adapter mode is not set to Mock.',
      'Do not power-cycle the timing master during operation unless the event team intentionally pauses the class and re-commissions the link.',
    ],
    sections: [
      {
        title: 'What registration means',
        body: 'Registering hardware with the software means three things are all true at once: the physical timing master is connected, the software is configured to read the correct transport, and the incoming payloads are parsed into valid timing signals.',
      },
      {
        title: 'Most common live path',
        body: 'For real ALGE use, the usual path is photocell or beam to ALGE timing master, then timing master to laptop through serial or USB serial. The software listens to the timing master output, not directly to the photocell.',
      },
    ],
  },
  {
    id: 'mobile-access',
    label: 'Mobile Access',
    summary: 'Open spectator and mobile control views on phones over the same Wi-Fi, with QR access and optional Bluetooth device pairing on supported browsers.',
    audience: 'Operator, judge, technical admin',
    prerequisites: [
      'The web app is running on the venue machine.',
      'The phone is on the same Wi-Fi or local LAN as the venue machine.',
      'If you want Bluetooth pairing, use a browser and device that support Web Bluetooth.',
    ],
    steps: [
      {
        title: 'Use the Share tab first',
        detail: 'Open Settings, then Share. You will find two QR codes: one for the spectator scoreboard and one for the mobile control page.',
      },
      {
        title: 'Connect the phone to the same local network',
        detail: 'The mobile device must be on the same Wi-Fi or LAN as the venue machine. This is the reliable path for opening the full timer interface remotely.',
      },
      {
        title: 'Scan the control QR',
        detail: 'Scan the Mobile Control QR code to open the phone-friendly timer control surface. This gives the operator quick access to arm, warm-up, main start, pause, resume, stop, abort, and reset.',
      },
      {
        title: 'Use Bluetooth only as a companion registration path',
        detail: 'Open the Bluetooth & Mobile settings tab if you want to register nearby Bluetooth devices on the venue machine. This stores them for operator reference, but the full web interface is still delivered over the local network for reliability.',
      },
      {
        title: 'Verify mobile control before the event',
        detail: 'On the phone, confirm that the timer moves, competitor details update, and actions reflect in the judge panel and dashboard before the class begins.',
      },
    ],
    verification: [
      'The spectator QR opens the live scorecard page.',
      'The mobile control QR opens the compact mobile timer page.',
      'Actions from the mobile page update the main timing state.',
      'Bluetooth pairing, if supported, can register nearby devices on the venue machine.',
    ],
    issues: [
      'If the phone cannot open the page, verify it is on the same Wi-Fi and use the venue machine local base URL.',
      'If Bluetooth is unavailable, this is a browser/device limitation. Use the Wi-Fi QR path instead.',
      'Do not treat Bluetooth as the primary event control transport for the full app; the reliable control path is the local network.',
    ],
    sections: [
      {
        title: 'What is supported',
        body: 'The software now supports full mobile access over the same Wi-Fi using QR codes and a phone-friendly control page. It also supports Bluetooth device registration on compatible browsers for nearby companion devices.',
      },
      {
        title: 'What is not guaranteed',
        body: 'A browser-based venue app cannot reliably serve the full control surface over raw Bluetooth the way it serves over LAN. For event safety, Wi-Fi / LAN remains the main remote-control path.',
      },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    summary: 'Configure ALGE and vMix properly, test them, and confirm the system is ready for a real event.',
    audience: 'Super admin, technical operator, broadcast lead',
    prerequisites: [
      'You have access to integration settings.',
      'You know whether you are using physical ALGE, simulator, or both.',
      'If using vMix, you know the host address and target input workflow.',
    ],
    steps: [
      {
        title: 'Open Super Admin or Settings',
        detail: 'Use the navigation sidebar and open the integrations workspace.',
      },
      {
        title: 'Configure hardware first',
        detail: 'Set adapter mode, connection values, parser rules, and save. Hardware should be stable before broadcast automation is finalized.',
      },
      {
        title: 'Configure vMix second',
        detail: 'Enter the vMix host URL, input references, and any title or automation values required by your broadcast workflow.',
      },
      {
        title: 'Test both paths independently',
        detail: 'Confirm hardware telemetry works before expecting overlay changes, and confirm overlay or vMix reachability before the show opens.',
      },
    ],
    verification: [
      'Hardware Console reports real ALGE connection when expected.',
      'Overlay and widget pages update when live timing changes.',
      'vMix settings can be saved and tested without error.',
    ],
    issues: [
      'Do not troubleshoot vMix before hardware is stable; otherwise two variables change at once.',
    ],
    sections: [
      {
        title: 'Best practice',
        body: 'Commission hardware first, then validate scoreboard and overlay, then move to vMix automation. That order isolates issues faster.',
      },
    ],
  },
  {
    id: 'overlay',
    label: 'Overlay & Widgets',
    summary: 'Design and launch broadcast outputs without disturbing the live timing path.',
    audience: 'Broadcast operator, super admin',
    prerequisites: [
      'Live timing feed is working or simulator is intentionally enabled.',
      'A widget or overlay style has been created.',
    ],
    steps: [
      {
        title: 'Create or edit the widget design',
        detail: 'Use the broadcast or widget manager area to adjust layout, colors, labels, sponsor areas, and visibility options.',
      },
      {
        title: 'Preview before going live',
        detail: 'Use the built-in preview to verify spacing, typography, and data visibility before launching a desktop widget or opening the overlay route in vMix.',
      },
      {
        title: 'Launch only the required widget',
        detail: 'Start the specific desktop widget or overlay needed for broadcast, and close any extra test widgets so the machine stays clean.',
      },
      {
        title: 'Keep design changes outside active rounds',
        detail: 'Avoid changing layouts while a round is running unless it is essential for broadcast recovery.',
      },
    ],
    verification: [
      'The overlay updates when the active competitor or timer changes.',
      'The widget reflects saved design changes.',
    ],
    issues: [
      'If the widget opens but looks stale, reload the widget and confirm the underlying overlay route is current.',
    ],
    sections: [
      {
        title: 'Operational note',
        body: 'The overlay is a display surface, not the timing authority. It should always be downstream of the server state.',
      },
    ],
  },
  {
    id: 'spectator',
    label: 'Spectator Live',
    summary: 'Publish a live scoreboard with timer, scorecard, and history that spectators can open on their own devices.',
    audience: 'Event operations, spectator display operator',
    prerequisites: [
      'The event and class have active data.',
      'A spectator layout has been configured.',
      'The public link or QR destination is known.',
    ],
    steps: [
      {
        title: 'Configure the spectator layout',
        detail: 'Open the spectator settings area and choose which data to show, such as timer, horse, rider, queue preview, history, sponsor blocks, and theme styling.',
      },
      {
        title: 'Generate and review the share link',
        detail: 'Create the public link and QR code from the share tools. Open it once on a phone and once on a larger screen to check readability.',
      },
      {
        title: 'Verify live movement during a test round',
        detail: 'Run a simulator or hardware test and confirm the public scoreboard updates in real time with current competitor and history information.',
      },
    ],
    verification: [
      'QR code opens the correct live page.',
      'Timer and history update without requiring a page refresh.',
    ],
    issues: [
      'If spectators report stale data, check local network quality and verify the public feed is updating from the server.',
    ],
    sections: [
      {
        title: 'Best practice',
        body: 'Keep spectator pages read-only and slightly simpler than admin screens so viewers get clear information without operator-only controls.',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    summary: 'Review live operations, completed runs, incidents, and platform performance in one reporting space.',
    audience: 'Admin, technical lead, event director',
    prerequisites: [
      'The event has active or completed run data.',
      'Hardware and timing services are running.',
    ],
    steps: [
      {
        title: 'Open the reports workspace during the event',
        detail: 'Use the reports section for operational oversight, not just post-event export.',
      },
      {
        title: 'Review live reliability signals',
        detail: 'Check disconnect counts, duplicate signal counts, completed runs, and current hardware posture.',
      },
      {
        title: 'Use history after each class',
        detail: 'At the end of a class, review completed runs and incident notes before exports are generated.',
      },
    ],
    verification: [
      'Completed runs appear after each finish.',
      'Hardware incident counts reflect real connection history.',
    ],
    issues: [
      'If reports appear empty, confirm the run actually completed and was not left in a non-terminal state.',
    ],
    sections: [
      {
        title: 'What it does',
        body: 'Reports combine live operational oversight with post-round review so technical and sporting decisions can rely on recorded facts.',
      },
    ],
  },
  {
    id: 'super-admin',
    label: 'Super Admin',
    summary: 'Use a segmented control center for policy, integrations, branding, access, and oversight without cluttering the live flow.',
    audience: 'Super admin, technical owner, event management lead',
    prerequisites: [
      'You have super admin permissions.',
    ],
    steps: [
      {
        title: 'Use the correct workspace for the task',
        detail: 'Keep policy changes in Operations Policy, user controls in Users and Access, hardware and vMix in Integrations, and public display controls in Broadcast and Share.',
      },
      {
        title: 'Avoid making governance changes during active rounds',
        detail: 'Use Super Admin primarily before the class, between classes, or after the session for auditing and configuration.',
      },
      {
        title: 'Use Audit and Oversight for review',
        detail: 'Check manual actions, integration changes, and session-level governance history from the audit workspace.',
      },
    ],
    verification: [
      'Each configuration change is made in the correct tab.',
      'Operators are not using Super Admin for live timing.',
    ],
    issues: [
      'If a page feels overloaded, move the task to the correct workspace instead of trying to do everything from one screen.',
    ],
    sections: [
      {
        title: 'Design intent',
        body: 'Super Admin is deliberately separated from the Judge panel so governance and live timing do not interfere with one another.',
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform Profile',
    summary: 'Configure venue branding, arena structure, local deployment behavior, licensing, and support diagnostics for a production on-prem installation.',
    audience: 'Super admin, deployment lead, support lead',
    prerequisites: [
      'You have Super Admin access.',
      'You know the venue branding requirements, arena names, and local network details.',
      'You know the licensed organization name and support profile for the installation.',
    ],
    steps: [
      {
        title: 'Set the branding profile first',
        detail: 'Enter the organization name, short label, product label, logo text, and primary colors so the shell, navigation, and operator identity match the venue or client branding.',
      },
      {
        title: 'Build the arena topology',
        detail: 'Create each arena profile with an ID, name, location label, and broadcast capability. Select the active arena before the event day starts.',
      },
      {
        title: 'Set the deployment profile',
        detail: 'Define the local hostname, LAN base URL, appliance name, and whether the venue installation should stay LAN-only. Enable critical-route caching when the venue needs an offline-first posture.',
      },
      {
        title: 'Record licensing and support details',
        detail: 'Enter the licensed organization, license key, deployment ID, support tier, and operator seat limits. This keeps the installation operationally traceable without turning it into a SaaS system.',
      },
      {
        title: 'Generate a diagnostics bundle after setup',
        detail: 'Refresh the diagnostics snapshot so support, audit, hardware, and deployment state can be handed over quickly if anything needs escalation during the event.',
      },
    ],
    verification: [
      'Navigation and shell branding reflect the saved organization and product labels.',
      'The correct active arena appears in the sidebar and diagnostics bundle.',
      'Diagnostics bundle shows deployment mode, licensing, and hardware state together.',
    ],
    issues: [
      'If arena counts are wrong, review event-to-arena mapping before the class begins.',
      'If the local base URL is wrong, spectator sharing and device access may fail on venue Wi-Fi.',
    ],
    sections: [
      {
        title: 'Why it matters',
        body: 'This workspace turns the application from a generic tool into a venue-grade product installation with proper identity, deployment posture, and support readiness.',
      },
    ],
  },
  {
    id: 'simulator',
    label: 'Simulator',
    summary: 'Run full rehearsals without live hardware and make sure the team understands the difference from a physical ALGE feed.',
    audience: 'Trainer, operator, QA tester',
    prerequisites: [
      'You want to rehearse or demonstrate without the real timing master connected.',
    ],
    steps: [
      {
        title: 'Enable simulator mode intentionally',
        detail: 'Set the system to mock or simulator only when you are testing, training, or demonstrating. Do not leave the system in simulator before a live class.',
      },
      {
        title: 'Run a full sample round',
        detail: 'Arm a competitor, send warm-up and main triggers, then finish the run. Check the judge panel, reports, overlay, and spectator page together.',
      },
      {
        title: 'Switch back to physical mode before the event',
        detail: 'If the event will use ALGE hardware, return to Serial or TCP mode and re-confirm that simulator labels disappear from the dashboard.',
      },
    ],
    verification: [
      'The UI clearly shows simulator mode rather than live ALGE status.',
      'Test triggers update timing, history, and display surfaces.',
    ],
    issues: [
      'Simulator mode is useful for rehearsal, but it should never be mistaken for hardware-ready status.',
    ],
    sections: [
      {
        title: 'What it is for',
        body: 'Simulator mode is a training and rehearsal tool. It helps operators practice without taking risks on real hardware during setup.',
      },
    ],
  },
  {
    id: 'deployment',
    label: 'Deployment & Recovery',
    summary: 'Prepare the platform for go-live, understand dependencies, and recover cleanly from issues during an event.',
    audience: 'Deployment engineer, technical lead, super admin',
    prerequisites: [
      'Production machine, database, Redis, and event network details are available.',
    ],
    steps: [
      {
        title: 'Validate dependencies before the event',
        detail: 'Confirm the API, web application, database, Redis, hardware link, and overlay routes are all reachable before the venue opens.',
      },
      {
        title: 'Run a full dress rehearsal',
        detail: 'Perform one end-to-end test using either simulator or real ALGE, then repeat with the real hardware if the show will depend on it.',
      },
      {
        title: 'Know the fallback path',
        detail: 'If hardware drops during the event, continue through manual controls, log the incident, and recover the link only when the arena team agrees it is safe.',
      },
    ],
    verification: [
      'Health endpoints are reachable.',
      'Dashboard, Judge panel, Hardware Console, and spectator page all load.',
      'At least one successful test run has been recorded before go-live.',
    ],
    issues: [
      'Do not treat a green UI alone as proof of readiness. Always confirm live test data is moving through the system.',
    ],
    sections: [
      {
        title: 'Recovery posture',
        body: 'The goal is not to pretend failures never happen. The goal is to make sure the platform fails visibly, recovers clearly, and keeps the competition moving safely.',
      },
    ],
  },
];

export function DocumentationCenter() {
  const [selectedId, setSelectedId] = useState('dashboard');
  const selected = useMemo(() => docs.find((item) => item.id === selectedId) ?? docs[0], [selectedId]);

  return (
    <div className="section-stack">
      <div className="metric-card">
        <p className="eyebrow">Documentation Center</p>
        <p className="panel-title">Feature tutorials and operating guidance</p>
        <p className="muted" style={{ marginTop: 0 }}>
          Select a feature to view prerequisites, exact steps, validation checks, and recovery guidance. The hardware tutorial includes the full registration flow from
          connection to live confirmation.
        </p>
        <div className="documentation-toolbar">
          <label className="field-stack documentation-picker">
            <span className="info-label">Feature</span>
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="field-input">
              {docs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="documentation-summary">
            <span className="documentation-summary-label">Selected</span>
            <strong className="documentation-summary-title">{selected.label}</strong>
            <p className="documentation-summary-copy">{selected.summary}</p>
            <div className="documentation-meta-row">
              <span className="documentation-meta-label">Primary audience</span>
              <strong className="documentation-meta-value">{selected.audience}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="documentation-layout">
        <div className="documentation-main">
          <div className="metric-card surface-soft">
            <p className="eyebrow">Step By Step</p>
            <p className="panel-title">Detailed operating flow</p>
            <div className="documentation-steps">
              {selected.steps.map((step, index) => (
                <div key={step.title} className="documentation-step-card">
                  <div className="documentation-step-number">{index + 1}</div>
                  <div>
                    <p className="documentation-step-title">{step.title}</p>
                    <p className="documentation-step-copy">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tip-grid">
            {selected.sections.map((section) => (
              <div key={section.title} className="tip-card">
                <p className="tip-title">{section.title}</p>
                <p className="tip-copy">{section.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="documentation-side">
          <div className="metric-card">
            <p className="eyebrow">Before You Start</p>
            <p className="panel-title">Prerequisites</p>
            <ul className="documentation-list">
              {selected.prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="metric-card">
            <p className="eyebrow">Checkpoints</p>
            <p className="panel-title">Verification</p>
            <ul className="documentation-list ok">
              {selected.verification.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="metric-card">
            <p className="eyebrow">If Something Fails</p>
            <p className="panel-title">Common issues</p>
            <ul className="documentation-list warn">
              {selected.issues.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
