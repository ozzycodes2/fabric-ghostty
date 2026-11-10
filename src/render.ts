export type Color = { hex: string; rgb: [number, number, number]; hsl: [number, number, number] };
export type Role = { slug: string; name: string; use: string; dusk: Color; dawn: Color };
export type Variant = { slug: "dusk" | "dawn"; id: string; name: string; appearance: "dark" | "light" };
export type Palette = { version: string; variants: Variant[]; ui: Role[]; terminal: Role[] };

const TOKEN = /\$[a-z][a-z0-9.-]*/g;

export function render(template: string, palette: Palette, variant: "dusk" | "dawn"): string {
  const meta = palette.variants.find((v) => v.slug === variant);
  if (!meta) throw new Error(`unknown variant ${variant}`);
  const tokens = new Map<string, string>([
    ["id", meta.id],
    ["name", meta.name],
  ]);
  for (const r of palette.ui) tokens.set(r.slug, `#${r[variant].hex.replace(/^#/, "")}`);
  for (const r of palette.terminal) tokens.set(`term.${r.slug}`, `#${r[variant].hex.replace(/^#/, "")}`);

  const out = template.replace(TOKEN, (match) => {
    const value = tokens.get(match.slice(1));
    if (value === undefined) throw new Error(`unknown token ${match}`);
    return value;
  });
  const leftover = out.match(/\$\S*/);
  if (leftover) throw new Error(`unknown token ${leftover[0]}`);
  return `${out.replace(/\n+$/, "")}\n`;
}
