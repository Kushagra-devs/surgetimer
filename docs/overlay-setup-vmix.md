# Overlay Setup For vMix

## Web Browser Input

Load the overlay route in a vMix Web Browser input:

- Browser URL: `http://<local-ip>:3001/overlay/live`
- Widget URL: `http://<local-ip>:3001/overlay/widget?widget=widget-timer-primary`
- JSON fallback: `http://<local-ip>:4000/overlay/state.json`

The overlay reconnects automatically and renders live state pushed from the server.

## vMix Integration Endpoints

The API now exposes deployment-facing vMix helpers:

- `GET /vmix/status`
- `GET /vmix/overlay-input-url`
- `POST /vmix/trigger`
- `GET /settings/integrations`
- `POST /settings/integrations`

## Supported vMix Workflows

- Web Browser input for timer overlays
- desktop widget capture for custom placement
- API-triggered vMix functions using generated command URLs
- CSV/data-source path configuration stored in integration settings

## Example Automation Path

1. Enable vMix in integration settings.
2. Set `baseUrl` to the local vMix API endpoint, usually `http://127.0.0.1:8088/api`.
3. Set the overlay input name and title field.
4. Enable `autoTriggerOnStateChange` if you want timer-state-driven automation.
5. Use `POST /vmix/trigger` to dry-run or trigger the configured preset.
