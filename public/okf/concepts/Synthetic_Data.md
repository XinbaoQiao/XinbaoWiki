---
type: Research concept
title: Synthetic Data
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
language: en
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
source_path: wiki/Synthetic_Data.md
---
**Synthetic Data** refers to generated examples that are used in place of, alongside, or as a proxy for real data. In machine learning, synthetic data can expand coverage, reduce annotation cost, protect privacy, or enable evaluation when real data are scarce. It can also introduce failure modes when generated samples are recursively reused without enough real-data anchoring.

## Role in this wiki

This page gives the narrow concept definition, while [Synthetic Data](./Synthetic_Data_and_Model_Collapse.md) with the broader cluster link covers Qiao's full research topic. The distinction is useful: synthetic data as a tool can be beneficial, but recursive synthetic-data training is a particular process with its own risks. The wiki links both meanings so readers can move from a simple definition to the model-collapse research thread.

## Connection to Qiao's work

Qiao's ICML 2026 work studies synthetic data under selection bias, low-resource verification, and siloed access. The core concern is not merely that data are generated, but that generation is embedded inside a repeated training loop. When each generation learns from biased selections of earlier outputs, the synthetic distribution can drift away from the original, with low-resource communities especially exposed to tail-mode loss. The project connects synthetic data to [data selection](./Data_Selection.md), [model collapse](./Model_Collapse.md), and [collaborative evaluation](./Collaborative_Evaluation.md).

## See also

- [Synthetic Data and Model Collapse](./Synthetic_Data_and_Model_Collapse.md)
- [Recursive Synthetic Data Training](./Recursive_Synthetic_Data_Training.md)
- [Sample Selection Bias](./Sample_Selection_Bias.md)
- [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md)
