import { Injectable, UnauthorizedException } from '@nestjs/common';
import { addAudit } from '../common/demo-store';

@Injectable()
export class MobileAccessService {
  private currentCode: string | null = null;
  private expiresAt: string | null = null;

  getStatus() {
    return {
      hasActiveCode: !!this.currentCode && !!this.expiresAt && Date.parse(this.expiresAt) > Date.now(),
      expiresAt: this.expiresAt,
      codePreview: this.currentCode ? `••••${this.currentCode.slice(-2)}` : null,
    };
  }

  generate(masterPassword?: string) {
    const expected = process.env.MOBILE_CONTROL_MASTER_PASSWORD ?? 'Surge';
    if (masterPassword !== expected) {
      throw new UnauthorizedException('Invalid master password for mobile control access.');
    }

    this.currentCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    addAudit('MOBILE_ACCESS_CODE_GENERATED', 'SYSTEM', 'mobile-control');

    return {
      code: this.currentCode,
      expiresAt: this.expiresAt,
      validForMinutes: 15,
    };
  }

  validate(code?: string) {
    const active = this.currentCode && this.expiresAt && Date.parse(this.expiresAt) > Date.now();
    const ok = !!active && code === this.currentCode;

    return {
      ok,
      expiresAt: ok ? this.expiresAt : null,
      reason: ok ? undefined : 'Mobile control code is missing, expired, or incorrect.',
    };
  }
}
