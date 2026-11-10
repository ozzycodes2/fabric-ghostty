import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { build, loadPalette, main, paletteUrl, PALETTE_TAG } from "../src/build.ts";
import { render } from "../src/render.ts";
import type { Palette } from "../src/render.ts";

const fixturePath = join(import.meta.dirname, "fixtures/palette.json");
const palette = JSON.parse(readFileSync(fixturePath, "utf8")) as Palette;
const template = readFileSync(join(import.meta.dirname, "../template/fabric"), "utf8");

describe("render", () => {
  const dusk = render(template, palette, "dusk");
  const dawn = render(template, palette, "dawn");

  it("renders dusk values", () => {
    expect(dusk).toContain("background = #010102");
    expect(dusk).toContain("palette = 1=#e04a3c");
    expect(dusk).toContain("selection-foreground = #171717");
    expect(dusk).toContain("# Fabric Dusk");
  });
  it("renders dawn values", () => {
    expect(dawn).toContain("palette = 8=#606060");
    expect(dawn).toContain("# Fabric Dawn");
  });
  it("emits exactly 16 palette lines", () => {
    expect(dusk.match(/^palette = /gm)).toHaveLength(16);
  });
  it("throws on unknown tokens", () => {
    expect(() => render("x = $nope\n", palette, "dusk")).toThrow(/unknown token \$nope/);
  });
  it("prefers the longest token match", () => {
    expect(render("$term.bright-black", palette, "dusk")).toBe("#8a8f98\n");
  });
  it("throws on leftover tokens the token pattern does not match", () => {
    expect(() => render("x = $Canvas\n", palette, "dusk")).toThrow(/unknown token \$Canvas/);
    expect(() => render("x = ${canvas}\n", palette, "dusk")).toThrow(/unknown token \$\{canvas\}/);
  });
  it("throws on unknown variant", () => {
    expect(() => render("$id", palette, "dim" as "dusk")).toThrow(/unknown variant/);
  });
  it("ends with a single newline", () => {
    expect(dusk.endsWith("\n")).toBe(true);
    expect(dusk.endsWith("\n\n")).toBe(false);
  });
});

describe("build", () => {
  it("writes both themes from a local palette", async () => {
    const out = mkdtempSync(join(tmpdir(), "fabric-ghostty-"));
    await build({ palettePath: fixturePath, templatePath: join(import.meta.dirname, "../template/fabric"), outDir: out });
    expect(readdirSync(out).sort()).toEqual(["fabric-dawn", "fabric-dusk"]);
    expect(readFileSync(join(out, "fabric-dusk"), "utf8")).toContain("background = #010102");
  });
  it("fails when a file lacks 16 palette lines", async () => {
    const out = mkdtempSync(join(tmpdir(), "fabric-ghostty-"));
    const bad = join(out, "t");
    (await import("node:fs")).writeFileSync(bad, "palette = 0=$term.black\n");
    await expect(build({ palettePath: fixturePath, templatePath: bad, outDir: out })).rejects.toThrow(/expected palette indices 0-15/);
    expect(readdirSync(out)).toEqual(["t"]);
  });
  it("fails when 16 palette lines repeat an index", async () => {
    const out = mkdtempSync(join(tmpdir(), "fabric-ghostty-"));
    const bad = join(out, "t");
    const lines = Array.from({ length: 16 }, (_, i) => `palette = ${i === 15 ? 1 : i}=$term.black`);
    (await import("node:fs")).writeFileSync(bad, `${lines.join("\n")}\n`);
    await expect(build({ palettePath: fixturePath, templatePath: bad, outDir: out })).rejects.toThrow(/found \[0,1,.*,14,1\]/);
  });
  it("builds the pinned url", () => {
    expect(paletteUrl()).toBe(`https://raw.githubusercontent.com/ozzycodes2/fabric-theme/${PALETTE_TAG}/dist/palette.json`);
  });
  it("fetches when no path is given", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => palette });
    expect(await loadPalette(undefined, f as unknown as typeof fetch)).toBe(palette);
    expect(f).toHaveBeenCalledWith(paletteUrl());
  });
  it("reports fetch failures", async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(loadPalette(undefined, f as unknown as typeof fetch)).rejects.toThrow(/404/);
  });
});

describe("main", () => {
  it("returns 0 on success and 1 with a message on failure", async () => {
    const out = mkdtempSync(join(tmpdir(), "fabric-ghostty-"));
    expect(await main(["--palette", fixturePath], out)).toBe(0);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await main(["--palette", join(out, "missing.json")], out)).toBe(1);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
  it("fetches the pinned palette when --palette is absent", async () => {
    const out = mkdtempSync(join(tmpdir(), "fabric-ghostty-"));
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => palette });
    vi.stubGlobal("fetch", f);
    expect(await main([], out)).toBe(0);
    vi.unstubAllGlobals();
    expect(f).toHaveBeenCalledWith(paletteUrl());
  });
});
