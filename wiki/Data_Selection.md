---
type: Research concept
title: Data Selection
description: Selection of training or evaluation data under reliability constraints.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.831Z'
content_hash: 'sha256:5f6c2676592f1d2db8f81830e111c54f8b0d6ec3d0ff75b0d3335de981a2aac4'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: Data Selection
summary: Selection of training or evaluation data under reliability constraints.
occupation: Research concept
---
**Data Selection** is the process of choosing which examples are used for training, pruning, evaluation, or synthetic-data reuse. Selection can reduce cost and improve quality, but biased selection can also distort a model's view of the target distribution.

## Research context

Data selection is a shared problem in [[Data_Centric_Machine_Learning|Data Centric ML]], [[AI_and_Networks|AI and networks]], and [[Synthetic_Data_and_Model_Collapse|Synthetic Data]]. In decentralized or siloed settings, selection is often local: each participant sees only part of the data and chooses examples according to local goals or constraints. That makes selection a networked problem rather than a purely statistical preprocessing step.

## Connection to Qiao's work

Data selection appears in [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]], where biased local selection can worsen recursive synthetic-data training and make low-resource communities more vulnerable to tail-mode loss. In the unlearning papers, selection reappears as removal or reweighting: the model is changed by changing which data count.

## See also

- [[Sample_Selection_Bias]]
- [[Data_Centric_Machine_Learning|Data Centric ML]]
- [[Distributed_Learning]]
- [[Synthetic_Data]]
