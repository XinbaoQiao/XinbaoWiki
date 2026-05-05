---
name: "Data Centric ML"
aliases:
  - "Data-Centric Machine Learning"
occupation: "Research topic"
summary: "Research topic focused on data quality, selection, valuation, correction, and governance."
---

**Data Centric ML** is the short label used in this wiki for data-centric machine learning. It refers to research where changes to data, rather than only changes to model architecture, are treated as first-order interventions. The relevant operations include selection, pruning, weighting, deletion, synthesis, and cross-party evaluation.[^data-centric]

## Role in this wiki

This page is the conceptual bridge between Qiao's older machine-unlearning work and his current [[AI_and_Networks|AI and networks]] direction. It explains why pages on [[Data_Selection|data selection]], [[Sample_Selection_Bias|sample selection bias]], [[Synthetic_Data|synthetic data]], [[Machine_Unlearning|machine unlearning]], and [[Collaborative_Evaluation|collaborative evaluation]] belong to the same wiki. Each page asks how a model changes when the data process changes.

## Connection to Qiao's work

In Qiao's publication record, data-centric ML appears in several forms. In unlearning, the data operation is removal or reweighting after training. In model-collapse work, the operation is selection of real or synthetic examples before recursive training. In decentralized learning, the operation is pruning local data before communication. The common question is whether a learning system can identify which data matter, which data harm reliability, and which data can be safely ignored under realistic cost constraints.

## See also

- [[Data_Selection]]
- [[Sample_Selection_Bias]]
- [[Synthetic_Data_and_Model_Collapse|Synthetic Data]]
- [[Machine_Unlearning]]
- [[AI_and_Networks]]

[^data-centric]: The term "data-centric AI" is commonly used for approaches that improve model performance by systematically improving data quality, consistency, and representativeness rather than only changing model code.
