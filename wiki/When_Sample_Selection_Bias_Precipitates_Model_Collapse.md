---
name: "When Sample Selection Bias Precipitates Model Collapse"
type: "publication"
occupation: "ICML 2026 paper"
authors:
  - "Xinbao Qiao"
  - "Xianglong Du"
  - "Wei Liu"
  - "Jingqi Zhang"
  - "Peihua Mai"
  - "Meng Zhang"
  - "Yan Pang"
venue: "ICML 2026; PMLR 306"
year: 2026
status: "accepted; owner-provided, with ICML author notification on 2026-04-30"
publication_type: "Conference paper"
categories:
  - "Synthetic Data and Model Collapse"
  - "Synthetic Data"
  - "Recursive Synthetic Data Training"
  - "Data Selection"
  - "Sample Selection Bias"
  - "Model Collapse"
  - "Data-Centric Machine Learning"
  - "Data Silos"
  - "Collaborative Evaluation"
  - "Wasserstein Geometry"
links:
  - label: "ICML 2026 dates"
    url: "https://icml.cc/Conferences/2026/Dates"
summary: "ICML 2026 paper on local sample-selection bias, model collapse, and collaborative Wasserstein-geometry proxies."
---

**When Sample Selection Bias Precipitates Model Collapse** is an ICML 2026 paper by [[Xinbao_Qiao|Xinbao Qiao]], Xianglong Du, Wei Liu, Jingqi Zhang, Peihua Mai, Meng Zhang, and Yan Pang.

The page belongs to [[Synthetic_Data_and_Model_Collapse]]. It is also classified under [[Synthetic_Data]], [[Recursive_Synthetic_Data_Training]], [[Data_Selection]], [[Sample_Selection_Bias]], [[Model_Collapse]], [[Data_Silos]], [[Collaborative_Evaluation]], and [[Wasserstein_Geometry]].

## Problem

Recursive synthetic-data training can reduce dependence on scarce human data, but it risks [[Model_Collapse]]: distributional tails disappear, generated outputs homogenize, and future models train on increasingly distorted data. Existing defenses often rely on data selection or verification, but this assumes that the verifier has access to a global view of the true distribution.

The paper studies the more realistic data-silo setting. A hospital, bank, or proprietary institution may only observe a biased slice of the global manifold. Selection against that local reference can act as confirmation bias: it retains samples close to the local view and prunes diversity needed for generalization.

## Main claim

The core claim is that **sample selection can precipitate collapse** when selection is locally biased. In the paper's Gaussian analysis, siloed top-alpha selection pulls the synthetic distribution toward a local target and drives variance decay with an asymptotic power-law rate.

## Methodology

The proposed mitigation shifts from single-silo verification to [[Collaborative_Evaluation]]. Multiple parties compute proxy references without exchanging raw data:

- **Scheme I**: collaborative geodesic interpolation, where parties construct proxy measures along Wasserstein geodesics.
- **Scheme II**: collaborative Wasserstein barycenter estimation, where a reusable barycenter approximates a collective global reference.

These proxies support Wasserstein-gradient-based sample scoring, so synthetic samples are evaluated against a collective distributional reference instead of one local silo.

## Experiments

The experiments use DDPM-style image generation on CIFAR-10, STL-10, and CelebA, with baselines including Random selection, K-means, CenterMatch, and CovMatch. The manuscript reports that local-selection baselines can help under IID reference data but may underperform under non-IID skew, while the collaborative schemes better preserve both quality and diversity.

## Source status

The page is initialized from an owner-provided accepted manuscript package. ICML 2026 lists 2026-04-30 as the author notification date. Official PMLR, OpenReview, arXiv, and code links should be added when publicly available.
