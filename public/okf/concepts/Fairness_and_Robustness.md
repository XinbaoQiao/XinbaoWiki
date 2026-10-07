---
type: Research concept
title: Fairness and Robustness
description: Fairness and robustness as goals of data-driven model correction.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-05T20:55:21+08:00'
modified: '2026-10-07T07:11:31.524Z'
content_hash: 'sha256:b3b6572931163e8bca1f1fe05c5fb2012d4a19831d3aa8bc5716d943cbef03ff'
reviewed_at: '2026-10-07T07:11:31.718Z'
review_due: '2027-04-05'
language: en
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-10-07T07:11:31.718Z'
  reviewDue: '2027-04-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Fairness_and_Robustness'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Fairness_and_Robustness.md
---
**Fairness and Robustness** are reliability objectives that can sometimes be improved by changing the training data or their weights. Fairness concerns systematic performance or treatment differences across groups, while robustness concerns stability under perturbations, corruptions, adversarial inputs, or distribution shift.

## Research context

Qiao's unlearning work also studies how deletion affects fairness and robustness. In [Beyond Binary Erasure](./Soft_Weighted_Machine_Unlearning.md), the operation is generalized from binary erasure to continuous weighting, allowing a data subset to be partially removed, corrected, or emphasized. This makes fairness and robustness part of the data-operation layer rather than a separate post-processing step.

## Connection to Qiao's work

Qiao's AAAI 2026 paper frames soft-weighted unlearning as a way to solve non-binary correction problems. The method adjusts how much influence each sample retains to improve fairness or robustness while limiting utility loss. It uses data weights as an intervention in [Data Centric ML](./Data_Centric_Machine_Learning.md) and supports the [Trustworthy AI](./Trustworthy_AI.md) goal of reliable model behavior under social or adversarial constraints.

## See also

- [Soft Weighted Machine Unlearning](./Soft_Weighted_Machine_Unlearning.md)
- [Machine Unlearning](./Machine_Unlearning.md)
- [Trustworthy AI](./Trustworthy_AI.md)
- [Influence Functions](./Influence_Functions.md)
