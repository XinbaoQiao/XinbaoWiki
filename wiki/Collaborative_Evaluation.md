---
name: "Collaborative Evaluation"
occupation: "Research concept"
summary: "Concept page for evaluating models or data processes across multiple parties."
---

**Collaborative Evaluation** refers to evaluation procedures in which multiple parties contribute evidence about model behavior, data quality, or distributional drift. In this wiki the concept is used mainly for cross-silo settings, where each participant has local observations but no participant has complete access to the global distribution.

## Role in this wiki

This page connects [[Data_Silos|data silos]] to [[Wasserstein_Geometry|Wasserstein geometry]] and [[AI_and_Networks|AI and networks]]. It explains why evaluation itself can be a networked problem. A centralized benchmark assumes that all relevant data can be gathered and labeled in one place. Collaborative evaluation instead asks what can be inferred from partial, possibly biased local signals.

## Connection to Qiao's work

In [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]], collaborative evaluation is used to reason about recursive synthetic-data failure when the original data distribution is split across silos. The project uses distributional proxies, including Wasserstein-style geometry, to compare generated behavior against local evidence. This connects Qiao's synthetic-data work to his broader systems interest: reliable AI often depends on how evidence is shared, not only on how a model is trained.

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Data_Silos]]
- [[Wasserstein_Geometry]]
- [[Synthetic_Data_and_Model_Collapse|Synthetic Data]]
