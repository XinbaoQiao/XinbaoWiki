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
modified: '2026-10-11T14:22:08.132Z'
content_hash: 'sha256:5568279effa89e5b3bb57c8f94c85ba3100a14bc5d773b4520d0e04d5fa3c2cf'
reviewed_at: '2026-10-11T14:22:50.689Z'
review_due: '2027-10-11'
name: Illusory Pattern Perception Drives Spurious Inference in Large Language Models
summary: >-
  NeurIPS 2026 paper comparing LLM and human illusory pattern perception across
  three psychological tasks, with sparse autoencoder feature analysis.
occupation: NeurIPS 2026 paper
dates: 6-12 December 2026
authors:
  - Peihua Mai
  - Zhuoyan Shao
  - Xinbao Qiao
  - Meng Zhang
  - Xinyue Zhou
  - Yan Pang
venue: NeurIPS 2026
location: 'Sydney, Australia (main site)'
year: 2026
status: accepted
publication_type: Conference paper
links:
  - label: NeurIPS 2026 conference
    url: 'https://neurips.cc/Conferences/2026'
  - label: OpenReview
    url: 'https://openreview.net/forum?id=VLcmdFfRQc'
  - label: arXiv
    url: 'https://arxiv.org/abs/2610.07791'
  - label: PDF
    url: 'https://arxiv.org/pdf/2610.07791'
  - label: Code
    url: 'https://github.com/NusIoraPrivacy/illusory'
---
**Illusory Pattern Perception Drives Spurious Inference in Large Language Models** is a paper by Peihua Mai\*, Zhuoyan Shao\*, **[[Xinbao_Qiao|Xinbao Qiao]]**\*, Meng Zhang, Xinyue Zhou, and Yan Pang, accepted at NeurIPS 2026. It studies unsupported relational inference from random, unrelated, or insufficient evidence.[^paper]

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

This paper belongs to [[LLM_Reliability]] and [[Trustworthy_AI]]. It extends Qiao's broader interest in how limited or misleading evidence affects AI systems.
