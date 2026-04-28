// ── Camera keyframes — AE-style move per phrase ────────────────────

import * as M from '../math';
import { easeInOutCubic, easeOutCubic } from './data';

const DEG = Math.PI / 180;

export function updateCamera(
  phaseIdx: number,
  lt: number,
  time: number,
  canvasWidth: number,
  canvasHeight: number,
): { viewMat: Float32Array; projMat: Float32Array } {
  const e = easeInOutCubic(lt);
  let px = 0, py = 0, pz = 5;
  let lx = 0, ly = 0, lz = 0;
  let roll = 0, fov = 35;

  if (phaseIdx === 0) {
    // P0 ささやかな毎日 : slow dolly-in + slight crane right
    pz = 7.2 - 3.2 * e;
    px = -0.6 + 1.0 * e;
    py = 0.15 * Math.sin(lt * Math.PI);
    fov = 38 - 5 * e;
    roll = -0.015 + 0.030 * e;
    lx = 0.2 * e;
  } else if (phaseIdx === 1) {
    // P1 思い出の場所 : crane down from above
    py = 1.6 - 1.7 * e;
    pz = 5.8 - 1.4 * e;
    px = -0.3 + 0.6 * e;
    ly = -0.6 + 0.6 * e;
    fov = 32 + 4 * e;
    roll = 0.04 * (1 - e);
  } else if (phaseIdx === 2) {
    // P2 帰りたい場所 : push-in then pull-back reveal
    if (lt < 0.5) {
      const k = easeOutCubic(lt / 0.5);
      pz = 5.0 - 2.4 * k;
      px = -0.4 + 0.4 * k;
    } else {
      const k = easeInOutCubic((lt - 0.5) / 0.5);
      pz = 2.6 + 4.0 * k;
      px = 0.0 + 0.8 * k;
    }
    fov = 30 + 12 * Math.sin(lt * Math.PI);
    roll = 0.02 * Math.sin(lt * Math.PI * 2);
  } else {
    // P3 わたしだけの秘密 : long lateral tracking (parallax showcase)
    px = -3.2 + 6.4 * e;
    pz = 4.6 - 0.6 * Math.sin(lt * Math.PI);
    py = 0.05 * Math.sin(lt * Math.PI * 4);
    lx = px * 0.35;
    fov = 36;
    roll = -0.02 + 0.04 * e;
  }

  // global subtle handheld
  px += Math.sin(time * 1.7) * 0.012;
  py += Math.cos(time * 2.1) * 0.010;

  // Build view matrix (lookAt then roll)
  let viewMat = M.lookAt([px, py, pz], [lx, ly, lz], [0, 1, 0]);
  if (roll !== 0) {
    viewMat = M.rollLeft(viewMat, roll);
  }

  // Projection
  const aspect = canvasWidth / canvasHeight;
  const projMat = M.perspective(fov * DEG, aspect, 0.1, 100);

  return { viewMat, projMat };
}
