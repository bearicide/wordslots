# Word$lots Drop-In Assets

Put the contents of this ZIP into the root of your Word$lots project/repo.

## Exact target location

After copying, your project should look like this:

```txt
/wordslots/
  index.html
  style.css
  game.js
  assets/
    slots/
      wordslots-v2/
        symbols/
        ui/
        backgrounds/
        icons/
        svg/
        css/
        docs/
        manifest.json
        README.md

    source/
      wordslots/
        boards/

    promo/
      wordslots/
```

## Game should load from this folder

```txt
assets/slots/wordslots-v2/
```

## Use these in code

```js
const ASSET_ROOT = "./assets/slots/wordslots-v2/";

const SYMBOLS = {
  W: `${ASSET_ROOT}symbols/tile-w.png`,
  O: `${ASSET_ROOT}symbols/tile-o.png`,
  R: `${ASSET_ROOT}symbols/tile-r.png`,
  D: `${ASSET_ROOT}symbols/tile-d.png`,
  S: `${ASSET_ROOT}symbols/tile-s.png`,
  L: `${ASSET_ROOT}symbols/tile-l.png`,
  T: `${ASSET_ROOT}symbols/tile-t.png`,
  REWIND: `${ASSET_ROOT}symbols/cassette-rewind.png`,
  BONUS: `${ASSET_ROOT}symbols/bonus-crt.png`,
  FX: `${ASSET_ROOT}symbols/fx-icon.png`,
  WILD: `${ASSET_ROOT}symbols/wild-bear.png`,
  JACKPOT: `${ASSET_ROOT}symbols/jackpot-wordplay.png`,
  MULT: `${ASSET_ROOT}symbols/mult-dollar.png`,
  MYSTERY: `${ASSET_ROOT}symbols/mystery-q.png`
};
```

## Important

- `assets/slots/wordslots-v2/` is for real game-loaded files.
- `assets/source/wordslots/boards/` is for big generated reference boards.
- `assets/promo/wordslots/` is for public promo/hero/loading images.
