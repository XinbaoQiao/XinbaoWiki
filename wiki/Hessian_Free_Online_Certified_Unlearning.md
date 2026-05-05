---
name: "Hessian-Free Online Certified Unlearning"
type: "publication"
authors:
  - "Xinbao Qiao"
  - "Meng Zhang"
  - "Ming Tang"
  - "Ermin Wei"
venue: "ICLR 2025"
location: "Singapore EXPO, Singapore"
year: 2025
status: "ICLR 2025 poster"
publication_type: "Conference paper"
links:
  - label: "OpenReview"
    url: "https://openreview.net/forum?id=C3TrHWanh5"
  - label: "arXiv"
    url: "https://arxiv.org/abs/2404.01712"
  - label: "Code"
    url: "https://github.com/XinbaoQiao/Hessian-Free-Certified-Unlearning"
summary: "ICLR 2025 paper on efficient Hessian-free certified machine unlearning."
---

**Hessian-Free Online Certified Unlearning** is an ICLR 2025 conference paper by **[[Xinbao_Qiao|Xinbao Qiao]]**, Meng Zhang, Ming Tang, and Ermin Wei. OpenReview lists the paper as an ICLR 2025 poster, published on 22 January 2025.

## Overview

The paper studies [[Certified_Data_Removal|certified data removal]] for models that cannot afford explicit Hessian construction, Hessian inversion, or a strict convex empirical-risk-minimizer assumption. Earlier certified-unlearning methods obtain Newton-style updates from stored second-order statistics, but those matrix operations become impractical for high-dimensional and over-parameterized models.

The paper's central move is to treat training as a trajectory rather than only a final optimizer. It records per-sample trajectory statistics that approximate how the learned model would have changed if a sample had been absent during stochastic training.

## Method

The method recollects an approximator for each training point through affine stochastic recursion. The recursion tracks the discrepancy between the model trained on the full dataset and the counterfactual model retrained without a requested sample. Because the update can be computed through Hessian-vector products, the algorithm avoids materializing the full Hessian matrix.

Once the recollected vectors have been computed, online deletion becomes additive: a batch of deletion requests is handled by summing the stored per-sample approximators and applying a vector update to the current model.

![Hessian-free online certified unlearning workflow](/papers/hessian-free/ours.png)

![ICLR 2025 poster for Hessian-Free Online Certified Unlearning](/papers/hessian-free/poster.png)

## Key formula

The page uses a compact notation for the core update. Here `a^{-u}_{E,B}` denotes the recollected trajectory approximator for deleting sample `u`, and `Hhat` denotes the accumulated Hessian-vector-product operator along the later training trajectory.

```text
a^{-u}_{E,B}
  ~= sum_{e=0}^{E} eta_{e,b(u)} / |B_{e,b(u)}|
       * Hhat_{E,B-1 -> e,b(u)+1} * grad l(w_{e,b(u)}; u)

unlearn(S, U):
  wbar^{-U}_{E,B} = w_{E,B} + sum_{u in U} a^{-u}_{E,B}
```

The additivity result is the operational reason the online stage is cheap: after precomputation, a deletion request does not require solving a new linear system or inverting a Hessian.

## Results

The paper reports millisecond-level unlearning execution and orders-of-magnitude lower time and storage costs than Hessian-based certified-unlearning baselines. The owner-provided manuscript package reports that, in large-scale application experiments, the method can remove a sample through simple vector additions with about 0.6 ms unlearning runtime while preserving test accuracy close to retraining.

The experiments also include membership-inference analysis. The reported trade-off is that certified unlearning should be evaluated not only for approximation-to-retraining and utility, but also for privacy leakage under repeated model releases.

![Membership-inference and utility trade-off for Hessian-free unlearning](/papers/hessian-free/mia-tradeoff.png)

## Placement

This work belongs to [[Machine_Unlearning]], [[Certified_Data_Removal]], and [[Trustworthy_AI]]. Within Qiao's publication record, it is the differentiable-model counterpart to [[DynFrs|DynFrs: An Efficient Framework for Machine Unlearning in Random Forest]], which studies exact unlearning for tree ensembles.
