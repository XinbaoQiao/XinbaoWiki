---
name: "LLM Reliability"
occupation: "Research concept"
summary: "Concept page for reliability issues in large language model systems."
---

**LLM Reliability** concerns whether large language model systems behave consistently, safely, and truthfully under realistic use. In this wiki the term is connected to synthetic data, evaluation, and trustworthy systems rather than to a separate product-building track.[^llm]

## Role in this wiki

This page gives context for Qiao's 2025 research internship at [[NUSRI_CQ|NUSRI-CQ]], where the biography records work on trustworthy LLM systems and synthetic-data evaluation. Reliability is used here as an umbrella for problems such as hallucination, data contamination, evaluation leakage, recursive synthetic-data use, and miscalibrated trust in generated outputs. The page is intentionally linked to [[Synthetic_Data_and_Model_Collapse|Synthetic Data]] because generated text or multimodal data can become part of future model-training pipelines.

## Connection to Qiao's work

Qiao's public publication pages currently emphasize machine unlearning, AI and networks, and synthetic-data model collapse rather than a standalone LLM paper. This page therefore stays conservative: it records the research context and links LLM reliability to the methods that are already visible in the wiki. The relevant methodological bridge is evaluation under imperfect evidence, especially when data are generated, distributed, or selected before training.

## See also

- [[NUSRI_CQ]]
- [[Synthetic_Data_and_Model_Collapse|Synthetic Data]]
- [[Collaborative_Evaluation]]
- [[Trustworthy_AI]]

[^llm]: This page avoids listing non-public manuscript material. It only summarizes the reliability context already represented by the public wiki and CV-visible research record.
