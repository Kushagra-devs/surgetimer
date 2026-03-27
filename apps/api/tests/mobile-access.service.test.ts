import { describe, expect, it } from 'vitest';
import { MobileAccessService } from '../src/mobile-access/mobile-access.service';

describe('mobile access service', () => {
  it('generates and validates a rotating mobile access code', () => {
    const service = new MobileAccessService();

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
});
