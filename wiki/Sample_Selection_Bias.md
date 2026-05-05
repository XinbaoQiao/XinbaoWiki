---
name: "Sample Selection Bias"
occupation: "Research concept"
summary: "Concept page for distributional bias introduced by non-representative sample choice."
---

**Sample Selection Bias** occurs when the data chosen for training or evaluation are not representative of the population or target distribution the model is expected to handle. In this wiki the concept is important because selection bias can compound when a model is repeatedly trained on generated or locally filtered data.[^bias]

## Role in this wiki

The page explains a mechanism behind [[Synthetic_Data_and_Model_Collapse|Synthetic Data]] failures. Selection bias is not merely a bad dataset label. It is a process: once a subset is preferred, missing modes may receive fewer examples, the model may generate them less often, and the next round of data may become even narrower. In networked settings, the bias may differ across parties, which makes diagnosis harder.

## Connection to Qiao's work

The ICML 2026 paper [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] places this concept in the title. The paper studies how local selection behavior can precipitate collapse in recursive synthetic-data training and how collaborative signals can diagnose the distributional drift. This page is therefore one of the most direct background entries for Qiao's synthetic-data line and one of the bridges to [[AI_and_Networks|AI and networks]].

## See also

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]]
- [[Data_Selection]]
- [[Model_Collapse]]
- [[Data_Silos]]

[^bias]: In statistics, sample-selection bias is a classic threat to inference because conclusions drawn from the selected sample need not generalize to the target population.
