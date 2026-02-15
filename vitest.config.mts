import codspeedPlugin from "@codspeed/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8'
		}
	},
	plugins: [codspeedPlugin()],
});
