'use client';

import { useState } from 'react';

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'How To Use The Hardware Area',
    steps: [
      'Start with Mock Simulator if you have never used the system before.',
      'Move to Serial / USB only when the ALGE device is physically connected.',
      'Use TCP Bridge only when a network bridge device is part of the venue setup.',
      'Always press Test Connection before the class begins.',
      'Always confirm new raw logs appear before trusting the timer.',
    ],
  },
  {
    id: 'alge-kit',
    label: 'Your ALGE Kit',
    title: 'How Your Photographed Hardware Should Connect',
    steps: [
      'The PR1aW photocells should feed the TIMY or TIMY3 timing master.',
      'The laptop should connect to the TIMY or TIMY3, not usually to the photocells alone.',
      'Use serial or USB connection from TIMY to the laptop if available.',
      'Use the Hardware Console to confirm real raw messages are coming from the timing master.',
      'If raw messages appear and parser output is correct, the software can operate with this ALGE kit.',
      'Always test the full beam-to-timer-to-PC path before the first class starts.',
    ],
  },
  {
    id: 'mock',
    label: 'Mock Simulator',
    title: 'Practice Without Real Hardware',
    steps: [
      'Set adapter mode to mock.',
      'Save integration settings.',
      'Open the Hardware Console and confirm mode shows mock.',
      'Press Test Connection.',
      'Press Inject Test Signal and confirm a new raw log appears.',
      'Open Judge Console and verify the timer reacts.',
    ],
  },
  {
    id: 'serial',
    label: 'Serial / USB',
    title: 'Connect Directly To ALGE By Cable',
    steps: [
      'Power on the ALGE timing master first.',
      'Connect the ALGE device to the computer using serial or USB-serial.',
      'Enter the correct serial port in integration settings.',
      'Save settings and press Connect.',
      'Press Test Connection.',
      'Trigger a real beam and confirm raw logs and parsed type are visible.',
    ],
  },
  {
    id: 'tcp',
    label: 'TCP Bridge',
    title: 'Connect Through A Network Bridge',
    steps: [
      'Power on the ALGE device and the bridge device.',
      'Enter the TCP host and port in integration settings.',
      'Select the correct line delimiter.',
      'Save settings and press Connect.',
      'Press Test Connection.',
      'Trigger a real beam and confirm raw TCP payloads appear in the log.',
    ],
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    title: 'What To Do When Something Looks Wrong',
    steps: [
      'If connection is down, check power, cable, and port or host values.',
      'If logs are empty, the software is not receiving real data.',
      'If logs appear but timer does not move, test the parser with the exact payload.',
      'If the class is live and hardware is unstable, move to manual timing controls.',
      'Never power-cycle the timing master during active operation unless absolutely necessary.',
    ],
  },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function HardwareGuideTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="metric-card">
      <p className="eyebrow">Layman Hardware Tutorial</p>
      <p className="panel-title">Step-by-step guidance for each hardware integration path</p>
      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="section-stack" style={{ marginTop: 18 }}>
        <div className="tip-card">
          <p className="tip-title">{active.title}</p>
          <p className="tip-copy">Follow these steps in order. Do not skip connection testing before live competition.</p>
        </div>
        <div className="analysis-list">
          {active.steps.map((step, index) => (
            <div key={`${active.id}-${index}`} className="analysis-item ok">
              <div className="analysis-title">Step {index + 1}</div>
              <div className="analysis-copy">{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
