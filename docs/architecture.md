# Architecture

The system is split into five runtime layers:

1. Hardware adapter layer for ALGE-compatible inputs over mock, serial, or TCP.
2. Server-authoritative timing engine package with deterministic reducer logic.
3. NestJS API for persistence, orchestration, logging, and realtime fanout.
4. Redis-backed ephemeral state and WebSocket event distribution.
5. Next.js admin, judge, simulator, and overlay presentation surfaces.

Core rule: timer values are derived from backend timestamps and monotonic server time, never from browser-local timer ownership.

