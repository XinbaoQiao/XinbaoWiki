---
type: Research concept
title: Wasserstein Geometry
description: Concept page for distributional comparison using optimal-transport geometry.
tags:
  - en
  - research
  - concept
  - research-concept
  - wasserstein
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:7332b1c94414444afaeadc595058d70d56cc4cbfc7d14d3d55bda2592ed311fe'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
name: Wasserstein Geometry
summary: Concept page for distributional comparison using optimal-transport geometry.
occupation: Research concept
---
**Wasserstein Geometry** refers to the use of optimal-transport distances and related geometric ideas to compare probability distributions. Unlike pointwise metrics, Wasserstein distances account for the cost of moving probability mass from one distribution to another, which makes them useful for reasoning about distribution shift and generated data.[^ot]

## Role in this wiki

This page supports the [[Synthetic_Data_and_Model_Collapse|Synthetic Data]], [[Collaborative_Evaluation|collaborative evaluation]], and [[Distributed_Wasserstein_Barycenter|distributed Wasserstein barycenter]] pages. It gives readers a reason why the wiki talks about geometry in a biography about AI and networks: when data are split across silos, a distributional comparison can be more informative than a single scalar accuracy score. Wasserstein-style measures provide a language for describing how generated data drift across classes, modes, or visual features.

## Connection to Qiao's work

The ICML 2026 paper [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] uses collaborative Wasserstein-style signals to reason about model collapse under low-resource selection bias. The later doctoral focus on [[Distributed_Wasserstein_Barycenter|distributed Wasserstein barycenters]] keeps the same geometry but shifts attention toward computation: how a shared distributional reference can be obtained from several local measures. In this wiki, Wasserstein geometry is therefore not a general math detour. It is the background for how Qiao's AI-and-networks line diagnoses distributional change when the data are distributed and direct global inspection is unavailable.

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Collaborative_Evaluation]]
- [[Distributed_Wasserstein_Barycenter]]
- [[Model_Collapse]]
- [[Data_Silos]]

[^ot]: Agueh and Carlier's SIAM paper on [barycenters in Wasserstein space](https://epubs.siam.org/doi/10.1137/100805741), Cuturi and Doucet's ICML paper on [fast Wasserstein barycenter computation](https://proceedings.mlr.press/v32/cuturi14.html), and Arjovsky, Chintala, and Bottou's [Wasserstein GAN](https://arxiv.org/abs/1701.07875) are useful background references for this page.
