---
name: "Influence Functions"
occupation: "Research concept"
summary: "Concept page for estimating how training examples affect learned models."
---

**Influence Functions** are analytical tools for estimating how a training point affects a fitted model or a downstream prediction. In modern machine learning they are often used as approximations: instead of retraining after changing one point, the method estimates the effect through gradients and curvature information.[^influence]

## Role in this wiki

This page explains why influence-based reasoning appears across data-centric ML. If a researcher can estimate the effect of a point, group, or weighted subset, they can ask which data should be removed, downweighted, kept, or inspected. Influence functions therefore connect [[Data_Selection|data selection]], [[Machine_Unlearning|machine unlearning]], fairness correction, and robustness analysis. The same idea also motivates why Hessian-vector products and second-order approximations appear in unlearning papers.

## Connection to Qiao's work

Qiao's unlearning work uses influence-style reasoning in several forms. [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]] relies on efficient updates without explicit Hessian inversion. [[Soft_Weighted_Machine_Unlearning|Beyond Binary Erasure]] uses weighted influence to turn a deletion problem into a corrective intervention for fairness and robustness. In this wiki, influence functions are therefore not a standalone mathematical curiosity; they are the local sensitivity language behind Qiao's data-operation papers.

## See also

- [[Machine_Unlearning]]
- [[Data_Centric_Machine_Learning|Data Centric ML]]
- [[Fairness_and_Robustness]]
- [[Hessian_Free_Online_Certified_Unlearning]]

[^influence]: Koh and Liang, "Understanding Black-box Predictions via Influence Functions", ICML 2017, reintroduced classical influence-function ideas for explaining predictions in modern machine-learning models.
