---
type: publication
title: 'DynFrs: An Efficient Framework for Machine Unlearning in Random Forest'
description: ICLR 2025 paper on efficient machine unlearning for random forests.
tags:
  - en
  - publication
  - paper
  - iclr-2025-poster
  - iclr-2025
timestamp: '2026-05-05T21:39:01+08:00'
modified: '2026-10-07T07:07:23.872Z'
content_hash: 'sha256:1b6691f31f55df4e55be20372c488f69dc0ad3daf113d0cf1380144f96bca4f1'
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
  document_id: 'wiki:DynFrs'
  chunking: markdown-heading-v1
source_ids:
  - src-19cdc04d387acf77
  - src-3234eea5652932e1
  - src-508cc93a8723d9eb
  - src-da17eb3884244bd3
source_path: wiki/DynFrs.md
---
**DynFrs: An Efficient Framework for Machine Unlearning in Random Forest** is an ICLR 2025 conference paper by Shurong Wang, Zhuoyang Shen, **[Xinbao Qiao](./Xinbao_Qiao.md)**, Tongning Zhang, and Meng Zhang. The work treats random-forest unlearning as a dynamic data-structure problem: it seeks exact distributional equivalence to retraining while keeping online deletion, insertion, and query latency low.

![ICLR 2025 poster for DynFrs](/papers/dynfrs/poster.png)

## Overview

The paper studies exact and efficient [machine unlearning](./Machine_Unlearning.md) for [random forests](./Random_Forest.md). Random forests are still widely used in privacy-sensitive domains such as healthcare, finance, and recommendation, but their tree-ensemble structure makes standard gradient-based unlearning tools inapplicable.

DynFrs targets three online operations on a forest: prediction, sample removal, and sample addition. The key design goal is low-latency modification without losing the distributional equivalence required by exact unlearning. The paper therefore treats unlearning as a data-structure and randomized-algorithm problem, not only as a model-update problem.

## Method

DynFrs combines three mechanisms:

- **OCC(q)**, a tree-subsampling rule that places each training sample in only `ceil(qT)` of `T` trees;
- **LZY**, a lazy-tag mechanism that postpones subtree reconstruction until a later query actually traverses the affected path;
- **ERT**, an Extremely Randomized Tree base learner, chosen because randomized split candidates make the structure less sensitive to local sample changes.

![DynFrs lazy-tag strategy](/papers/dynfrs/lazy-tags.png)

## Key takeaways

- **Exact unlearning can be a data-structure problem.** Tree membership and repair operations must preserve distributional equivalence to retraining after deletion.
- **Update latency affects continued service.** An efficient deletion procedure limits the reconstruction work that could otherwise delay predictions.
- **Randomization helps control maintenance costs.** Tree subsampling limits how many trees a sample affects, while lazy updates defer reconstruction until it is needed.
- **Classical models also need support for changing data.** Deletion, insertion, and prediction must work together when a model serves an ongoing stream of requests.

## Results

The OpenReview paper reports that DynFrs achieves orders-of-magnitude faster unlearning than existing random-forest unlearning methods while preserving or improving predictive accuracy. In the PDF, the authors report a 4000 to 1,500,000 times speedup relative to naive retraining, a 22 to 523 times speedup relative to DaRE in sequential unlearning, and online mixed-stream latency of about 0.12 ms for modification requests and 1.3 ms for querying requests on a large-scale dataset.

The empirical results also distinguish sequential and batch unlearning. DynFrs is presented as the only evaluated random-forest method that remains strong in both settings, because OCC(q) reduces per-sample tree coverage while LZY prevents every deletion from triggering full subtree reconstruction.

## Placement

This work belongs to [Machine Unlearning](./Machine_Unlearning.md), [Random Forest](./Random_Forest.md), and [Trustworthy AI](./Trustworthy_AI.md). In Qiao's publication record, it complements [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md) by focusing on exact unlearning for tree ensembles rather than approximate certified unlearning for differentiable models.
