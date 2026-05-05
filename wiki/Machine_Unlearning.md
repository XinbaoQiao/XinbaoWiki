---
name: "Machine Unlearning"
occupation: "Research topic"
summary: "Research topic on removing or correcting data influence from trained models."
---

**Machine Unlearning** studies how to remove, reduce, or correct the effect of selected training data after a model has already been trained. In this wiki it is treated as both a privacy topic and a data-centric systems topic: an unlearning method must say what it removes, how faithfully it approximates retraining, and how much computation or latency is saved.[^unlearning]

## Role in this wiki

This page organizes Qiao's publication line on post-training data operations. The line includes certified deletion, weighted correction, and tree-ensemble updates. It is closely connected to [[Data_Centric_Machine_Learning|Data Centric ML]] because the central object is not a new model architecture, but a data operation that changes model behavior. It also connects to [[Trustworthy_AI|Trustworthy AI]], since deletion requests, fairness corrections, and robustness interventions are forms of governance over a trained system.

## Connection to Qiao's work

Qiao's unlearning papers cover complementary settings. [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]] targets certified updates for convex objectives without explicit Hessian inversion. [[Soft_Weighted_Machine_Unlearning|Beyond Binary Erasure]] generalizes deletion from binary remove-or-keep actions to continuous weights for fairness and robustness. [[DynFrs|DynFrs: An Efficient Framework for Machine Unlearning in Random Forest]] studies exact and efficient update mechanisms for random forests. Together they define an arc from mathematical certification to practical low-latency model maintenance.

## See also

- [[Certified_Data_Removal]]
- [[Influence_Functions]]
- [[Fairness_and_Robustness]]
- [[Random_Forest]]
- [[Publications]]

[^unlearning]: A widely cited formulation is Bourtoule et al., "Machine Unlearning", IEEE Symposium on Security and Privacy 2021, which introduced SISA-style sharded, isolated, sliced, and aggregated training as a practical route to deletion.
