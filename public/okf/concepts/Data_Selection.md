---
type: Research concept
title: Data Selection
description: >-
  Concept page for choosing training or evaluation data under reliability
  constraints.
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
source_path: wiki/Data_Selection.md
---
**Data Selection** is the process of choosing which examples are used for training, pruning, evaluation, or synthetic-data reuse. In this wiki it is treated as a central data-centric operation: selection can reduce cost and improve quality, but biased selection can also distort a model's view of the target distribution.

## Role in this wiki

The page links [Data Centric ML](./Data_Centric_Machine_Learning.md) to both [AI and networks](./AI_and_Networks.md) and [Synthetic Data](./Synthetic_Data_and_Model_Collapse.md). In decentralized or siloed settings, selection is often local: each participant sees only part of the data and chooses examples according to local goals or constraints. That makes selection a networked problem rather than a purely statistical preprocessing step.

## Connection to Qiao's work

Data selection appears in [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md), where biased local selection can worsen recursive synthetic-data training and make low-resource communities more vulnerable to tail-mode loss. In the unlearning papers, selection reappears as removal or reweighting: the model is changed by changing which data count.

## See also

- [Sample Selection Bias](./Sample_Selection_Bias.md)
- [Data Centric ML](./Data_Centric_Machine_Learning.md)
- [Distributed Learning](./Distributed_Learning.md)
- [Synthetic Data](./Synthetic_Data.md)
