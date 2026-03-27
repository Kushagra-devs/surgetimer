export function OpsWorkflow() {
  const steps = [
    {
      title: '1. Stage the next run',
      copy: 'Confirm queue order, arm the competitor, and keep one operator responsible for the live timing path.',
    },
    {
      title: '2. Execute from the judge panel',
      copy: 'Start, monitor, stop, or override from the dedicated control surface while the rest of the platform stays observational.',
    },
    {
      title: '3. Keep display changes off the critical path',
      copy: 'Use overlay, widget, and spectator controls before or after the live sequence rather than during an active round.',
    },
    {
      title: '4. Review reports and incidents continuously',
      copy: 'Use hardware telemetry, run history, and realtime reports to spot reliability issues before they affect the arena.',
    },
  ];

  return (
    <div className="metric-card">
      <p className="eyebrow">Operating Model</p>
      <p className="panel-title">Recommended live workflow</p>
      <div className="tip-grid">
        {steps.map((step) => (
          <div key={step.title} className="tip-card">
            <p className="tip-title">{step.title}</p>
            <p className="tip-copy">{step.copy}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
