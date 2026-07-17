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
modified: '2026-07-08T13:18:57+08:00'
content_hash: 'sha256:e6ac063f602e015e12506e44c362a212c8155400bf1007d5aaa5be220af99a47'
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
  document_id: 'wiki:DynFrs'
  chunking: markdown-heading-v1
source_ids:
  - src-19cdc04d387acf77
  - src-3234eea5652932e1
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

- **Exact unlearning can be a data-structure problem.** For random forests, the central challenge is not gradient correction but how to organize tree membership and repair work so that deletion remains equivalent to retraining.
- **Latency matters as much as final correctness.** A theoretically clean unlearning rule is incomplete if every request blocks prediction or forces broad reconstruction.
- **Randomization can make models easier to maintain.** By controlling where samples appear and delaying unnecessary subtree work, the framework turns randomness into a maintenance tool rather than only a modeling choice.
- **The broader message is that classical models also need lifecycle design.** Even non-neural models used in sensitive domains need update paths for deletion, insertion, and continued service.

## Results

The OpenReview paper reports that DynFrs achieves orders-of-magnitude faster unlearning than existing random-forest unlearning methods while preserving or improving predictive accuracy. In the PDF, the authors report a 4000 to 1,500,000 times speedup relative to naive retraining, a 22 to 523 times speedup relative to DaRE in sequential unlearning, and online mixed-stream latency of about 0.12 ms for modification requests and 1.3 ms for querying requests on a large-scale dataset.

The empirical results also distinguish sequential and batch unlearning. DynFrs is presented as the only evaluated random-forest method that remains strong in both settings, because OCC(q) reduces per-sample tree coverage while LZY prevents every deletion from triggering full subtree reconstruction.

## Placement

This work belongs to [Machine Unlearning](./Machine_Unlearning.md), [Random Forest](./Random_Forest.md), and [Trustworthy AI](./Trustworthy_AI.md). In Qiao's publication record, it complements [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md) by focusing on exact unlearning for tree ensembles rather than approximate certified unlearning for differentiable models.
