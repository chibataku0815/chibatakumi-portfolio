// ── HUD overlay — Orthographic, camera-locked metadata layer ───────

import { ROMAJI, MEANING, sstep } from './data';

export const HUD_W = 1920;
export const HUD_H = 1080;

export function drawHUD(
  hctx: CanvasRenderingContext2D,
  time: number,
  phaseIdx: number,
  lt: number,
): void {
  hctx.clearRect(0, 0, HUD_W, HUD_H);
  const metaA = sstep(0.04, 0.20, lt) * (1 - sstep(1.85, 2.0, lt));

  // corner mono text
  hctx.fillStyle = `rgba(210,190,160,${metaA * 0.85})`;
  hctx.font = '300 22px "SF Mono","Menlo",monospace';
  hctx.textBaseline = 'top';
  hctx.textAlign = 'left';
  hctx.fillText(`PHRASE  ${String(phaseIdx + 1).padStart(2, '0')} / 04`, 60, 50);
  hctx.fillText(`SET     CHIBATAKUMI.STUDIO`, 60, 78);
  hctx.fillText(`MODE    KINETIC \u00B7 3D \u00B7 CAM`, 60, 106);
  hctx.textAlign = 'right';
  hctx.fillText(`T+${(time % 8).toFixed(3)}`, HUD_W - 60, 50);
  hctx.fillText(`F ${String(Math.floor(time * 60)).padStart(6, '0')}`, HUD_W - 60, 78);
  hctx.fillText(`LOOP 8.00s`, HUD_W - 60, 106);

  hctx.textBaseline = 'bottom';
  hctx.textAlign = 'left';
  hctx.fillText(ROMAJI[phaseIdx], 60, HUD_H - 78);
  hctx.fillText(MEANING[phaseIdx], 60, HUD_H - 50);
  hctx.textAlign = 'right';
  hctx.fillText(`${String(Math.floor(lt * 100)).padStart(3, '0')}%`, HUD_W - 60, HUD_H - 78);

  // progress bar
  const barW = 240;
  hctx.fillStyle = `rgba(210,190,160,${metaA * 0.25})`;
  hctx.fillRect(HUD_W - 60 - barW, HUD_H - 58, barW, 2);
  hctx.fillStyle = `rgba(242,148,56,${metaA})`;
  hctx.fillRect(HUD_W - 60 - barW, HUD_H - 58, barW * lt, 2);

  // vertical side label
  hctx.save();
  hctx.translate(36, HUD_H / 2);
  hctx.rotate(-Math.PI / 2);
  hctx.textAlign = 'center';
  hctx.textBaseline = 'middle';
  hctx.font = '300 15px "SF Mono",monospace';
  hctx.fillStyle = `rgba(210,190,160,${metaA * 0.55})`;
  hctx.fillText('\u2014 TYPOGRAPHY \u00B7 3D CAMERA STUDY \u00B7 2026 \u2014', 0, 0);
  hctx.restore();

  // film leader ticks (right edge)
  for (let i = 0; i < 24; i++) {
    const y = (i / 24) * HUD_H;
    const a = metaA * 0.30 * sstep(0, 1, lt - i * 0.018);
    hctx.fillStyle = `rgba(210,190,160,${a})`;
    hctx.fillRect(HUD_W - 36, y, i % 4 === 0 ? 18 : 8, 1);
  }

  // crosshair center
  hctx.strokeStyle = `rgba(242,148,56,${metaA * 0.5})`;
  hctx.lineWidth = 1;
  hctx.beginPath();
  hctx.moveTo(HUD_W / 2 - 12, HUD_H / 2);
  hctx.lineTo(HUD_W / 2 + 12, HUD_H / 2);
  hctx.moveTo(HUD_W / 2, HUD_H / 2 - 12);
  hctx.lineTo(HUD_W / 2, HUD_H / 2 + 12);
  hctx.stroke();

  // romaji typewriter under main subject (screen-locked because HUD)
  const typeP = sstep(0.42, 0.95, lt);
  const visC = Math.floor(typeP * ROMAJI[phaseIdx].length);
  const visStr = ROMAJI[phaseIdx].substring(0, visC) + (visC < ROMAJI[phaseIdx].length ? '_' : '');
  const romA = sstep(0.42, 0.55, lt) * (1 - sstep(1.7, 1.88, lt));
  hctx.font = '300 26px "SF Mono",monospace';
  hctx.fillStyle = `rgba(242,148,56,${romA})`;
  hctx.textAlign = 'center';
  hctx.textBaseline = 'middle';
  hctx.fillText(visStr, HUD_W / 2, HUD_H * 0.74);

  // hard cut flash bar
  const flash = Math.exp(-Math.pow((lt - 1.0) * 55, 2));
  if (flash > 0.01) {
    hctx.fillStyle = `rgba(248,237,229,${flash * 0.85})`;
    hctx.fillRect(0, HUD_H / 2 - 3, HUD_W, 6);
  }
}
