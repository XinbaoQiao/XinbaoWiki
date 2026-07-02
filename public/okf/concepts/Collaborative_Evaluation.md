---
type: Research concept
title: Collaborative Evaluation
description: Concept page for evaluating models or data processes across multiple parties.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-27T17:56:27+08:00'
language: en
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
source_path: wiki/Collaborative_Evaluation.md
---
**Collaborative Evaluation** refers to evaluation procedures in which multiple parties contribute evidence about model behavior, data quality, or distributional drift. In this wiki the concept is used mainly for cross-silo settings, where each participant has local observations but no participant has complete access to the global distribution.

## Role in this wiki

This page connects [data silos](./Data_Silos.md) to [Wasserstein geometry](./Wasserstein_Geometry.md) and [AI and networks](./AI_and_Networks.md). It explains why evaluation itself can be a networked problem. A centralized benchmark assumes that all relevant data can be gathered and labeled in one place. Collaborative evaluation instead asks what can be inferred from partial, possibly biased local signals, especially when some parties operate in low-resource conditions.

## Connection to Qiao's work

In [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md), collaborative evaluation is used to reason about recursive synthetic-data failure when the original data distribution is split across low-resource silos. The project uses distributional proxies, including Wasserstein-style geometry, to compare generated behavior against multi-party evidence. This connects Qiao's synthetic-data work to his broader systems interest: reliable AI often depends on how evidence is shared, not only on how a model is trained.

## See also

- [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md)
- [Data Silos](./Data_Silos.md)
- [Wasserstein Geometry](./Wasserstein_Geometry.md)
- [Synthetic Data](./Synthetic_Data_and_Model_Collapse.md)
