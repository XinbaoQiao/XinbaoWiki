---
type: Research concept
title: Influence Functions
description: Concept page for estimating how training examples affect learned models.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-05T19:52:29+08:00'
language: en
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
source_path: wiki/Influence_Functions.md
---
**Influence Functions** are analytical tools for estimating how a training point affects a fitted model or a downstream prediction. In modern machine learning they are often used as approximations: instead of retraining after changing one point, the method estimates the effect through gradients and curvature information.[^influence]

## Role in this wiki

This page explains why influence-based reasoning appears across data-centric ML. If a researcher can estimate the effect of a point, group, or weighted subset, they can ask which data should be removed, downweighted, kept, or inspected. Influence functions therefore connect [data selection](./Data_Selection.md), [machine unlearning](./Machine_Unlearning.md), fairness correction, and robustness analysis. The same idea also motivates why Hessian-vector products and second-order approximations appear in unlearning papers.

## Connection to Qiao's work

Qiao's unlearning work uses influence-style reasoning in several forms. [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md) relies on efficient updates without explicit Hessian inversion. [Beyond Binary Erasure](./Soft_Weighted_Machine_Unlearning.md) uses weighted influence to turn a deletion problem into a corrective intervention for fairness and robustness. In this wiki, influence functions are therefore not a standalone mathematical curiosity; they are the local sensitivity language behind Qiao's data-operation papers.

## See also

- [Machine Unlearning](./Machine_Unlearning.md)
- [Data Centric ML](./Data_Centric_Machine_Learning.md)
- [Fairness and Robustness](./Fairness_and_Robustness.md)
- [Hessian Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md)

[^influence]: Koh and Liang, "Understanding Black-box Predictions via Influence Functions", ICML 2017, reintroduced classical influence-function ideas for explaining predictions in modern machine-learning models.
