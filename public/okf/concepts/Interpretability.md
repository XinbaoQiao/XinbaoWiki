---
type: Research concept
title: Interpretability
description: Understanding model behavior and the influence of training data.
tags:
  - en
  - research
  - concept
  - research-concept
  - llm
timestamp: '2026-05-05T20:55:21+08:00'
modified: '2026-10-07T07:07:23.903Z'
content_hash: 'sha256:2ac8a263a49bb7d1cc07ce83e65f860dc1b3b6febdfca5b3dd9839b14751620f'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
language: en
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2027-04-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Interpretability'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Interpretability.md
---
**Interpretability** refers to methods that help people understand why a model behaves the way it does. Qiao's related research focuses on data influence, error diagnosis, and explanations that support trustworthiness decisions.

## Research context

Interpretability is a supporting topic for [Trustworthy AI](./Trustworthy_AI.md) and [Data Centric ML](./Data_Centric_Machine_Learning.md). A model can be accurate but still difficult to audit. If a researcher can explain which examples, groups, or synthetic-data processes caused a behavior, then the next action can be data selection, unlearning, correction, or collaborative evaluation. Interpretability therefore links explanation to intervention.

## Connection to Qiao's work

Qiao uses [influence functions](./Influence_Functions.md) and unlearning to study how data changes affect model behavior. [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md) and [Beyond Binary Erasure](./Soft_Weighted_Machine_Unlearning.md) both rely on understanding how data changes affect model parameters or predictions. The synthetic-data line also needs interpretability in a broader sense: when model collapse occurs, the research asks what process caused the degeneration and how distributed parties can detect it. The NeurIPS 2026 paper [Illusory Pattern Perception Drives Spurious Inference in Large Language Models](./Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models.md) examines a recognizable failure mode in which a perceived prompt pattern displaces evidence-grounded inference.

## See also

- [Illusory Pattern Perception Drives Spurious Inference in Large Language Models](./Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models.md)
- [Influence Functions](./Influence_Functions.md)
- [Trustworthy AI](./Trustworthy_AI.md)
- [Machine Unlearning](./Machine_Unlearning.md)
- [Data Centric ML](./Data_Centric_Machine_Learning.md)
