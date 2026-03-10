# Chiba Takumi Brand Identity Mini Guide

## Core

- Primary name: `CHIBA TAKUMI` (family name first, Japanese convention)
- Brand direction: quiet tension, craft precision, integrated perspective
- Visual stance: restrained, sharp, editorial, never decorative-first

## Identity System

- Primary mark: logotype `CHIBA TAKUMI` (custom-drawn word mark)
- Supporting mark: abstract `TC / 工` monoline symbol
- Usage rule: if the symbol feels generic or crowded in context, prefer the logotype alone

## Logotype Design Specifications

### Construction

- Base font: Geist Sans (Medium 500 for CHIBA, Light 300 for TAKUMI)
- Glyph paths extracted with opentype.js and mathematically modified
- Output: SVG path data rendered as inline `<svg>` with `fill` (not stroke)

### Character Modifications

| Character | Modification |
|-----------|-------------|
| A | Flat-top apex (90 UPM), crossbar shortened 6 UPM per side |
| K | Junction gap enhancement with taper toward stem |
| C | 30° terminal angle cuts, wider opening (+12 UPM) |
| T | Crossbar extended +4 UPM per side, terminal cuts |
| H | Crossbar raised to optical center (+8 UPM above mathematical center) |
| B | Waist narrowing at bowl junction (ink trap, -12 UPM) |
| M | Diagonal thinning (-10 UPM), deeper nadir |
| I | Unmodified — functions as breathing point |
| U | Unmodified — original curve preserved |

### Weight Hierarchy

- **CHIBA** (primary): Geist Medium 500, `var(--text-base)` = `#F5F5F5`
- **TAKUMI** (secondary): Geist Light 300, `var(--text-base-80)` = 80% opacity

### Minimum Size

- `20px` height for full detail visibility (A flat-top, K gap, terminal angles)
- `14px` height for nav compact use (detail degrades gracefully)

## Symbol Logic

- Left vertical + top/bottom rails create an open `C`
- Center stem anchors the `T`
- Middle rail retains the structural memory of `工`
- Open right side keeps the mark breathable at favicon scale

## Color

- Background: `#050505`
- Foreground: `#F5F5F5`
- Secondary wordmark tone: 80% opacity of foreground
- Accent context only: existing site amber tokens

## Clear Space and Size

- Symbol clear space: `12` units on the `80x80` grid
- Symbol minimum size: `16px`
- Logotype minimum size: `20px` height (detail visibility threshold)
- Preferred favicon sizes: `16`, `32`, `48`, `180`, `512`

## Asset Inventory

- Source mark: `apps/web/public/brand/logo-mark.svg`
- Source wordmark: `apps/web/public/brand/logo-wordmark.svg` (path-based, not text)
- Source lockup: `apps/web/public/brand/logo-lockup.svg`
- App icon source: `apps/web/src/app/icon.svg`
- Generated icons: `apps/web/src/app/favicon.ico`, `apps/web/src/app/apple-icon.png`
- Build scripts: `apps/web/scripts/` (extract-glyphs, modify-glyphs, build-wordmark)

## Implementation Notes

- Site navigation uses inline SVG wordmark with the symbol as a compact lead-in.
- Wordmark uses `fill` rendering (closed path outlines), not `stroke`.
- Path data stored in `portfolio.ts` wordmark field as `primaryPaths[]` and `secondaryPaths[]`.
- Page transition uses the symbol only for stroke-draw animation compatibility.
- The current implementation intentionally avoids an overbuilt emblem. The wordmark remains primary.
