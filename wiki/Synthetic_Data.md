---
type: Research concept
title: Synthetic Data (concept)
description: >-
  Concept page for generated data used in training, evaluation, or
  privacy-preserving collaboration.
tags:
  - en
  - research
  - concept
  - research-concept
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-07-03T00:03:48+08:00'
content_hash: 'sha256:bbe93fac97f4c9cdd3408c23951a3082bd7e098256861dfd64ad06fb01970f2a'
reviewed_at: '2026-07-03T00:03:48+08:00'
review_due: '2026-12-29'
name: Synthetic Data (concept)
summary: >-
  Concept page for generated data used in training, evaluation, or
  privacy-preserving collaboration.
occupation: Research concept
---
**Synthetic Data** refers to generated examples that are used in place of, alongside, or as a proxy for real data. In machine learning, synthetic data can expand coverage, reduce annotation cost, protect privacy, or enable evaluation when real data are scarce. It can also introduce failure modes when generated samples are recursively reused without enough real-data anchoring.

## Role in this wiki

This page gives the narrow concept definition, while [[Synthetic_Data_and_Model_Collapse|Synthetic Data]] with the broader cluster link covers Qiao's full research topic. The distinction is useful: synthetic data as a tool can be beneficial, but recursive synthetic-data training is a particular process with its own risks. The wiki links both meanings so readers can move from a simple definition to the model-collapse research thread.

## Connection to Qiao's work

Qiao's ICML 2026 work studies synthetic data under selection bias, low-resource verification, and siloed access. The core concern is not merely that data are generated, but that generation is embedded inside a repeated training loop. When each generation learns from biased selections of earlier outputs, the synthetic distribution can drift away from the original, with low-resource communities especially exposed to tail-mode loss. The project connects synthetic data to [[Data_Selection|data selection]], [[Model_Collapse|model collapse]], and [[Collaborative_Evaluation|collaborative evaluation]].

## See also

- [[Synthetic_Data_and_Model_Collapse]]
- [[Recursive_Synthetic_Data_Training]]
- [[Sample_Selection_Bias]]
- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
