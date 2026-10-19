---
type: publication
title: 'DynFrs: An Efficient Framework for Machine Unlearning in Random Forest'
description: ICLR 2025 paper on efficient machine unlearning for random forests.
tags:
  - en
  - publication
  - paper
  - iclr-2025-poster
  - iclr-2025
timestamp: '2026-05-05T21:39:01+08:00'
modified: '2026-10-19T12:56:48.731Z'
content_hash: 'sha256:9cf63909ba50a853f850f836d1e29b8b836f45547b450155e8e9c705b308faa5'
reviewed_at: '2026-10-19T12:58:04.614Z'
review_due: '2027-01-17'
name: 'DynFrs: An Efficient Framework for Machine Unlearning in Random Forest'
summary: ICLR 2025 paper on efficient machine unlearning for random forests.
dates: 24-28 April 2025
authors:
  - Shurong Wang
  - Zhuoyang Shen
  - Xinbao Qiao
  - Tongning Zhang
  - Meng Zhang
venue: ICLR 2025
location: 'Singapore EXPO, Singapore'
year: 2025
status: ICLR 2025 poster
publication_type: Conference paper
links:
  - label: ICLR 2025 conference
    url: 'https://iclr.cc/Conferences/2025'
  - label: OpenReview
    url: 'https://openreview.net/forum?id=nsCOeCLR8e'
  - label: arXiv
    url: 'https://arxiv.org/abs/2410.01588'
  - label: Code
    url: 'https://github.com/shurongwang/DynFrs'
paper_highlight:
  tldr: >-
    Exact unlearning for random forests can be designed as a dynamic
    data-structure problem. Tree subsampling limits the reach of each sample,
    while lazy tags postpone subtree rebuilding until needed, keeping deletion,
    insertion and prediction efficient while preserving distributional
    equivalence to retraining.
  image: /papers/dynfrs/overview.webp
  image_alt: >-
    DynFrs lazy-tag strategy: deleted nodes, tagged nodes and deferred subtree
    reconstruction.
  width: 1008
  height: 252
  poster:
    image: /papers/dynfrs/poster-preview.webp
    image_alt: Conference paper poster.
    width: 2000
    height: 1125
  figures:
    - image: /papers/dynfrs/complexity-guarantees.webp
      image_alt: DynFrs training and update complexity guarantees (Theorems 2 and 3).
      width: 1800
      height: 947
    - image: /papers/dynfrs/overview.webp
      image_alt: Lazy-tag strategy for deferred subtree rebuilding.
      width: 1008
      height: 252
    - image: /papers/dynfrs/figure-2.webp
      image_alt: >-
        Predictive accuracy for different tree-subsampling proportions (Figure
        2).
      width: 889
      height: 702
---
**DynFrs: An Efficient Framework for Machine Unlearning in Random Forest** is an ICLR 2025 conference paper by Shurong Wang, Zhuoyang Shen, **[[Xinbao_Qiao|Xinbao Qiao]]**, Tongning Zhang, and Meng Zhang. The work treats random-forest unlearning as a dynamic data-structure problem: it seeks exact distributional equivalence to retraining while keeping online deletion, insertion, and query latency low.

![ICLR 2025 poster for DynFrs](/papers/dynfrs/poster.png)

## Overview

The paper studies exact and efficient [[Machine_Unlearning|machine unlearning]] for [[Random_Forest|random forests]]. Random forests are still widely used in privacy-sensitive domains such as healthcare, finance, and recommendation, but their tree-ensemble structure makes standard gradient-based unlearning tools inapplicable.

DynFrs targets three online operations on a forest: prediction, sample removal, and sample addition. The key design goal is low-latency modification without losing the distributional equivalence required by exact unlearning. The paper therefore treats unlearning as a data-structure and randomized-algorithm problem, not only as a model-update problem.

## Method

DynFrs combines three mechanisms:

- **OCC(q)**, a tree-subsampling rule that places each training sample in only `ceil(qT)` of `T` trees;
- **LZY**, a lazy-tag mechanism that postpones subtree reconstruction until a later query actually traverses the affected path;
- **ERT**, an Extremely Randomized Tree base learner, chosen because randomized split candidates make the structure less sensitive to local sample changes.

![DynFrs lazy-tag strategy](/papers/dynfrs/lazy-tags.png)

## Key takeaways

- **Exact unlearning can be a data-structure problem.** Tree membership and repair operations must preserve distributional equivalence to retraining after deletion.
- **Update latency affects continued service.** An efficient deletion procedure limits the reconstruction work that could otherwise delay predictions.
- **Randomization helps control maintenance costs.** Tree subsampling limits how many trees a sample affects, while lazy updates defer reconstruction until it is needed.
- **Classical models also need support for changing data.** Deletion, insertion, and prediction must work together when a model serves an ongoing stream of requests.

## Results

The OpenReview paper reports that DynFrs achieves orders-of-magnitude faster unlearning than existing random-forest unlearning methods while preserving or improving predictive accuracy. In the PDF, the authors report a 4000 to 1,500,000 times speedup relative to naive retraining, a 22 to 523 times speedup relative to DaRE in sequential unlearning, and online mixed-stream latency of about 0.12 ms for modification requests and 1.3 ms for querying requests on a large-scale dataset.

The empirical results also distinguish sequential and batch unlearning. DynFrs is presented as the only evaluated random-forest method that remains strong in both settings, because OCC(q) reduces per-sample tree coverage while LZY prevents every deletion from triggering full subtree reconstruction.

## Placement

This work belongs to [[Machine_Unlearning]], [[Random_Forest]], and [[Trustworthy_AI]]. In Qiao's publication record, it complements [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]] by focusing on exact unlearning for tree ensembles rather than approximate certified unlearning for differentiable models.
