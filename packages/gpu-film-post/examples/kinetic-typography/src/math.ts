// ── Column-major mat4 operations for WebGPU clip-z [0,1] ───────────

export function identity(): Float32Array {
  const m = new Float32Array(16);
  m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
  return m;
}

export function mul(a: Float32Array, b: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      o[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

/** Perspective projection — WebGPU clip-z [0,1] */
export function perspective(
  fovY: number,
  aspect: number,
  near: number,
  far: number,
): Float32Array {
  const f = 1.0 / Math.tan(fovY * 0.5);
  const nf = 1.0 / (near - far);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = far * nf;          // WebGPU: maps to [0,1] not [-1,1]
  m[11] = -1;
  m[14] = near * far * nf;
  return m;
}

/** View matrix — same convention as Three.js Matrix4.lookAt */
export function lookAt(
  eye: number[],
  target: number[],
  up: number[],
): Float32Array {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let len = Math.hypot(zx, zy, zz);
  if (len > 1e-6) { zx /= len; zy /= len; zz /= len; }

  // x = up cross z
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz);
  if (len > 1e-6) { xx /= len; xy /= len; xz /= len; }

  // y = z cross x
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  const m = new Float32Array(16);
  m[0] = xx; m[1] = yx; m[2]  = zx; m[3]  = 0;
  m[4] = xy; m[5] = yy; m[6]  = zy; m[7]  = 0;
  m[8] = xz; m[9] = yz; m[10] = zz; m[11] = 0;
  m[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  m[15] = 1;
  return m;
}

/** Model matrix: translate × rotateZ × scale */
export function trs(
  tx: number, ty: number, tz: number,
  rz: number,
  sx: number, sy: number, sz: number,
): Float32Array {
  const c = Math.cos(rz);
  const s = Math.sin(rz);
  const m = new Float32Array(16);
  m[0]  = c * sx;  m[1]  = s * sx;  m[2]  = 0;   m[3]  = 0;
  m[4]  = -s * sy; m[5]  = c * sy;  m[6]  = 0;   m[7]  = 0;
  m[8]  = 0;       m[9]  = 0;       m[10] = sz;  m[11] = 0;
  m[12] = tx;      m[13] = ty;      m[14] = tz;  m[15] = 1;
  return m;
}

/** Apply roll rotation to an existing view matrix (post-multiply rotation around Z in camera space) */
export function rollLeft(view: Float32Array, roll: number): Float32Array {
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  const o = new Float32Array(16);
  // Multiply: Rz * view  (rotate camera-space Z)
  for (let col = 0; col < 4; col++) {
    const i = col * 4;
    o[i + 0] = c * view[i + 0] + s * view[i + 1];
    o[i + 1] = -s * view[i + 0] + c * view[i + 1];
    o[i + 2] = view[i + 2];
    o[i + 3] = view[i + 3];
  }
  return o;
}
