# Mock Simulator Tutorial

Use this when you want to learn the system without any real ALGE hardware.

## When To Use It

Use `mock` mode when:

- you are training staff
- you are testing the overlay
- you are testing the judge panel
- the real ALGE device is not available yet

## Step-by-Step

1. Open `Settings` or `Hardware Console`.
2. Set adapter mode to `mock`.
3. Save the integration settings.
4. Open the Hardware Console.
5. Confirm mode shows `mock`.
6. Press `Test Connection`.
7. Press `Inject Test Signal`.
8. Check that a new raw log row appears.
9. Check that the parser result shows `TRIGGER`.
10. Open the Judge Console or Simulator page and verify the timer reacts.

## What You Should See

- connection can show healthy even without physical hardware
- raw log entries appear immediately
- parser shows a valid trigger type
- timer can move through warm-up and round flow

## Common Mistakes

- forgetting to save settings after changing adapter mode
- expecting a real COM port in mock mode
- testing the scoreboard before testing the timing path

## Best Use

Use this mode first before every venue deployment if you want to prove that the software itself is healthy.
