# Character ocean (your-wiki)

Clean-room Canvas recreation of the jiezi1234/character-ocean *look* for a full-bleed site background.

## Licensing

- **UX / style names** aligned with [jiezi1234/character-ocean](https://github.com/jiezi1234/character-ocean) (MIT for app UI concepts).
- **Do not vendor** stackedlol/ascii-sharks or character-ocean `engine` / `world` / `renderer` / `species` / `math` sources — those paths are unlicensed upstream.
- This folder is an independent clean-room: spine sharks, Couzin-zone schools, soft currents, and cell-raster glyph silhouettes rewritten to match observed demo behavior.

## Architecture

- `math.ts` — angle wrap, hash, divergence-free current
- `species.ts` — school personality presets
- `world.ts` — follow-the-leader shark spines + Reynolds/Couzin fish schools
- `silhouette.ts` — half-width body profile + fins sampled along the spine
- `engine.ts` — fixed-timestep loop, supersampled raster, glyph draw
- `alphabets.ts` — ZH density ramps unchanged; EN body glyphs stream site-theme vocabulary (research/networks/learning/wiki)

## Site behavior

- Default style: **ASCII** (no mode-select chrome).
- Glyph alphabets follow `html[lang]` (EN theme letter-streams vs ZH CJK ramps). Full shark kinds (classic→sunfish) with tiger/zebra/whale markings + manta disc. Ocean fades under portal/article text.
- Stack: palette → wallpaper → translucent ocean → content.
- `prefers-reduced-motion`: settle then still frame.
- Preview: `/dev/character-ocean/`

## Flocking model

School forces follow Reynolds boids in Couzin-style zones (Couzin et al. 2002),
as adapted by jiezi1234/character-ocean from stackedlol/ascii-sharks: repulsion
inside elliptical personal space, alignment + cohesion outside it, rear blind
spot, and species-weighted polarised / swarm / mill mixes in `species.ts`.

Schools seed as tight blobs inside the perception radius (so neighbours actually
see each other), with stronger align/cohesion weights so ribbons stay clustered
instead of scattering into loners. Mini fish are character-composed head+body+tail silhouettes
(`><>` / `<><`, alphabet-bodied `>R>` / `>鱼>`, style variants) — never
lone dashes or caret swarms that read as mosquitoes.


## Fidelity notes (recreate pass)

- Cell pitch matches the public demo (~width/124 on desktop); mobile uses a denser grid for punchier small fish without growing shark length.
- Shark body cells use coverage ≥ 0.6 for solid skin and edge glyphs otherwise (Couzin/ref raster feel).
- Homepage ocean mode strips portal/shell *card chrome* (border, radius, padding slab, backdrop) so UI floats on the ocean.
- Mobile keeps reduced shark/fish size but raises canvas opacity and ink contrast so schools remain readable.
