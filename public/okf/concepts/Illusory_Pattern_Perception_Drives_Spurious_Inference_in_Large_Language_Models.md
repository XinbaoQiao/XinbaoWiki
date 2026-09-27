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
language: en
lifecycle:
  status: confirmed
  confidence: 0.95
  review: on venue/status change
  retention: long-lived semantic memory
  reviewedAt: '2026-09-27T11:41:45.574Z'
  reviewDue: '2027-09-27'
  pendingReview: false
  overdue: false
retrieval:
  document_id: >-
    wiki:Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models
  chunking: markdown-heading-v1
source_ids:
  - src-b005562340a1c871
  - src-d48b0fa9ae43a703
source_path: >-
  wiki/Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models.md
---
**Illusory Pattern Perception Drives Spurious Inference in Large Language Models** is a paper by Peihua Mai\*, Zhuoyan Shao\*, **[Xinbao Qiao](./Xinbao_Qiao.md)**\*, Meng Zhang, Xinyue Zhou, and Yan Pang, accepted at NeurIPS 2026. It examines how a perceived pattern in a prompt can lead a large language model to make an inference that is insufficiently grounded in the available evidence.

\* Co-first authors.

## Overview

The paper places illusory pattern perception among the reliability problems of large language models. A prompt can appear to contain a regularity even when that regularity is a poor basis for the requested conclusion. The resulting risk is that a model follows the apparent pattern instead of evaluating the evidence relevant to the question.

## Key takeaways

- **Apparent regularity is not evidence.** A pattern suggested by a prompt should not by itself determine a model's conclusion.
- **Reliable inference depends on grounding.** The work highlights the need to check whether an answer follows from the available evidence when a prompt invites pattern completion.
- **Prompt interpretation is part of LLM reliability.** This failure mode connects the way models read an input to the trustworthiness of their output.

## Placement

This paper belongs to [LLM Reliability](./LLM_Reliability.md) and [Trustworthy AI](./Trustworthy_AI.md). It extends Qiao's broader interest in how limited or misleading evidence affects AI systems.
