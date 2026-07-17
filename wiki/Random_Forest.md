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
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:6ef03a3d58778c15b3243793362e42f687b2f20f9c364d1ce25f158e6de0a6b7'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
name: Random Forest
summary: Concept page for random forests as the model class studied in DynFrs.
occupation: Model family
---
**Random Forest** refers to an ensemble of decision trees trained with randomization over samples, features, or split choices. The method is widely used because it is strong on tabular data, relatively robust, and easier to inspect than many neural models.[^breiman]

## Role in this wiki

This page supplies model background for [[DynFrs|DynFrs: An Efficient Framework for Machine Unlearning in Random Forest]]. Random forests matter for unlearning because their structure is discrete: removing one training point can affect paths, leaf statistics, and possibly split decisions across many trees. A naive retraining baseline is clear but expensive. A useful unlearning framework must preserve the distribution of the forest while reducing unnecessary recomputation.

## Connection to Qiao's work

DynFrs studies machine unlearning for random forests in dynamic environments. The paper's core design uses lazy tags and update logic to avoid rebuilding everything after each deletion or modification request. In Qiao's broader wiki, the random-forest page connects practical model maintenance to [[Machine_Unlearning|machine unlearning]] and [[AI_and_Networks|AI and networks]]: the central question is how to maintain a deployed model when data change continuously and latency matters.

## See also

- [[DynFrs]]
- [[Machine_Unlearning]]
- [[Certified_Data_Removal]]
- [[Data_Centric_Machine_Learning|Data Centric ML]]

[^breiman]: Leo Breiman's 2001 paper "Random Forests" in Machine Learning 45(1), 5-32, is the standard reference for the model family.
