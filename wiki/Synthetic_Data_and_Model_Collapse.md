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
name: Synthetic Data
summary: >-
  Research topic on synthetic data, recursive training, low-resource
  verification, selection bias, and model collapse.
aliases:
  - Synthetic Data and Model Collapse
occupation: Research topic
image: /topics/synthetic-data.png
image_caption: Synthetic data topic diagram
relations:
  - type: depends-on
    target: Synthetic_Data
    label: concept foundation
---
**Synthetic Data** is the short research-topic label for Qiao's work on generated data, recursive training, and model collapse. The full cluster remains broader than the label: it includes [[Recursive_Synthetic_Data_Training|recursive synthetic-data training]], [[Data_Selection|data selection]], [[Sample_Selection_Bias|sample selection bias]], [[Model_Collapse|model collapse]], [[Data_Silos|data silos]], and [[Wasserstein_Geometry|Wasserstein geometry]].[^collapse]

## Introduction

The topic treats synthetic data as both a resource and a risk. Generated samples can reduce data-access costs and support privacy-preserving workflows, but recursive use of selected synthetic data can also narrow the training distribution. This page records that tension in the specific setting of low-resource verification, biased local selection, and collaborative evaluation.

## Role in this wiki

This page keeps the biography readable by giving the long technical background its own location. On the main page, "Synthetic Data" is enough to signal the topic. Here, the topic is unpacked as a research problem: generated samples can improve coverage or reduce access costs, but recursive use of generated data can amplify bias, erase modes, or distort the target distribution. The newer emphasis is that low-resource communities are not only short on data; they are also more exposed to tail loss when local verifiers mistake rare but valid samples for low-quality generations.

## Publications

| Paper | Venue/status |
| --- | --- |
| [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] | ICML 2026, 6-11 July 2026, Seoul. |

## Connection to Qiao's work

[[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] studies how local selection bias can trigger collapse in low-resource, siloed recursive training, then uses collaborative Wasserstein-style signals to diagnose the problem. This connects synthetic-data reliability to [[AI_and_Networks|AI and networks]] because the key difficulty is not only generation quality, but also distributed access to evidence about the data distribution.

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Synthetic_Data]]
- [[Model_Collapse]]
- [[Data_Silos]]
- [[Collaborative_Evaluation]]

[^collapse]: Shumailov et al., "AI models collapse when trained on recursively generated data", Nature 631, 755-759 (2024), is a widely cited reference for the recursive model-collapse framing.
