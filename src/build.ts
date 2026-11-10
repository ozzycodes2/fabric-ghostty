import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "./render.ts";
import type { Palette } from "./render.ts";

export const PALETTE_TAG = "v0.1.0";

export const paletteUrl = (): string =>
  `https://raw.githubusercontent.com/ozzycodes2/fabric-theme/${PALETTE_TAG}/dist/palette.json`;

export async function loadPalette(path?: string, fetchFn: typeof fetch = fetch): Promise<Palette> {
  if (path) return JSON.parse(readFileSync(path, "utf8")) as Palette;
  const res = await fetchFn(paletteUrl());
  if (!res.ok) throw new Error(`failed to fetch ${paletteUrl()}: ${res.status}`);
  return (await res.json()) as Palette;
}

export interface BuildOptions {
  palettePath?: string;
  templatePath: string;
  outDir: string;
}

export async function build({ palettePath, templatePath, outDir }: BuildOptions): Promise<void> {
  const palette = await loadPalette(palettePath);
  const template = readFileSync(templatePath, "utf8");
  mkdirSync(outDir, { recursive: true });
  for (const variant of ["dusk", "dawn"] as const) {
    const text = render(template, palette, variant);
    const count = text.split("\n").filter((l) => l.startsWith("palette = ")).length;
    if (count !== 16) throw new Error(`fabric-${variant}: expected 16 palette lines, found ${count}`);
    writeFileSync(join(outDir, `fabric-${variant}`), text);
  }
}

export async function main(argv: string[], outDir: string): Promise<number> {
  const i = argv.indexOf("--palette");
  try {
    await build({
      palettePath: i >= 0 ? argv[i + 1] : undefined,
      templatePath: join(import.meta.dirname, "../template/fabric"),
      outDir,
    });
    return 0;
  } catch (e) {
    console.error(`build failed: ${(e as Error).message}`);
    return 1;
  }
}

/* v8 ignore next 3 */
if (process.argv[1] === import.meta.filename) {
  process.exitCode = await main(process.argv.slice(2), join(import.meta.dirname, "../dist"));
}
