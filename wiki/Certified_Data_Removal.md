---
type: Research concept
title: Certified Data Removal
description: Concept page for deletion guarantees in machine unlearning.
tags:
  - en
  - research
  - concept
  - research-concept
  - machine-unlearning
timestamp: '2026-05-05T19:52:29+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:aa1f00effe5b056f30d3d7f991135fb9e7d563e4eec1d66b6a7413b3875c3c06'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
name: Certified Data Removal
summary: Concept page for deletion guarantees in machine unlearning.
occupation: Research concept
---
**Certified Data Removal** refers to machine-learning methods that provide an explicit guarantee about the effect of removing data from a trained model. In this wiki the concept is used mainly to explain the mathematical side of [[Machine_Unlearning|machine unlearning]], where the goal is not only to update a model quickly, but to bound how close the updated model is to a model retrained without the deleted data.[^certified]

## Role in this wiki

This page is a background article for readers who arrive at [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]] without the unlearning vocabulary. "Certified" does not mean that a model becomes globally safe or fair. It means the method states a measurable deletion criterion, often by comparing parameters, losses, predictions, or distributions before and after removal. That distinction keeps the claim narrower and more testable.

## Connection to Qiao's work

Qiao's Hessian-free paper is organized around certified deletion under online update constraints. The paper avoids explicit Hessian inversion, which matters because exact second-order operations can be expensive or unstable in deployed systems. Certified data removal therefore connects Qiao's mathematical unlearning work to his broader [[AI_and_Networks|AI and networks]] interest: deletion guarantees are valuable only when they can be delivered at realistic computational and latency cost.

## See also

- [[Machine_Unlearning]]
- [[Hessian_Free_Online_Certified_Unlearning]]
- [[Influence_Functions]]
- [[Trustworthy_AI]]

[^certified]: Guo et al., "Certified Data Removal from Machine Learning Models", ICML 2020, is one reference point for treating deletion as a certified approximation to retraining.
