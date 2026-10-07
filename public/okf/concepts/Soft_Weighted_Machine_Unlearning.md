---
type: publication
title: 'Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness'
description: >-
  AAAI 2026 paper on soft-weighted unlearning for fairness and robustness
  correction.
tags:
  - en
  - publication
  - paper
  - accepted
  - aaai-2026
  - machine-unlearning
timestamp: '2026-05-05T21:39:01+08:00'
modified: '2026-10-07T07:07:23.968Z'
content_hash: 'sha256:6a442fefe80b6de9b6128ea4a2ac0d4e7b2f61ba27fa2882d6532008246686a0'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-10-07'
language: en
lifecycle:
  status: confirmed
  confidence: 0.95
  review: on venue/status change
  retention: long-lived semantic memory
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2027-10-07'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Soft_Weighted_Machine_Unlearning'
  chunking: markdown-heading-v1
source_ids:
  - src-0642a11373a83c47
  - src-53e1199f272a4df4
  - src-998b6c4324199ad3
source_path: wiki/Soft_Weighted_Machine_Unlearning.md
---
**Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness** is an AAAI 2026 conference paper by **[Xinbao Qiao](./Xinbao_Qiao.md)**, Ningning Ding, Yushi Cheng, and Meng Zhang. It reframes unlearning as a continuous data-influence correction problem rather than only a binary erase-or-keep operation. The paper asks how much influence each sample should retain when the goal is to improve fairness or robustness while limiting utility loss.

![AAAI 2026 poster for Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness](/papers/soft-weighted/poster.png)

## Overview

The paper studies a mismatch between privacy-driven unlearning and correction-driven unlearning. In a right-to-be-forgotten setting, binary deletion is natural: a sample is either retained or removed. In fairness and robustness correction, however, the goal is often to reduce harmful influence without discarding useful signal.

The paper names the resulting failure mode **over-unlearning**: hard deletion can improve a target fairness or robustness metric while degrading utility, flipping bias in the opposite direction, or treating borderline samples as if they were highly detrimental.

## Method

The method replaces binary deletion weights with continuous sample weights. It first estimates each sample's influence on both the target metric and utility, then solves a convex quadratic program for a tailored weight vector. Influence-function-based unlearning or related correction methods then use these weights to adjust each sample's influence according to its estimated effects.

The three-stage workflow is:

1. estimate each sample's influence on fairness or robustness and on utility;
2. solve for continuous weights that improve the target metric while constraining utility loss;
3. apply a weighted model correction instead of deleting a fixed top-k set.

![Soft-weighted unlearning framework](/papers/soft-weighted/framework.png)

## Key takeaways

- **The goal of correction determines how data influence should change.** Fairness and robustness interventions may benefit from reducing a sample's harmful influence while retaining useful information.
- **Hard deletion can remove too much.** Samples that harm one metric can still contribute to predictive utility.
- **Continuous weights allow finer control.** Soft-weighted correction adjusts each sample's remaining influence while constraining utility loss.
- **Unlearning can support model improvement.** Influence-based updates provide a way to intervene in fairness and robustness as well as to remove data.

## Results

The experiments evaluate fairness and robustness settings across tabular, image, and text datasets, including Adult, Bank, Jigsaw, CelebA, and CIFAR-based robustness evaluations. The paper reports that soft-weighted variants improve fairness or robustness metrics more consistently than hard-weighted schemes while reducing the loss in utility.

The diagnostic experiments also support the premise of the method: leave-one-out and influence-based analyses show that samples harmful to a target metric are not uniformly harmful to utility. This explains why the binary "remove or keep" rule is too coarse for correction-driven unlearning.

## Placement

This work belongs to [Machine Unlearning](./Machine_Unlearning.md), [Fairness and Robustness](./Fairness_and_Robustness.md), [Influence Functions](./Influence_Functions.md), and [Trustworthy AI](./Trustworthy_AI.md). It complements [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md) by shifting the problem from certified privacy deletion to fine-grained model correction.
