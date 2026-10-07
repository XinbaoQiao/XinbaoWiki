---
type: Research topic
title: Synthetic Data
description: >-
  Research topic on synthetic data, recursive training, low-resource
  verification, selection bias, and model collapse.
tags:
  - en
  - research
  - topic
  - research-topic
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.970Z'
content_hash: 'sha256:3ec58145d656d9cc7adf4493e8b851749546d1805d8e30fca3822fe5c2c0877f'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
language: en
aliases:
  - Synthetic Data and Model Collapse
relations:
  - type: depends-on
    target: Synthetic_Data
    label: concept foundation
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2027-04-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Synthetic_Data_and_Model_Collapse'
  chunking: markdown-heading-v1
source_ids:
  - src-3e9d5d7dceceebc1
source_path: wiki/Synthetic_Data_and_Model_Collapse.md
---
Qiao's research on **synthetic data** examines generated data, recursive training, and model collapse. Related questions include [recursive synthetic-data training](./Recursive_Synthetic_Data_Training.md), [data selection](./Data_Selection.md), [sample selection bias](./Sample_Selection_Bias.md), [model collapse](./Model_Collapse.md), [data silos](./Data_Silos.md), and [Wasserstein geometry](./Wasserstein_Geometry.md).

## Introduction

The topic treats synthetic data as both a resource and a risk. Generated samples can reduce data-access costs and support privacy-preserving workflows, but recursive use of selected synthetic data can also narrow the training distribution. Evidence for model collapse concerns indiscriminate recursive reuse rather than every use of synthetic data; retaining original data reduced degradation in the cited study.[^collapse] Low-resource verification, biased local selection, and collaborative evaluation shape this tradeoff.

## Research context

Recursive selection can amplify bias and erase modes from the training distribution. Low-resource communities are particularly exposed to tail loss when local verifiers mistake rare but valid samples for low-quality generations.

## Publications

| Paper | Venue/status |
| --- | --- |
| [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md) | ICML 2026, 6-11 July 2026, Seoul. |

## Connection to Qiao's work

[When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md) studies how local selection bias can trigger collapse in low-resource, siloed recursive training, then uses collaborative Wasserstein-style signals to diagnose the problem. This connects synthetic-data reliability to [AI and networks](./AI_and_Networks.md) because the key difficulty is not only generation quality, but also distributed access to evidence about the data distribution.

## See also

- [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md)
- [Synthetic Data](./Synthetic_Data.md)
- [Model Collapse](./Model_Collapse.md)
- [Data Silos](./Data_Silos.md)
- [Collaborative Evaluation](./Collaborative_Evaluation.md)

[^collapse]: Shumailov et al., ["AI models collapse when trained on recursively generated data"](https://www.nature.com/articles/s41586-024-07566-y), *Nature* 631, 755-759 (2024), is a primary reference for the recursive model-collapse framing and reports reduced degradation when part of the original data is preserved.
