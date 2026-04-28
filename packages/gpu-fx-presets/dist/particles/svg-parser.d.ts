import type { CubicPathDef } from "./helpers";
/** Parse SVG path `d` attribute into cubic Bezier segments */
export declare function parseSvgPath(d: string, viewBox?: {
    width: number;
    height: number;
}): CubicPathDef[];
/** Parse full SVG string, extracting all <path> elements */
export declare function parseSvgFile(svg: string): {
    paths: CubicPathDef[][];
    viewBox: {
        width: number;
        height: number;
    };
};
