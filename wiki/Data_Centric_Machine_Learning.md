---
name: "Data Centric ML"
aliases:
  - "Data-Centric Machine Learning"
occupation: "Research topic"
summary: "Research topic focused on data quality, selection, valuation, correction, and governance."
---

**Data Centric ML** is the short label used in this wiki for data-centric machine learning. It refers to research where changes to data, rather than only changes to model architecture, are treated as first-order interventions. The relevant operations include selection, pruning, weighting, deletion, synthesis, and cross-party evaluation.[^data-centric]

## Introduction

The page groups projects where the main intervention is a data operation. Some operations happen after training, such as deletion and reweighting; others happen before or during training, such as pruning, synthetic-data filtering, and cross-silo evaluation. The topic acts as a bridge between Qiao's machine-unlearning work and the newer AI-and-networks line.

## Role in this wiki

This page is the conceptual bridge between Qiao's older machine-unlearning work and his current [[AI_and_Networks|AI and networks]] direction. It explains why pages on [[Data_Selection|data selection]], [[Sample_Selection_Bias|sample selection bias]], [[Synthetic_Data|synthetic data]], [[Machine_Unlearning|machine unlearning]], and [[Collaborative_Evaluation|collaborative evaluation]] belong to the same wiki. Each page asks how a model changes when the data process changes.

## Publications

| Paper | Venue/status |
| --- | --- |
| [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]] | ICLR 2025, 24-28 April 2025, Singapore; OpenReview published 22 January 2025. |
| [[DynFrs|DynFrs: An Efficient Framework for Machine Unlearning in Random Forest]] | ICLR 2025, 24-28 April 2025, Singapore; OpenReview published 22 January 2025. |
| [[Soft_Weighted_Machine_Unlearning|Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness]] | AAAI 2026, 20-27 January 2026, Singapore; accepted main track, with arXiv v1 24 May 2025 and presentation listed for 25 January 2026. |
| [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|When Sample Selection Bias Precipitates Model Collapse]] | ICML 2026, 6-11 July 2026, Seoul; accepted 30 April 2026 according to owner-provided records and the ICML author-notification date. |
| [[Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters: Data Pruning for Efficient Decentralized Learning]] | TNNLS under review; ongoing journal manuscript listed in the CV. |

## Connection to Qiao's work

In Qiao's publication record, data-centric ML appears in several forms. In unlearning, the data operation is removal or reweighting after training. In model-collapse work, the operation is selection of real or synthetic examples before recursive training. In decentralized learning, the operation is pruning local data before communication. The common question is whether a learning system can identify which data matter, which data harm reliability, and which data can be safely ignored under realistic cost constraints.

## See also

- [[Data_Selection]]
- [[Sample_Selection_Bias]]
- [[Synthetic_Data_and_Model_Collapse|Synthetic Data]]
- [[Machine_Unlearning]]
- [[AI_and_Networks]]

[^data-centric]: The term "data-centric AI" is commonly used for approaches that improve model performance by systematically improving data quality, consistency, and representativeness rather than only changing model code.
