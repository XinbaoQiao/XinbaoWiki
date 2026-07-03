---
type: Research concept
title: Data Silos
description: >-
  Concept page for learning and evaluation when data are distributed across
  separate holders.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-27T17:56:27+08:00'
name: Data Silos
summary: >-
  Concept page for learning and evaluation when data are distributed across
  separate holders.
occupation: Research concept
---
**Data Silos** are organizational, legal, technical, or geographic separations that prevent all training data from being pooled in one place. In this wiki the term is used for institutions, devices, or clients that each hold only a partial view of the target distribution.

## Role in this wiki

Data silos are a key reason why [[AI_and_Networks|AI and networks]] differs from ordinary centralized machine learning. When each party only sees local data, model training and evaluation must work under communication, privacy, and representation constraints. A silo can be useful because it protects data ownership, but it also makes global diagnosis harder. Bias may be invisible locally and obvious only when evidence is compared across parties. This is especially consequential for low-resource holders whose local data may underrepresent tail regions from the start.

## Connection to Qiao's work

Data silos are central to [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]], where recursive synthetic-data training is studied under low-resource local sample-selection bias. In this setting, the research question is not just model accuracy, but how distributed parties can coordinate without assuming complete data access.

## See also

- [[AI_and_Networks]]
- [[Distributed_Learning]]
- [[Collaborative_Evaluation]]
- [[Sample_Selection_Bias]]
