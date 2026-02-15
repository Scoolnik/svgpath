import svgpath from "./lib/svgpath";
import commands from "./lib/commands";

export type MoveToAbs = [typeof commands["M"], number, number];
export type LineToAbs = [typeof commands["L"], number, number];
export type HorizontalLineToAbs = [typeof commands["H"], number];
export type VerticalLineToAbs = [typeof commands["V"], number];
export type CurveToAbs = [typeof commands["C"], number, number, number, number, number, number];
export type SmoothCurveToAbs = [typeof commands["S"], number, number, number, number];
export type QuadraticBézierCurveToAbs = [typeof commands["Q"], number, number, number, number];
export type SmoothQuadraticBézierCurveToAbs = [typeof commands["T"], number, number];
export type EllipticalArcAbs = [
	typeof commands["A"],
	number,
	number,
	number,
	number,
	number,
	number,
	number,
];

export type MoveToRel = [typeof commands["m"], number, number];
export type LineToRel = [typeof commands["l"], number, number];
export type HorizontalLineToRel = [typeof commands["h"], number];
export type VerticalLineToRel = [typeof commands["v"], number];
export type CurveToRel = [typeof commands["c"], number, number, number, number, number, number];
export type SmoothCurveToRel = [typeof commands["s"], number, number, number, number];
export type QuadraticBézierCurveToRel = [typeof commands["q"], number, number, number, number];
export type SmoothQuadraticBézierCurveToRel = [typeof commands["t"], number, number];
export type EllipticalArcRel = [
	typeof commands["a"],
	number,
	number,
	number,
	number,
	number,
	number,
	number,
];

export type ClosePath = [typeof commands["Z"] | typeof commands["z"]];

export type Segment =
	| MoveToAbs
	| MoveToRel
	| LineToAbs
	| LineToRel
	| HorizontalLineToAbs
	| HorizontalLineToRel
	| VerticalLineToAbs
	| VerticalLineToRel
	| CurveToAbs
	| CurveToRel
	| SmoothCurveToAbs
	| SmoothCurveToRel
	| QuadraticBézierCurveToAbs
	| QuadraticBézierCurveToRel
	| SmoothQuadraticBézierCurveToAbs
	| SmoothQuadraticBézierCurveToRel
	| EllipticalArcAbs
	| EllipticalArcRel
	| ClosePath;

export interface SvgPath {
	(path: string): SvgPath;
	new (path: string): SvgPath;
	from(path: string | SvgPath): SvgPath;
	abs(): SvgPath;
	rel(): SvgPath;
	scale(sx: number, sy?: number): SvgPath;
	translate(x: number, y?: number): SvgPath;
	rotate(angle: number, rx?: number, ry?: number): SvgPath;
	skewX(degrees: number): SvgPath;
	skewY(degrees: number): SvgPath;
	matrix(m: number[]): SvgPath;
	transform(str: string): SvgPath;
	unshort(): SvgPath;
	unarc(): SvgPath;
	toString(): string;
	round(precision: number): SvgPath;
	iterate(
		iterator: (segment: Segment, index: number, x: number, y: number) => void,
		keepLazyStack?: boolean,
	): SvgPath;
}

export default svgpath;
export * as commands from "./lib/commands";
