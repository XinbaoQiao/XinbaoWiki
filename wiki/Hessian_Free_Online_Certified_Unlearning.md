---
type: publication
title: Hessian-Free Online Certified Unlearning
description: ICLR 2025 paper on efficient Hessian-free certified machine unlearning.
tags:
  - en
  - publication
  - paper
  - iclr-2025-poster
  - iclr-2025
timestamp: '2026-05-05T21:39:01+08:00'
modified: '2026-10-23T16:06:41.634Z'
content_hash: 'sha256:cad7ba023baa9a217654210c7c629d33b32da4694fb4572bf04f8ec5b1a65894'
reviewed_at: '2026-10-23T16:06:41.634Z'
review_due: '2027-01-21'
name: Hessian-Free Online Certified Unlearning
summary: ICLR 2025 paper on efficient Hessian-free certified machine unlearning.
dates: 24-28 April 2025
authors:
  - Xinbao Qiao
  - Meng Zhang
  - Ming Tang
  - Ermin Wei
venue: ICLR 2025
location: 'Singapore EXPO, Singapore'
year: 2025
status: ICLR 2025 poster
publication_type: Conference paper
links:
  - label: ICLR 2025 conference
    url: 'https://iclr.cc/Conferences/2025'
  - label: OpenReview
    url: 'https://openreview.net/forum?id=C3TrHWanh5'
  - label: arXiv
    url: 'https://arxiv.org/abs/2404.01712'
  - label: Code
    url: 'https://github.com/XinbaoQiao/Hessian-Free-Certified-Unlearning'
paper_highlight:
  tldr: >-
    Planning for deletion during training can make later unlearning a
    lightweight vector update. The method stores per-sample trajectory
    statistics and uses Hessian-vector products, avoiding explicit Hessian
    construction or inversion while providing certified approximation guarantees
    under its assumptions.
  image: /papers/hessian-free/overview.webp
  image_alt: >-
    Poster comparison of empirical-risk-minimizer reweighting and
    model-update-trajectory reweighting.
  width: 1441
  height: 494
  poster:
    image: /papers/hessian-free/poster-preview.webp
    image_alt: Conference paper poster.
    width: 1200
    height: 795
  figures:
    - image: /papers/hessian-free/unlearning-guarantee.webp
      image_alt: >-
        Assumptions, lemmas and the unlearning guarantee (Theorem 4), in
        original typesetting.
      width: 1800
      height: 1071
    - image: /papers/hessian-free/overview.webp
      image_alt: Comparison of empirical-risk and training-trajectory reweighting.
      width: 1441
      height: 494
    - image: /papers/hessian-free/figure-1.webp
      image_alt: >-
        Unlearning verification experiments on logistic regression and CNNs
        (Figure 1).
      width: 1800
      height: 449
---
**Hessian-Free Online Certified Unlearning** is an ICLR 2025 conference paper by **[[Xinbao_Qiao|Xinbao Qiao]]**, Meng Zhang, Ming Tang, and Ermin Wei. The paper develops a certified unlearning procedure for stochastic training pipelines where explicit Hessian storage, inversion, or repeated retraining would be too costly. Its main contribution is to turn deletion into an online vector update after a trajectory-based precomputation stage.

![ICLR 2025 poster for Hessian-Free Online Certified Unlearning](/papers/hessian-free/poster.webp)

## Overview

The paper studies [[Certified_Data_Removal|certified data removal]] for stochastic training, relaxing the requirement of a strictly convex empirical-risk minimizer and avoiding explicit Hessian construction or inversion. Earlier certified-unlearning methods often use Newton-style corrections from stored second-order statistics, but those matrix operations become impractical for high-dimensional and over-parameterized models.

The method tracks the stochastic optimization trajectory throughout training. It records per-sample trajectory statistics that approximate how the learned model would have changed if a sample had been absent during stochastic training.

## Method

The method accumulates an approximate influence vector for each training point through affine stochastic recursion. The recursion tracks the discrepancy between the model trained on the full dataset and the counterfactual model retrained without a requested sample. Because the update can be computed through Hessian-vector products, the algorithm avoids materializing the full Hessian matrix while retaining a certificate-style approximation guarantee.

Once the recollected vectors have been computed, online deletion becomes additive: a batch of deletion requests is handled by summing the stored per-sample approximators and applying a vector update to the current model.

## Key takeaways

- **Deletion costs depend on how training is organized.** Recording per-sample information during training can reduce the work needed when deletion requests arrive.
- **Training trajectories contain reusable information about data influence.** Stored trajectory statistics support later vector updates without explicitly constructing or inverting the full Hessian.
- **Efficiency and certification can be designed together.** The method combines low-cost updates with a formal approximation guarantee relative to retraining.
- **Future deletion requests belong in the model lifecycle.** Planning for removal during training makes subsequent model maintenance more practical.

## Results

The paper reports millisecond-level unlearning execution and orders-of-magnitude lower time and storage costs than Hessian-based certified-unlearning baselines. In large-scale application experiments, the method removes a sample through vector additions while preserving test accuracy close to retraining.

The experiments also use membership-inference analysis to examine privacy leakage under repeated model releases.

## Placement

This work belongs to [[Machine_Unlearning]], [[Certified_Data_Removal]], and [[Trustworthy_AI]]. Within Qiao's publication record, it is the differentiable-model counterpart to [[DynFrs|DynFrs: An Efficient Framework for Machine Unlearning in Random Forest]], which studies exact unlearning for tree ensembles.
