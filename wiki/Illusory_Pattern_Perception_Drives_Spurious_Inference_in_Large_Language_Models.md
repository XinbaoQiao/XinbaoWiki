---
type: publication
title: Illusory Pattern Perception Drives Spurious Inference in Large Language Models
description: >-
  NeurIPS 2026 paper on illusory pattern perception and spurious inference in
  large language models.
tags:
  - en
  - publication
  - paper
  - accepted
  - neurips-2026
  - llm-reliability
timestamp: '2026-09-25T13:49:35+09:00'
modified: '2026-09-27T11:41:29.316Z'
content_hash: 'sha256:7a1e1072fcd8e84d387b65469659a5cfbf93234281790ea4043b12236b855a08'
reviewed_at: '2026-09-27T11:41:45.574Z'
review_due: '2027-09-27'
name: Illusory Pattern Perception Drives Spurious Inference in Large Language Models
summary: >-
  NeurIPS 2026 paper on illusory pattern perception and spurious inference in
  large language models.
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
---
**Illusory Pattern Perception Drives Spurious Inference in Large Language Models** is a paper by Peihua Mai\*, Zhuoyan Shao\*, **[[Xinbao_Qiao|Xinbao Qiao]]**\*, Meng Zhang, Xinyue Zhou, and Yan Pang, accepted at NeurIPS 2026. It examines how a perceived pattern in a prompt can lead a large language model to make an inference that is insufficiently grounded in the available evidence.

\* Co-first authors.

## Overview

The paper places illusory pattern perception among the reliability problems of large language models. A prompt can appear to contain a regularity even when that regularity is a poor basis for the requested conclusion. The resulting risk is that a model follows the apparent pattern instead of evaluating the evidence relevant to the question.

## Key takeaways

- **Apparent regularity is not evidence.** A pattern suggested by a prompt should not by itself determine a model's conclusion.
- **Reliable inference depends on grounding.** The work highlights the need to check whether an answer follows from the available evidence when a prompt invites pattern completion.
- **Prompt interpretation is part of LLM reliability.** This failure mode connects the way models read an input to the trustworthiness of their output.

## Placement

This paper belongs to [[LLM_Reliability]] and [[Trustworthy_AI]]. It extends Qiao's broader interest in how limited or misleading evidence affects AI systems.
