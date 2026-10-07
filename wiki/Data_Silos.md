---
type: Research concept
title: Data Silos
description: Learning and evaluation across institutions with limited data sharing.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.844Z'
content_hash: 'sha256:c278c75bcb5e1728747d675ea93232ef5160f79c8f55f67800b939aad76de498'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: Data Silos
summary: Learning and evaluation across institutions with limited data sharing.
occupation: Research concept
---
**Data Silos** are organizational, legal, technical, or geographic separations that prevent all training data from being pooled in one place. Individual institutions, devices, or clients each hold only a partial view of the target distribution.

## Research context

Data silos are a key reason why [[AI_and_Networks|AI and networks]] differs from ordinary centralized machine learning. When each party only sees local data, model training and evaluation must work under communication, privacy, and representation constraints. A silo can be useful because it protects data ownership, but it also makes global diagnosis harder. Bias may be invisible locally and obvious only when evidence is compared across parties. This is especially consequential for low-resource holders whose local data may underrepresent tail regions from the start.

## Connection to Qiao's work

Data silos are central to [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]], where recursive synthetic-data training is studied under low-resource local sample-selection bias. In this setting, the research question is not just model accuracy, but how distributed parties can coordinate without assuming complete data access.

## See also

- [[AI_and_Networks]]
- [[Distributed_Learning]]
- [[Collaborative_Evaluation]]
- [[Sample_Selection_Bias]]
