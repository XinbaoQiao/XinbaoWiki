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
language: en
lifecycle:
  status: confirmed
  confidence: 0.95
  review: on venue/status change
  retention: long-lived semantic memory
source_path: wiki/Soft_Weighted_Machine_Unlearning.md
---
**Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness** is an AAAI 2026 conference paper by **[Xinbao Qiao](./Xinbao_Qiao.md)**, Ningning Ding, Yushi Cheng, and Meng Zhang. It reframes unlearning as a continuous data-influence correction problem rather than only a binary erase-or-keep operation. The paper asks how much influence each sample should retain when the goal is to improve fairness or robustness without paying unnecessary utility loss.

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

## Key formula

The paper's optimization can be summarized as a constrained reweighting problem. $I_{\mathrm{metric}}(z_i)$ denotes a sample's influence on the fairness or robustness objective, and $I_{\mathrm{util}}(z_i)$ denotes its influence on utility.

The soft deletion weights solve a regularized correction problem:

$$
\epsilon^\star
=
\arg\min_{\epsilon}
\sum_i \epsilon_i I_{\mathrm{metric}}(z_i)
+\lambda\lVert\epsilon\rVert_2^2
$$

subject to:

$$
\sum_i \epsilon_i I_{\mathrm{metric}}(z_i)\le -\Delta,
\qquad
\sum_i \epsilon_i I_{\mathrm{util}}(z_i)\le 0,
\qquad
0\le \epsilon_i\le 1 .
$$

The resulting model correction follows an influence-function update:

$$
\theta_{\mathrm{soft}}
=
\widehat{\theta}
-H_{\widehat{\theta}}^{-1}
\sum_i \epsilon_i^\star\nabla_\theta \ell(z_i;\widehat{\theta}) .
$$

The constraints distinguish this approach from hard top-k deletion: the target metric must improve, but the update is not allowed to pay for that improvement through avoidable utility degradation.

## Results

The experiments evaluate fairness and robustness settings across tabular, image, and text datasets, including Adult, Bank, Jigsaw, CelebA, and CIFAR-based robustness evaluations in the owner-provided paper package. The paper reports that soft-weighted variants improve fairness or robustness metrics more consistently than hard-weighted schemes while reducing the loss in utility.

The diagnostic experiments also support the premise of the method: leave-one-out and influence-based analyses show that samples harmful to a target metric are not uniformly harmful to utility. This explains why the binary "remove or keep" rule is too coarse for correction-driven unlearning.

## Placement

This work belongs to [Machine Unlearning](./Machine_Unlearning.md), [Fairness and Robustness](./Fairness_and_Robustness.md), [Influence Functions](./Influence_Functions.md), and [Trustworthy AI](./Trustworthy_AI.md). It complements [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md) by shifting the problem from certified privacy deletion to fine-grained model correction.
