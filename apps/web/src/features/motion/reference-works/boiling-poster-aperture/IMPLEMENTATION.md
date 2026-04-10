# Boiling Poster Aperture

Internal browser-first reference work for proving the `PixiJS` home.

## Route

- `/[locale]/motion/reference-works/boiling-poster-aperture`
- clean capture mode:
  - `?capture=1`
  - `?capture=1&frame=24`
  - `?capture=1&frame=92`
  - `?capture=1&play=0`

## What Is Implemented

- `boilField()` drives subtle multi-pass edge jitter only around the aperture rim
- `alphaMaskGate()` controls one expanding circular aperture through the sealed poster cover
- `displacementReveal()` concentrates distortion during the opening instead of turning the whole study into liquid motion
- `secondaryFlickerAccent()` keeps one narrow accent channel alive after the reveal is mostly open
- capture mode strips surrounding chrome so stills can be taken without widening the route

## Validation Intent

- the scene should read first as a poster still, not as a generic FX demo
- the reveal should read as one controlled aperture event
- boil should stay localized to edge activity, not become full-frame turbulence
- displacement should help the reveal edge feel alive without broadening scope into simulation
- reduced-motion should land on the payoff frame instead of an in-flight state

## Knowledge

- the local evaluator owns timing; Pixi is the rendering home, not a shared orchestration layer
- the poster art is a still texture under a sealed cover card, so the reveal stays narrow and readable
- the displacement map exists only to energize the opening window and decays after the reveal reaches its hold
- boil is implemented as tiny positional and alpha perturbations on repeated outline passes rather than a general-purpose noise runtime
