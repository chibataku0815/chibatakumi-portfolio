export const getBoardPath = ({
  centerX,
  baseY,
  width,
  sagPx,
}: {
  centerX: number;
  baseY: number;
  width: number;
  sagPx: number;
}) => {
  const half = width / 2;
  const x0 = centerX - half;
  const x1 = centerX + half;
  const midY = baseY + sagPx;
  const edgeDrop = sagPx * 0.5;

  return [
    `M ${x0} ${baseY}`,
    `C ${x0 + width * 0.2} ${baseY + edgeDrop}`,
    `${centerX - width * 0.18} ${midY}`,
    `${centerX} ${midY}`,
    `C ${centerX + width * 0.18} ${midY}`,
    `${x1 - width * 0.2} ${baseY + edgeDrop}`,
    `${x1} ${baseY}`,
  ].join(" ");
};
