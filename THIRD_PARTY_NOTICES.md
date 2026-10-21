# Third-party notices

This inventory records third-party material shipped with the template.

## Inline icons

| Component | Tracked location | Terms |
| --- | --- | --- |
| Font Awesome 5 Free SVG icons | Inline paths in `components/PublicationLinkLegend.ts` (comment-dots, archive, github, link) | CC BY 4.0, Fonticons, Inc. See [local license](LICENSES/CC-BY-4.0.txt) and [upstream](https://github.com/FortAwesome/Font-Awesome/tree/5.15.4/svgs). |
| Alex Brush (homepage name wordmark, loaded from Google Fonts) | `app/layout.tsx` | SIL Open Font License 1.1. See [local license](LICENSES/OFL-1.1.txt). |

## Visitor activity map geometry

| Component | Tracked location | Version and ownership information | Terms and upstream |
| --- | --- | --- | --- |
| World Atlas TopoJSON | Source transformation recorded by `scripts/generate-site-activity-map.mjs`; derived output at `public/maps/world-land-dots.svg` | Version 2.0.2; copyright 2013-2019 Michael Bostock. The package redistributes Natural Earth 4.1.0 geometry. | ISC License. See [local license](LICENSES/ISC-world-atlas.txt), [upstream repository](https://github.com/topojson/world-atlas/tree/v2.0.2), and the pinned [`countries-110m.json`](https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json) source. |
| Natural Earth map data | Geometry underlying the same derived SVG | Natural Earth 4.1.0 vector data; primary authors include Tom Patterson and Nathaniel Vaughn Kelso. | Natural Earth declares all versions of its raster and vector map data to be public domain. See the official [terms of use](https://www.naturalearthdata.com/about/terms-of-use/). Attribution is not required, but the source is retained here for provenance. |

These upstream copyright terms do not imply that the generated silhouette is a
Chinese official standard map, has a map-review number, or is suitable for any
particular jurisdiction without a separate map-publication assessment.

## Community policy source

`CODE_OF_CONDUCT.md` is adapted from
[Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/)
and changes only the reporting contact. Contributor Covenant 2.1 is licensed
under CC BY 4.0; the file retains its required upstream attribution and the
[local CC BY 4.0 text](LICENSES/CC-BY-4.0.txt) is included.

## Your own assets

When you add portraits, paper figures, institutional logos, or a CV PDF, record
their source and license here.
