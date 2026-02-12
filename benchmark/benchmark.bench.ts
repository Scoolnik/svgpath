import { bench, describe } from "vitest";
import path from "node:path";
import fs from "node:fs";
import SvgPath from "../lib/svgpath";

const big = fs.readFileSync(path.join(__dirname, "samples/big.txt"), "utf8");
const one_path = fs.readFileSync(
	path.join(__dirname, "samples/one_path.txt"),
	"utf8",
);
const long = "M 4.8173765432098765 -9.12666320366964 Z".repeat(5000);

describe("Big", () => {
	bench('.from("big.txt")', () => {
		SvgPath.from(big);
	});
});

describe("Regular", () => {
	bench('.from("one_path.txt")', () => {
		SvgPath.from(one_path);
	});
});

describe("Operations", () => {
	bench("parse", () => {
		SvgPath.from(one_path);
	});
	bench("abs", () => {
		SvgPath.from(one_path).abs();
	});
	bench("unshort", () => {
		SvgPath.from(one_path).unshort();
	});
	bench("unarc", () => {
		SvgPath.from(one_path).unarc();
	});
	bench("iterate", () => {
		SvgPath.from(one_path).iterate((v) => {
			if (v[0] === "z") {
				v[0] = "Z";
			}
		});
	});
	bench("lazy iterate", () => {
		SvgPath.from(one_path).iterate((v) => {
			if (v[0] === "z") {
				v[0] = "Z";
			}
		}, true);
	});
	bench("toString", () => {
		SvgPath.from(one_path).toString();
	});
});

describe("Long repeated", () => {
	bench(".from(long).toString()", () => {
		SvgPath.from(long).toString();
	});
});
