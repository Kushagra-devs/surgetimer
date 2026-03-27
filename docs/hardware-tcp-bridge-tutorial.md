# TCP Bridge Tutorial

Use this when the ALGE timing device is not connected directly to the software computer, but is instead sent through:

- a serial-to-network converter
- a TCP bridge device
- a network serial server

## What You Need

- ALGE timing device powered on
- bridge device powered on
- correct IP address or hostname
- correct TCP port
- both the bridge and SurgeTimer computer on the same network

## Simple Setup Steps

1. Power on the ALGE device.
2. Power on the TCP bridge.
3. Confirm the bridge is on the same local network as the SurgeTimer computer.
4. Open the Hardware Console.
5. Set adapter mode to `tcp`.
6. Enter the TCP host.
7. Enter the TCP port.
8. Choose the correct line delimiter.
9. Save settings.
10. Press `Connect`.
11. Press `Test Connection`.
12. Trigger a test beam.
13. Watch the raw history and parsed result.

## What “Correct” Looks Like

- status shows connected
- raw TCP payloads appear in the history table
- parsed type becomes `TRIGGER` or `FINISH`
- the timer responds in the Judge Console

## If It Fails

If no connection:

1. Confirm IP address is correct.
2. Confirm TCP port is correct.
3. Confirm firewall rules are not blocking the connection.
4. Confirm the bridge device is actually forwarding serial data.

If data arrives but looks broken:

1. Check the line delimiter setting.
2. Try `LF`, `CRLF`, or `CR` based on the device output.
3. Use `Test Parser` with a copied raw payload.

## Best Practice

Always perform a full end-to-end start and finish test before the first class begins.
