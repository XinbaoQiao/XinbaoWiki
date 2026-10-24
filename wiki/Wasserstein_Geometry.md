---
type: Research concept
title: Wasserstein Geometry
description: Comparison of probability distributions using optimal-transport geometry.
tags:
  - en
  - research
  - concept
  - research-concept
  - wasserstein
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-24T14:48:31.203Z'
content_hash: 'sha256:f09cdb31d7722809a1227f7a810111f1d6b3e0501adc8d2824fb2c682e11e8b0'
reviewed_at: '2026-10-24T14:48:55.704Z'
review_due: '2027-04-22'
name: Wasserstein Geometry
summary: Comparison of probability distributions using optimal-transport geometry.
occupation: Research concept
---
**Wasserstein Geometry** refers to the use of optimal-transport distances and related geometric ideas to compare probability distributions. Unlike pointwise metrics, Wasserstein distances account for the cost of moving probability mass from one distribution to another, which makes them useful for reasoning about distribution shift and generated data.

## Research context

Wasserstein geometry supports [[Synthetic_Data_and_Model_Collapse|synthetic-data analysis]], [[Collaborative_Evaluation|collaborative evaluation]], and [[Distributed_Wasserstein_Barycenter|distributed barycenter computation]]. When data are split across silos, a distributional comparison can be more informative than a single scalar accuracy score. Wasserstein-style measures provide a language for describing how generated data drift across classes, modes, or visual features.

This geometry is not limited to Euclidean domains. Recent work on generative modeling over Wasserstein spaces of Riemannian manifolds illustrates how McCann displacement interpolants connect probability measures on a base manifold $(\mathcal{M}, d_g)$ to a geodesic path in the Wasserstein manifold $(\mathcal{P}_2(\mathcal{M}), W_2)$ above it—the same transport geometry used to compare and combine distributions.[^rwefm]

![McCann interpolant between measures on a Riemannian manifold and its lift in Wasserstein space](/related/rwefm/mccann-interpolant.webp)

## Connection to Qiao's work

The ICML 2026 paper [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] uses collaborative Wasserstein-style signals to reason about model collapse under low-resource selection bias. The later doctoral focus on [[Distributed_Wasserstein_Barycenter|distributed Wasserstein barycenters]] keeps the same geometry but shifts attention toward computation: how a shared distributional reference can be obtained from several local measures. Wasserstein geometry provides tools for diagnosing distributional change when data are distributed and direct global inspection is unavailable.

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Collaborative_Evaluation]]
- [[Distributed_Wasserstein_Barycenter]]
- [[Model_Collapse]]
- [[Data_Silos]]

[^rwefm]: Doron Haviv, Edward De Brouwer, Rishabh Anand, Rex Ying, Aïcha Bentaieb, Gabriele Scalia, and Hector Corrada Bravo, "[When Riemann flows with Wasserstein: Generative Modeling of Probability Distributions on Manifolds](https://arxiv.org/abs/2609.25659)", arXiv:2609.25659, 2026. The figure above is from that paper (their overview of Riemannian Wasserstein Entropic Flow Matching and McCann interpolants) and is shown here for illustration with attribution; it is not a result of Qiao's work.
