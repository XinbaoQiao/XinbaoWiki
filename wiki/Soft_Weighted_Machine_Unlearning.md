---
name: "Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness"
type: "publication"
authors:
  - "Xinbao Qiao"
  - "Ningning Ding"
  - "Yushi Cheng"
  - "Meng Zhang"
venue: "AAAI 2026"
year: 2026
status: "accepted; AAAI final notification date 2025-11-03; proceedings published 2026"
publication_type: "Conference paper"
categories:
  - "Machine Unlearning"
  - "Trustworthy AI"
  - "Fairness and Robustness"
links:
  - label: "OpenReview"
    url: "https://openreview.net/forum?id=bCPJ6Jiqv7"
  - label: "Code"
    url: "https://github.com/XinbaoQiao/Soft-Weighted-Machine-Unlearning"
  - label: "AAAI 2026 lecture page"
    url: "https://underline.io/lecture/139759-beyond-binary-erasure-soft-weighted-unlearning-for-fairness-and-robustness"
image: "/images/SW%20Unlearning.png"
image_caption: "Soft-weighted unlearning figure from the earlier homepage assets."
summary: "A soft-weighted unlearning framework for fairness and robustness settings."
---

**Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness** is an AAAI 2026 paper on [[Machine_Unlearning]] and [[Trustworthy_AI]]. It argues that non-privacy applications of unlearning, such as fairness and robustness correction, do not always require binary deletion.

## Idea

Instead of treating samples as either fully retained or fully removed, soft-weighted unlearning assigns continuous removal weights. This makes unlearning usable as a corrective mechanism when the objective is to reduce harmful influence rather than satisfy a strict right-to-be-forgotten request.

The paper frames hard deletion in fairness and robustness settings as a source of over-unlearning. It then uses counterfactual leave-one-out analysis and influence-function reasoning to assign tailored sample weights through a convex quadratic programming problem. The resulting soft scheme is designed to plug into existing unlearning algorithms with small overhead.

![Utility and fairness experiment](/papers/soft-weighted/utility-fairness.png)

## Publication record

AAAI-26 listed 2025-11-03 as the notification date for final acceptance or rejection in the main technical track. Public indexing records list the paper in the AAAI 2026 proceedings, volume 40, issue 29, pages 24936-24944.

## Topics

- [[Machine_Unlearning]]
- [[Fairness_and_Robustness]]
- [[Influence_Functions]]
- [[Trustworthy_AI]]
