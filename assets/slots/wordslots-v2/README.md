# Word$lots Asset Pack V2

Production-ready visual pack for the MATTBEAR **Word$lots / ШØЯDPLΔY Slot Machine** build.

## What is inside

- `symbols/` — 14 neon reel tiles, including W/O/R/D/S/L/T, cassette rewind, CRT bonus, FX, wild bear, jackpot, multiplier, and mystery.
- `backgrounds/` — 1920×1080 skyline, word-grid, and bonus CRT backgrounds.
- `ui/` — header art, 4×4 reel frame, spin/rewind/max-bet buttons, payline glow, luck meter, volume knob, mini-player shell.
- `icons/` — app icons for PWA/favicon use.
- `svg/` — scalable logo/frame/payline helpers.
- `css/wordslots-assets.css` — simple drop-in tokens and effects.
- `docs/preload-snippet.html` — preload tags using the recommended path.

## Recommended repo location

```txt
assets/slots/wordslots-v2/
```

This keeps it compatible with the existing WordSlots idea of `assets/symbols/`, without dumping new art into the root like a raccoon found FTP access.

## Primary slot symbols

```js
const WORDSLOTS_SYMBOLS = [
  "tile-w.png",
  "tile-o.png",
  "tile-r.png",
  "tile-d.png",
  "tile-s.png",
  "tile-l.png",
  "tile-t.png",
  "cassette-rewind.png",
  "bonus-crt.png",
  "fx-icon.png",
  "wild-bear.png",
  "jackpot-wordplay.png",
  "mult-dollar.png",
  "mystery-q.png"
];
```

## Suggested special rules

- `cassette-rewind.png`: 3 symbols trigger Click/Rewind mode.
- `bonus-crt.png`: 3 symbols trigger bonus splash.
- `fx-icon.png`: use for glitch/effects payout.
- `wild-bear.png`: wild symbol.
- `jackpot-wordplay.png`: top-tier jackpot/wordplay hit.
- `mult-dollar.png`: multiplier tile.
- `mystery-q.png`: mystery reveal / random tile.

## Visual style

Neon arcade, dark cabinet, gold/cyan/pink glow, CRT scanlines, rave sparkle, and clean mobile button states.
