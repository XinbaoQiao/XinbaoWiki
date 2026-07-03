---
type: Model family
title: Random Forest
description: Concept page for random forests as the model class studied in DynFrs.
tags:
  - en
  - research
  - model
  - model-family
timestamp: '2026-05-05T19:52:29+08:00'
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
source_path: wiki/Random_Forest.md
---
**Random Forest** refers to an ensemble of decision trees trained with randomization over samples, features, or split choices. The method is widely used because it is strong on tabular data, relatively robust, and easier to inspect than many neural models.[^breiman]

## Role in this wiki

This page supplies model background for [DynFrs: An Efficient Framework for Machine Unlearning in Random Forest](./DynFrs.md). Random forests matter for unlearning because their structure is discrete: removing one training point can affect paths, leaf statistics, and possibly split decisions across many trees. A naive retraining baseline is clear but expensive. A useful unlearning framework must preserve the distribution of the forest while reducing unnecessary recomputation.

## Connection to Qiao's work

DynFrs studies machine unlearning for random forests in dynamic environments. The paper's core design uses lazy tags and update logic to avoid rebuilding everything after each deletion or modification request. In Qiao's broader wiki, the random-forest page connects practical model maintenance to [machine unlearning](./Machine_Unlearning.md) and [AI and networks](./AI_and_Networks.md): the central question is how to maintain a deployed model when data change continuously and latency matters.

## See also

- [DynFrs](./DynFrs.md)
- [Machine Unlearning](./Machine_Unlearning.md)
- [Certified Data Removal](./Certified_Data_Removal.md)
- [Data Centric ML](./Data_Centric_Machine_Learning.md)

[^breiman]: Leo Breiman's 2001 paper "Random Forests" in Machine Learning 45(1), 5-32, is the standard reference for the model family.
