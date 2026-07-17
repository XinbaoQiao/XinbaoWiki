---
type: Research concept
title: Fairness and Robustness
description: >-
  Concept page for fairness and robustness as data-centric correction
  objectives.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-05T20:55:21+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:01ec70a2530423cf6b84a82836edb8899ddb896b3b6bf1456e347539aafbb777'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
language: en
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-07-02T20:03:20+08:00'
  reviewDue: '2026-12-29'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Fairness_and_Robustness'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Fairness_and_Robustness.md
---
**Fairness and Robustness** are treated in this wiki as reliability objectives that can sometimes be improved by changing the training data or their weights. Fairness concerns systematic performance or treatment differences across groups, while robustness concerns stability under perturbations, corruptions, adversarial inputs, or distribution shift.

## Role in this wiki

The page exists because Qiao's unlearning work does not treat deletion as a purely legal or privacy operation. In [Beyond Binary Erasure](./Soft_Weighted_Machine_Unlearning.md), the operation is generalized from binary erasure to continuous weighting, allowing a data subset to be partially removed, corrected, or emphasized. This makes fairness and robustness part of the data-operation layer rather than a separate post-processing step.

## Connection to Qiao's work

Qiao's AAAI 2026 paper frames soft-weighted unlearning as a way to solve non-binary correction problems. Instead of asking whether one point should disappear, the method asks how much influence different data should retain to improve fairness, robustness, and utility together. This connects to [Data Centric ML](./Data_Centric_Machine_Learning.md) because the intervention is encoded in the data weights, and to [Trustworthy AI](./Trustworthy_AI.md) because the purpose is to make the model's behavior more reliable under social or adversarial constraints.

## See also

- [Soft Weighted Machine Unlearning](./Soft_Weighted_Machine_Unlearning.md)
- [Machine Unlearning](./Machine_Unlearning.md)
- [Trustworthy AI](./Trustworthy_AI.md)
- [Influence Functions](./Influence_Functions.md)
