---
type: Project overview
title: Projects
description: Research projects and project clusters.
tags:
  - en
  - project
  - overview
  - project-overview
timestamp: '2026-06-13T20:46:02+08:00'
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
source_path: wiki/Projects.md
---
## Research project clusters

### AI and networks

[AI and Networks](./AI_and_Networks.md) is the current primary project cluster. It includes AI for Networks, Networks for AI, data pruning for decentralized learning, communication-aware evaluation, cross-silo reliability, and distributed computation for Wasserstein-style distributional references.

### Distributed Wasserstein barycenters

[Distributed Wasserstein barycenter](./Distributed_Wasserstein_Barycenter.md) is a technical project within the AI-and-networks cluster. It asks how multiple parties can compute or approximate a shared distributional reference from local empirical measures, with applications to collaborative evaluation, sample scoring, and synthetic-data verification.

### Machine unlearning

[Machine Unlearning](./Machine_Unlearning.md) includes both approximate certified unlearning for differentiable models and exact or efficient unlearning for tree ensembles. Project pages include [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md), [Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness](./Soft_Weighted_Machine_Unlearning.md), and [DynFrs: An Efficient Framework for Machine Unlearning in Random Forest](./DynFrs.md).

### Collaborative evaluation

[Collaborative Evaluation](./Collaborative_Evaluation.md) studies verification without raw-data exchange. It is used in the ICML 2026 model-collapse work to replace a single low-resource, biased verifier with multi-party Wasserstein-geometry proxies.

### Synthetic data

[Synthetic Data](./Synthetic_Data_and_Model_Collapse.md) asks when generated data can safely replace or augment real data, and when recursive training amplifies bias or erodes diversity. The current emphasis is low-resource communities, where fragmented real-data coverage makes local filtering more likely to prune valid tail modes. The main paper page is [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md).
