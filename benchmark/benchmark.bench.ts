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
	bench("scale", () => {
		SvgPath.from(one_path).scale(2, 2).__evaluateStack();
	});
	bench("translate", () => {
		SvgPath.from(one_path).translate(-150, 150).__evaluateStack();
	});
	bench("translate+scale", () => {
		SvgPath.from(one_path).translate(-150, 150).scale(2, 2).__evaluateStack();
	});
	bench("abs", () => {
		SvgPath.from(one_path).abs();
	});
	bench("rel", () => {
		SvgPath.from(one_path).rel();
	});
	bench("rotate", () => {
		SvgPath.from(one_path).rotate(90).__evaluateStack();
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

describe("Operations on big", () => {
	bench("parse big", () => {
		SvgPath.from(big);
	});
	bench("scale", () => {
		SvgPath.from(big).scale(2, 2).__evaluateStack();
	});
	bench("translate", () => {
		SvgPath.from(big).translate(-150, 150).__evaluateStack();
	});
	bench("translate+scale", () => {
		SvgPath.from(big).translate(-150, 150).scale(2, 2).__evaluateStack();
	});
	bench("abs big", () => {
		SvgPath.from(big).abs();
	});
	bench("rel big", () => {
		SvgPath.from(big).rel();
	});
	bench("rotate big", () => {
		SvgPath.from(big).rotate(90).__evaluateStack();
	});
	bench("unshort big", () => {
		SvgPath.from(big).unshort();
	});
	bench("unarc big", () => {
		SvgPath.from(big).unarc();
	});
	bench("iterate big", () => {
		SvgPath.from(big).iterate((v) => {
			if (v[0] === "z") {
				v[0] = "Z";
			}
		});
	});
	bench("lazy iterate big", () => {
		SvgPath.from(big).iterate((v) => {
			if (v[0] === "z") {
				v[0] = "Z";
			}
		}, true);
	});
	bench("toString big", () => {
		SvgPath.from(big).toString();
	});
});

describe("Long repeated", () => {
	bench(".from(long).toString()", () => {
		SvgPath.from(long).toString();
	});
});
