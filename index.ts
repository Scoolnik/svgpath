import svgpath from "./lib/svgpath";
import { SvgCommand } from "./lib/commands";

export type MoveToAbs = [(typeof SvgCommand)["M"], number, number];
export type LineToAbs = [(typeof SvgCommand)["L"], number, number];
export type HorizontalLineToAbs = [(typeof SvgCommand)["H"], number];
export type VerticalLineToAbs = [(typeof SvgCommand)["V"], number];
export type CurveToAbs = [
	(typeof SvgCommand)["C"],
	number,
	number,
	number,
	number,
	number,
	number,
];
export type SmoothCurveToAbs = [
	(typeof SvgCommand)["S"],
	number,
	number,
	number,
	number,
];
export type QuadraticBézierCurveToAbs = [
	(typeof SvgCommand)["Q"],
	number,
	number,
	number,
	number,
];
export type SmoothQuadraticBézierCurveToAbs = [
	(typeof SvgCommand)["T"],
	number,
	number,
];
export type EllipticalArcAbs = [
	(typeof SvgCommand)["A"],
	number,
	number,
	number,
	number,
	number,
	number,
	number,
];

export type MoveToRel = [(typeof SvgCommand)["m"], number, number];
export type LineToRel = [(typeof SvgCommand)["l"], number, number];
export type HorizontalLineToRel = [(typeof SvgCommand)["h"], number];
export type VerticalLineToRel = [(typeof SvgCommand)["v"], number];
export type CurveToRel = [
	(typeof SvgCommand)["c"],
	number,
	number,
	number,
	number,
	number,
	number,
];
export type SmoothCurveToRel = [
	(typeof SvgCommand)["s"],
	number,
	number,
	number,
	number,
];
export type QuadraticBézierCurveToRel = [
	(typeof SvgCommand)["q"],
	number,
	number,
	number,
	number,
];
export type SmoothQuadraticBézierCurveToRel = [
	(typeof SvgCommand)["t"],
	number,
	number,
];
export type EllipticalArcRel = [
	(typeof SvgCommand)["a"],
	number,
	number,
	number,
	number,
	number,
	number,
	number,
];

export type ClosePath = [(typeof SvgCommand)["Z"] | (typeof SvgCommand)["z"]];

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

export default svgpath as SvgPath;
export { SvgCommand } from "./lib/commands";
