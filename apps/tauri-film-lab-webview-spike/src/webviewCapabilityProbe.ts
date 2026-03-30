/**
 * @fileoverview Tauri（OS ネイティブ WebView）上で、Film Lab 相当の書き出し前提になる能力をざっくり計測する。
 *
 * 主な仕様:
 * - WebGL2 コンテキスト取得と主要拡張の有無
 * - オフスクリーン FBO に Float / half テクスチャを張れるか（LUT や中間バッファの近似チェック）
 * - WebCodecs（VideoDecoder / VideoEncoder）の存在と `isConfigSupported` のプローブ
 *
 * 制限:
 * - 「Film Lab 本番とピクセル一致」は保証しない。あくまで WebView がボトルネックになりうる床のスキャン。
 * - 動画デコードは実ファイルを読まず、コーデック設定の supported 調査のみ。
 */

/** チェック結果 1 行分 */
export type capabilityLine = {
  /** カテゴリ（例: webgl2） */
  category: string;
  /** キー */
  key: string;
  /** 値またはメッセージ */
  value: string;
  /** true なら概ね良好、false は要追跡、undefined は情報のみ */
  ok?: boolean;
};

const filmLabRelatedExtensions = [
  "EXT_color_buffer_float",
  "EXT_color_buffer_half_float",
  "OES_texture_float_linear",
  "OES_texture_half_float_linear",
  "WEBGL_clip_cull_distance",
  "WEBGL_multi_draw",
];

/**
 * WebGL2 と周辺能力を調べ、行リストを返す。
 *
 * @returns {capabilityLine[]} ログ用の行
 */
function probeWebgl2(): capabilityLine[] {
  const lines: capabilityLine[] = [];
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: true,
    stencil: false,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });

  if (!gl) {
    lines.push({
      category: "webgl2",
      key: "context",
      value: "取得失敗（webgl2 未対応の可能性）",
      ok: false,
    });
    return lines;
  }

  lines.push({
    category: "webgl2",
    key: "context",
    value: "OK",
    ok: true,
  });
  lines.push({
    category: "webgl2",
    key: "version",
    value: gl.getParameter(gl.VERSION)?.toString() ?? "(不明)",
  });
  lines.push({
    category: "webgl2",
    key: "shadingLanguageVersion",
    value:
      gl.getParameter(gl.SHADING_LANGUAGE_VERSION)?.toString() ?? "(不明)",
  });
  lines.push({
    category: "webgl2",
    key: "renderer",
    value: gl.getParameter(gl.RENDERER)?.toString() ?? "(不明)",
  });
  lines.push({
    category: "webgl2",
    key: "vendor",
    value: gl.getParameter(gl.VENDOR)?.toString() ?? "(不明)",
  });

  const extList = gl.getSupportedExtensions() ?? [];
  lines.push({
    category: "webgl2",
    key: "extensionCount",
    value: String(extList.length),
  });

  for (const name of filmLabRelatedExtensions) {
    const has = extList.includes(name);
    lines.push({
      category: "webgl2.ext",
      key: name,
      value: has ? "present" : "absent",
      ok: has,
    });
  }

  // Float カラーバッファ付き FBO が完成するか
  gl.getExtension("EXT_color_buffer_float");
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!tex || !fbo) {
    lines.push({
      category: "webgl2.fbo",
      key: "floatRgba16f",
      value: "texture/fbo 作成失敗",
      ok: false,
    });
  } else {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      4,
      4,
      0,
      gl.RGBA,
      gl.HALF_FLOAT,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0,
    );
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    const complete = status === gl.FRAMEBUFFER_COMPLETE;
    lines.push({
      category: "webgl2.fbo",
      key: "rgba16fFboComplete",
      value: complete
        ? "FRAMEBUFFER_COMPLETE"
        : `incomplete (0x${status.toString(16)})`,
      ok: complete,
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteTexture(tex);
    gl.deleteFramebuffer(fbo);
  }

  // 極小シェーダのコンパイル（文法レベル）
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) {
    lines.push({
      category: "webgl2.shader",
      key: "miniProgram",
      value: "オブジェクト作成失敗",
      ok: false,
    });
    return lines;
  }
  gl.shaderSource(
    vs,
    `#version 300 es
    precision highp float;
    layout(location = 0) in vec4 aPos;
    void main(){ gl_Position = aPos; }`,
  );
  gl.shaderSource(
    fs,
    `#version 300 es
    precision highp float;
    out vec4 o;
    void main(){ o = vec4(1.0); }`,
  );
  gl.compileShader(vs);
  gl.compileShader(fs);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  const linked = gl.getProgramParameter(prog, gl.LINK_STATUS) === true;
  lines.push({
    category: "webgl2.shader",
    key: "miniProgramLink",
    value: linked ? "OK" : (gl.getProgramInfoLog(prog) ?? "link 失敗"),
    ok: linked,
  });
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  gl.deleteProgram(prog);

  return lines;
}

/**
 * WebCodecs の有無と代表的な設定の supported を調べる。
 *
 * @returns {capabilityLine[]}
 */
async function probeWebCodecs(): Promise<capabilityLine[]> {
  const lines: capabilityLine[] = [];
  const VD =
    typeof VideoDecoder !== "undefined"
      ? VideoDecoder
      : undefined;
  const VE =
    typeof VideoEncoder !== "undefined"
      ? VideoEncoder
      : undefined;

  lines.push({
    category: "webcodecs",
    key: "VideoDecoder",
    value: VD ? "defined" : "undefined",
    ok: Boolean(VD),
  });
  lines.push({
    category: "webcodecs",
    key: "VideoEncoder",
    value: VE ? "defined" : "undefined",
    ok: Boolean(VE),
  });

  if (VD && "isConfigSupported" in VD) {
    const decCfg: VideoDecoderConfig = {
      codec: "avc1.42E01E",
      codedWidth: 1920,
      codedHeight: 1080,
    };
    try {
      const sup = await VideoDecoder.isConfigSupported(decCfg);
      lines.push({
        category: "webcodecs",
        key: "decoder.avc1.42E01E",
        value: JSON.stringify(sup),
        ok: sup.supported === true,
      });
    } catch (err) {
      lines.push({
        category: "webcodecs",
        key: "decoder.avc1.42E01E",
        value: `error: ${String(err)}`,
        ok: false,
      });
    }
  }

  if (VE && "isConfigSupported" in VE) {
    const encCfg: VideoEncoderConfig = {
      codec: "avc1.42E01E",
      width: 1920,
      height: 1080,
      bitrate: 5_000_000,
      framerate: 30,
    };
    try {
      const sup = await VideoEncoder.isConfigSupported(encCfg);
      lines.push({
        category: "webcodecs",
        key: "encoder.avc1.42E01E",
        value: JSON.stringify(sup),
        ok: sup.supported === true,
      });
    } catch (err) {
      lines.push({
        category: "webcodecs",
        key: "encoder.avc1.42E01E",
        value: `error: ${String(err)}`,
        ok: false,
      });
    }
  }

  return lines;
}

/**
 * 実行環境の素朴な識別子（User-Agent など）。
 *
 * @returns {capabilityLine[]}
 */
function probeEnvironment(): capabilityLine[] {
  return [
    {
      category: "env",
      key: "userAgent",
      value: navigator.userAgent,
    },
    {
      category: "env",
      key: "platform",
      value: navigator.platform,
    },
    {
      category: "env",
      key: "hardwareConcurrency",
      value: String(navigator.hardwareConcurrency ?? 0),
    },
  ];
}

/**
 * 全プローブを走らせ、レポート用テキストを組み立てる。
 *
 * @returns {Promise<string>} 人間が読むレポート
 */
export async function runWebviewCapabilityProbe(): Promise<string> {
  const rows: capabilityLine[] = [
    ...probeEnvironment(),
    ...probeWebgl2(),
  ];
  rows.push(...(await probeWebCodecs()));

  const width = Math.max(
    ...rows.map((r) => r.category.length),
    10,
  );
  const lines = rows.map((r) => {
    const flag =
      r.ok === true ? "[+]" : r.ok === false ? "[!]" : "[ ]";
    return `${flag} ${r.category.padEnd(width)} | ${r.key} = ${r.value}`;
  });
  return lines.join("\n");
}
