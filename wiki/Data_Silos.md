---
name: "Data Silos"
occupation: "Research concept"
summary: "Concept page for learning and evaluation when data are distributed across separate holders."
---

**Data Silos** are organizational, legal, technical, or geographic separations that prevent all training data from being pooled in one place. In this wiki the term is used for institutions, devices, or clients that each hold only a partial view of the target distribution.

## Role in this wiki

Data silos are a key reason why [[AI_and_Networks|AI and networks]] differs from ordinary centralized machine learning. When each party only sees local data, model training and evaluation must work under communication, privacy, and representation constraints. A silo can be useful because it protects data ownership, but it also makes global diagnosis harder. Bias may be invisible locally and obvious only when evidence is compared across parties.

## Connection to Qiao's work

Data silos are central to [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]], where recursive synthetic-data training is studied under local sample-selection bias. They also motivate [[Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters]], where decentralized learning requires deciding which data are worth communicating or retaining. In both cases, the research question is not just model accuracy, but how distributed parties can coordinate without assuming complete data access.

## See also

- [[AI_and_Networks]]
- [[Distributed_Learning]]
- [[Collaborative_Evaluation]]
- [[Sample_Selection_Bias]]
