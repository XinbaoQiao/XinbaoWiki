# Third-party notices and protected assets

This inventory records material that is not covered by Xinbaopedia's project
MIT grant or its original-content CC BY 4.0 grant. It reflects the repository
state reviewed on 2026-07-18. These notices preserve upstream attribution; they
do not transfer ownership, grant endorsement, or relicense protected material.
A per-file evidence and status register is maintained in
[ASSET_PROVENANCE.md](ASSET_PROVENANCE.md).

## Bundled and embedded fonts

| Component | Tracked location | Version and ownership information | Terms and upstream |
| --- | --- | --- | --- |
| Roboto | `assets/cv-fonts/Roboto-*.ttf` | Version 2.137; copyright 2011 Google Inc. | Apache License 2.0. See [local license](LICENSES/Apache-2.0.txt) and [upstream](https://github.com/googlefonts/roboto-2/blob/main/LICENSE). |
| Source Sans Pro | `assets/cv-fonts/SourceSansPro-*.otf` | Version 3.006; copyright 2010-2019 Adobe; Reserved Font Name "Source". | SIL Open Font License 1.1. See [local license](LICENSES/OFL-1.1.txt) and [upstream](https://github.com/adobe-fonts/source-sans/blob/release/LICENSE.md). |
| Font Awesome 5 Free | `assets/cv-fonts/fa-brands-400.ttf`, `assets/cv-fonts/fa-solid-900.ttf` | Version 5.15.4; copyright Fonticons, Inc. | The font files are under SIL Open Font License 1.1. See [local license](LICENSES/OFL-1.1.txt) and [upstream](https://github.com/FortAwesome/Font-Awesome/blob/5.x/LICENSE.txt). The upstream project's separate icon and code licenses do not broaden the license of these font binaries. |
| Latin Modern Math | Embedded subset in `public/files/XinbaoQiao_CV.pdf`; no standalone tracked font file | Version 1.959; copyright 2012-2014 B. Jackowski, P. Strzelczyk, and P. Pianowski. | GUST Font License. See [local notice](LICENSES/GUST-FONT-LICENSE.txt), [CTAN package record](https://ctan.org/pkg/lm-math), and [TUG license page](https://www.tug.org/fonts/licenses/gfl.html). |

The bundled font files remain under their upstream licenses. Reserved font
names and upstream attribution requirements continue to apply. The CV source
and rendered PDF are not otherwise opened by those font licenses.

## Community policy source

`CODE_OF_CONDUCT.md` is adapted from
[Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/)
and changes only the reporting contact. Contributor Covenant 2.1 is licensed
under CC BY 4.0; the file retains its required upstream attribution and the
[local CC BY 4.0 text](LICENSES/CC-BY-4.0.txt) is included.

## Media, figures, and documents with reserved or unresolved rights

| Category | Tracked paths | Repository reuse status |
| --- | --- | --- |
| CV source and rendered document | `CV.tex`, `public/files/**` | All rights reserved unless a separate written permission applies. Template and layout provenance is not sufficiently documented for an open-content grant. |
| Portraits and likenesses | `public/images/**` | No repository license is granted. Photography, generated-image provenance, privacy, publicity, and personality rights require separate review. Generator metadata and content notes for one image are not yet reconciled. |
| Paper figures and posters | `public/papers/**` | No repository license is granted. These files may involve co-author, conference, publisher, or other third-party rights. |
| Generated research-topic illustrations | `public/topics/**` | No repository license is granted while model, prompt, output terms, and human-authorship provenance remain undocumented. |
| Xinbaopedia brand graphics | `public/site-icons/**`, `public/site-logos/**`, `public/xinbaopedia-icon.png` | Copyright and trademark rights are reserved. No permission to imply affiliation or endorsement is granted. |

## Institutional names and insignia

Institutional emblems and logos in `public/institutions/**` are excluded from
the project licenses. Their inclusion identifies public academic affiliations;
it does not imply institutional sponsorship or permission for downstream reuse.

- `cuhk-emblem.svg` matches the
  [Wikimedia Commons CUHK emblem file](https://commons.wikimedia.org/wiki/File:CUHK_Emblem_(1973-2008).svg).
  The upstream page marks the image as public-domain material but also flags
  possible restrictions on official insignia. CUHK publishes separate
  [guidelines for use of its name and emblem](https://kto.cuhk.edu.hk/en/about/guidelines-use-of-university-name).
- `nusri-cq-logo.svg` is treated as an NUS/NUSRI identifier. NUS publishes
  [identity guidance](https://nus.edu.sg/identity); no source-specific reuse
  permission is recorded in this repository.
- `shandong-university-logo.png` and
  `zhejiang-university-logo.png` have no source-specific license manifest in
  this repository. See the institutions' official identity information:
  [Shandong University](https://view.sdu.edu.cn/info/1018/170846.htm) and
  [Zhejiang University](https://www.zju.edu.cn/_t3007/xx1/list.psp).

All institution names, logos, emblems, and related marks remain subject to
their owners' trademark, insignia, and usage policies.

## General reservation

No license is granted by this repository for the protected files listed above
other than the explicit upstream font terms. Inclusion does not imply that
Xinbao Qiao owns all underlying rights or that any institution, venue,
publisher, photographer, co-author, or platform endorses this project. Reuse
requires an independent rights assessment and, where applicable, permission
from the relevant rightsholder.

For the path-level project license map, see [LICENSING.md](LICENSING.md).
This inventory is an engineering compliance record, not legal advice.
