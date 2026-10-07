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
Qiao's research on **synthetic data** examines generated data, recursive training, and model collapse. Related questions include [[Recursive_Synthetic_Data_Training|recursive synthetic-data training]], [[Data_Selection|data selection]], [[Sample_Selection_Bias|sample selection bias]], [[Model_Collapse|model collapse]], [[Data_Silos|data silos]], and [[Wasserstein_Geometry|Wasserstein geometry]].

## Introduction

The topic treats synthetic data as both a resource and a risk. Generated samples can reduce data-access costs and support privacy-preserving workflows, but recursive use of selected synthetic data can also narrow the training distribution. Evidence for model collapse concerns indiscriminate recursive reuse rather than every use of synthetic data; retaining original data reduced degradation in the cited study.[^collapse] Low-resource verification, biased local selection, and collaborative evaluation shape this tradeoff.

## Research context

Recursive selection can amplify bias and erase modes from the training distribution. Low-resource communities are particularly exposed to tail loss when local verifiers mistake rare but valid samples for low-quality generations.

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

[^collapse]: Shumailov et al., ["AI models collapse when trained on recursively generated data"](https://www.nature.com/articles/s41586-024-07566-y), *Nature* 631, 755-759 (2024), is a primary reference for the recursive model-collapse framing and reports reduced degradation when part of the original data is preserved.
