---
type: Research concept
title: Synthetic Data (concept)
description: 'Generated data used for training, evaluation, and collaboration.'
tags:
  - en
  - research
  - concept
  - research-concept
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.981Z'
content_hash: 'sha256:d82e3aff42533a29575db5055bba799019c7640c26267922953b7b15fbb65520'
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
  document_id: 'wiki:Synthetic_Data'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Synthetic_Data.md
---
**Synthetic Data** refers to generated examples that are used in place of, alongside, or as a proxy for real data. In machine learning, synthetic data can expand coverage, reduce annotation cost, protect privacy, or enable evaluation when real data are scarce. It can also introduce failure modes when generated samples are recursively reused without enough real-data anchoring.

## Research context

Synthetic data can be useful for augmentation and other applications, while recursive reuse introduces risks of its own. Qiao's [synthetic-data research](./Synthetic_Data_and_Model_Collapse.md) studies how those risks depend on selection and access to real data.

## Connection to Qiao's work

Qiao's ICML 2026 work studies synthetic data under selection bias, low-resource verification, and siloed access. The core concern is not merely that data are generated, but that generation is embedded inside a repeated training loop. When each generation learns from biased selections of earlier outputs, the synthetic distribution can drift away from the original, with low-resource communities especially exposed to tail-mode loss. The project connects synthetic data to [data selection](./Data_Selection.md), [model collapse](./Model_Collapse.md), and [collaborative evaluation](./Collaborative_Evaluation.md).

## See also

- [Synthetic Data and Model Collapse](./Synthetic_Data_and_Model_Collapse.md)
- [Recursive Synthetic Data Training](./Recursive_Synthetic_Data_Training.md)
- [Sample Selection Bias](./Sample_Selection_Bias.md)
- [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md)
