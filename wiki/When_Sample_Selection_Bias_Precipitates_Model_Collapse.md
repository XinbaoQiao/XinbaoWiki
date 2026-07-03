---
type: publication
title: When Sample Selection Bias Precipitates Model Collapse
description: >-
  ICML 2026 paper on low-resource verification regimes, sample-selection bias,
  model collapse, and collaborative Wasserstein-geometry proxies.
tags:
  - en
  - publication
  - paper
  - accepted
  - icml-2026
  - synthetic-data
timestamp: '2026-06-02T22:56:50+08:00'
name: When Sample Selection Bias Precipitates Model Collapse
summary: >-
  ICML 2026 paper on low-resource verification regimes, sample-selection bias,
  model collapse, and collaborative Wasserstein-geometry proxies.
occupation: ICML 2026 paper
authors:
  - Xinbao Qiao
  - Xianglong Du
  - Wei Liu
  - Jingqi Zhang
  - Peihua Mai
  - Meng Zhang
  - Yan Pang
venue: ICML 2026
location: 'COEX Convention & Exhibition Center, Seoul, South Korea'
year: 2026
status: accepted
publication_type: Conference paper
links:
  - label: OpenReview
    url: 'https://openreview.net/forum?id=FFXvnzM254'
  - label: Code
    url: >-
      https://github.com/XinbaoQiao/When-Sample-Selection-Bias-Precipitates-Model-Collapse
  - label: ICML 2026 conference
    url: 'https://icml.cc/Conferences/2026'
---
**When Sample Selection Bias Precipitates Model Collapse** is an ICML 2026 conference paper by **[[Xinbao_Qiao|Xinbao Qiao]]**, Xianglong Du, Wei Liu, Jingqi Zhang, Peihua Mai, Meng Zhang, and Yan Pang. It examines how low-resource verification regimes in data silos can turn sample selection from a safeguard against model collapse into a mechanism that accelerates it, and how collaborative distributional proxies can reduce that failure mode.

![Teaser: local selection bias narrows recursive synthetic data, while collaborative Wasserstein verification preserves diversity](/papers/model-collapse/teaser.png)

## Overview

The paper studies [[Model_Collapse|model collapse]] in recursive synthetic-data training. Prior work often treats data selection as a stabilizing tool: a verifier filters generated samples so that only high-quality synthetic data are reused for training. This paper makes the verifier the object of analysis. When the verifier sees only a small, fragmented, and biased slice of the target distribution, selection can repeatedly reward samples near that local slice and remove globally relevant tail modes that future generators need.

The motivating setting is a low-resource data-silo environment. A hospital consortium, bank, or proprietary institution may evaluate synthetic samples against its own limited reference data because raw data cannot be pooled. Selection then becomes a confirmation-bias mechanism: samples close to the local view are retained, while rare but valid modes are pruned away. The updated framing emphasizes why low-resource communities are especially vulnerable: tail regions are already weakly represented before synthetic augmentation begins, so local filtering can turn scarcity into persistent coverage loss.

## Method

The paper first formalizes biased top-alpha selection under Gaussian modeling and connects it to variance collapse across recursive generations. It then proposes collaborative evaluation methods that replace a single local verifier with distributional proxies computed across parties without raw-data exchange. The methodological shift is from sample quality as judged by one low-resource silo to distributional fit against a proxy for the global target.

Two schemes are described:

- **Scheme I**, collaborative geodesic interpolation, constructs proxy measures along Wasserstein geodesics between synthetic and local real distributions;
- **Scheme II**, collaborative Wasserstein barycenter estimation, computes a reusable barycenter proxy for the collective reference distribution.

Both schemes use Wasserstein-gradient-based sample scoring, so the synthetic pool is evaluated against a multi-party distributional reference rather than one biased silo.

![Collaborative Wasserstein barycenter methodology](/papers/model-collapse/barycenter-methodology.png)

## Key formula

The paper's theory links local selection, diversity decay, and Wasserstein cost. In the following summary, $R_t$ is the selected top-$\alpha$ region, $D_t$ is the filtered synthetic distribution at generation $t$, and $D^\star$ is the target distribution.

Local verifier selection is summarized as truncated sampling:

$$
X_{i,t}\sim \operatorname{TN}(\mu_{t-1},\Sigma_{t-1},R_t),
\qquad
\Pr(X\in R_t)=\alpha .
$$

The resulting diversity decay can be expressed through the covariance trace:

$$
\frac{\operatorname{Tr}(\Sigma_t)}{\operatorname{Tr}(\Sigma_0)}
\asymp C\,t^{-\lambda_{\min}(\Psi_\infty)} .
$$

A Wasserstein generalization bound then relates model risk under the target distribution to the filtered distribution:

$$
\mathcal{R}_{D^\star}(h_t)
\le
\mathcal{R}_{D_t}(h_t)
+2L\epsilon\,W_p(D_t,D^\star)+\delta .
$$

The collaborative scoring rule can be viewed through a dual potential $f^\star$:

$$
S(x_i)
= f^\star(x_i)
-\frac{1}{N-1}\sum_{j\ne i} f^\star(x_j).
$$

The formulas explain the paper's main mechanism: biased selection can make the retained distribution increasingly narrow, while collaborative Wasserstein proxies try to reduce the discrepancy between filtered synthetic data and the global target distribution.

## Results

The manuscript reports DDPM-style recursive image-generation experiments on CIFAR-10, STL-10, and CelebA. Baselines include Random selection, K-means, CenterMatch, and CovMatch. Under non-IID or locally skewed references, local-selection baselines can fall behind random selection, while the collaborative schemes better preserve both sample quality and mode coverage.

The main lesson is that low-resource regimes are not merely smaller versions of high-resource settings. When real-data coverage is scarce or fragmented, tail modes may already be difficult to observe. Local-reference selection can then confuse rare but valid samples with low-quality generations, systematically suppressing underrepresented regions of the target distribution. An appendix experiment with a topic-local LLM verifier makes the same point semantically: filtering against a narrow local topic can reduce held-out topic coverage rather than protect it.

![FID trends under recursive synthetic-data training](/papers/model-collapse/fid-trends-combined.png)

![Class-proportion trends under recursive selection](/papers/model-collapse/class-proportions-trend.png)

## Placement

This work belongs to [[Synthetic_Data_and_Model_Collapse|Synthetic Data]], [[Synthetic_Data]], [[Recursive_Synthetic_Data_Training]], [[Data_Selection]], [[Sample_Selection_Bias]], [[Data_Silos]], [[Collaborative_Evaluation]], and [[Wasserstein_Geometry]]. It is the synthetic-data counterpart to Qiao's unlearning papers: instead of asking how to remove data after training, it asks how selection and verification shape the data stream before future training. The low-resource emphasis also connects the paper to the social side of model collapse: distributional tail loss can correspond to the loss of culturally, linguistically, or institutionally underrepresented content.
