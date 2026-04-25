struct Params {
  resolution: vec2f,
  gridOrigin: vec2f,
  cellSize: f32,
  lineWeight: f32,
  gridSize: vec2f,
  blockCount: f32,
  cornerRadius: f32,
  majorEvery: f32,
  gridAlpha: f32,
  majorAlpha: f32,
  blockInset: f32,
  accentBoost: f32,
  pulse: f32,
  backgroundLift: f32,
  textAlpha: f32,
  time: f32,
  strikePhase: f32,
  strikeFlag: f32,
  flickerIntensity: f32,
  glowMix: f32,
  _pad: f32,
}

struct Block {
  cellData: vec4f,
  motion: vec4f,
  shape: vec4f,
  color: vec4f,
  extra: vec4f,
}

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var<uniform> u: Params;
@group(0) @binding(1) var<storage, read> blocks: array<Block>;

fn lineMask(coord: f32, spacing: f32, width: f32) -> f32 {
  let fracCoord = fract(coord / spacing);
  let dist = min(fracCoord, 1.0 - fracCoord) * spacing;
  return 1.0 - smoothstep(width, width + 1.0, dist);
}

fn sdRoundedBox(point: vec2f, halfSize: vec2f, radius: f32) -> f32 {
  let q = abs(point) - halfSize + vec2f(radius, radius);
  return length(max(q, vec2f(0.0, 0.0))) + min(max(q.x, q.y), 0.0) - radius;
}

fn hash11(x: f32) -> f32 {
  return fract(sin(x * 12.9898) * 43758.5453);
}

fn palette(toneIdx: f32) -> vec3f {
  let i = i32(round(toneIdx));
  if (i == 1) { return vec3f(1.0, 1.0, 1.0); }
  if (i == 2) { return vec3f(1.0, 1.0, 0.95); }
  if (i == 3) { return vec3f(0.70, 0.85, 1.05); }
  return vec3f(0.102, 0.102, 0.102);
}

@vertex
fn vs(@builtin(vertex_index) index: u32) -> VertexOut {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0),
  );

  let position = positions[index];
  var output: VertexOut;
  output.position = vec4f(position, 0.0, 1.0);
  output.uv = vec2f((position.x + 1.0) * 0.5, 1.0 - (position.y + 1.0) * 0.5);
  return output;
}

@fragment
fn fs(input: VertexOut) -> @location(0) vec4f {
  let fragCoord = vec2f(input.uv.x * u.resolution.x, input.uv.y * u.resolution.y);
  let local = fragCoord - u.gridOrigin;

  let minorMask = max(
    lineMask(local.x, u.cellSize, u.lineWeight),
    lineMask(local.y, u.cellSize, u.lineWeight),
  ) * u.gridAlpha;
  let majorSpacing = u.cellSize * u.majorEvery;
  let majorMask = max(
    lineMask(local.x, majorSpacing, u.lineWeight + 0.25),
    lineMask(local.y, majorSpacing, u.lineWeight + 0.25),
  ) * u.majorAlpha;

  let continuousPulse = u.pulse * 0.08;
  let strikePulse = u.strikeFlag
    * smoothstep(0.0, 0.15, u.strikePhase)
    * (1.0 - smoothstep(0.30, 0.70, u.strikePhase))
    * 0.45;
  let scanFreq = 380.0;
  let scanSpeed = 120.0;
  let scanCoord = local.y * scanFreq / u.resolution.y + u.time * scanSpeed;
  let scanStripe = smoothstep(0.48, 0.52, fract(scanCoord));
  let scanGate = u.strikeFlag
    * smoothstep(0.30, 0.50, u.strikePhase)
    * (1.0 - smoothstep(0.50, 0.75, u.strikePhase));
  let scanLineBoost = scanStripe * scanGate * 0.06;
  let gridStrength = max(minorMask, majorMask) + continuousPulse + strikePulse + scanLineBoost;

  let backgroundBase = vec3f(
    0.82 - u.backgroundLift * 0.035,
    0.82 - u.backgroundLift * 0.03,
    0.82 - u.backgroundLift * 0.015,
  );
  let flashCurve = u.strikeFlag
    * smoothstep(0.0, 0.15, u.strikePhase)
    * (1.0 - smoothstep(0.15, 0.45, u.strikePhase));
  let flashColor = vec3f(0.96, 0.97, 1.0);
  let background = mix(backgroundBase, flashColor, flashCurve * 0.55);
  let gridColor = mix(background, vec3f(0.102, 0.102, 0.102), gridStrength);

  var result = gridColor;

  for (var i = 0u; i < u32(u.blockCount); i++) {
    let block = blocks[i];
    if (block.cellData.w < 0.5 || block.motion.z <= 0.001) {
      continue;
    }

    let phase = clamp(block.motion.y, 0.0, 1.0);
    let massBias = clamp(block.shape.w, 0.45, 1.0);
    let recovery = smoothstep(mix(0.14, 0.22, massBias), 0.80, phase);
    let impactPressure = 1.0 - smoothstep(0.0, mix(0.56, 0.72, massBias), phase);
    let landingCarry = (1.0 - smoothstep(0.10, mix(0.50, 0.64, massBias), phase)) * mix(0.06, 0.11, massBias);
    let restPressure = smoothstep(0.76, 1.0, phase) * massBias * 0.04;
    let pressure = max(impactPressure, landingCarry + restPressure);

    let glitchBlockHash = hash11(block.cellData.x * 11.0 + block.cellData.y * 43.0 + floor(u.time * 30.0));
    let glitchJump = floor(glitchBlockHash * 7.0) - 3.0;
    let glitchGate = step(0.85, hash11(block.cellData.x * 7.0 + block.cellData.y * 23.0))
      * u.strikeFlag
      * step(0.40, u.strikePhase)
      * (1.0 - step(0.60, u.strikePhase));
    let glitchOffsetX = glitchJump * glitchGate;

    let cellTopLeft = u.gridOrigin + vec2f(block.cellData.x + block.color.w + glitchOffsetX, block.cellData.y + block.extra.x) * u.cellSize;
    let center = cellTopLeft + vec2f(u.cellSize * 0.5, u.cellSize * 0.5);
    let inset = u.blockInset * block.shape.z;
    let recoveryScale = mix(0.985, 1.0, recovery) * mix(0.996, 1.0, massBias);
    let halfSize = vec2f(
      (((u.cellSize - inset * 2.0) * block.shape.x) * recoveryScale) * 0.5,
      (((u.cellSize - inset * 2.0) * block.shape.y) * recoveryScale) * 0.5,
    );

    let cornerRadius = u.cornerRadius * mix(0.90, 1.0, recovery) * (1.0 - pressure * massBias * 0.05);
    let sdf = sdRoundedBox(fragCoord - center, halfSize, cornerRadius);
    let harden = clamp(block.motion.w * 1.12 + pressure * 0.10 + u.pulse * 0.10, 0.0, 0.32);
    let rawAlpha = (1.0 - smoothstep(0.29 - harden * 0.03, 1.08 - harden * 0.10, sdf)) * block.motion.z;
    let blockHash = hash11(block.cellData.x * 31.0 + block.cellData.y * 17.0);
    let flickerGate = step(0.60, blockHash);
    let flickerOsc = sin(u.time * 48.0 + blockHash * 6.2831);
    let flickerDelta = u.flickerIntensity * flickerGate * flickerOsc * 0.22;
    let alpha = clamp(rawAlpha * (1.0 + flickerDelta), 0.0, 1.0);
    if (alpha <= 0.001) {
      continue;
    }

    let toneIdx = block.extra.y;
    let primaryColor = palette(toneIdx);
    let darkColor = vec3f(block.color.x, block.color.y, block.color.z);
    let toneMix = clamp(toneIdx, 0.0, 1.0) + step(1.5, toneIdx);
    let baseColor = mix(darkColor, primaryColor, toneMix);
    let glowTarget = vec3f(0.70, 0.85, 1.05);
    let baseWithGlow = mix(baseColor, glowTarget, u.glowMix * 0.35);
    let centerRadius = min(halfSize.x, halfSize.y) * mix(0.60, 0.74, massBias);
    let centerMask = 1.0 - smoothstep(centerRadius * 0.18, centerRadius, length(fragCoord - center));
    let centerAccent = clamp(block.motion.w * 0.16 + pressure * 0.08 + u.accentBoost * 0.14, 0.0, 0.30);
    let accented = mix(baseWithGlow, vec3f(0.0, 0.0, 0.0), centerMask * centerAccent);
    result = mix(result, accented, alpha * u.textAlpha);
  }

  return vec4f(result, 1.0);
}
