#!/usr/bin/env python3
"""
depth-v2-keyframes.py — Run Depth Anything V2 (Small) on each keyframe PNG
and save per-pixel depth maps at the keyframe's native resolution.

Usage:
  source ~/.venvs/da3/bin/activate
  KMP_DUPLICATE_LIB_OK=TRUE python dev-scripts/depth-v2-keyframes.py

Input:  dev-fixtures/depth-probe-kf-NN.png (512x288 approx)
Output: dev-fixtures/depth-probe-depth-NN.png (same res, 8-bit grayscale)

Replaces the earlier LLM-based 32x32 depth grids with dense per-pixel depth.
"""
import os
import glob
import sys
from pathlib import Path

from PIL import Image
import numpy as np
import torch
from transformers import pipeline

SCRIPT_DIR = Path(__file__).resolve().parent
FIXTURES_DIR = SCRIPT_DIR.parent / "dev-fixtures"

device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Device: {device}")

print("Loading Depth-Anything-V2-Small…")
pipe = pipeline(
    task="depth-estimation",
    model="depth-anything/Depth-Anything-V2-Small-hf",
    device=device,
)

keyframes = sorted(FIXTURES_DIR.glob("depth-probe-kf-*.png"))
if not keyframes:
    print("No keyframes found.", file=sys.stderr)
    sys.exit(1)

print(f"Processing {len(keyframes)} keyframes…")
for i, kf in enumerate(keyframes, 1):
    idx = kf.stem.split("-")[-1]
    img = Image.open(kf).convert("RGB")
    result = pipe(img)
    depth_img = result["depth"]
    depth_arr = np.array(depth_img, dtype=np.float32)
    d_min = float(depth_arr.min())
    d_max = float(depth_arr.max())
    # Normalize to [0, 1] then invert: Depth Anything V2 returns "relative
    # depth" where larger values = closer. Our shader expects 0=near, 1=far,
    # so invert after normalization.
    if d_max > d_min:
        norm = (depth_arr - d_min) / (d_max - d_min)
    else:
        norm = np.zeros_like(depth_arr)
    inverted = 1.0 - norm
    out = (inverted * 255.0 + 0.5).astype(np.uint8)
    out_img = Image.fromarray(out, mode="L")
    out_path = FIXTURES_DIR / f"depth-probe-depth-{idx}.png"
    out_img.save(out_path, compress_level=6)
    print(f"  [{i}/{len(keyframes)}] {kf.name} → {out_path.name} ({out_img.size[0]}x{out_img.size[1]})")

print("Done.")
