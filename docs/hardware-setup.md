# Hardware Setup Guide

This guide explains, in plain language, exactly how to connect ALGE hardware to SurgeTimer and how to confirm that the software is using the real hardware feed rather than simulator data.

## What "Register Hardware" Means

Registering hardware with SurgeTimer means all of the following are true:

1. The ALGE timing master is physically connected to the computer.
2. SurgeTimer is configured for the correct connection method.
3. The software can open the connection successfully.
4. Real hardware messages are arriving in the raw log.
5. Those messages are being parsed into valid timing signals.
6. The dashboard and judge panel show live ALGE status, not simulator mode.

If even one of these is missing, the hardware is not fully registered.

## Supported Connection Methods

The system supports three connection methods:

1. `mock`
   Use this only for testing without real hardware.
2. `serial`
   Use this when the ALGE timing master is connected directly through RS232, USB serial, or a USB-to-serial adapter.
3. `tcp`
   Use this when the ALGE timing master is connected through a network serial bridge or TCP device server.

## Important Safety Rules

- Keep the ALGE timing master powered on during operation.
- Do not power-cycle the timing master in the middle of a live class unless the class is officially stopped.
- Always complete one full hardware test before the class starts.
- If hardware is not stable, continue only through manual judge controls until the issue is understood.

## Before You Start

You need:

- the SurgeTimer web app and API running
- the ALGE timing master powered on
- the correct data cable or network bridge
- access to the `Settings` or `Super Admin` screen
- access to the `Hardware Console`
- access to the real beam or signal trigger so you can test live input

## Step 1: Physically Connect the ALGE Hardware

In most real setups, the path is:

`ALGE photocell / beam -> ALGE timing master -> laptop running SurgeTimer`

Do not expect the software to talk directly to the beam sensor unless the venue has a custom setup. In most cases the computer reads from the timing master.

For a serial or USB-serial setup:

1. Power on the ALGE timing master.
2. Connect the serial or USB-serial cable from the timing master to the computer.
3. Wait for the computer to detect the device.
4. Identify the port name.

Examples of port names:

- macOS: `/dev/tty.usbserial-xxxxx`
- Linux: `/dev/ttyUSB0` or `/dev/ttyACM0`
- Windows: `COM3`, `COM4`, and similar

For a TCP bridge setup:

1. Power on the ALGE timing master.
2. Connect it to the serial server or network bridge.
3. Confirm the bridge device is on the same network as the computer.
4. Note the bridge IP address and port.

## Step 2: Open Hardware Settings in the Software

You can do this from:

- `Super Admin -> Integrations`
- or `Settings -> Integrations`

This is where you tell SurgeTimer how to talk to the hardware.

## Step 3: Choose the Correct Adapter Mode

Select the adapter mode based on the real setup:

- choose `Serial` for direct USB serial or RS232
- choose `TCP` for a TCP bridge or device server
- use `Mock` only for rehearsal or testing without real ALGE hardware

If you want real hardware status, do not leave the system in `Mock`.

## Step 4: Enter the Connection Details

### If you are using Serial

1. Enter the serial device path or COM port.
2. Confirm any serial settings required by the venue timing master.
3. Save the configuration.

### If you are using TCP

1. Enter the host IP address.
2. Enter the TCP port.
3. Save the configuration.

## Step 5: Configure or Review Parser Rules

Parser rules tell SurgeTimer how to understand ALGE output messages.

Use this order:

1. Open the parser section in the integrations workspace.
2. Review the existing rules.
3. If the venue provided sample ALGE messages, paste one into the parser test tool.
4. Confirm the result shows a recognized signal such as `TRIGGER` or `FINISH`.
5. If it stays unknown, adjust the parser rule before going live.

Important:

- A successful cable connection is not enough.
- The software must also understand the incoming message format.

## Step 6: Open Hardware Console and Connect

Now open `Hardware Console`.

Follow this exact order:

1. Confirm the adapter mode shown matches your intended setup.
2. Start with the `Guided Hardware Connection` section at the top of the page.
3. Read Step 1 and Step 2 in the wizard before pressing anything.
4. Press `Verify Current Connection` to let the software check the current configuration and connection state.
5. Read which steps show `pass`, `warn`, or `fail`.
6. Fix any failed step before moving on.
7. Press `Connect`.
8. Wait for the status to update.
9. Press `Test Connection`.

What success looks like:

- the connection test returns success
- hardware status shows connected
- source is shown as physical, not simulated

If `Test Connection` fails, stop here and correct the connection settings.

## Step 7: Trigger a Real Hardware Signal

Once the connection is open:

1. Trigger a real beam or input from the ALGE system.
2. Watch the raw log section in Hardware Console.
3. Confirm a new line appears with a timestamp.
4. Confirm the parsed signal section shows a valid type and channel.
5. Press `Verify Current Connection` again and confirm the `Receive a real signal` and `Confirm live parsing` steps change to `pass`.

At this stage you are checking two things:

- can the software receive the message
- can the software understand the message

## Step 8: Confirm the Application Shows Real Live Status

After at least one successful real input:

1. Open the Dashboard.
2. Open the Judge panel.
3. Confirm the platform shows ALGE connected or live hardware ready.
4. Confirm it does not say simulator mode.

This is the most important visibility check. It proves the software is now reading a physical hardware path.

## Step 9: Run a Full Dry Test

Before the event starts, run a full test round:

1. Arm a competitor.
2. Trigger the first signal and confirm warm-up starts.
3. Trigger the second signal and confirm the main timer starts.
4. Trigger the finish signal or use the mapped finish input.
5. Confirm the run completes.
6. Confirm the run appears in history with timestamps.
7. Confirm the overlay and spectator page update.

If this full dry test passes, the hardware is properly registered and validated.

## Quick Start For Non-Technical Operators

If you are not technical, follow this order without skipping steps:

1. Open `Settings` or `Super Admin`.
2. Select the correct hardware mode.
3. Enter the port or bridge details.
4. Save the settings.
5. Open `Hardware Console`.
6. Press `Connect`.
7. Press `Test Connection`.
8. Trigger a real beam.
9. Confirm the raw log updates.
10. Confirm parsed signal values appear.
11. Open `Dashboard`.
12. Confirm the system says ALGE connected or ready.
13. Only then start the class.

## What Good Looks Like

A healthy hardware setup should show:

- Hardware status: `Connected`
- Source: `physical`
- Adapter mode: correct for the real setup
- Latest signal: visible in raw logs
- Parsed type: `TRIGGER` or `FINISH`
- Channel: visible and correct
- Dashboard readiness: `ready`
- Judge panel label: ALGE connected

## What To Do If It Fails

### If the software says Disconnected

1. Check that the ALGE timing master is powered on.
2. Check the cable is fully inserted.
3. Check the software is using the correct port or TCP host and port.
4. Press `Test Connection` again.
5. Watch diagnostics for the exact error message.

### If the connection test passes but no raw logs appear

1. The software can reach the port, but the timing master may not be sending the expected data.
2. Check ALGE output settings on the timing master.
3. Trigger the beam again.
4. Confirm the venue wiring really reaches the timing master output you connected.

### If raw logs appear but the parser result is unknown

1. Copy the exact payload from the raw log.
2. Paste it into the parser test area.
3. Adjust the parser rule until it recognizes the message.
4. Save the rule and test again with a new real trigger.

### If the platform still shows simulator mode

1. Re-open integrations settings.
2. Make sure adapter mode is not set to `Mock`.
3. Save the correct mode.
4. Reconnect the hardware.

## Hardware Console Endpoints

- `GET /hardware/status`
- `GET /hardware/logs`
- `GET /hardware/diagnostics`
- `GET /hardware/telemetry`
- `POST /hardware/connect`
- `POST /hardware/disconnect`
- `POST /hardware/reconfigure`
- `POST /hardware/test-signal`
- `POST /hardware/test-connection`
- `POST /hardware/test-parser`

## Recommended Commissioning Sequence

1. Run the software.
2. Power on the ALGE timing master.
3. Connect the data cable or network bridge.
4. Open Integrations and choose the correct adapter mode.
5. Enter port or TCP values.
6. Save settings.
7. Review parser rules.
8. Open Hardware Console.
9. Press `Connect`.
10. Run `Test Connection`.
11. Trigger a real beam or real input.
12. Confirm a raw message appears.
13. Confirm it parses correctly.
14. Open Dashboard and Judge panel.
15. Confirm ALGE live status is shown.
16. Run one full dry round.
17. Only then go live with the class.
