---
type: publication
title: 样本选择偏差何以促成模型坍缩
description: ICML 2026 论文，研究低资源验证场景、样本选择偏差、模型坍缩与协作 Wasserstein 几何代理。
tags:
  - zh
  - publication
  - paper
  - accepted
  - icml-2026
  - synthetic-data
timestamp: '2026-06-02T22:56:50+08:00'
modified: '2026-10-07T07:07:23.992Z'
content_hash: 'sha256:e72b3490b8b9a8ee9c8e6909e76559a1f48e7e98b3a8ae019a4092f1696a3fd3'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-10-07'
name: 样本选择偏差何以促成模型坍缩
language: zh
summary: ICML 2026 论文，研究低资源验证场景、样本选择偏差、模型坍缩与协作 Wasserstein 几何代理。
occupation: ICML 2026 paper
dates: 2026年7月6日至11日
authors:
  - Xinbao Qiao
  - Xianglong Du
  - Wei Liu
  - Jingqi Zhang
  - Peihua Mai
  - 张萌
  - Yan Pang
venue: ICML 2026
location: 'COEX Convention & Exhibition Center, Seoul, South Korea'
year: 2026
status: accepted
publication_type: 会议论文
links:
  - label: OpenReview
    url: 'https://openreview.net/forum?id=FFXvnzM254'
  - label: arXiv
    url: 'https://arxiv.org/abs/2606.13732'
  - label: Code
    url: >-
      https://github.com/XinbaoQiao/When-Sample-Selection-Bias-Precipitates-Model-Collapse
  - label: ICML 2026 conference
    url: 'https://icml.cc/Conferences/2026'
translation_of: When_Sample_Selection_Bias_Precipitates_Model_Collapse
---
**样本选择偏差何以促成模型坍缩** 是 **[[Xinbao_Qiao|乔鑫宝]]**、Xianglong Du、Wei Liu、Jingqi Zhang、Peihua Mai、张萌和 Yan Pang 的 ICML 2026 会议论文。论文研究递归合成数据训练中的一种失效模式：当验证器只有少量本地参考数据时，它可能把稀有但有效的样本误判为低质量生成，使样本选择放大而不是抑制模型坍缩。论文通过协作 Wasserstein 几何代理，在无需汇集原始数据的情况下扩展评估所依据的分布参考。

![样本选择偏差何以促成模型坍缩 ICML 2026 poster](/papers/model-collapse/poster.png)

## 概述

论文研究递归合成数据训练中的 [[Model_Collapse|模型坍缩]]。已有工作常把数据选择视为稳定工具：验证器过滤生成样本，只让高质量合成数据进入下一轮训练。本文反过来把验证器本身作为分析对象。当验证器只看到目标分布中小规模、碎片化且有偏的局部切片时，选择过程可能反复保留接近本地参考分布的样本，却删除目标分布中下一轮训练仍需保留的尾部模式。

论文关注参考数据有限且分散于不同机构的场景。医疗联合体、银行或专有机构可能因为原始数据不能汇集，只能使用自身有限参考数据评估合成样本。选择因此变成一种确认偏差机制：接近本地视角的样本被保留，而稀有但有效的模式被剪掉。低资源社区对此尤其脆弱：尾部区域在合成数据增强开始前就已经代表不足，本地过滤会把数据稀缺放大为持续性的覆盖损失。

![局部选择偏差会收窄递归合成数据；协作 Wasserstein 验证有助于保持多样性](/papers/model-collapse/teaser.png)

## 方法

论文首先在 Gaussian 建模下形式化有偏 top-$\alpha$ 选择，并把它与递归代际中的方差坍缩联系起来。随后提出协作评估方法，用多方计算的分布代理替代单个本地验证器，并且不交换原始数据。方法上的转变是：从单个低资源孤岛判断样本质量，转向评估合成池与全局目标代理分布的拟合程度。

论文描述了两个方案：

- **Scheme I**：协作测地插值，在合成分布与本地真实分布之间的 Wasserstein 测地线 上构造代理测度；
- **Scheme II**：协作 Wasserstein barycenter 估计，为集体参考分布计算可复用的 barycenter 代理。

两个方案都使用基于 Wasserstein 梯度的样本评分，使评估依据涵盖多方分布信息。

## 关键启示

- **数据筛选并不天然保护模型。** 参考数据有限的验证器可能保留熟悉的样本，却误删稀有但有效的模式。
- **选择过程会影响后续生成。** 反复过滤改变了下一轮训练可用的数据，并可能放大已有偏差。
- **协作评估能够扩展分布参考。** Wasserstein 代理结合多方信息，无需交换各方的原始样本。
- **尾部覆盖尤其需要关注。** 对低资源或代表不足的领域，本地过滤可能使有限的覆盖进一步退化为持续的多样性损失。

## 结果

手稿报告了 CIFAR-10、STL-10 和 CelebA 上的 DDPM 风格递归图像生成实验。基线包括 Random selection、K-means、CenterMatch 和 CovMatch。在非 IID 或本地偏斜参考下，本地选择基线可能落后于随机选择；协作方案则能更好保持样本质量和模式覆盖。

当真实数据覆盖稀缺或碎片化时，尾部模式本来就难以观测；本地参考选择会把稀有但有效的样本误认为低质量生成，从而系统性压制目标分布中代表不足的区域。附录中的 topic-local LLM 验证实验从语义角度支持了同一机制：用狭窄本地主题进行过滤，可能削弱 held-out 主题覆盖，而不是保护它。

## 定位

该工作属于 [[Synthetic_Data_and_Model_Collapse|合成数据]]、[[Synthetic_Data|合成数据（概念）]]、[[Recursive_Synthetic_Data_Training|递归合成数据训练]]、[[Data_Selection|数据选择]]、[[Sample_Selection_Bias|样本选择偏差]]、[[Data_Silos|数据孤岛]]、[[Collaborative_Evaluation|协作评估]] 和 [[Wasserstein_Geometry|Wasserstein 几何]]。它与乔鑫宝的机器遗忘研究分别关注数据生命周期的不同阶段：训练前的选择与验证，以及训练后的数据删除。对低资源场景的研究也揭示了模型坍缩的社会影响：分布尾部损失可能对应文化、语言或机构中代表不足内容的消失。
