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
language: en
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
source_path: wiki/Trustworthy_AI.md
---
**Trustworthy AI** is the broadest reliability label in Qiao's wiki. It covers model behavior that can be audited, corrected, updated, or evaluated under realistic constraints. The page is deliberately broad, but the biography keeps the main research labels shorter: [AI and networks](./AI_and_Networks.md), [machine unlearning](./Machine_Unlearning.md), [synthetic data](./Synthetic_Data_and_Model_Collapse.md), and [Data Centric ML](./Data_Centric_Machine_Learning.md).

## Role in this wiki

This page functions as a parent concept rather than a single project. It gathers [machine unlearning](./Machine_Unlearning.md), [fairness and robustness](./Fairness_and_Robustness.md), [interpretability](./Interpretability.md), [LLM reliability](./LLM_Reliability.md), and [collaborative evaluation](./Collaborative_Evaluation.md). The unifying idea is that reliability is not only a property of a trained model. It also depends on the data process, who can inspect the data, how changes are requested, and how evidence is shared.

## Connection to Qiao's work

Qiao's work contributes to trustworthy AI through concrete mechanisms. Unlearning papers give methods for deleting or correcting data influence. Synthetic-data work studies how recursive training can fail and how distributed parties can detect the failure. AI-and-networks projects study how reliability and efficiency change under communication constraints. This page is therefore a map of the trustworthiness motivations behind the more specific research pages.

## See also

- [Machine Unlearning](./Machine_Unlearning.md)
- [Synthetic Data](./Synthetic_Data_and_Model_Collapse.md)
- [AI and Networks](./AI_and_Networks.md)
- [Fairness and Robustness](./Fairness_and_Robustness.md)
- [Interpretability](./Interpretability.md)
