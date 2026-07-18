# Asset provenance register

Last reviewed: 2026-07-18

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
- `public/papers/soft-weighted/poster.png`

## Generated research-topic illustrations

The following files are recorded in Git history as generated concept
illustrations, but the model, prompt, date, output terms, and human-authorship
contribution are not documented. They are all **unresolved** and receive no
downstream reuse permission:

- `public/topics/ai-and-networks.png`
- `public/topics/data-centric-ml.png`
- `public/topics/machine-unlearning.png`
- `public/topics/synthetic-data.png`

## Xinbaopedia brand assets

The following files are **project marks reserved**. Their inclusion does not
grant trademark rights or permission to imply an official fork, affiliation,
or endorsement:

- `public/site-icons/xinbaopedia-blue.png`
- `public/site-icons/xinbaopedia-charcoal.png`
- `public/site-icons/xinbaopedia-gold.png`
- `public/site-icons/xinbaopedia-green.png`
- `public/site-logos/wordmark/xinbao-qiao-blue.png`
- `public/site-logos/wordmark/xinbao-qiao-charcoal.png`
- `public/site-logos/wordmark/xinbao-qiao-gold.png`
- `public/site-logos/wordmark/xinbao-qiao-green.png`
- `public/xinbaopedia-icon.png`

## Closing an unresolved record

A provenance update should identify the exact path and checksum, creator or
source, creation or download date, version or generation model when relevant,
prompt or transformation history when relevant, license or written permission,
required attribution, likeness consent when applicable, and reviewer/date.
Only then should [LICENSING.md](LICENSING.md) or
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) be broadened.

This register is an engineering compliance record, not legal advice.
