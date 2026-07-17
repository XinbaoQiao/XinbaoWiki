---
type: Research concept
title: Sample Selection Bias
description: >-
  Concept page for distributional bias introduced by non-representative sample
  choice.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:24005e66c5a5ac72037a20b6868fb1935bc8e292c9fea0810c3a76c85b7c06a8'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
name: Sample Selection Bias
summary: >-
  Concept page for distributional bias introduced by non-representative sample
  choice.
occupation: Research concept
---
**Sample Selection Bias** occurs when the data chosen for training or evaluation are not representative of the population or target distribution the model is expected to handle. In this wiki the concept is important because selection bias can compound when a model is repeatedly trained on generated or locally filtered data.

## Role in this wiki

The page explains a mechanism behind [[Synthetic_Data_and_Model_Collapse|Synthetic Data]] failures. Selection bias is not merely a bad dataset label. It is a process: once a subset is preferred, missing modes may receive fewer examples, the model may generate them less often, and the next round of data may become even narrower. In low-resource networked settings, the same mechanism is sharper because rare modes may already be weakly represented before selection starts.

## Connection to Qiao's work

The ICML 2026 paper [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] places this concept in the title. The paper studies how local selection behavior can precipitate collapse in recursive synthetic-data training, especially when low-resource verifiers only see fragmented local evidence. This page is therefore one of the most direct background entries for Qiao's synthetic-data line and one of the bridges to [[AI_and_Networks|AI and networks]].

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Data_Selection]]
- [[Model_Collapse]]
- [[Data_Silos]]
