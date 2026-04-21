# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SylvanEnrollmentV2 is a static single-file enrollment form for Sylvan Learning. No build system, dependencies, or tooling.

## Running

Open `index.html` directly in any modern browser. No server, compilation, or install step needed.

## Architecture

The entire application lives in `index.html` (~680KB). It is structured as:

- **Two `.pdf-page` divs** — each renders a scanned enrollment form page as a base64-encoded JPEG background
- **`.overlay` divs** — contain all `<input>` fields positioned with `top`/`left` percentages over the background image
- **`#sigCanvas`** — HTML5 Canvas element for handwritten signature capture (touch + mouse)
- **`<style>`** — embedded CSS; inputs use absolute positioning, transparent backgrounds, and percentage-based coordinates to align with the underlying scanned form lines
- **`<script>`** — minimal JS: canvas drawing setup with device-pixel-ratio scaling, touch/mouse event listeners, and auto-populating today's date

**Positioning convention:** All field positions are specified as `top: X%; left: Y%; width: Z%` relative to their `.pdf-page` container. When adding or moving fields, coordinates must be visually verified in the browser against the background image.

**Print/PDF export** uses the native browser print dialog. `@media print` CSS hides the print button and signature clear button, and removes scroll constraints so both pages render fully.
