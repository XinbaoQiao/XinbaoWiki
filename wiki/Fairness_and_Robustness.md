---
type: Research concept
title: Fairness and Robustness
description: >-
  Concept page for fairness and robustness as data-centric correction
  objectives.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-05T20:55:21+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:01ec70a2530423cf6b84a82836edb8899ddb896b3b6bf1456e347539aafbb777'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
name: Fairness and Robustness
summary: >-
  Concept page for fairness and robustness as data-centric correction
  objectives.
occupation: Research concept
---
**Fairness and Robustness** are treated in this wiki as reliability objectives that can sometimes be improved by changing the training data or their weights. Fairness concerns systematic performance or treatment differences across groups, while robustness concerns stability under perturbations, corruptions, adversarial inputs, or distribution shift.

## Role in this wiki

The page exists because Qiao's unlearning work does not treat deletion as a purely legal or privacy operation. In [[Soft_Weighted_Machine_Unlearning|Beyond Binary Erasure]], the operation is generalized from binary erasure to continuous weighting, allowing a data subset to be partially removed, corrected, or emphasized. This makes fairness and robustness part of the data-operation layer rather than a separate post-processing step.

## Connection to Qiao's work

Qiao's AAAI 2026 paper frames soft-weighted unlearning as a way to solve non-binary correction problems. Instead of asking whether one point should disappear, the method asks how much influence different data should retain to improve fairness, robustness, and utility together. This connects to [[Data_Centric_Machine_Learning|Data Centric ML]] because the intervention is encoded in the data weights, and to [[Trustworthy_AI|Trustworthy AI]] because the purpose is to make the model's behavior more reliable under social or adversarial constraints.

## See also

- [[Soft_Weighted_Machine_Unlearning]]
- [[Machine_Unlearning]]
- [[Trustworthy_AI]]
- [[Influence_Functions]]
