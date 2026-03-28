import { describe, expect, it } from 'vitest';
import { MobileAccessService } from '../src/mobile-access/mobile-access.service';

describe('mobile access service', () => {
  it('generates and validates a rotating mobile access code', () => {
    const service = new MobileAccessService({
      armCompetitor: () => null,
      manualWarmupStart: () => null,
      manualMainStart: () => null,
      pause: () => null,
      resume: () => null,
      manualStop: () => null,
      abort: () => null,
      reset: () => null,
    } as never);

    expect(() => service.generate('wrong')).toThrow();

    const generated = service.generate('Surge');
    expect(generated.code).toHaveLength(6);

    const valid = service.validate(generated.code);
    expect(valid.ok).toBe(true);

    const next = service.generate('Surge');
    expect(next.code).not.toBe(generated.code);
    expect(service.validate(generated.code).ok).toBe(false);
    expect(service.validate(next.code).ok).toBe(true);
  });

  it('requires password, campus location, and respects the two-user limit', () => {
    const service = new MobileAccessService({
      armCompetitor: () => null,
      manualWarmupStart: () => null,
      manualMainStart: () => null,
      pause: () => null,
      resume: () => null,
      manualStop: () => null,
      abort: () => null,
      reset: () => null,
    } as never);

    const generated = service.generate('Surge');

    expect(() =>
      service.login({
        code: generated.code,
        password: 'wrong',
        name: 'Operator One',
        location: {
          latitude: 13.1725,
          longitude: 77.635,
          accuracyMeters: 10,
          capturedAt: new Date().toISOString(),
        },
      }),
    ).toThrow();

    const first = service.login({
      code: generated.code,
      password: 'Surge',
      name: 'Operator One',
      ipAddress: '127.0.0.1',
      device: {
        userAgent: 'test',
        platform: 'iPhone',
        language: 'en-IN',
        viewport: '390x844',
      },
      location: {
        latitude: 13.1725,
        longitude: 77.635,
        accuracyMeters: 10,
        capturedAt: new Date().toISOString(),
      },
    });
    expect(first.ok).toBe(true);

    service.login({
      code: generated.code,
      password: 'Surge',
      name: 'Operator Two',
      ipAddress: '127.0.0.2',
      device: {
        userAgent: 'test',
        platform: 'Android',
        language: 'en-IN',
        viewport: '412x915',
      },
      location: {
        latitude: 13.1726,
        longitude: 77.6351,
        accuracyMeters: 8,
        capturedAt: new Date().toISOString(),
      },
    });

    expect(() =>
      service.login({
        code: generated.code,
        password: 'Surge',
        name: 'Operator Three',
        location: {
          latitude: 13.1727,
          longitude: 77.6352,
          accuracyMeters: 8,
          capturedAt: new Date().toISOString(),
        },
      }),
    ).toThrow();
  });
});
