# Venue Rehearsal Test Plan

This plan is designed to create trust before a live event. Do not skip steps. Repeat until the system behaves predictably.

## Objective

Prove that the platform, operators, hardware, and display outputs behave correctly under realistic venue conditions.

## Rehearsal Phases

### Phase 1: Dry Software Rehearsal

Use simulator mode only.

| Test | Target Result |
|---|---|
| Arm competitor | State becomes READY |
| Trigger warm-up | Warm-up starts |
| Trigger main timer | Main timer starts |
| Finish run | Run completes |
| Review history | Timestamps visible |
| Overlay check | Updates live |
| Spectator check | Updates live |

### Phase 2: Hardware Commissioning Rehearsal

Use the real ALGE path.

| Test | Target Result |
|---|---|
| Connect timing master | Physical connection visible |
| Test connection | Pass |
| Trigger real beam | Raw payload visible |
| Parse payload | Valid parsed type and channel |
| Warm-up from hardware | Works |
| Main start from hardware | Works |
| Finish from hardware | Works |

### Phase 3: Operator Workflow Rehearsal

Run the real operator sequence with event staff.

| Test | Target Result |
|---|---|
| Queue next rider | Correct entry visible |
| Judge arms rider | Correct competitor active |
| Start and finish run | Correct timing flow |
| Advance next competitor | Queue stays aligned |
| Review dashboard | Shows expected state |

### Phase 4: Failure Rehearsal

These are mandatory.

| Failure Drill | Expected Recovery |
|---|---|
| Refresh browser mid-run | Timer stays authoritative |
| Disconnect hardware | Alert visible |
| Use manual controls after disconnect | Event can continue |
| Clear cache | Clients refresh cleanly |
| Force runtime restart | Services recover without losing the operational picture |

## Required Repetition

- 10 simulator rounds minimum
- 10 real hardware-triggered rounds minimum
- 3 manual fallback rounds minimum
- 3 disconnect recovery drills minimum

## Rehearsal Completion Criteria

The rehearsal is complete only when:

- no unresolved critical issues remain
- operators can complete the flow without hesitation
- hardware messages are consistently visible and parsed
- history, reports, overlay, and spectator views all stay aligned

## Post-Rehearsal Review

Log the following after each rehearsal session:

- what failed
- what was unclear to operators
- whether the issue was product, process, or hardware
- whether it was fixed
- whether it was retested successfully
