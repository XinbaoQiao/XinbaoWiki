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
paper_highlight:
  tldr: >-
    LLMs can infer associations and causal stories from random or insufficient
    evidence. Human comparisons across three psychological tasks, together with
    sparse-autoencoder feature analysis, identify when these illusory patterns
    arise and which internal features are associated with them.
  image: /papers/illusory-pattern/overview.webp
  image_alt: >-
    Study overview of three psychological tasks and sparse-autoencoder feature
    analysis.
  width: 1800
  height: 839
  figures:
    - image: /papers/illusory-pattern/human-comparison.webp
      image_alt: Human and LLM responses across three tasks (Table 1).
      width: 1740
      height: 778
    - image: /papers/illusory-pattern/figure-2.webp
      image_alt: Human and LLM responses with chain-of-thought prompting (Figure 2).
      width: 1657
      height: 479
    - image: /papers/illusory-pattern/figure-3.webp
      image_alt: Pooled activation changes by SAE feature category (Figure 3).
      width: 1723
      height: 617
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
