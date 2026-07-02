---
type: Research concept
title: Model Collapse
description: >-
  Concept page for degenerative distributional drift in recursive model
  training.
tags:
  - en
  - research
  - concept
  - research-concept
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
language: en
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
source_path: wiki/Model_Collapse.md
---
**Model Collapse** is a degenerative process in which a model trained recursively on generated or biased data loses information about the original data distribution. Collapse can appear as mode loss, reduced diversity, distorted class proportions, or worsening sample quality over generations.[^collapse]

## Role in this wiki

The page provides the failure concept for the broader [Synthetic Data](./Synthetic_Data_and_Model_Collapse.md) topic. It is written separately because "synthetic data" is not automatically bad: the failure depends on how generated data are selected, mixed, and reused. Model collapse is therefore the negative endpoint that motivates careful data governance and collaborative verification. The low-resource framing is important here: if tail regions are poorly covered from the beginning, collapse may arrive earlier and affect underrepresented content more severely.

## Connection to Qiao's work

Qiao's ICML 2026 paper studies when sample-selection bias precipitates collapse in low-resource verification regimes. The work is connected to [Wasserstein geometry](./Wasserstein_Geometry.md) because distributional distances can provide signals about drift, and to [data silos](./Data_Silos.md) because no single party may have the full distribution. In the biography, model collapse is part of Qiao's broader reliability agenda: data processes can silently degrade models even when the model architecture remains unchanged.

## See also

- [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md)
- [Recursive Synthetic Data Training](./Recursive_Synthetic_Data_Training.md)
- [Sample Selection Bias](./Sample_Selection_Bias.md)
- [Collaborative Evaluation](./Collaborative_Evaluation.md)

[^collapse]: Shumailov et al. define model collapse in the context of recursively generated data and report the phenomenon across language models, variational autoencoders, and Gaussian mixture models.
