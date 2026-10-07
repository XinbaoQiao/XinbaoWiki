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
name: Random Forest
summary: Randomized tree ensembles and their efficient maintenance in DynFrs.
occupation: Model family
---
**Random Forest** refers to an ensemble of decision trees trained with randomization over samples, features, or split choices. The method is widely used because it is strong on tabular data, relatively robust, and easier to inspect than many neural models.[^breiman]

## Research context

Random forests matter for unlearning because their structure is discrete: removing one training point can affect paths, leaf statistics, and possibly split decisions across many trees. A naive retraining baseline is clear but expensive. A useful unlearning framework must preserve the distribution of the forest while reducing unnecessary recomputation.

## Connection to Qiao's work

DynFrs studies machine unlearning for random forests in dynamic environments. The paper's core design uses lazy tags and update logic to avoid rebuilding everything after each deletion or modification request. This work connects model maintenance to [[Machine_Unlearning|machine unlearning]] and [[AI_and_Networks|AI and networks]]: how can a deployed model be updated with low latency as its data change?

## See also

- [[DynFrs]]
- [[Machine_Unlearning]]
- [[Certified_Data_Removal]]
- [[Data_Centric_Machine_Learning|Data Centric ML]]

[^breiman]: Leo Breiman's 2001 paper "Random Forests" in Machine Learning 45(1), 5-32, is the standard reference for the model family.
