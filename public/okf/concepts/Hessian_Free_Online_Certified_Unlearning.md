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
modified: '2026-07-08T13:18:57+08:00'
content_hash: 'sha256:017f86e5da6b8fec2ff8c7a791fbebe84e2d8dcbaa22316b5d7239f9c4f04884'
reviewed_at: '2026-07-08T13:18:57+08:00'
review_due: '2026-10-06'
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-07-08T13:18:57+08:00'
  reviewDue: '2026-10-06'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Hessian_Free_Online_Certified_Unlearning'
  chunking: markdown-heading-v1
source_ids:
  - src-65d81b8aca549860
  - src-a0a9b7171dc028d2
  - src-faaafad831fbefc5
source_path: wiki/Hessian_Free_Online_Certified_Unlearning.md
---
**Hessian-Free Online Certified Unlearning** is an ICLR 2025 conference paper by **[Xinbao Qiao](./Xinbao_Qiao.md)**, Meng Zhang, Ming Tang, and Ermin Wei. The paper develops a certified unlearning procedure for stochastic training pipelines where explicit Hessian storage, inversion, or repeated retraining would be too costly. Its main contribution is to turn deletion into an online vector update after a trajectory-based precomputation stage.

![ICLR 2025 poster for Hessian-Free Online Certified Unlearning](/papers/hessian-free/poster.png)

## Overview

The paper studies [certified data removal](./Certified_Data_Removal.md) for models that cannot afford explicit Hessian construction, Hessian inversion, or a strict convex empirical-risk-minimizer assumption. Earlier certified-unlearning methods often use Newton-style corrections from stored second-order statistics, but those matrix operations become impractical for high-dimensional and over-parameterized models.

The paper's central move is to treat training as a trajectory rather than only a final optimizer. It records per-sample trajectory statistics that approximate how the learned model would have changed if a sample had been absent during stochastic training.

## Method

The method recollects an approximator for each training point through affine stochastic recursion. The recursion tracks the discrepancy between the model trained on the full dataset and the counterfactual model retrained without a requested sample. Because the update can be computed through Hessian-vector products, the algorithm avoids materializing the full Hessian matrix while retaining a certificate-style approximation guarantee.

Once the recollected vectors have been computed, online deletion becomes additive: a batch of deletion requests is handled by summing the stored per-sample approximators and applying a vector update to the current model.

## Key takeaways

- **Unlearning needs an operational model, not only a legal ideal.** The paper treats a deletion request as a concrete systems event that must be handled without full retraining or storing massive second-order objects.
- **The training trajectory contains reusable deletion information.** Instead of asking the final model alone to explain every future removal, the method preserves enough trajectory-level information to make later updates cheap.
- **Certification and efficiency should be designed together.** The contribution is not simply faster unlearning; it is a way to keep a certificate-style link to retraining while avoiding Hessian materialization.
- **The broader lesson is lifecycle readiness.** Models intended for regulated or user-facing environments should be built with future removal requests in mind, not patched after deployment.

## Results

The paper reports millisecond-level unlearning execution and orders-of-magnitude lower time and storage costs than Hessian-based certified-unlearning baselines. In large-scale application experiments, the method removes a sample through vector additions while preserving test accuracy close to retraining.

The experiments also include membership-inference analysis. The reported trade-off is that certified unlearning should be evaluated not only for approximation-to-retraining and utility, but also for privacy leakage under repeated model releases.

## Placement

This work belongs to [Machine Unlearning](./Machine_Unlearning.md), [Certified Data Removal](./Certified_Data_Removal.md), and [Trustworthy AI](./Trustworthy_AI.md). Within Qiao's publication record, it is the differentiable-model counterpart to [DynFrs: An Efficient Framework for Machine Unlearning in Random Forest](./DynFrs.md), which studies exact unlearning for tree ensembles.
