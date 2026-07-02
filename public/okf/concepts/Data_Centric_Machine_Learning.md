---
type: Research topic
title: Data Centric ML
description: >-
  Research topic focused on data quality, selection, valuation, correction, and
  governance.
tags:
  - en
  - research
  - topic
  - research-topic
timestamp: '2026-05-27T17:56:27+08:00'
language: en
aliases:
  - Data-Centric Machine Learning
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
source_path: wiki/Data_Centric_Machine_Learning.md
---
**Data Centric ML** is the short label used in this wiki for data-centric machine learning. It refers to research where changes to data, rather than only changes to model architecture, are treated as first-order interventions. The relevant operations include selection, pruning, weighting, deletion, synthesis, and cross-party evaluation.

## Introduction

The page groups projects where the main intervention is a data operation. Some operations happen after training, such as deletion and reweighting; others happen before or during training, such as pruning, synthetic-data filtering, and cross-silo evaluation. The topic acts as a bridge between Qiao's machine-unlearning work and the newer AI-and-networks line.

## Role in this wiki

This page is the conceptual bridge between Qiao's older machine-unlearning work and his current [AI and networks](./AI_and_Networks.md) direction. It explains why pages on [data selection](./Data_Selection.md), [sample selection bias](./Sample_Selection_Bias.md), [synthetic data](./Synthetic_Data.md), [machine unlearning](./Machine_Unlearning.md), and [collaborative evaluation](./Collaborative_Evaluation.md) belong to the same wiki. Each page asks how a model changes when the data process changes.

## Publications

| Paper | Venue/status |
| --- | --- |
| [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md) | ICLR 2025, 24-28 April 2025, Singapore. |
| [DynFrs: An Efficient Framework for Machine Unlearning in Random Forest](./DynFrs.md) | ICLR 2025, 24-28 April 2025, Singapore. |
| [Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness](./Soft_Weighted_Machine_Unlearning.md) | AAAI 2026, 20-27 January 2026, Singapore. |
| [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md) | ICML 2026, 6-11 July 2026, Seoul. |

## Connection to Qiao's work

In Qiao's publication record, data-centric ML appears in several forms. In unlearning, the data operation is removal or reweighting after training. In model-collapse work, the operation is selection of real or synthetic examples before recursive training, with low-resource verification exposing how local filters can mistake rare valid modes for low-quality samples. The common question is whether a learning system can identify which data matter, which data harm reliability, and which data can be safely ignored under realistic cost constraints.

## See also

- [Data Selection](./Data_Selection.md)
- [Sample Selection Bias](./Sample_Selection_Bias.md)
- [Synthetic Data](./Synthetic_Data_and_Model_Collapse.md)
- [Machine Unlearning](./Machine_Unlearning.md)
- [AI and Networks](./AI_and_Networks.md)
