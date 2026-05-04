---
name: "Hessian-Free Online Certified Unlearning"
type: "publication"
authors:
  - "Xinbao Qiao"
  - "Meng Zhang"
  - "Ming Tang"
  - "Ermin Wei"
venue: "ICLR 2025"
year: 2025
status: "published on OpenReview on 2025-01-22; ICLR 2025 poster"
publication_type: "Conference paper"
categories:
  - "Machine Unlearning"
  - "Certified Data Removal"
  - "Trustworthy AI"
links:
  - label: "OpenReview"
    url: "https://openreview.net/forum?id=C3TrHWanh5"
  - label: "arXiv"
    url: "https://arxiv.org/abs/2404.01712"
  - label: "Code"
    url: "https://github.com/XinbaoQiao/Hessian-Free-Certified-Unlearning"
summary: "ICLR 2025 paper on efficient Hessian-free certified machine unlearning."
---

**Hessian-Free Online Certified Unlearning** is an ICLR 2025 paper by [[Xinbao_Qiao|Xinbao Qiao]], Meng Zhang, Ming Tang, and Ermin Wei.

## Idea

The paper addresses efficient online [[Certified_Data_Removal|certified data removal]] without explicit Hessian matrix operations. It maintains per-sample recollected statistics and performs data removal through low-cost vector operations.

The manuscript package describes the method as maintaining a statistical vector for each training data point through an affine stochastic recursion of the discrepancy between retrained and learned models. The online deletion operation then becomes near-instantaneous because the update can be reduced to vector addition.

## Positioning

The work is part of [[Machine_Unlearning]] and [[Trustworthy_AI]], targeting the gap between theoretical certified unlearning and high-dimensional over-parameterized models. OpenReview lists the paper as published on 2025-01-22, matching the ICLR 2025 final decision date.
