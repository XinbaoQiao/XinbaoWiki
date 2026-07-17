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
modified: '2026-07-03T00:03:48+08:00'
content_hash: 'sha256:e71393c9d3848004a058ac5c4889a5de233c1a26b86793c00ee99193924a49dc'
reviewed_at: '2026-07-03T00:03:48+08:00'
review_due: '2026-12-29'
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
  reviewedAt: '2026-07-03T00:03:48+08:00'
  reviewDue: '2026-12-29'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Synthetic_Data_and_Model_Collapse'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Synthetic_Data_and_Model_Collapse.md
---
**Synthetic Data** is the short research-topic label for Qiao's work on generated data, recursive training, and model collapse. The full cluster remains broader than the label: it includes [recursive synthetic-data training](./Recursive_Synthetic_Data_Training.md), [data selection](./Data_Selection.md), [sample selection bias](./Sample_Selection_Bias.md), [model collapse](./Model_Collapse.md), [data silos](./Data_Silos.md), and [Wasserstein geometry](./Wasserstein_Geometry.md).[^collapse]

## Introduction

The topic treats synthetic data as both a resource and a risk. Generated samples can reduce data-access costs and support privacy-preserving workflows, but recursive use of selected synthetic data can also narrow the training distribution. This page records that tension in the specific setting of low-resource verification, biased local selection, and collaborative evaluation.

## Role in this wiki

This page keeps the biography readable by giving the long technical background its own location. On the main page, "Synthetic Data" is enough to signal the topic. Here, the topic is unpacked as a research problem: generated samples can improve coverage or reduce access costs, but recursive use of generated data can amplify bias, erase modes, or distort the target distribution. The newer emphasis is that low-resource communities are not only short on data; they are also more exposed to tail loss when local verifiers mistake rare but valid samples for low-quality generations.

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

[^collapse]: Shumailov et al., "AI models collapse when trained on recursively generated data", Nature 631, 755-759 (2024), is a widely cited reference for the recursive model-collapse framing.
