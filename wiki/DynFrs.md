---
name: "DynFrs: An Efficient Framework for Machine Unlearning in Random Forest"
type: "publication"
authors:
  - "Shurong Wang"
  - "Zhuoyang Shen"
  - "Xinbao Qiao"
  - "Tongning Zhang"
  - "Meng Zhang"
venue: "ICLR 2025"
location: "Singapore EXPO, Singapore"
year: 2025
status: "published on OpenReview on 2025-01-22; ICLR 2025 poster"
publication_type: "Conference paper"
links:
  - label: "OpenReview"
    url: "https://openreview.net/forum?id=nsCOeCLR8e"
  - label: "arXiv"
    url: "https://arxiv.org/abs/2410.01588"
  - label: "Code"
    url: "https://github.com/shurongwang/DynFrs"
summary: "ICLR 2025 paper on efficient machine unlearning for random forests."
---

**DynFrs: An Efficient Framework for Machine Unlearning in Random Forest** is an ICLR 2025 conference paper by Shurong Wang, Zhuoyang Shen, [[Xinbao_Qiao|Xinbao Qiao]], Tongning Zhang, and Meng Zhang. OpenReview lists the paper as an ICLR 2025 poster, published on 22 January 2025.

## Overview

The paper studies exact and efficient [[Machine_Unlearning|machine unlearning]] for [[Random_Forest|random forests]]. Random forests are still widely used in privacy-sensitive domains such as healthcare, finance, and recommendation, but their tree-ensemble structure makes standard gradient-based unlearning tools inapplicable.

DynFrs targets three online operations on a forest: prediction, sample removal, and sample addition. The key design goal is low-latency modification without losing the distributional equivalence required by exact unlearning.

## Method

DynFrs combines three mechanisms:

- **OCC(q)**, a tree-subsampling rule that places each training sample in only `ceil(qT)` of `T` trees;
- **LZY**, a lazy-tag mechanism that postpones subtree reconstruction until a later query actually traverses the affected path;
- **ERT**, an Extremely Randomized Tree base learner, chosen because randomized split candidates make the structure less sensitive to local sample changes.

![DynFrs lazy-tag strategy](/papers/dynfrs/lazy-tags.png)

![ICLR 2025 poster for DynFrs](/papers/dynfrs/poster.png)

## Key formula

The framework reduces the number of trees touched by each sample and amortizes tree repair over later queries. The following summary keeps the notation used in the paper: `T` is the forest size, `q < 1` is the occurrence factor, and `k = ceil(qT)`.

```text
k = ceil(qT)
Pr[z_i in S^(t)] = k / T ~= q

training time:
  O(q T d_max p n log s)

expected unlearning speedup from OCC(q):
  E[N_naive / N_occ] ~= 1 / q^2

exact unlearning condition:
  A^-(A(S), S, z)  has the same distribution as  A(S \ {z})
```

The lazy-tag mechanism then turns a potentially large subtree retraining operation into path-level reconstruction only when a future query reaches the tagged node.

## Results

The OpenReview paper reports that DynFrs achieves orders-of-magnitude faster unlearning than existing random-forest unlearning methods while preserving or improving predictive accuracy. In the PDF, the authors report a 4000 to 1,500,000 times speedup relative to naive retraining, a 22 to 523 times speedup relative to DaRE in sequential unlearning, and online mixed-stream latency of about 0.12 ms for modification requests and 1.3 ms for querying requests on a large-scale dataset.

The empirical results also distinguish sequential and batch unlearning. DynFrs is presented as the only evaluated random-forest method that remains strong in both settings, because OCC(q) reduces per-sample tree coverage while LZY prevents every deletion from triggering full subtree reconstruction.

## Placement

This work belongs to [[Machine_Unlearning]], [[Random_Forest]], and [[Trustworthy_AI]]. In Qiao's publication record, it complements [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]] by focusing on exact unlearning for tree ensembles rather than approximate certified unlearning for differentiable models.
