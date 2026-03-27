# Hardware Troubleshooting

This page helps non-technical users decide what to do when hardware timing is not behaving correctly.

## Problem: Hardware Shows Disconnected

Possible reasons:

- device is powered off
- cable is loose
- wrong serial port
- wrong TCP host or port
- bridge device is offline

What to do:

1. Check device power.
2. Check cable.
3. Check adapter mode.
4. Check port or host values.
5. Press `Test Connection`.
6. Press `Connect`.

## Problem: Logs Are Empty

Possible reasons:

- no real signal is reaching the software
- wrong device output mode
- wrong cable
- wrong bridge settings

What to do:

1. Trigger a real beam.
2. Use `Inject Test Signal`.
3. If inject works but real beam does not, the issue is outside the software.

## Problem: Logs Appear But Timer Does Not Move

Possible reasons:

- parser does not match the payload correctly
- signal type is unknown
- channel mapping is wrong
- duplicate debounce is ignoring repeated events

What to do:

1. Copy the raw payload.
2. Use `Test Parser`.
3. Confirm parsed type and channel.
4. Confirm start and finish channel rules are correct.

## Problem: Competition Must Continue But Hardware Is Unstable

What to do:

1. Stop trying random fixes mid-round.
2. Move judges to manual timing controls.
3. Keep the run moving safely.
4. Troubleshoot hardware only during a safe pause.

## Golden Rule

If there is doubt about the hardware, keep the competition safe and continue with manual controls until the signal path is proven healthy again.
