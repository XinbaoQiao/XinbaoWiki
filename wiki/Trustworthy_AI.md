---
type: Research topic
title: Trustworthy AI
description: >-
  Research topic covering reliability, deletion, fairness, robustness,
  interpretability, and evaluation.
tags:
  - en
  - research
  - topic
  - research-topic
timestamp: '2026-05-05T20:55:21+08:00'
modified: '2026-10-07T06:42:08.636Z'
content_hash: 'sha256:1a24126519061279056efd864675f4e806c6c191063728a33d3b0fdf7cabec25'
reviewed_at: '2026-10-07T06:43:53.160Z'
review_due: '2027-04-05'
name: Trustworthy AI
summary: >-
  Research topic covering reliability, deletion, fairness, robustness,
  interpretability, and evaluation.
occupation: Research topic
---
**Trustworthy AI** concerns model behavior that can be audited, corrected, updated, or evaluated under realistic constraints.

## Research context

Trustworthy AI encompasses [[Machine_Unlearning|machine unlearning]], [[Fairness_and_Robustness|fairness and robustness]], [[Interpretability|interpretability]], [[LLM_Reliability|LLM reliability]], and [[Collaborative_Evaluation|collaborative evaluation]]. The unifying idea is that reliability is not only a property of a trained model. It also depends on the data process, who can inspect the data, how changes are requested, and how evidence is shared.

## Connection to Qiao's work

Qiao's work contributes to trustworthy AI through concrete mechanisms. Unlearning papers give methods for deleting or correcting data influence. Synthetic-data work studies how recursive training can fail and how distributed parties can detect the failure. The NeurIPS 2026 paper [[Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models|Illusory Pattern Perception Drives Spurious Inference in Large Language Models]] examines a different reliability risk: perceived prompt patterns can steer inference away from evidence. AI-and-networks projects study how reliability and efficiency change under communication constraints.

## See also

- [[Machine_Unlearning]]
- [[Synthetic_Data_and_Model_Collapse|Synthetic Data]]
- [[AI_and_Networks]]
- [[Fairness_and_Robustness]]
- [[Interpretability]]
