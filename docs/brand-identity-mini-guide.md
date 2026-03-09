# Takumi Chiba Brand Identity Mini Guide

## Core

- Primary name: `Takumi Chiba`
- Brand direction: quiet tension, craft precision, integrated perspective
- Visual stance: restrained, sharp, editorial, never decorative-first

## Identity System

- Primary mark: logotype `Takumi Chiba`
- Supporting mark: abstract `TC / 工` monoline symbol
- Usage rule: if the symbol feels generic or crowded in context, prefer the logotype alone

## Symbol Logic

- Left vertical + top/bottom rails create an open `C`
- Center stem anchors the `T`
- Middle rail retains the structural memory of `工`
- Open right side keeps the mark breathable at favicon scale

## Color

- Background: `#050505`
- Foreground: `#F5F5F5`
- Secondary wordmark tone: `#B7B7B7`
- Accent context only: existing site amber tokens

## Clear Space and Size

- Symbol clear space: `12` units on the `80x80` grid
- Symbol minimum size: `16px`
- Preferred favicon sizes: `16`, `32`, `48`, `180`, `512`

## Asset Inventory

- Source mark: `apps/web/public/brand/logo-mark.svg`
- Source wordmark: `apps/web/public/brand/logo-wordmark.svg`
- Source lockup: `apps/web/public/brand/logo-lockup.svg`
- App icon source: `apps/web/src/app/icon.svg`
- Generated icons: `apps/web/src/app/favicon.ico`, `apps/web/src/app/apple-icon.png`

## Implementation Notes

- Site navigation uses a text-first wordmark with the symbol as a compact lead-in.
- Page transition uses the symbol only for stroke-draw animation compatibility.
- The current implementation intentionally avoids an overbuilt emblem. The wordmark remains primary.
