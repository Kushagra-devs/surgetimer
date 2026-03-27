import { describe, expect, it } from 'vitest';
import { buildParserPipelineFromRules } from '../src/index';

describe('parser pipeline', () => {
  it('parses configurable trigger and finish rules', () => {
    const pipeline = buildParserPipelineFromRules([
      {
        id: 'trigger',
        enabled: true,
        type: 'TRIGGER',
        pattern: '(?<channel>C\\d+)\\s+TRIG(?:GER)?(?:\\s+(?<timestamp>[\\d:.TZ-]+))?',
        channelGroupName: 'channel',
        timestampGroupName: 'timestamp',
        sourceFilter: 'any',
      },
      {
        id: 'finish',
        enabled: true,
        type: 'FINISH',
        pattern: '(?<channel>C\\d+)\\s+FINISH(?:\\s+(?<timestamp>[\\d:.TZ-]+))?',
        channelGroupName: 'channel',
        timestampGroupName: 'timestamp',
        sourceFilter: 'any',
      },
    ]);

    const trigger = pipeline.parse('C1 TRIG 2026-03-27T16:00:00.000Z', 'tcp');
    const finish = pipeline.parse('C2 FINISH 2026-03-27T16:00:10.000Z', 'tcp');

    expect(trigger.type).toBe('TRIGGER');
    expect(trigger.channel).toBe('C1');
    expect(finish.type).toBe('FINISH');
    expect(finish.channel).toBe('C2');
  });
});
