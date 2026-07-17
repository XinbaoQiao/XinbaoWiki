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
modified: '2026-07-12T20:00:05+08:00'
content_hash: 'sha256:716cec747164b611174524f9ef173b5027f5d0873107ea5e7158c0676c2134e4'
reviewed_at: '2026-07-12T20:00:05+08:00'
review_due: '2027-07-12'
name: 'Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness'
summary: >-
  AAAI 2026 paper on soft-weighted unlearning for fairness and robustness
  correction.
authors:
  - Xinbao Qiao
  - Ningning Ding
  - Yushi Cheng
  - Meng Zhang
venue: AAAI 2026
location: 'Singapore EXPO, Singapore'
year: 2026
status: accepted
publication_type: Conference paper
links:
  - label: arXiv
    url: 'https://arxiv.org/abs/2505.18783'
  - label: AAAI article
    url: 'https://ojs.aaai.org/index.php/AAAI/article/view/39681'
  - label: Code
    url: 'https://github.com/XinbaoQiao/Soft-Weighted-Machine-Unlearning'
---
**Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness** is an AAAI 2026 conference paper by **[[Xinbao_Qiao|Xinbao Qiao]]**, Ningning Ding, Yushi Cheng, and Meng Zhang. It reframes unlearning as a continuous data-influence correction problem rather than only a binary erase-or-keep operation. The paper asks how much influence each sample should retain when the goal is to improve fairness or robustness without paying unnecessary utility loss.

![AAAI 2026 poster for Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness](/papers/soft-weighted/poster.png)

## Overview

The paper studies a mismatch between privacy-driven unlearning and correction-driven unlearning. In a right-to-be-forgotten setting, binary deletion is natural: a sample is either retained or removed. In fairness and robustness correction, however, the goal is often to reduce harmful influence without discarding useful signal.

The paper names the resulting failure mode **over-unlearning**: hard deletion can improve a target fairness or robustness metric while degrading utility, flipping bias in the opposite direction, or treating borderline samples as if they were highly detrimental.

## Method

The method replaces binary deletion weights with continuous sample weights. It first estimates each sample's influence on both the target metric and utility, then solves a convex quadratic program for a tailored weight vector. The resulting weights are plugged into influence-function-style unlearning or related correction methods, so harmful samples can be downweighted without being treated as equally removable.

The three-stage workflow is:

1. estimate each sample's influence on fairness or robustness and on utility;
2. solve for continuous weights that improve the target metric while constraining utility loss;
3. apply a weighted model correction instead of deleting a fixed top-k set.

![Soft-weighted unlearning framework](/papers/soft-weighted/framework.png)

## Key takeaways

- **Not every correction should be a deletion.** The paper separates privacy-style removal from fairness or robustness repair, where the goal is often to reduce harmful influence without discarding useful signal.
- **Binary unlearning can overreact.** Hard removal treats all selected samples as equally removable, even when some of them contain information the model still needs.
- **Influence should be treated as a dial, not a switch.** Soft weights let the maintenance process ask how much each sample should matter after correction, rather than whether it should disappear entirely.
- **The broader lesson is that unlearning can be a model-improvement interface.** Deletion machinery can support fairness and robustness interventions when it is designed as calibrated influence control.

## Results

The experiments evaluate fairness and robustness settings across tabular, image, and text datasets, including Adult, Bank, Jigsaw, CelebA, and CIFAR-based robustness evaluations in the owner-provided paper package. The paper reports that soft-weighted variants improve fairness or robustness metrics more consistently than hard-weighted schemes while reducing the loss in utility.

The diagnostic experiments also support the premise of the method: leave-one-out and influence-based analyses show that samples harmful to a target metric are not uniformly harmful to utility. This explains why the binary "remove or keep" rule is too coarse for correction-driven unlearning.

## Placement

This work belongs to [[Machine_Unlearning]], [[Fairness_and_Robustness]], [[Influence_Functions]], and [[Trustworthy_AI]]. It complements [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]] by shifting the problem from certified privacy deletion to fine-grained model correction.
