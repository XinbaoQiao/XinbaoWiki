# Asset provenance register

Last reviewed: 2026-08-09

This register records the evidence currently available for non-code assets in
Xinbaopedia. It is an audit surface, not a license grant. The governing reuse
terms remain [LICENSING.md](LICENSING.md) and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Status meanings

- **Documented upstream terms:** the component has an identified upstream
  license; comply with that license and its notices.
- **Project mark reserved:** the file is treated as a Xinbaopedia brand asset;
  no trademark or endorsement permission is granted.
- **Unresolved:** creator, source, permission, or generation provenance is
  incomplete. The repository does not authorize downstream reuse, and the
  current distribution basis still requires owner or legal confirmation.

## CV and fonts

| Path | Evidence | Status |
| --- | --- | --- |
| `CV.tex` | Legacy reference-matched layout; no upstream template record is stored in the repository. | **Unresolved.** No open-content grant. |
| `public/files/XinbaoQiao_CV.pdf` | Rendered CV containing embedded Roboto, Source Sans Pro, Font Awesome, and Latin Modern Math subsets. | **Unresolved** as a document. Font licenses do not open the CV text or layout. |
| `assets/cv-fonts/Roboto-Bold.ttf` | Roboto 2.137; Google; Apache-2.0. | **Documented upstream terms.** |
| `assets/cv-fonts/Roboto-BoldItalic.ttf` | Roboto 2.137; Google; Apache-2.0. | **Documented upstream terms.** |
| `assets/cv-fonts/Roboto-Italic.ttf` | Roboto 2.137; Google; Apache-2.0. | **Documented upstream terms.** |
| `assets/cv-fonts/Roboto-Light.ttf` | Roboto 2.137; Google; Apache-2.0. | **Documented upstream terms.** |
| `assets/cv-fonts/Roboto-LightItalic.ttf` | Roboto 2.137; Google; Apache-2.0. | **Documented upstream terms.** |
| `assets/cv-fonts/Roboto-Medium.ttf` | Roboto 2.137; Google; Apache-2.0. | **Documented upstream terms.** |
| `assets/cv-fonts/Roboto-Regular.ttf` | Roboto 2.137; Google; Apache-2.0. | **Documented upstream terms.** |
| `assets/cv-fonts/SourceSansPro-Bold.otf` | Source Sans Pro 3.006; Adobe; OFL-1.1 with Reserved Font Name "Source". | **Documented upstream terms.** |
| `assets/cv-fonts/SourceSansPro-BoldIt.otf` | Source Sans Pro 3.006; Adobe; OFL-1.1 with Reserved Font Name "Source". | **Documented upstream terms.** |
| `assets/cv-fonts/SourceSansPro-It.otf` | Source Sans Pro 3.006; Adobe; OFL-1.1 with Reserved Font Name "Source". | **Documented upstream terms.** |
| `assets/cv-fonts/SourceSansPro-Light.otf` | Source Sans Pro 3.006; Adobe; OFL-1.1 with Reserved Font Name "Source". | **Documented upstream terms.** |
| `assets/cv-fonts/SourceSansPro-LightIt.otf` | Source Sans Pro 3.006; Adobe; OFL-1.1 with Reserved Font Name "Source". | **Documented upstream terms.** |
| `assets/cv-fonts/SourceSansPro-Regular.otf` | Source Sans Pro 3.006; Adobe; OFL-1.1 with Reserved Font Name "Source". | **Documented upstream terms.** |
| `assets/cv-fonts/SourceSansPro-Semibold.otf` | Source Sans Pro 3.006; Adobe; OFL-1.1 with Reserved Font Name "Source". | **Documented upstream terms.** |
| `assets/cv-fonts/SourceSansPro-SemiboldIt.otf` | Source Sans Pro 3.006; Adobe; OFL-1.1 with Reserved Font Name "Source". | **Documented upstream terms.** |
| `assets/cv-fonts/fa-brands-400.ttf` | Font Awesome 5 Free 5.15.4; Fonticons, Inc.; font binary under OFL-1.1. | **Documented upstream terms.** |
| `assets/cv-fonts/fa-solid-900.ttf` | Font Awesome 5 Free 5.15.4; Fonticons, Inc.; font binary under OFL-1.1. | **Documented upstream terms.** |

The component notices and full local license texts are linked from
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Portraits and likenesses

| Path | Evidence | Status |
| --- | --- | --- |
| `public/images/Portrait.png` | An embedded C2PA claim names OpenAI Media Service, gpt-image 2.0, creation date 2026-07-15, and trained algorithmic media. The claim has not been signature-verified with a C2PA validator; prompt, human creator or transformation history, output-terms review, and likeness consent are not recorded. | **Unresolved.** No downstream reuse permission. |
| `public/images/Portrait-Singapore-ICLR-2025.jpg` | Event photograph. Photographer, original source, license or permission, and subject-consent record are not stored here. | **Unresolved.** No downstream reuse permission. |
| `public/images/Portrait-Seoul-ICML-2026.png` | An embedded C2PA claim names OpenAI Media Service, gpt-image 2.0, creation date 2026-07-15, and trained algorithmic media. Older repository notes named another provider, so current public copy is provider-neutral. The C2PA claim has not been signature-verified; prompt, human creator or transformation history, output-terms review, and likeness consent are not recorded. | **Unresolved.** No downstream reuse permission. |

## Institutional insignia

| Path | Evidence | Status |
| --- | --- | --- |
| `public/institutions/cuhk-emblem.svg` | Binary identity matches the Wikimedia Commons CUHK emblem file; the source page marks it as public-domain material and warns about official-insignia restrictions. | **Unresolved for downstream brand use.** Follow the upstream page and CUHK policy. |
| `public/institutions/nusri-cq-logo.svg` | Used as an NUS/NUSRI identifier; no source-specific license or permission record is stored here. | **Unresolved.** No downstream reuse permission. |
| `public/institutions/shandong-university-logo.png` | Official identifier; no source-specific license or permission record is stored here. | **Unresolved.** No downstream reuse permission. |
| `public/institutions/zhejiang-university-logo.png` | Official identifier; no source-specific license or permission record is stored here. | **Unresolved.** No downstream reuse permission. |

Official names and insignia may remain restricted even when an image file is
in the public domain.

## Visitor activity map geometry

| Path | Evidence | Status |
| --- | --- | --- |
| `public/maps/world-land-dots.svg` | Generated on 2026-08-09 by `scripts/generate-site-activity-map.mjs` from the pinned `world-atlas` 2.0.2 `countries-110m.json` source, which redistributes Natural Earth 4.1.0 geometry. The project script merges the land geometry, applies a fixed projection and samples it into a dotted silhouette without internal political borders. SHA-256: `464d4d0ee4c209779f4b47135c66254839286754dd6f6a47fe83f9cebbb41225`. | **Documented upstream terms.** `world-atlas` 2.0.2 is ISC licensed; its copyright and permission notice are retained in `LICENSES/ISC-world-atlas.txt`. Natural Earth states that its raster and vector data are public domain. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). This provenance record does not represent Chinese official-map approval or a map-review number. |

## Paper figures and posters

The following files have no per-file source, co-author approval, publisher
license, or generation manifest recorded in the repository. They are all
**unresolved** and receive no downstream reuse permission:

- `public/papers/dynfrs/lazy-tags.png`
- `public/papers/dynfrs/poster.png`
- `public/papers/hessian-free/poster.png`
- `public/papers/model-collapse/poster.png`
- `public/papers/model-collapse/teaser.png`
- `public/papers/soft-weighted/framework.png`
- `public/papers/soft-weighted/framework.webp`


## Withdrawn paper media

The former Soft-Weighted poster and its preview were withdrawn at the author’s request on 2026-10-19 because they were not the original poster. They are no longer public assets and must not be restored from historical copies. The author-selected framework is the current leading visual; this selection does not grant downstream reuse rights. A newly created poster requires explicit author approval and provenance before replacing it.

## Generated research-topic illustrations

The following four illustrations were replaced on 2026-10-20 with qualitative
academic mechanism diagrams generated using the built-in image-generation tool.
The exact model version was not exposed. Author feedback rejected the initial
decorative and overly uniform drafts; those drafts are not deployed. Human input selected
topic-specific visual mechanisms, checked labels and arrows, and scoped the unlearning
influence illustration. Prompts and source mechanisms are preserved in
[research-topic-image-prompts.md](docs/research-topic-image-prompts.md).
Exports were resized to 1400 × 933 and PNG-compressed for the website. These are
illustrative schematics, not measured experimental results. Publication was
requested by the site owner; output-terms and downstream licensing are not
expanded by this record, and no downstream reuse permission is granted.

- `public/topics/ai-and-networks.png`
- `public/topics/data-centric-ml.png`
- `public/topics/machine-unlearning.png`
- `public/topics/synthetic-data.png`

| Asset | SHA-256 |
| --- | --- |
| AI and Networks | `29dc9e52ca6f58110ddd60c539e34b362613a0bc57f1173fe81940c3fd7fa638` |
| Machine Unlearning | `f8abc9d67804f5ee972c70b1a56b9e635d373907cf1f5e632408b8ccea105bca` |
| Synthetic Data | `f94d4b3cc1b217ea528f442173f5c36c187b06a1d290687ecccadd0318f7e08c` |
| Data Centric ML | `a21662269dca98c9de40c291c27d28683ab4e26ce66adb08b4cd6d232646be91` |

## Xinbaopedia brand assets

The following files are **project marks reserved**. Their inclusion does not
grant trademark rights or permission to imply an official fork, affiliation,
or endorsement:

- `public/site-icons/xinbaopedia-blue.png`
- `public/site-icons/xinbaopedia-blue.webp`
- `public/site-icons/xinbaopedia-charcoal.png`
- `public/site-icons/xinbaopedia-charcoal.webp`
- `public/site-icons/xinbaopedia-gold.png`
- `public/site-icons/xinbaopedia-gold.webp`
- `public/site-icons/xinbaopedia-green.png`
- `public/site-icons/xinbaopedia-green.webp`
- `public/site-logos/wordmark/xinbao-qiao-blue.png`
- `public/site-logos/wordmark/xinbao-qiao-charcoal.png`
- `public/site-logos/wordmark/xinbao-qiao-gold.png`
- `public/site-logos/wordmark/xinbao-qiao-green.png`
- `public/xinbaopedia-icon.png`
- `public/xinbaopedia-icon.webp`

## Closing an unresolved record

A provenance update should identify the exact path and checksum, creator or
source, creation or download date, version or generation model when relevant,
prompt or transformation history when relevant, license or written permission,
required attribution, likeness consent when applicable, and reviewer/date.
Only then should [LICENSING.md](LICENSING.md) or
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) be broadened.

This register is an engineering compliance record, not legal advice.
