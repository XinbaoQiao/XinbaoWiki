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
venue: "ICML 2026"
location: "COEX Convention & Exhibition Center, Seoul, South Korea"
year: 2026
status: "accepted; owner-provided, with ICML author notification on 2026-04-30"
publication_type: "Conference paper"
links:
  - label: "ICML 2026 conference"
    url: "https://icml.cc/Conferences/2026"
summary: "ICML 2026 paper on local sample-selection bias, model collapse, and collaborative Wasserstein-geometry proxies."
---

**When Sample Selection Bias Precipitates Model Collapse** is an ICML 2026 conference paper by [[Xinbao_Qiao|Xinbao Qiao]], Xianglong Du, Wei Liu, Jingqi Zhang, Peihua Mai, Meng Zhang, and Yan Pang. The page is based on an owner-provided accepted manuscript package.

## Overview

The paper studies [[Model_Collapse|model collapse]] in recursive synthetic-data training. Prior work often treats data selection as a stabilizing tool: a verifier filters generated samples so that only high-quality synthetic data are reused for training. This paper argues that the verifier itself can be a source of collapse when it only sees a biased local slice of the target distribution.

The motivating setting is a data-silo environment. A hospital, bank, or proprietary institution may evaluate synthetic samples against its own limited reference data. Selection then becomes a confirmation-bias mechanism: samples close to the local view are retained, while distributional tails needed for generalization are pruned away.

## Method

The paper first formalizes biased top-alpha selection under Gaussian modeling and shows that local selection can drive variance collapse. It then proposes collaborative evaluation methods that replace a single local verifier with distributional proxies computed across parties without raw-data exchange.

Two schemes are described:

- **Scheme I**, collaborative geodesic interpolation, constructs proxy measures along Wasserstein geodesics between synthetic and local real distributions;
- **Scheme II**, collaborative Wasserstein barycenter estimation, computes a reusable barycenter proxy for the collective reference distribution.

Both schemes use Wasserstein-gradient-based sample scoring, so the synthetic pool is evaluated against a multi-party distributional reference rather than one biased silo.

![Collaborative Wasserstein barycenter methodology](/papers/model-collapse/barycenter-methodology.png)

## Key formula

The paper's theory links local selection, diversity decay, and Wasserstein cost. In the following summary, `R_t` is the selected top-alpha region, `D_t` is the filtered synthetic distribution at generation `t`, and `D*` is the true target manifold.

```text
Biased selection:
  X_{i,t} ~ TN(mu_{t-1}, Sigma_{t-1}, R_t)
  P(X in R_t) = alpha

Asymptotic diversity decay:
  Tr(Sigma_t) / Tr(Sigma_0) ~= C * t^{-lambda_min(Psi_infty)}

Wasserstein-cost view:
  Risk_{D*}(h_t)
    <= Risk_{D_t}(h_t) + 2 l epsilon W_p(D_t, D*) + delta

Sample score from dual potential f*:
  S(x_i) = f*(x_i) - (1 / (N - 1)) sum_{j != i} f*(x_j)
```

The formulas explain the paper's main mechanism: biased selection can make the retained distribution increasingly narrow, while collaborative Wasserstein proxies try to reduce the discrepancy between filtered synthetic data and the global target distribution.

## Results

The owner-provided manuscript reports DDPM-style recursive image-generation experiments on CIFAR-10, STL-10, and CelebA. Baselines include Random selection, K-means, CenterMatch, and CovMatch. Under non-IID or locally skewed references, local-selection baselines can fall behind random selection, while the collaborative schemes better preserve both quality and diversity.

![FID trends under recursive synthetic-data training](/papers/model-collapse/fid-trends-combined.png)

![Class-proportion trends under recursive selection](/papers/model-collapse/class-proportions-trend.png)

## Placement

This work belongs to [[Synthetic_Data_and_Model_Collapse|Synthetic Data]], [[Synthetic_Data]], [[Recursive_Synthetic_Data_Training]], [[Data_Selection]], [[Sample_Selection_Bias]], [[Data_Silos]], [[Collaborative_Evaluation]], and [[Wasserstein_Geometry]]. It is the synthetic-data counterpart to Qiao's unlearning papers: instead of asking how to remove data after training, it asks how selection and verification shape the data stream before future training.
