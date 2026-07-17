---
type: Research overview
title: Research
description: Overview of Xinbao Qiao's research directions and linked topic pages.
tags:
  - en
  - research
  - overview
  - research-overview
timestamp: '2026-06-13T20:46:02+08:00'
modified: '2026-07-11T07:28:06+08:00'
content_hash: 'sha256:09e30b38e992c7f3c7c8b32a5bba43801fe9854088306229588b105b24990848'
reviewed_at: '2026-07-11T07:28:06+08:00'
review_due: '2026-10-08'
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-07-11T07:28:06+08:00'
  reviewDue: '2026-10-08'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Research'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Research.md
---
This page summarizes the main research directions in Qiao Xinbao's academic wiki. It functions as a compiled map of linked topic pages rather than a static list of interests. The current center of gravity is [data-centric ML](./Data_Centric_Machine_Learning.md) and the two-way [AI-and-networks](./AI_and_Networks.md) problem.

## Research thesis

Qiao's work primarily studies lifecycle management of data in AI models, focusing on theoretical methods and practical problems that arise as data are generated, used, and deleted. The related work aims to improve the reliability, interpretability, and controllability of AI models in heterogeneous, computation-constrained, and communication-constrained environments.

1. In data generation, it studies synthetic data and its effects on quality, privacy, and generalization.
2. In data use, it focuses on data modeling, collaborative optimization, and system design in distributed/federated learning, AI for Networks, and Networks for AI.
3. In data deletion, it studies machine unlearning and data influence evaluation, exploring how to preserve model performance while protecting privacy and satisfying deletion requests.

## AI and networks

[AI and Networks](./AI_and_Networks.md) covers the intersection of AI with networking and communication systems: AI for Networks, Networks for AI, decentralized learning, data pruning, and collaborative evaluation. In the current CUHK doctoral stage, this line is paired with [data-centric ML](./Data_Centric_Machine_Learning.md) and includes distributed tools such as [Wasserstein barycenters](./Distributed_Wasserstein_Barycenter.md), where multiple local distributions can be combined into a shared distributional reference without treating raw-data pooling as the default assumption.

## Machine unlearning

[Machine Unlearning](./Machine_Unlearning.md) studies certified data removal and low-cost update mechanisms after deletion requests. Related pages include [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md), [Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness](./Soft_Weighted_Machine_Unlearning.md), [DynFrs: An Efficient Framework for Machine Unlearning in Random Forest](./DynFrs.md), [Influence Functions](./Influence_Functions.md), and [Certified Data Removal](./Certified_Data_Removal.md).

## Synthetic data

[Synthetic Data](./Synthetic_Data_and_Model_Collapse.md) studies recursive synthetic-data training, [Data Selection](./Data_Selection.md), [Sample Selection Bias](./Sample_Selection_Bias.md), [Model Collapse](./Model_Collapse.md), and collaborative mitigation in low-resource [data silos](./Data_Silos.md). The central paper is [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md), which frames model collapse as especially risky when real-data coverage is scarce or fragmented.

## Data centric ML and trustworthy AI

[Data Centric ML](./Data_Centric_Machine_Learning.md) covers data selection, valuation, filtering, and evaluation. [Trustworthy AI](./Trustworthy_AI.md) connects unlearning, fairness, robustness, privacy, security, interpretability, and reliability.

## Geometry and distributed learning

[Wasserstein Geometry](./Wasserstein_Geometry.md), [Distributed Wasserstein Barycenter](./Distributed_Wasserstein_Barycenter.md), and [Distributed Learning](./Distributed_Learning.md) provide tools for collaborative evaluation, optimal-transport proxies, decentralized data access, and distributional references for networked AI systems.
