---
type: Research concept
title: Sample Selection Bias
description: >-
  How data selection can distort the distribution used for learning or
  evaluation.
tags:
  - en
  - research
  - concept
  - research-concept
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.959Z'
content_hash: 'sha256:a02db56ea6834971d3c1d619584632060ceb8e20e17b999fda1493a1d8f94d15'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: Sample Selection Bias
summary: >-
  How data selection can distort the distribution used for learning or
  evaluation.
occupation: Research concept
---
**Sample Selection Bias** occurs when the data chosen for training or evaluation are not representative of the population or target distribution the model is expected to handle. Selection bias can compound when a model is repeatedly trained on generated or locally filtered data.

## Research context

Selection bias is one mechanism behind [[Synthetic_Data_and_Model_Collapse|Synthetic Data]] failures. Selection bias is not merely a bad dataset label. It is a process: once a subset is preferred, missing modes may receive fewer examples, the model may generate them less often, and the next round of data may become even narrower. In low-resource networked settings, the same mechanism is sharper because rare modes may already be weakly represented before selection starts.

## Connection to Qiao's work

The ICML 2026 paper [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] studies how local selection behavior can precipitate collapse in recursive synthetic-data training, especially when low-resource verifiers only see fragmented local evidence. This links Qiao's synthetic-data research with [[AI_and_Networks|AI and networks]].

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Data_Selection]]
- [[Model_Collapse]]
- [[Data_Silos]]
