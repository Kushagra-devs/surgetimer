# Platform Enterprise Profile Guide

This guide explains the product-grade controls that make SurgeTimer suitable for a serious on-prem venue deployment without converting it into a SaaS platform.

## What This Covers

- multi-event and multi-arena venue structure
- white-label branding
- offline-first LAN deployment settings
- license and support controls
- remote diagnostics bundle generation

## Multi-Event and Multi-Arena

Use the `Platform Profile` workspace to define each arena used by the venue.

For each arena, set:

- arena ID
- arena name
- location label
- surface type
- whether broadcast is supported

Use the active arena selector to define which arena is currently driving the live operational context.

## White-Label Branding

The branding profile controls how the product appears in the shell and navigation.

Recommended fields:

- organization name
- product label
- short label
- logo text
- primary and secondary colors
- support contact details

## Offline-First LAN Deployment

For venue-safe operation, use:

- deployment mode: `LOCAL_LAN`
- a local hostname such as `surgetimer.local`
- a local base URL that is valid on the venue Wi-Fi
- LAN-only enforcement enabled when the installation should not depend on the public internet

Enable critical-route caching so the most important operator and spectator pages stay usable in unstable network conditions.

## License and Support Controls

The product includes non-SaaS licensing and support fields for traceability:

- license key
- licensed organization
- deployment ID
- support tier
- max arenas
- max operator seats
- diagnostics sharing approval

These fields are intended for on-prem product operations, support escalation, and venue governance.

## Diagnostics Bundle

The diagnostics bundle is a support-ready snapshot of:

- site and arena context
- deployment mode
- license and support profile
- hardware telemetry
- integrations
- overlay settings
- recent audit entries
- summary counters

Generate or refresh this bundle whenever:

- a venue installation is completed
- a major issue occurs
- support needs a clean operational snapshot

## Best Practice

Use this order when commissioning a venue:

1. Define branding.
2. Define arenas.
3. Set deployment profile and local URL.
4. Configure hardware and integrations.
5. Run diagnostics bundle generation.
6. Run a full timing and overlay rehearsal.
