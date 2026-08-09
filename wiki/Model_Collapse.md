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
modified: '2026-08-09T18:32:45.779Z'
content_hash: 'sha256:026aaccf6d298044dc9d9397d84569e104f51de8a5c8fcd9264e76513516d336'
reviewed_at: '2026-08-10T02:34:00+08:00'
review_due: '2027-02-05'
name: Model Collapse
summary: >-
  Concept page for degenerative distributional drift in recursive model
  training.
occupation: Research concept
---
**Model Collapse** is a degenerative process in which a model trained recursively on generated or biased data loses information about the original data distribution. Collapse can appear as mode loss, reduced diversity, distorted class proportions, or worsening sample quality over generations.[^collapse]

## Role in this wiki

The page provides the failure concept for the broader [[Synthetic_Data_and_Model_Collapse|Synthetic Data]] topic. It is written separately because "synthetic data" is not automatically bad: the failure depends on how generated data are selected, mixed, and reused. Model collapse is therefore the negative endpoint that motivates careful data governance and collaborative verification. The low-resource framing is important here: if tail regions are poorly covered from the beginning, collapse may arrive earlier and affect underrepresented content more severely.

## Connection to Qiao's work

Qiao's ICML 2026 paper studies when sample-selection bias precipitates collapse in low-resource verification regimes. The work is connected to [[Wasserstein_Geometry|Wasserstein geometry]] because distributional distances can provide signals about drift, and to [[Data_Silos|data silos]] because no single party may have the full distribution. In the biography, model collapse is part of Qiao's broader reliability agenda: data processes can silently degrade models even when the model architecture remains unchanged.

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Recursive_Synthetic_Data_Training]]
- [[Sample_Selection_Bias]]
- [[Collaborative_Evaluation]]

[^collapse]: Shumailov et al., ["AI models collapse when trained on recursively generated data"](https://www.nature.com/articles/s41586-024-07566-y), *Nature* 631 (2024), define model collapse in the context of indiscriminate recursive use of generated data and report the phenomenon across language models, variational autoencoders, and Gaussian mixture models.
