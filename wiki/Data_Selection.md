---
name: "Data Selection"
occupation: "Research concept"
summary: "Concept page for choosing training or evaluation data under reliability constraints."
---

**Data Selection** is the process of choosing which examples are used for training, pruning, evaluation, or synthetic-data reuse. In this wiki it is treated as a central data-centric operation: selection can reduce cost and improve quality, but biased selection can also distort a model's view of the target distribution.

## Role in this wiki

The page links [[Data_Centric_Machine_Learning|Data Centric ML]] to both [[AI_and_Networks|AI and networks]] and [[Synthetic_Data_and_Model_Collapse|Synthetic Data]]. In decentralized or siloed settings, selection is often local: each participant sees only part of the data and chooses examples according to local goals or constraints. That makes selection a networked problem rather than a purely statistical preprocessing step.

## Connection to Qiao's work

Data selection appears in [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]], where biased local selection can worsen recursive synthetic-data training. In the unlearning papers, selection reappears as removal or reweighting: the model is changed by changing which data count.

## See also

- [[Sample_Selection_Bias]]
- [[Data_Centric_Machine_Learning|Data Centric ML]]
- [[Distributed_Learning]]
- [[Synthetic_Data]]
