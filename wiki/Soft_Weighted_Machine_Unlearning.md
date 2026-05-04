---
name: "Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness"
type: "publication"
authors:
  - "Xinbao Qiao"
  - "Ningning Ding"
  - "Yushi Cheng"
  - "Meng Zhang"
venue: "AAAI 2026"
location: "Singapore EXPO, Singapore"
year: 2026
status: "accepted; AAAI 2026 presentation listed for 2026-01-25; arXiv submitted on 2025-05-24"
publication_type: "Conference paper"
links:
  - label: "arXiv"
    url: "https://arxiv.org/abs/2505.18783"
  - label: "Code"
    url: "https://github.com/XinbaoQiao/Soft-Weighted-Machine-Unlearning"
  - label: "AAAI 2026 lecture page"
    url: "https://underline.io/lecture/139759-beyond-binary-erasure-soft-weighted-unlearning-for-fairness-and-robustness"
summary: "AAAI 2026 paper on soft-weighted unlearning for fairness and robustness correction."
---

**Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness** is an AAAI 2026 conference paper by [[Xinbao_Qiao|Xinbao Qiao]], Ningning Ding, Yushi Cheng, and Meng Zhang. The arXiv v1 predates the final AAAI presentation title, which is used as the canonical title on this wiki.

## Overview

The paper studies a mismatch between privacy-driven unlearning and correction-driven unlearning. In a right-to-be-forgotten setting, binary deletion is natural: a sample is either retained or removed. In fairness and robustness correction, however, the goal is often to reduce harmful influence without discarding useful signal.

The paper names the resulting failure mode **over-unlearning**: hard deletion can improve a target fairness or robustness metric while degrading utility, flipping bias in the opposite direction, or treating borderline samples as if they were highly detrimental.

## Method

The method replaces binary deletion weights with continuous sample weights. It first estimates each sample's influence on both the target metric and utility, then solves a convex quadratic program for a tailored weight vector. The resulting weights are plugged into influence-function-style unlearning or related correction methods.

![Soft-weighted unlearning framework](/papers/soft-weighted/framework.png)

The three-stage workflow is:

1. estimate each sample's influence on fairness or robustness and on utility;
2. solve for continuous weights that improve the target metric while constraining utility loss;
3. apply a weighted model correction instead of deleting a fixed top-k set.

## Key formula

The paper's optimization can be summarized as a constrained reweighting problem. `I_metric` denotes the influence on the fairness or robustness objective, and `I_util` denotes the influence on utility.

```text
epsilon* = argmin_epsilon
  sum_i I_metric(z_i; epsilon_i) + lambda ||epsilon||_2^2

subject to
  sum_i I_metric(z_i; epsilon_i) <= -Delta
  sum_i I_util(z_i; epsilon_i) <= 0

theta_soft = theta_hat
  - H_{theta_hat}^{-1} * sum_i epsilon_i* grad_theta l(z_i; theta_hat)
```

The constraints distinguish this approach from hard top-k deletion: the target metric must improve, but the update is not allowed to pay for that improvement through avoidable utility degradation.

## Results

The experiments evaluate fairness and robustness settings across tabular, image, and text datasets, including Adult, Bank, Jigsaw, CelebA, and CIFAR-based robustness evaluations in the owner-provided paper package. The paper reports that soft-weighted variants improve fairness or robustness metrics more consistently than hard-weighted schemes while reducing the loss in utility.

The diagnostic experiments also support the premise of the method: leave-one-out and influence-based analyses show that samples harmful to a target metric are not uniformly harmful to utility. This explains why the binary "remove or keep" rule is too coarse for correction-driven unlearning.

![Soft-weighted unlearning experiment summary](/papers/soft-weighted/sec-5-1-1.png)

## Placement

This work belongs to [[Machine_Unlearning]], [[Fairness_and_Robustness]], [[Influence_Functions]], and [[Trustworthy_AI]]. It complements [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]] by shifting the problem from certified privacy deletion to fine-grained model correction.
