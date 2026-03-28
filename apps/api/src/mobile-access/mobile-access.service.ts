import { ForbiddenException, HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { addAudit } from '../common/demo-store';
import { TimingService } from '../timing/timing.service';
import type {
  MobileControlCampusPolicy,
  MobileControlDeviceInfo,
  MobileControlLocation,
  MobileControlSessionView,
  MobileControlStatus,
} from '@horse-timer/types';

type MobileSessionRecord = MobileControlSessionView & {
  token: string;
};

@Injectable()
export class MobileAccessService {
  private currentCode: string | null = null;
  private expiresAt: string | null = null;
  private readonly sessions = new Map<string, MobileSessionRecord>();
  private readonly sessionTtlMs = 2 * 60 * 1000;

  constructor(@Inject(TimingService) private readonly timingService: TimingService) {}

  getCampusPolicy(): MobileControlCampusPolicy {
    return {
      venueName: 'Surge Stable',
      address: 'Surge Stable, Rakum Ashram road, North, Tarahunise village, Bengaluru, Karnataka 562157',
      latitude: Number(process.env.SURGE_CAMPUS_LAT ?? 13.1725),
      longitude: Number(process.env.SURGE_CAMPUS_LNG ?? 77.635),
      radiusMeters: Number(process.env.SURGE_CAMPUS_RADIUS_METERS ?? 1200),
      maxConcurrentUsers: Number(process.env.MOBILE_CONTROL_MAX_USERS ?? 2),
    };
  }

  getStatus(): MobileControlStatus {
    const sessions = this.getActiveSessions();
    const campus = this.getCampusPolicy();
    return {
      hasActiveCode: !!this.currentCode && !!this.expiresAt && Date.parse(this.expiresAt) > Date.now(),
      expiresAt: this.expiresAt,
      codePreview: this.currentCode ? `••••${this.currentCode.slice(-2)}` : null,
      activeUsers: sessions.length,
      slotsRemaining: Math.max(0, campus.maxConcurrentUsers - sessions.length),
      campus,
      sessions,
    };
  }

  generate(masterPassword?: string) {
    const expected = process.env.MOBILE_CONTROL_MASTER_PASSWORD ?? 'Surge';
    if (masterPassword !== expected) {
      throw new UnauthorizedException('Invalid master password for mobile control access.');
    }

    this.currentCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    this.cleanupSessions();
    addAudit('MOBILE_ACCESS_CODE_GENERATED', 'SYSTEM', 'mobile-control');

    return {
      code: this.currentCode,
      expiresAt: this.expiresAt,
      validForMinutes: 15,
      activeUsers: this.getActiveSessions().length,
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

  login(input: {
    code?: string;
    password?: string;
    name?: string;
    location?: MobileControlLocation;
    device?: MobileControlDeviceInfo;
    ipAddress?: string;
  }) {
    this.assertCode(input.code);

    const password = input.password?.trim();
    const expectedPassword = process.env.MOBILE_CONTROL_ACCESS_PASSWORD ?? 'Surge';
    if (!password || password !== expectedPassword) {
      throw new UnauthorizedException('Mobile control password is incorrect.');
    }

    const name = input.name?.trim();
    if (!name) {
      throw new UnauthorizedException('Operator name is required for mobile control.');
    }

    if (!input.location) {
      throw new ForbiddenException('Live location is required to unlock mobile control.');
    }

    const campusCheck = this.verifyCampusLocation(input.location);
    if (!campusCheck.insideCampus) {
      throw new ForbiddenException(`Mobile control is restricted to the Surge Stable campus. Current device is ${Math.round(campusCheck.distanceMeters)}m away.`);
    }

    const activeSessions = this.getActiveSessions();
    const campus = this.getCampusPolicy();
    if (activeSessions.length >= campus.maxConcurrentUsers) {
      throw new HttpException(
        `Only ${campus.maxConcurrentUsers} mobile controllers can stay active at one time.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const token = randomUUID();
    const now = new Date().toISOString();
    const session: MobileSessionRecord = {
      id: `mbl-${Date.now()}`,
      token,
      name,
      createdAt: now,
      lastSeenAt: now,
      ipAddress: input.ipAddress ?? 'unknown',
      status: 'ACTIVE',
      insideCampus: true,
      distanceMeters: campusCheck.distanceMeters,
      device: input.device ?? {
        userAgent: 'unknown',
        platform: 'unknown',
        language: 'unknown',
        viewport: 'unknown',
      },
      location: input.location,
    };

    this.sessions.set(token, session);
    addAudit('MOBILE_ACCESS_UNLOCKED', 'SYSTEM', session.id, name);

    return {
      ok: true,
      expiresAt: this.expiresAt,
      sessionToken: token,
      session: this.toSessionView(session),
      status: this.getStatus(),
    };
  }

  heartbeat(token?: string, location?: MobileControlLocation) {
    const session = this.getValidSession(token);
    session.lastSeenAt = new Date().toISOString();
    if (location) {
      const campusCheck = this.verifyCampusLocation(location);
      if (!campusCheck.insideCampus) {
        session.status = 'REVOKED';
        this.sessions.delete(session.token);
        throw new ForbiddenException('Mobile control access ended because this device moved outside the Surge Stable campus boundary.');
      }
      session.location = location;
      session.distanceMeters = campusCheck.distanceMeters;
    }

    return {
      ok: true,
      session: this.toSessionView(session),
      status: this.getStatus(),
    };
  }

  logout(token?: string) {
    const session = this.getValidSession(token);
    this.sessions.delete(session.token);
    addAudit('MOBILE_ACCESS_LOGOUT', 'SYSTEM', session.id, session.name);
    return {
      ok: true,
    };
  }

  runAction(token: string | undefined, action: string, body?: { competitorEntryId?: string; reason?: string }) {
    const session = this.getValidSession(token);
    const userId = `mobile:${session.name}`;

    switch (action) {
      case 'arm':
        return this.timingService.armCompetitor(body?.competitorEntryId ?? 'entry-1', userId);
      case 'warmup':
        return this.timingService.manualWarmupStart(userId);
      case 'main':
        return this.timingService.manualMainStart(userId);
      case 'pause':
        return this.timingService.pause(userId);
      case 'resume':
        return this.timingService.resume(userId);
      case 'stop':
        return this.timingService.manualStop(userId);
      case 'abort':
        return this.timingService.abort(userId, body?.reason ?? 'Mobile control abort');
      case 'reset':
        return this.timingService.reset(userId);
      default:
        throw new ForbiddenException('Unsupported mobile control action.');
    }
  }

  private assertCode(code?: string) {
    const active = this.currentCode && this.expiresAt && Date.parse(this.expiresAt) > Date.now();
    if (!active || code !== this.currentCode) {
      throw new UnauthorizedException('Mobile control code is missing, expired, or incorrect.');
    }
  }

  private getValidSession(token?: string) {
    this.cleanupSessions();
    if (!token) {
      throw new UnauthorizedException('Mobile session token is required.');
    }

    const session = this.sessions.get(token);
    if (!session || session.status !== 'ACTIVE') {
      throw new UnauthorizedException('Mobile control session is not active.');
    }

    return session;
  }

  private cleanupSessions() {
    const cutoff = Date.now() - this.sessionTtlMs;
    for (const [token, session] of this.sessions.entries()) {
      if (Date.parse(session.lastSeenAt) < cutoff) {
        session.status = 'EXPIRED';
        this.sessions.delete(token);
      }
    }
  }

  private getActiveSessions() {
    this.cleanupSessions();
    return Array.from(this.sessions.values())
      .filter((session) => session.status === 'ACTIVE')
      .sort((left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt))
      .map((session) => this.toSessionView(session));
  }

  private toSessionView(session: MobileSessionRecord): MobileControlSessionView {
    return {
      id: session.id,
      name: session.name,
      createdAt: session.createdAt,
      lastSeenAt: session.lastSeenAt,
      ipAddress: session.ipAddress,
      status: session.status,
      insideCampus: session.insideCampus,
      distanceMeters: session.distanceMeters,
      device: session.device,
      location: session.location,
    };
  }

  private verifyCampusLocation(location: MobileControlLocation) {
    const campus = this.getCampusPolicy();
    const distanceMeters = this.calculateDistanceMeters(
      campus.latitude,
      campus.longitude,
      location.latitude,
      location.longitude,
    );

    return {
      insideCampus: distanceMeters <= campus.radiusMeters,
      distanceMeters,
    };
  }

  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const earthRadius = 6371000;
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(deltaLat / 2) ** 2
      + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }
}
