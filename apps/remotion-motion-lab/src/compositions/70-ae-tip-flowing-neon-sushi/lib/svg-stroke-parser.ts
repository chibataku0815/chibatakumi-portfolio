const parseNumber = (value: string | null | undefined, fallback = 0) => {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePaint = (value: string | null | undefined) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized === "" || normalized === "none") {
    return undefined;
  }

  return normalized;
};

const parseStyleAttribute = (style: string | null) => {
  if (!style) {
    return new Map<string, string>();
  }

  const entries = style
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(":");
      if (separatorIndex === -1) {
        return null;
      }

      return [
        entry.slice(0, separatorIndex).trim(),
        entry.slice(separatorIndex + 1).trim(),
      ] as const;
    })
    .filter((entry): entry is readonly [string, string] => entry !== null);

  return new Map(entries);
};

const getPresentationValue = (
  element: Element,
  style: Map<string, string>,
  attributeName: string,
) => {
  return element.getAttribute(attributeName) ?? style.get(attributeName);
};

const combineTransforms = (parent?: string, child?: string) =>
  [parent, child].filter(Boolean).join(" ").trim() || undefined;

const circleToPath = (cx: number, cy: number, radius: number) =>
  `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`;

const ellipseToPath = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`;

const rectToPath = ({
  x,
  y,
  width,
  height,
  rx,
  ry,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
}) => {
  if (rx <= 0 && ry <= 0) {
    return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
  }

  const cornerX = Math.min(rx || ry, width / 2);
  const cornerY = Math.min(ry || rx, height / 2);

  return [
    `M ${x + cornerX} ${y}`,
    `H ${x + width - cornerX}`,
    `A ${cornerX} ${cornerY} 0 0 1 ${x + width} ${y + cornerY}`,
    `V ${y + height - cornerY}`,
    `A ${cornerX} ${cornerY} 0 0 1 ${x + width - cornerX} ${y + height}`,
    `H ${x + cornerX}`,
    `A ${cornerX} ${cornerY} 0 0 1 ${x} ${y + height - cornerY}`,
    `V ${y + cornerY}`,
    `A ${cornerX} ${cornerY} 0 0 1 ${x + cornerX} ${y}`,
    "Z",
  ].join(" ");
};

const pointsToPath = (pointsValue: string, close: boolean) => {
  const numbers = pointsValue
    .trim()
    .split(/[\s,]+/)
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value));

  if (numbers.length < 4) {
    return null;
  }

  const commands: string[] = [];

  for (let index = 0; index < numbers.length; index += 2) {
    const x = numbers[index];
    const y = numbers[index + 1];

    if (x == null || y == null) {
      break;
    }

    commands.push(`${index === 0 ? "M" : "L"} ${x} ${y}`);
  }

  if (close) {
    commands.push("Z");
  }

  return commands.join(" ");
};

const elementToPathData = (element: Element) => {
  switch (element.tagName.toLowerCase()) {
    case "path":
      return element.getAttribute("d");
    case "circle":
      return circleToPath(
        parseNumber(element.getAttribute("cx")),
        parseNumber(element.getAttribute("cy")),
        parseNumber(element.getAttribute("r")),
      );
    case "ellipse":
      return ellipseToPath(
        parseNumber(element.getAttribute("cx")),
        parseNumber(element.getAttribute("cy")),
        parseNumber(element.getAttribute("rx")),
        parseNumber(element.getAttribute("ry")),
      );
    case "line":
      return `M ${parseNumber(element.getAttribute("x1"))} ${parseNumber(
        element.getAttribute("y1"),
      )} L ${parseNumber(element.getAttribute("x2"))} ${parseNumber(
        element.getAttribute("y2"),
      )}`;
    case "polyline":
      return pointsToPath(element.getAttribute("points") ?? "", false);
    case "polygon":
      return pointsToPath(element.getAttribute("points") ?? "", true);
    case "rect":
      return rectToPath({
        x: parseNumber(element.getAttribute("x")),
        y: parseNumber(element.getAttribute("y")),
        width: parseNumber(element.getAttribute("width")),
        height: parseNumber(element.getAttribute("height")),
        rx: parseNumber(element.getAttribute("rx")),
        ry: parseNumber(element.getAttribute("ry")),
      });
    default:
      return null;
  }
};

interface PresentationState {
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  opacity: number;
}

const inheritPresentation = (
  element: Element,
  parent: PresentationState,
): PresentationState => {
  const style = parseStyleAttribute(element.getAttribute("style"));
  const opacity =
    parent.opacity *
    parseNumber(getPresentationValue(element, style, "opacity"), 1) *
    parseNumber(getPresentationValue(element, style, "stroke-opacity"), 1);
  const strokeWidth = parseNumber(
    getPresentationValue(element, style, "stroke-width"),
    parent.strokeWidth ?? 0,
  );
  const linecap =
    (getPresentationValue(element, style, "stroke-linecap") as
      | "butt"
      | "round"
      | "square"
      | undefined) ?? parent.strokeLinecap;
  const linejoin =
    (getPresentationValue(element, style, "stroke-linejoin") as
      | "miter"
      | "round"
      | "bevel"
      | undefined) ?? parent.strokeLinejoin;

  return {
    stroke:
      normalizePaint(getPresentationValue(element, style, "stroke")) ??
      parent.stroke,
    fill:
      normalizePaint(getPresentationValue(element, style, "fill")) ??
      parent.fill,
    strokeWidth,
    strokeLinecap: linecap,
    strokeLinejoin: linejoin,
    opacity,
  };
};

export interface ParsedSvgStrokeLayer {
  id: string;
  d: string;
  transform?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  opacity: number;
}

export interface ParsedSvgStrokeDocument {
  viewBox: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
  layers: ParsedSvgStrokeLayer[];
}

interface ParseSvgStrokeOptions {
  includeFilledShapes?: boolean;
  defaultStrokeWidth?: number;
}

const parseViewBox = (svg: SVGSVGElement) => {
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const [minX, minY, width, height] = viewBox
      .trim()
      .split(/[\s,]+/)
      .map((value) => Number.parseFloat(value));

    return {
      minX: Number.isFinite(minX) ? minX : 0,
      minY: Number.isFinite(minY) ? minY : 0,
      width: Number.isFinite(width) ? width : 1920,
      height: Number.isFinite(height) ? height : 1080,
    };
  }

  return {
    minX: 0,
    minY: 0,
    width: parseNumber(svg.getAttribute("width"), 1920),
    height: parseNumber(svg.getAttribute("height"), 1080),
  };
};

export const parseSvgStrokeDocument = (
  svgMarkup: string,
  options: ParseSvgStrokeOptions = {},
): ParsedSvgStrokeDocument => {
  if (typeof DOMParser === "undefined") {
    throw new Error("DOMParser is unavailable in this environment.");
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(svgMarkup, "image/svg+xml");
  const svg = document.documentElement;

  if (svg.tagName.toLowerCase() !== "svg") {
    throw new Error("Expected SVG markup with a root <svg> element.");
  }

  const svgElement = svg as unknown as SVGSVGElement;

  const layers: ParsedSvgStrokeLayer[] = [];
  const initialPresentation: PresentationState = {
    stroke: undefined,
    fill: undefined,
    strokeWidth: options.defaultStrokeWidth ?? 0,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    opacity: 1,
  };

  let generatedId = 0;

  const walk = (
    element: Element,
    parentPresentation: PresentationState,
    parentTransform?: string,
  ) => {
    const currentPresentation = inheritPresentation(element, parentPresentation);
    const currentTransform = combineTransforms(
      parentTransform,
      element.getAttribute("transform") ?? undefined,
    );
    const tagName = element.tagName.toLowerCase();

    if (tagName === "g" || tagName === "svg") {
      Array.from(element.children).forEach((child) =>
        walk(child, currentPresentation, currentTransform),
      );
      return;
    }

    const d = elementToPathData(element);
    if (!d) {
      return;
    }

    const stroke = normalizePaint(currentPresentation.stroke);
    const fill = normalizePaint(currentPresentation.fill);
    const shouldInclude =
      stroke != null || (options.includeFilledShapes === true && fill != null);

    if (!shouldInclude) {
      return;
    }

    generatedId += 1;
    layers.push({
      id: element.getAttribute("id") ?? `svg-layer-${generatedId}`,
      d,
      transform: currentTransform,
      stroke,
      fill,
      strokeWidth: currentPresentation.strokeWidth,
      strokeLinecap: currentPresentation.strokeLinecap,
      strokeLinejoin: currentPresentation.strokeLinejoin,
      opacity: currentPresentation.opacity,
    });
  };

  walk(svgElement, initialPresentation);

  return {
    viewBox: parseViewBox(svgElement),
    layers,
  };
};
