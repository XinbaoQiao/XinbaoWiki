---
type: Research topic
title: Machine Unlearning
description: Research topic on removing or correcting data influence from trained models.
tags:
  - en
  - research
  - topic
  - research-topic
  - machine-unlearning
timestamp: '2026-05-05T22:09:30+08:00'
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
source_path: wiki/Machine_Unlearning.md
---
**Machine Unlearning** studies how to remove, reduce, or correct the effect of selected training data after a model has already been trained. In this wiki it is treated as both a privacy topic and a data-centric systems topic: an unlearning method must say what it removes, how faithfully it approximates retraining, and how much computation or latency is saved.[^unlearning]

## Introduction

The topic covers post-training data operations: certified deletion, exact removal in tree ensembles, and continuous reweighting for fairness or robustness correction. The shared question is whether a trained system can be revised after deployment without simply retraining from scratch each time the data record changes.

## Role in this wiki

This page organizes Qiao's publication line on post-training data operations. The line includes certified deletion, weighted correction, and tree-ensemble updates. It is closely connected to [Data Centric ML](./Data_Centric_Machine_Learning.md) because the central object is not a new model architecture, but a data operation that changes model behavior. It also connects to [Trustworthy AI](./Trustworthy_AI.md), since deletion requests, fairness corrections, and robustness interventions are forms of governance over a trained system.

## Publications

| Paper | Venue/status |
| --- | --- |
| [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md) | ICLR 2025, 24-28 April 2025, Singapore. |
| [DynFrs: An Efficient Framework for Machine Unlearning in Random Forest](./DynFrs.md) | ICLR 2025, 24-28 April 2025, Singapore. |
| [Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness](./Soft_Weighted_Machine_Unlearning.md) | AAAI 2026, 20-27 January 2026, Singapore. |

## Connection to Qiao's work

Qiao's unlearning papers cover complementary settings. [Hessian-Free Online Certified Unlearning](./Hessian_Free_Online_Certified_Unlearning.md) targets certified updates for convex objectives without explicit Hessian inversion. [Beyond Binary Erasure](./Soft_Weighted_Machine_Unlearning.md) generalizes deletion from binary remove-or-keep actions to continuous weights for fairness and robustness. [DynFrs: An Efficient Framework for Machine Unlearning in Random Forest](./DynFrs.md) studies exact and efficient update mechanisms for random forests. Together they define an arc from mathematical certification to practical low-latency model maintenance.

## See also

- [Certified Data Removal](./Certified_Data_Removal.md)
- [Influence Functions](./Influence_Functions.md)
- [Fairness and Robustness](./Fairness_and_Robustness.md)
- [Random Forest](./Random_Forest.md)
- [Publications](./Publications.md)

[^unlearning]: A widely cited formulation is Bourtoule et al., "Machine Unlearning", IEEE Symposium on Security and Privacy 2021, which introduced SISA-style sharded, isolated, sliced, and aggregated training as a practical route to deletion.
