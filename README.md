# Warung Sari Rasa — Dapur Kilat

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/meongs123/warung-sari-rasa/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/meongs123/warung-sari-rasa/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Entry for the [make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) bounty **"Warung Sari Rasa — Dapur Kilat"** (`best-cooking-game-20261125-0137`).

An original Indonesian street-food cooking game. You are the cook of a small neighbourhood warung at lunch rush: read the tickets on the order board, walk a route through the kitchen (pantry → chopping board → wok → plating counter → serving window), and serve dishes before patience runs out. One 3-minute shift; the ticket rate rises and patience shortens as the shift goes on. Serve fast and in a row to build a combo and earn tips. Pak Budi, the regular, orders his Nasi Goreng every shift.

## How to play

- **Click a station** to walk there and use it (mouse-only play works).
- **1–3** select a ticket; **Z–N** take a pantry bowl; **E / Space** interact with the station you face; **Q** trash; **K** recipe book; **P / Esc** pause; **M** mute.
- Four dishes: Nasi Goreng (fried rice), Mie Goreng (fried noodles), Sate Ayam (chicken satay), Es Teh Melati (iced jasmine tea). Each is a different chain of the same verbs: take, chop, cook, assemble, serve.
- A dish left on the burner past its green zone burns — trash it, or it breaks your combo. A ticket that runs out of patience leaves angry and resets your combo.
- Picky orders (last 90 seconds) ask you to skip one step (TANPA TELUR, TANPA KECAP) for +25% pay. Serve the standard dish to a picky ticket and the window refuses it.

## Play it

Serve `game/` with any static server and open `game/index.html` in a desktop browser (no network needed):

```
node serve.ts
# open http://localhost:8080
```

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

All art is drawn in code (canvas), all sounds are synthesized (WebAudio). No image, audio, or font files; no network requests; no eval; no service worker; no cookies.
