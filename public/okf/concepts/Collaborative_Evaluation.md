---
type: Research concept
title: Collaborative Evaluation
description: Evaluation of models and data processes using evidence from multiple parties.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.816Z'
content_hash: 'sha256:4e5e84fafa00db7b2bcb8408d677f1c2d4c3f6fcd8cb540ea75839f7dceab75c'
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
  document_id: 'wiki:Collaborative_Evaluation'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Collaborative_Evaluation.md
---
**Collaborative Evaluation** refers to evaluation procedures in which multiple parties contribute evidence about model behavior, data quality, or distributional drift. In cross-silo settings, each participant has local observations but no participant has complete access to the global distribution.

## Research context

Evaluation across [data silos](./Data_Silos.md) is a networked problem, connecting [Wasserstein geometry](./Wasserstein_Geometry.md) with [AI and networks](./AI_and_Networks.md). A centralized benchmark assumes that all relevant data can be gathered and labeled in one place. Collaborative evaluation instead asks what can be inferred from partial, possibly biased local signals, especially when some parties operate in low-resource conditions.

## Connection to Qiao's work

In [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md), collaborative evaluation is used to reason about recursive synthetic-data failure when the original data distribution is split across low-resource silos. The project uses distributional proxies, including Wasserstein-style geometry, to compare generated behavior against multi-party evidence. This connects Qiao's synthetic-data work to his broader systems interest: reliable AI often depends on how evidence is shared, not only on how a model is trained.

## See also

- [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md)
- [Data Silos](./Data_Silos.md)
- [Wasserstein Geometry](./Wasserstein_Geometry.md)
- [Synthetic Data](./Synthetic_Data_and_Model_Collapse.md)
