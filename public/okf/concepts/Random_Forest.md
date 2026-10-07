---
type: Model family
title: Random Forest
description: Randomized tree ensembles and their efficient maintenance in DynFrs.
tags:
  - en
  - research
  - model
  - model-family
timestamp: '2026-05-05T19:52:29+08:00'
modified: '2026-10-07T07:07:23.935Z'
content_hash: 'sha256:1fc3a6369d686420f43c19ba558107ebad315ba5f9dad0282251eea21b7fb399'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
language: en
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
  document_id: 'wiki:Random_Forest'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Random_Forest.md
---
**Random Forest** refers to an ensemble of decision trees trained with randomization over samples, features, or split choices. The method is widely used because it is strong on tabular data, relatively robust, and easier to inspect than many neural models.[^breiman]

## Research context

Random forests matter for unlearning because their structure is discrete: removing one training point can affect paths, leaf statistics, and possibly split decisions across many trees. A naive retraining baseline is clear but expensive. A useful unlearning framework must preserve the distribution of the forest while reducing unnecessary recomputation.

## Connection to Qiao's work

DynFrs studies machine unlearning for random forests in dynamic environments. The paper's core design uses lazy tags and update logic to avoid rebuilding everything after each deletion or modification request. This work connects model maintenance to [machine unlearning](./Machine_Unlearning.md) and [AI and networks](./AI_and_Networks.md): how can a deployed model be updated with low latency as its data change?

## See also

- [DynFrs](./DynFrs.md)
- [Machine Unlearning](./Machine_Unlearning.md)
- [Certified Data Removal](./Certified_Data_Removal.md)
- [Data Centric ML](./Data_Centric_Machine_Learning.md)

[^breiman]: Leo Breiman's 2001 paper "Random Forests" in Machine Learning 45(1), 5-32, is the standard reference for the model family.
