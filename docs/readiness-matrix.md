# Red / Yellow / Green Readiness Matrix

Use this matrix to decide whether the system is allowed to go live.

## Green

Go live is allowed.

| Area | Green Condition |
|---|---|
| Hardware | Physical ALGE connection is active and verified |
| Parser | Real payloads parse correctly |
| Queue | At least one ready competitor is staged |
| Timing | Judge panel, dashboard, and history stay aligned |
| Operators | Team has completed rehearsal successfully |
| Recovery | Cache clear and runtime restart are understood |

## Yellow

Go live is possible only if the event lead explicitly accepts the risk.

| Area | Yellow Condition |
|---|---|
| Hardware | Simulator or manual fallback only |
| Persistence | Postgres or Redis unavailable but system still operates |
| Broadcast | vMix disabled but browser overlay still works |
| Spectator | Public page disabled or not yet verified |
| Operations | Minor warnings remain but no hard blockers exist |

## Red

Go live is not allowed.

| Area | Red Condition |
|---|---|
| Hardware | No physical connection and policy requires hardware |
| Parser | Raw payloads arrive but parser does not recognize them |
| Queue | No ready competitor and policy requires ready entries |
| Runtime | System shows critical blocker in Pre-Event Test |
| Operators | Staff cannot complete the live flow confidently |
| Rehearsal | Failure drills have not been completed |

## Decision Rule

| Status | Action |
|---|---|
| Green | Proceed with live event |
| Yellow | Proceed only with explicit risk acceptance and fallback plan |
| Red | Do not go live |
