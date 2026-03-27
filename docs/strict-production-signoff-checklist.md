# Strict Production Sign-Off Checklist

Use this checklist only after feature work is frozen. The purpose of this document is to decide whether the platform is truly ready for a live event, not whether it "basically works."

## Sign-Off Rule

The system is signed off only when:

- all critical checks are complete
- all critical checks pass
- all blockers are resolved
- the operator rehearsal has been completed
- the actual hardware path has been tested on the venue setup

If any critical item fails, sign-off is denied.

## Section 1: Platform Readiness

| Check | Required | Pass / Fail |
|---|---|---|
| API starts cleanly | Yes |  |
| Web app starts cleanly | Yes |  |
| Dashboard loads | Yes |  |
| Judge panel loads | Yes |  |
| Hardware Console loads | Yes |  |
| Settings page loads | Yes |  |
| No blocking runtime errors in startup logs | Yes |  |

## Section 2: Persistence and Recovery

| Check | Required | Pass / Fail |
|---|---|---|
| Postgres connected | Strongly recommended for production |  |
| Redis connected | Strongly recommended for production |  |
| Runtime state survives refresh | Yes |  |
| Run history persists correctly | Yes |  |
| Cache clear action works | Yes |  |
| Runtime restart action works | Yes |  |

## Section 3: Hardware Readiness

| Check | Required | Pass / Fail |
|---|---|---|
| Correct adapter mode selected | Yes |  |
| Correct serial or TCP target entered | Yes |  |
| Parser rules enabled | Yes |  |
| Hardware connection test passes | Yes |  |
| Real hardware payload appears in raw logs | Yes |  |
| Real payload parses correctly | Yes |  |
| Dashboard shows physical ALGE readiness | Yes |  |
| Judge panel shows ALGE connected | Yes |  |

## Section 4: Timing Readiness

| Check | Required | Pass / Fail |
|---|---|---|
| Competitor can be armed | Yes |  |
| First valid trigger starts warm-up | Yes |  |
| Second valid trigger starts main timer | Yes |  |
| Finish trigger completes run | Yes |  |
| Manual stop completes run | Yes |  |
| Manual fallback works with hardware disconnected | Yes |  |
| Queue advances correctly after run | Yes |  |
| Timestamped history is recorded | Yes |  |

## Section 5: Display and Broadcast Readiness

| Check | Required | Pass / Fail |
|---|---|---|
| Overlay route updates live | Yes |  |
| Native widget opens correctly | If used |  |
| Spectator page updates live | If used |  |
| QR link opens correctly on mobile device | If used |  |
| vMix integration tested or intentionally disabled | Yes |  |

## Section 6: Event-Day Operator Readiness

| Check | Required | Pass / Fail |
|---|---|---|
| Operator knows the Judge panel flow | Yes |  |
| Operator knows manual fallback path | Yes |  |
| Operator knows hardware verification path | Yes |  |
| Operator knows how to clear cache and restart runtime | Yes |  |
| Operator knows how to read blockers in Pre-Event Test | Yes |  |

## Section 7: Failure Drills

| Drill | Required | Pass / Fail |
|---|---|---|
| Browser refresh during active round | Yes |  |
| Hardware disconnect during rehearsal | Yes |  |
| Manual fallback after disconnect | Yes |  |
| Runtime restart after a non-live test | Yes |  |
| Parser mismatch recovery using sample payload | Yes |  |

## Sign-Off Decision

| Decision Item | Result |
|---|---|
| All critical checks passed |  |
| All failure drills passed |  |
| Venue hardware path verified |  |
| Operator approved for live use |  |
| Final sign-off granted |  |

## Signatures

| Role | Name | Signature | Date |
|---|---|---|---|
| Technical Lead |  |  |  |
| Judge / Timing Operator |  |  |  |
| Event Manager |  |  |  |
