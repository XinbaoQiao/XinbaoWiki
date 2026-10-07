---
type: Research concept
title: Model Collapse
description: Distributional degradation during recursive model training.
tags:
  - en
  - research
  - concept
  - research-concept
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.925Z'
content_hash: 'sha256:30a590aad71dec54fb3dbf59a63fb452bc2b48c5b3c19e7a6f26c3d5bfbd65ee'
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
  document_id: 'wiki:Model_Collapse'
  chunking: markdown-heading-v1
source_ids:
  - src-3e9d5d7dceceebc1
source_path: wiki/Model_Collapse.md
---
**Model Collapse** is a degenerative process in which a model trained recursively on generated or biased data loses information about the original data distribution. Collapse can appear as mode loss, reduced diversity, distorted class proportions, or worsening sample quality over generations.[^collapse]

## Research context

Model collapse is a failure mode studied in [Synthetic Data](./Synthetic_Data_and_Model_Collapse.md) research. Synthetic data are not inherently harmful: the failure depends on how generated data are selected, mixed, and reused. This risk motivates careful data governance and collaborative verification. Low-resource conditions are particularly important: if tail regions are poorly covered from the beginning, collapse may arrive earlier and affect underrepresented content more severely.

## Connection to Qiao's work

Qiao's ICML 2026 paper studies when sample-selection bias precipitates collapse in low-resource verification regimes. The work is connected to [Wasserstein geometry](./Wasserstein_Geometry.md) because distributional distances can provide signals about drift, and to [data silos](./Data_Silos.md) because no single party may have the full distribution. This work addresses a broader reliability problem: data processes can silently degrade models even when the model architecture remains unchanged.

## See also

- [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md)
- [Recursive Synthetic Data Training](./Recursive_Synthetic_Data_Training.md)
- [Sample Selection Bias](./Sample_Selection_Bias.md)
- [Collaborative Evaluation](./Collaborative_Evaluation.md)

[^collapse]: Shumailov et al., ["AI models collapse when trained on recursively generated data"](https://www.nature.com/articles/s41586-024-07566-y), *Nature* 631 (2024), define model collapse in the context of indiscriminate recursive use of generated data and report the phenomenon across language models, variational autoencoders, and Gaussian mixture models.
