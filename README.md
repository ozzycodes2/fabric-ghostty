# Fabric for Ghostty

Fabric is a colour theme with two variants, Dusk and Dawn. This is the port for [Ghostty](https://ghostty.org).

## Usage

Download the theme files into your Ghostty themes directory:

```sh
mkdir -p ~/.config/ghostty/themes
for v in dusk dawn; do
  curl -fsSL -o ~/.config/ghostty/themes/fabric-$v \
    https://raw.githubusercontent.com/ozzycodes2/fabric-ghostty/main/dist/fabric-$v
done
```

From a clone, `cp dist/* ~/.config/ghostty/themes/` does the same.

The theme files are named `fabric-dusk` and `fabric-dawn`. Then set the theme in your Ghostty config, following the system appearance:

```
theme = dark:fabric-dusk,light:fabric-dawn
```

Or use a single variant:

```
theme = fabric-dusk
```

## Gallery

Screenshots follow.

## Thanks

Structure inspired by the [Rosé Pine port for Ghostty](https://github.com/rose-pine/ghostty).

## Contributing

The theme files in `dist/` are generated from [`template/fabric`](template/fabric) and the Fabric palette, pinned to the `v0.1.0` tag of [fabric-theme](https://github.com/ozzycodes2/fabric-theme). To rebuild:

```sh
pnpm install && pnpm build
```

## License

MIT
