# Your ALGE Kit Compatibility Guide

This page explains the exact type of ALGE hardware visible in your photos and how SurgeTimer should connect to it.

## What Is Visible In Your Photos

From the photos, the hardware appears to include:

1. `PR1aW` ALGE photocell unit
   This is clearly visible on the device label.
   This is a wireless-capable photocell and can also work by cable.

2. `ALGE-TIMING` photocell / reflector partner unit
   One of the black units marked `OUT` appears to be the paired beam unit used with the photocell setup.

3. `TIMY` or `TIMY3` style handheld timing device
   The long handheld timing unit with keypad and printer cover appears to be from the TIMY family.

4. `D-LINE` style numeric display board
   The red LED display board appears to be an ALGE display connected to the timing setup.

## Most Important Integration Rule

SurgeTimer should integrate with the `TIMY / TIMY3 timing device`, not with the photocells alone.

Why:

- the photocells generate timing impulses
- the TIMY / TIMY3 is usually the main timing master that receives those impulses
- the PC software should usually read the final timing data or impulse output from the timing master

That means the recommended path is:

`PR1aW / beam sensors -> TIMY / TIMY3 -> PC running SurgeTimer`

Not:

`PR1aW directly into SurgeTimer without the timing master`

## Is SurgeTimer Capable Of Supporting This Kit?

Yes, with an important condition:

SurgeTimer is already architected correctly for this family of hardware because it supports:

- serial connection
- USB serial connection
- TCP bridge connection
- parser-based message handling
- real-time hardware logs
- connection testing
- parser testing

This matches the ALGE workflow well.

## What Is Already Compatible

The current system is suitable for:

- ALGE photocell-based start / finish impulses
- TIMY / TIMY3 serial or USB connection to the PC
- ALGE bridge or network-forwarded output through TCP
- real-time log inspection and parser validation
- mock simulation before connecting the real kit

## What Still Depends On Venue Setup

Even though the hardware family is correct, final compatibility still depends on the exact setup used at your venue:

- which TIMY or TIMY3 model is installed
- whether it outputs data over USB, serial, or a bridge
- the exact output format being sent by that timing master
- which channel is used for start, main start, and finish
- whether the PR1aW units are being used wirelessly or by cable

So the answer is:

- `Yes`, this system is capable of integration with the exact style of hardware shown
- `But` final live commissioning must be tested against the actual TIMY output seen on your machine

## Recommended Real-World Wiring Path

For your photographed kit, the most realistic production path is:

1. Set up the PR1aW beam units in the arena.
2. Let them feed the TIMY / TIMY3 timing device.
3. Connect the TIMY / TIMY3 to the laptop by USB or serial.
4. Run SurgeTimer in `serial` mode if the device exposes a serial-style port.
5. Use the Hardware Console to confirm real raw messages are arriving.
6. Test parser matching with copied payloads.
7. Run a full warm-up / start / finish dry run before the class begins.

## What To Check In Hardware Console

When this exact ALGE kit is connected properly, Hardware Console should show:

- connection status: connected
- adapter mode: serial or tcp
- last raw payload: visible
- parsed type: `TRIGGER` or `FINISH`
- channel: visible
- no repeated disconnect errors

## Recommended Commissioning Steps For This Kit

1. Use `mock` mode first and confirm the software works.
2. Move to `serial` mode.
3. Plug the TIMY / TIMY3 into the laptop.
4. Press `Connect`.
5. Press `Test Connection`.
6. Trigger a real beam with the PR1aW hardware.
7. Confirm a raw log appears.
8. Confirm parser result is correct.
9. Open Judge Console and confirm the timer reacts.
10. Run a full dry test before going live.

## Bottom Line

Your software is compatible with this ALGE hardware family in principle and in architecture.

The safest production statement is:

`SurgeTimer is ready to integrate with this ALGE setup through the TIMY / TIMY3 timing master, provided the final serial/USB/TCP output is validated on site in the Hardware Console.`
