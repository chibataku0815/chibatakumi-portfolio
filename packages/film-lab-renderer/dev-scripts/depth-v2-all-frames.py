#!/usr/bin/env python3
"""
depth-v2-all-frames.py — Run Depth Anything V2 Small on every video frame
in dev-fixtures/frames/frame-NNN.png and save per-pixel depth maps at the
same resolution to dev-fixtures/frames/depth-NNN.png.

Usage:
  source ~/.venvs/da3/bin/activate
  KMP_DUPLICATE_LIB_OK=TRUE python dev-scripts/depth-v2-all-frames.py
"""
import sys
from pathlib import Path

from PIL import Image
import numpy as np
import torch
from transformers import pipeline

SCRIPT_DIR = Path(__file__).resolve().parent
FRAMES_DIR = SCRIPT_DIR.parent / "dev-fixtures" / "frames"

device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Device: {device}")

print("Loading Depth-Anything-V2-Base…")
pipe = pipeline(
    task="depth-estimation",
    model="depth-anything/Depth-Anything-V2-Base-hf",
    device=device,
)

frames = sorted(FRAMES_DIR.glob("frame-*.png"))
if not frames:
    print("No frames found.", file=sys.stderr)
    sys.exit(1)

print(f"Processing {len(frames)} frames…")
for i, f in enumerate(frames, 1):
    idx = f.stem.split("-")[-1]
    img = Image.open(f).convert("RGB")
    result = pipe(img)
    depth_arr = np.array(result["depth"], dtype=np.float32)
    d_min, d_max = float(depth_arr.min()), float(depth_arr.max())
    norm = (depth_arr - d_min) / (d_max - d_min) if d_max > d_min else np.zeros_like(depth_arr)
    inverted = 1.0 - norm
    out = (inverted * 255.0 + 0.5).astype(np.uint8)
    out_img = Image.fromarray(out, mode="L")
    out_path = FRAMES_DIR / f"depth-{idx}.png"
    out_img.save(out_path, compress_level=6)
    if i % 25 == 0 or i == len(frames):
        print(f"  [{i}/{len(frames)}]")

print("Done.")
