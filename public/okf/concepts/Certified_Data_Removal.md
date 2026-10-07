---
type: Research concept
title: Certified Data Removal
description: Deletion guarantees in machine unlearning.
tags:
  - en
  - research
  - concept
  - research-concept
  - machine-unlearning
timestamp: '2026-05-05T19:52:29+08:00'
modified: '2026-10-07T07:07:23.807Z'
content_hash: 'sha256:0d82a6e82c5fe2bd97b3e47abac339d956fd7295e8cfaab308cef27d6e7119a6'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
language: en
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2027-04-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Certified_Data_Removal'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Certified_Data_Removal.md
---
**Certified Data Removal** refers to machine-learning methods that provide an explicit guarantee about the effect of removing data from a trained model. In [machine unlearning](./Machine_Unlearning.md), certification bounds how close the updated model is to a model retrained without the deleted data.[^certified]

## Research context

"Certified" does not mean that a model becomes globally safe or fair. It means the method states a measurable deletion criterion, often by comparing parameters, losses, predictions, or distributions before and after removal.

## Connection to Qiao's work

Qiao's Hessian-free paper is organized around certified deletion under online update constraints. The paper avoids explicit Hessian inversion, which matters because exact second-order operations can be expensive or unstable in deployed systems. Certified data removal also raises a systems question within [AI and networks](./AI_and_Networks.md): how can deletion guarantees be provided at an acceptable computational cost and latency?

## See also

- [Machine Unlearning](./Machine_Unlearning.md)
- [Hessian Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md)
- [Influence Functions](./Influence_Functions.md)
- [Trustworthy AI](./Trustworthy_AI.md)

[^certified]: Guo et al., "Certified Data Removal from Machine Learning Models", ICML 2020, is one reference point for treating deletion as a certified approximation to retraining.
