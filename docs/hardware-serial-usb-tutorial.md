# Serial / USB ALGE Tutorial

Use this when the ALGE device is connected directly to the computer through:

- RS232 serial
- USB-to-serial adapter
- native USB serial connection

## What You Need

- ALGE timing device powered on
- correct serial or USB cable
- if needed, a USB-to-serial adapter
- the serial port name used by the computer

Examples of serial port names:

- macOS: `/dev/tty.usbserial-XXXX` or `/dev/cu.usbserial-XXXX`
- Linux: `/dev/ttyUSB0` or `/dev/ttyACM0`
- Windows: `COM3`, `COM4`, `COM5`

## Plain-Language Setup Steps

1. Power on the ALGE timing master.
2. Connect the ALGE device to the computer.
3. Wait a few seconds for the computer to detect the cable.
4. Open the Hardware Console.
5. Set adapter mode to `serial`.
6. Enter the serial port value.
7. Save settings.
8. Press `Connect`.
9. Press `Test Connection`.
10. Trigger a real start or finish sensor, or ask a technician to send a test impulse.
11. Watch the raw log.
12. Confirm a parsed result appears.

## How To Know It Worked

It is working correctly when:

- status says `Connected`
- raw lines appear in history
- parsed type is visible
- channel value is visible
- the judge timer reacts to real signals

## If It Does Not Work

If it says disconnected:

1. Confirm the ALGE device is powered.
2. Confirm the cable is correct.
3. Confirm the computer sees the serial port.
4. Try reconnecting the cable.
5. Press `Connect` again.

If the wrong port is entered:

1. Disconnect.
2. Enter the correct serial port.
3. Save settings.
4. Press `Connect`.

If raw payloads arrive but parsing fails:

1. Copy the exact payload from the raw log.
2. Paste it into `Test Parser`.
3. Adjust parser rules until the result is correct.

## Safety Note

Do not switch off the ALGE timing master during the live session unless absolutely necessary.
