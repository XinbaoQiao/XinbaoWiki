---
type: publication
title: Hessian-Free Online Certified Unlearning
description: ICLR 2025 paper on efficient Hessian-free certified machine unlearning.
tags:
  - en
  - publication
  - paper
  - iclr-2025-poster
  - iclr-2025
timestamp: '2026-05-05T21:39:01+08:00'
modified: '2026-10-07T07:07:23.883Z'
content_hash: 'sha256:809a45415e206a5078ad9191c1422a3b97cf19fd566acdfb8e87577fff96e1c4'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-01-05'
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2027-01-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Hessian_Free_Online_Certified_Unlearning'
  chunking: markdown-heading-v1
source_ids:
  - src-508cc93a8723d9eb
  - src-65d81b8aca549860
  - src-a0a9b7171dc028d2
  - src-faaafad831fbefc5
source_path: wiki/Hessian_Free_Online_Certified_Unlearning.md
---
**Hessian-Free Online Certified Unlearning** is an ICLR 2025 conference paper by **[Xinbao Qiao](./Xinbao_Qiao.md)**, Meng Zhang, Ming Tang, and Ermin Wei. The paper develops a certified unlearning procedure for stochastic training pipelines where explicit Hessian storage, inversion, or repeated retraining would be too costly. Its main contribution is to turn deletion into an online vector update after a trajectory-based precomputation stage.

![ICLR 2025 poster for Hessian-Free Online Certified Unlearning](/papers/hessian-free/poster.png)

## Overview

The paper studies [certified data removal](./Certified_Data_Removal.md) for stochastic training, relaxing the requirement of a strictly convex empirical-risk minimizer and avoiding explicit Hessian construction or inversion. Earlier certified-unlearning methods often use Newton-style corrections from stored second-order statistics, but those matrix operations become impractical for high-dimensional and over-parameterized models.

The method tracks the stochastic optimization trajectory throughout training. It records per-sample trajectory statistics that approximate how the learned model would have changed if a sample had been absent during stochastic training.

## Method

The method accumulates an approximate influence vector for each training point through affine stochastic recursion. The recursion tracks the discrepancy between the model trained on the full dataset and the counterfactual model retrained without a requested sample. Because the update can be computed through Hessian-vector products, the algorithm avoids materializing the full Hessian matrix while retaining a certificate-style approximation guarantee.

Once the recollected vectors have been computed, online deletion becomes additive: a batch of deletion requests is handled by summing the stored per-sample approximators and applying a vector update to the current model.

## Key takeaways

- **Deletion costs depend on how training is organized.** Recording per-sample information during training can reduce the work needed when deletion requests arrive.
- **Training trajectories contain reusable information about data influence.** Stored trajectory statistics support later vector updates without explicitly constructing or inverting the full Hessian.
- **Efficiency and certification can be designed together.** The method combines low-cost updates with a formal approximation guarantee relative to retraining.
- **Future deletion requests belong in the model lifecycle.** Planning for removal during training makes subsequent model maintenance more practical.

## Results

The paper reports millisecond-level unlearning execution and orders-of-magnitude lower time and storage costs than Hessian-based certified-unlearning baselines. In large-scale application experiments, the method removes a sample through vector additions while preserving test accuracy close to retraining.

The experiments also use membership-inference analysis to examine privacy leakage under repeated model releases.

## Placement

This work belongs to [Machine Unlearning](./Machine_Unlearning.md), [Certified Data Removal](./Certified_Data_Removal.md), and [Trustworthy AI](./Trustworthy_AI.md). Within Qiao's publication record, it is the differentiable-model counterpart to [DynFrs: An Efficient Framework for Machine Unlearning in Random Forest](./DynFrs.md), which studies exact unlearning for tree ensembles.
