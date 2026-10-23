---
type: publication
title: Illusory Pattern Perception Drives Spurious Inference in Large Language Models
description: >-
  NeurIPS 2026 paper comparing LLM and human illusory pattern perception across
  three psychological tasks, with sparse autoencoder feature analysis.
tags:
  - en
  - publication
  - paper
  - accepted
  - neurips-2026
  - llm-reliability
timestamp: '2026-09-25T13:49:35+09:00'
modified: '2026-10-23T18:05:19.101Z'
content_hash: 'sha256:02743affe3205f227d48cd9c4cd5f08102c8ccc5753a199775dacc9faadb7cd4'
reviewed_at: '2026-10-23T18:05:33.029Z'
review_due: '2027-10-23'
language: en
lifecycle:
  status: confirmed
  confidence: 0.95
  review: on venue/status change
  retention: long-lived semantic memory
  reviewedAt: '2026-10-23T18:05:33.029Z'
  reviewDue: '2027-10-23'
  pendingReview: false
  overdue: false
retrieval:
  document_id: >-
    wiki:Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models
  chunking: markdown-heading-v1
source_ids:
  - src-19ed8d8ac2a744f7
  - src-2d7834852d5a70ca
  - src-af06ca5886446072
  - src-b005562340a1c871
  - src-d48b0fa9ae43a703
source_path: >-
  wiki/Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models.md
---
**Illusory Pattern Perception Drives Spurious Inference in Large Language Models** is a paper by Peihua Mai\*, Zhuoyan Shao\*, **[Xinbao Qiao](./Xinbao_Qiao.md)**\*, Meng Zhang, Xinyue Zhou, and Yan Pang, accepted at NeurIPS 2026. It studies unsupported relational inference from random, unrelated, or insufficient evidence.[^paper]

\* Co-first authors.

## Overview

The study adapts psychological paradigms into community correlation, investment correlation, and conspiracy belief tasks, directly comparing LLMs with human participants.

The correlation tasks vary information volume while matching positive-to-negative ratios; the conspiracy task tests perceived causal links between ambiguous events. Tested LLMs often exhibit stronger illusory pattern perception, with variation across models and tasks.

Sparse autoencoder (SAE) analysis of paired prompts links internal feature shifts involving holistic frequency perception and analytic cognitive orientation to illusory inference.[^paper]

## Key takeaways

- **Information volume is not evidence of association.** Frequently described groups or companies can attract unsupported positive associations.
- **Reliable inference requires sound relational judgments.** Accurate individual statements can still yield unsupported causal explanations.
- **Feature analysis offers mechanistic clues.** SAE findings identify associated internal signals within the tested models and tasks.

[^paper]: [arXiv:2610.07791](https://arxiv.org/abs/2610.07791).

## Placement

This paper belongs to [LLM Reliability](./LLM_Reliability.md) and [Trustworthy AI](./Trustworthy_AI.md). It extends Qiao's broader interest in how limited or misleading evidence affects AI systems.
