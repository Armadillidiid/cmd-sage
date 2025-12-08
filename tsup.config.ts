import { defineConfig } from "tsup";
import packageJSON from "./package.json" with { type: "json" };

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(packageJSON.version),
  },
  entry: ["src/bin.ts"],
  clean: true,
  publicDir: true,
  treeshake: "smallest",
  external: ["@parcel/watcher"],
});
