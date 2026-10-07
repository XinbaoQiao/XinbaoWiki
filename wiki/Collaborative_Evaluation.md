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
name: Collaborative Evaluation
summary: Evaluation of models and data processes using evidence from multiple parties.
occupation: Research concept
---
**Collaborative Evaluation** refers to evaluation procedures in which multiple parties contribute evidence about model behavior, data quality, or distributional drift. In cross-silo settings, each participant has local observations but no participant has complete access to the global distribution.

## Research context

Evaluation across [[Data_Silos|data silos]] is a networked problem, connecting [[Wasserstein_Geometry|Wasserstein geometry]] with [[AI_and_Networks|AI and networks]]. A centralized benchmark assumes that all relevant data can be gathered and labeled in one place. Collaborative evaluation instead asks what can be inferred from partial, possibly biased local signals, especially when some parties operate in low-resource conditions.

## Connection to Qiao's work

In [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]], collaborative evaluation is used to reason about recursive synthetic-data failure when the original data distribution is split across low-resource silos. The project uses distributional proxies, including Wasserstein-style geometry, to compare generated behavior against multi-party evidence. This connects Qiao's synthetic-data work to his broader systems interest: reliable AI often depends on how evidence is shared, not only on how a model is trained.

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Data_Silos]]
- [[Wasserstein_Geometry]]
- [[Synthetic_Data_and_Model_Collapse|Synthetic Data]]
