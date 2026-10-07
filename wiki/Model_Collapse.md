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
name: Model Collapse
summary: Distributional degradation during recursive model training.
occupation: Research concept
---
**Model Collapse** is a degenerative process in which a model trained recursively on generated or biased data loses information about the original data distribution. Collapse can appear as mode loss, reduced diversity, distorted class proportions, or worsening sample quality over generations.[^collapse]

## Research context

Model collapse is a failure mode studied in [[Synthetic_Data_and_Model_Collapse|Synthetic Data]] research. Synthetic data are not inherently harmful: the failure depends on how generated data are selected, mixed, and reused. This risk motivates careful data governance and collaborative verification. Low-resource conditions are particularly important: if tail regions are poorly covered from the beginning, collapse may arrive earlier and affect underrepresented content more severely.

## Connection to Qiao's work

Qiao's ICML 2026 paper studies when sample-selection bias precipitates collapse in low-resource verification regimes. The work is connected to [[Wasserstein_Geometry|Wasserstein geometry]] because distributional distances can provide signals about drift, and to [[Data_Silos|data silos]] because no single party may have the full distribution. This work addresses a broader reliability problem: data processes can silently degrade models even when the model architecture remains unchanged.

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Recursive_Synthetic_Data_Training]]
- [[Sample_Selection_Bias]]
- [[Collaborative_Evaluation]]

[^collapse]: Shumailov et al., ["AI models collapse when trained on recursively generated data"](https://www.nature.com/articles/s41586-024-07566-y), *Nature* 631 (2024), define model collapse in the context of indiscriminate recursive use of generated data and report the phenomenon across language models, variational autoencoders, and Gaussian mixture models.
