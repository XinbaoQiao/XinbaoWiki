---
type: Research topic
title: Trustworthy AI
description: >-
  Research topic covering reliability, deletion, fairness, robustness,
  interpretability, and evaluation.
tags:
  - en
  - research
  - topic
  - research-topic
timestamp: '2026-05-05T20:55:21+08:00'
modified: '2026-10-07T06:42:08.636Z'
content_hash: 'sha256:1a24126519061279056efd864675f4e806c6c191063728a33d3b0fdf7cabec25'
reviewed_at: '2026-10-07T06:43:53.160Z'
review_due: '2027-04-05'
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-10-07T06:43:53.160Z'
  reviewDue: '2027-04-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Trustworthy_AI'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Trustworthy_AI.md
---
**Trustworthy AI** concerns model behavior that can be audited, corrected, updated, or evaluated under realistic constraints.

## Research context

Trustworthy AI encompasses [machine unlearning](./Machine_Unlearning.md), [fairness and robustness](./Fairness_and_Robustness.md), [interpretability](./Interpretability.md), [LLM reliability](./LLM_Reliability.md), and [collaborative evaluation](./Collaborative_Evaluation.md). The unifying idea is that reliability is not only a property of a trained model. It also depends on the data process, who can inspect the data, how changes are requested, and how evidence is shared.

## Connection to Qiao's work

Qiao's work contributes to trustworthy AI through concrete mechanisms. Unlearning papers give methods for deleting or correcting data influence. Synthetic-data work studies how recursive training can fail and how distributed parties can detect the failure. The NeurIPS 2026 paper [Illusory Pattern Perception Drives Spurious Inference in Large Language Models](./Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models.md) examines a different reliability risk: perceived prompt patterns can steer inference away from evidence. AI-and-networks projects study how reliability and efficiency change under communication constraints.

## See also

- [Machine Unlearning](./Machine_Unlearning.md)
- [Synthetic Data](./Synthetic_Data_and_Model_Collapse.md)
- [AI and Networks](./AI_and_Networks.md)
- [Fairness and Robustness](./Fairness_and_Robustness.md)
- [Interpretability](./Interpretability.md)
