---
type: Project overview
title: Projects
description: >-
  Research projects in AI and networks, machine unlearning, synthetic data, and
  reliable language models.
tags:
  - en
  - project
  - overview
  - project-overview
timestamp: '2026-06-13T20:46:02+08:00'
modified: '2026-10-07T07:07:23.928Z'
content_hash: 'sha256:fda4d8d5340b060e97ab1830e822325f8c58e4b446191dcfd155c7e4f703643e'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-01-05'
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2027-01-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Projects'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Projects.md
---
## Research projects

### AI and networks

[AI and Networks](./AI_and_Networks.md) is a current research focus. It includes AI for Networks, Networks for AI, data pruning for decentralized learning, communication-aware evaluation, reliability across data silos, and distributed computation of Wasserstein-based reference distributions.

### Distributed Wasserstein barycenters

[Distributed Wasserstein barycenter](./Distributed_Wasserstein_Barycenter.md) is part of this work on AI and networks. It asks how multiple parties can compute or approximate a shared distributional reference from local empirical measures, with applications to collaborative evaluation, sample scoring, and synthetic-data verification.

### Machine unlearning

[Machine Unlearning](./Machine_Unlearning.md) includes both approximate certified unlearning for differentiable models and exact or efficient unlearning for tree ensembles. Related work includes [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md), [Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness](./Soft_Weighted_Machine_Unlearning.md), and [DynFrs: An Efficient Framework for Machine Unlearning in Random Forest](./DynFrs.md).

### Collaborative evaluation

[Collaborative Evaluation](./Collaborative_Evaluation.md) studies verification without raw-data exchange. It is used in the ICML 2026 model-collapse work to replace a single low-resource, biased verifier with multi-party Wasserstein-geometry proxies.

### Synthetic data

[Synthetic Data](./Synthetic_Data_and_Model_Collapse.md) asks when generated data can safely replace or augment real data, and when recursive training amplifies bias or erodes diversity. The current emphasis is low-resource communities, where fragmented real-data coverage makes local filtering more likely to prune valid tail modes. A central paper is [When Sample Selection Bias Precipitates Model Collapse](./When_Sample_Selection_Bias_Precipitates_Model_Collapse.md).

### Trustworthy LLM systems

[LLM Reliability](./LLM_Reliability.md) examines whether language models use evidence appropriately when prompts suggest misleading patterns. The NeurIPS 2026 paper [Illusory Pattern Perception Drives Spurious Inference in Large Language Models](./Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models.md) studies how perceived prompt patterns can lead to unsupported inference.
